#include <iostream>
#include <list>
#include <vector>
#include <cstdint>
#include <random>
#include "json.hpp"

using json = nlohmann::json;

uint64_t ROOT_DEPTH = 6; // Max 7 for now

struct Piece {
    std::string piece;
    int firstMove;
    std::string color;
    int piecePos;

    NLOHMANN_DEFINE_TYPE_INTRUSIVE(Piece, piece, color, firstMove);
};
struct Moves {
    uint64_t from;
    uint64_t to;
};

std::list<Piece> parsePiecesFromJson(const std::string& jsonString) {
    json j = json::parse(jsonString);
    std::list<Piece> pieces;

    int i = 0;
    for (const auto& item : j) {
        if (item.is_null()) {
            i++;
            continue;
        }

        Piece piece;
        piece.piece = item.value("piece", "");
        piece.firstMove = item.value("firstMove", 0);
        piece.color = item.value("color", "");
        piece.piecePos = 63-i;

        pieces.push_back(piece);
        i++;
    }

    return pieces;
}
struct Position {
    uint64_t individualPieces[2][6];
    uint64_t colorPieces[2];
    uint64_t allPieces;
    unsigned char colorToMove;
    unsigned char castlingRights;
    unsigned char enPassantFile;

    Position() : allPieces(0), colorToMove(0), castlingRights(0), enPassantFile(0) {
        for (int color = 0; color < 2; color++) {
            colorPieces[color] = 0;
            for (int pieceType = 0; pieceType < 6; ++pieceType) {
                individualPieces[color][pieceType] = 0;
            }
        }
    }

    Position(std::list<Piece> pieces, std::string colorFirstMove) {
        allPieces = 0;
        for (int color = 0; color < 2; color++) {
            colorPieces[color] = 0;
            for (int pieceType = 0; pieceType < 6; ++pieceType) {
                individualPieces[color][pieceType] = 0;
            }
        }
        for (const auto& piece : pieces) {
            int colorIndex = (piece.color == "white") ? 0 : 1; // White is 0 and Black is 1
            int pieceTypeIndex = std::string("pnbrqk").find(piece.piece);
            if (pieceTypeIndex != std::string::npos) {
                individualPieces[colorIndex][pieceTypeIndex] |= (1ULL << piece.piecePos);
            }
        }
        for (int color = 0; color < 2; color++) {
            for (int pieceType = 0; pieceType < 6; pieceType++) {
                colorPieces[color] |= individualPieces[color][pieceType];
            }
        }
        allPieces = colorPieces[0] | colorPieces[1];

        colorToMove = (colorFirstMove.compare("white") == 0) ? 0 : 1;

        castlingRights = 0;
        if (individualPieces[0][5] & (1ULL << 4)) {
            if (individualPieces[0][3] & (1ULL << 0)) castlingRights |= 0b0001; // White queenside
            if (individualPieces[0][3] & (1ULL << 7)) castlingRights |= 0b0010; // White kingside
        }
        if (individualPieces[1][5] & (1ULL << 60)) {
            if (individualPieces[1][3] & (1ULL << 56)) castlingRights |= 0b0100; // Black queenside
            if (individualPieces[1][3] & (1ULL << 63)) castlingRights |= 0b1000; // Black kingside
        }

        enPassantFile = 0;
    }

    void updatePosition() {
        colorPieces[0] = colorPieces[1] = 0;
        for (int pieces = 0; pieces < 6; ++pieces) {
            colorPieces[0] |= individualPieces[0][pieces];
            colorPieces[1] |= individualPieces[1][pieces];
        }
        allPieces = colorPieces[0] | colorPieces[1];
    }
};

void printBitboard(uint64_t bitboard);
void printMoves(const std::vector<Moves>& moves);
void copyBoard(const Position& oldPos, Position& newPos);
std::string numToSquareString(uint64_t square);

uint64_t not_h_file = 18374403900871474942ULL;
uint64_t not_a_file = 9187201950435737471ULL;
uint64_t not_hg_file = 18229723555195321596ULL;
uint64_t not_ab_file = 4557430888798830399ULL;

void genPawnMoves(const Position& position, std::vector<Moves>& moves, std::string type) {
    const unsigned char color = position.colorToMove;

    uint64_t pawns = position.individualPieces[color][0];
    uint64_t emptySquares = ~position.allPieces;
    uint64_t opponentPieces = position.colorPieces[1 - color];

    int direction = (color == 0) ? 8 : -8;
    int startRank = (color == 0) ? 1 : 6;

    while (pawns) {
        int from = __builtin_ctzll(pawns);
        pawns &= pawns - 1;
        if (type != "capture") {
            int to = from + direction;
            if (to >= 0 && to < 64 && (emptySquares & (1ULL << to))) {
                moves.push_back({1ULL << from, 1ULL << to});
                if ((from / 8) == startRank) {
                    int doubleTo = from + 2 * direction;
                    if (doubleTo >= 0 && doubleTo < 64 && (emptySquares & (1ULL << doubleTo))) {
                        moves.push_back({1ULL << from, 1ULL << doubleTo});
                    }
                }
            }
        }

        int captureLeft = from + direction - 1;
        if (captureLeft >= 0 && captureLeft < 64 && (opponentPieces & 
            (1ULL << captureLeft)) && (from % 8 != 0)) {
            moves.push_back({1ULL << from, 1ULL << captureLeft});
        }
        int captureRight = from + direction + 1;
        if (captureRight >= 0 && captureRight < 64 && (opponentPieces & 
            (1ULL << captureRight)) && (from % 8 != 7)) {
            moves.push_back({1ULL << from, 1ULL << captureRight});
        }
    }
}
void genKnightMoves(const Position& position, std::vector<Moves>& moves, std::string type) {
    const unsigned char color = position.colorToMove;
    uint64_t knights = position.individualPieces[color][1];
    uint64_t notAlliedPieces = ~position.colorPieces[color];

    while (knights) {
        uint64_t from = __builtin_ctzll(knights);
        knights &= knights - 1;

        uint64_t knightMoves = 0;
        if (from + 17 < 64) knightMoves |= (1ULL << (from + 17)) & not_h_file;
        if (from + 15 < 64) knightMoves |= (1ULL << (from + 15)) & not_a_file;
        if (from + 10 < 64) knightMoves |= (1ULL << (from + 10)) & not_hg_file;
        if (from + 6 < 64) knightMoves |= (1ULL << (from + 6)) & not_ab_file;
        if (from >= 17) knightMoves |= (1ULL << (from - 17)) & not_a_file;
        if (from >= 15) knightMoves |= (1ULL << (from - 15)) & not_h_file;
        if (from >= 10) knightMoves |= (1ULL << (from - 10)) & not_ab_file;
        if (from >= 6) knightMoves |= (1ULL << (from - 6)) & not_hg_file;

        knightMoves &= notAlliedPieces;

        while (knightMoves) {
            uint64_t to = __builtin_ctzll(knightMoves);
            knightMoves &= knightMoves - 1;
            if (type == "capture" && !(position.colorPieces[1 - color] & (1ULL << to))) {
                continue;
            }
            moves.push_back({1ULL << from, 1ULL << to});
        }
    }
}
void genBishopMoves(const Position& position, std::vector<Moves>& moves, std::string type) {
    const unsigned char color = position.colorToMove;
    uint64_t bishops = position.individualPieces[color][2];
    const uint64_t notAlliedPieces = ~position.colorPieces[color];
    const uint64_t enemyPieces = position.colorPieces[1 - color];

    while (bishops) {
        const int from = __builtin_ctzll(bishops);
        bishops &= bishops - 1;

        for (int direction : {7, 9, -7, -9}) {
            int to = from;
            while (true) {
                to += direction;
                if (to < 0 || to >= 64) break;

                if ((direction == 7 || direction == -9) && (to % 8 == 7)) break;
                if ((direction == 9 || direction == -7) && (to % 8 == 0)) break;

                if (notAlliedPieces & (1ULL << to)) {
                    if (type == "capture" && !(position.colorPieces[1 - color] & (1ULL << to))) continue;
                    moves.push_back({1ULL << from, 1ULL << to});
                    if (enemyPieces & (1ULL << to)) break;
                } else {
                    break;
                }
            }
        }
    }
}
void genRookMoves(const Position& position, std::vector<Moves>& moves, std::string type) {
    const unsigned char color = position.colorToMove;
    uint64_t rooks = position.individualPieces[color][3];
    const uint64_t notAlliedPieces = ~position.colorPieces[color];
    const uint64_t enemyPieces = position.colorPieces[1 - color];

    while (rooks) {
        const int from = __builtin_ctzll(rooks);
        rooks &= rooks - 1;

        for (int direction : {-8, -1, 1, 8}) {
            int to = from;
            while (true) {
                to += direction;
                if (to < 0 || to >= 64) break;

                if ((direction == -1) && (to % 8 == 7)) break;
                if ((direction == 1) && (to % 8 == 0)) break;

                if (notAlliedPieces & (1ULL << to)) {
                    if (type == "capture" && !(position.colorPieces[1 - color] & (1ULL << to))) continue;
                    moves.push_back({1ULL << from, 1ULL << to});
                    if (enemyPieces & (1ULL << to)) break;
                } else {
                    break;
                }
            }
        }
    }
}
void genQueenMoves(const Position& position, std::vector<Moves>& moves, std::string type) {
    const unsigned char color = position.colorToMove;
    uint64_t queens = position.individualPieces[color][4];
    const uint64_t notAlliedPieces = ~position.colorPieces[color];
    const uint64_t enemyPieces = position.colorPieces[1 - color];

    while (queens) {
        const int from = __builtin_ctzll(queens);
        queens &= queens - 1;

        for (int direction : {7, 9, -7, -9, -8, -1, 1, 8}) {
            int to = from;
            while (true) {
                to += direction;
                if (to < 0 || to >= 64) break;

                if ((direction == 7 || direction == -9 || direction == -1) && (to % 8 == 7)) break;
                if ((direction == 9 || direction == -7 || direction == 1) && (to % 8 == 0)) break;

                if (notAlliedPieces & (1ULL << to)) {
                    if (type == "capture" && !(position.colorPieces[1 - color] & (1ULL << to))) continue;
                    moves.push_back({1ULL << from, 1ULL << to});
                    if (enemyPieces & (1ULL << to)) break;
                } else {
                    break;
                }
            }
        }
    }
}
void genKingMoves(const Position& position, std::vector<Moves>& moves, std::string type) {
    const unsigned char color = position.colorToMove;
    const uint64_t king = position.individualPieces[color][5];
    const uint64_t notAlliedPieces = ~position.colorPieces[color];

    uint64_t from = __builtin_ctzll(king);
    for (int i = -1; i <= 1; ++i) {
        for (int j = -1; j <= 1; ++j) {
            if (i == 0 && j == 0) continue;
            int toRank = (from / 8) + i;
            int toFile = (from % 8) + j;
            if (toRank >= 0 && toRank < 8 && toFile >= 0 && toFile < 8) {
                uint64_t to = toRank * 8 + toFile;
                if (notAlliedPieces & (1ULL << to)) {
                    if (type == "capture" && !(position.colorPieces[1 - color] & (1ULL << to))) continue;
                    moves.push_back({1ULL << from, 1ULL << to});
                }
            }
        }
    }

    if (color) {
        if ((position.castlingRights & 0b0010) && (position.allPieces & (1ULL << 5)) == 0 && (position.allPieces & (1ULL << 6)) == 0) {
            moves.push_back({1ULL << from, 1ULL << 6});
        }
        if ((position.castlingRights & 0b0001) && (position.allPieces & (1ULL << 3)) == 0 && (position.allPieces & (1ULL << 2)) == 0 && (position.allPieces & (1ULL << 1)) == 0) {
            moves.push_back({1ULL << from, 1ULL << 2});
        }
    } else {
        if ((position.castlingRights & 0b1000) && (position.allPieces & (1ULL << 61)) == 0 && (position.allPieces & (1ULL << 62)) == 0) {
            moves.push_back({1ULL << from, 1ULL << 62});
        }
        if ((position.castlingRights & 0b0100) && (position.allPieces & (1ULL << 59)) == 0 && (position.allPieces & (1ULL << 58)) == 0 && (position.allPieces & (1ULL << 57)) == 0) {
            moves.push_back({1ULL << from, 1ULL << 58});
        }
    }
}
std::vector<Moves> generateMoves(const Position& position, std::string type = "all") {
    std::vector<Moves> moves;
    genPawnMoves(position, moves, type);
    genKnightMoves(position, moves, type);
    genBishopMoves(position, moves, type);
    genRookMoves(position, moves, type);
    genQueenMoves(position, moves, type);
    genKingMoves(position, moves, type);
    return moves;
}

bool isSquareAttacked(const Position& position, int square, unsigned char attackerColor) {
    uint64_t pawns = position.individualPieces[attackerColor][0];
    while (pawns) {
        int from = __builtin_ctzll(pawns);
        pawns &= pawns - 1;
        if (attackerColor == 0) {
            if (square == from + 7 && (from % 8 != 0) || square == from + 9 && (from % 8 != 7)) return true;
        } else {
            if (square == from - 7 && (from % 8 != 0) || square == from - 9 && (from % 8 != 7)) return true;
        }
    }
    uint64_t knights = position.individualPieces[attackerColor][1];
    while (knights) {
        int from = __builtin_ctzll(knights);
        knights &= knights - 1;
        if (square == from + 17 || square == from + 15 || square == from - 17 || square == from - 15 ||
            square == from + 10 || square == from + 6 || square == from - 10 || square == from - 6) {
            return true;
        }
    }
    uint64_t bishops = position.individualPieces[attackerColor][2];
    while (bishops) {
        int from = __builtin_ctzll(bishops);
        bishops &= bishops - 1;
        for (int direction : {7, 9, -7, -9}) {
            int to = from;
            while (true) {
                to += direction;
                if (to < 0 || to >= 64) break;
                if ((direction == 7 || direction == -9) && (to % 8 == 7)) break;
                if ((direction == 9 || direction == -7) && (to % 8 == 0)) break;
                if (square == to) return true;
                if (position.allPieces & (1ULL << to)) break;
            }
        }
    }
    uint64_t rooks = position.individualPieces[attackerColor][3];
    while (rooks) {
        int from = __builtin_ctzll(rooks);
        rooks &= rooks - 1;
        for (int direction : {-8, -1, 1, 8}) {
            int to = from;
            while (true) {
                to += direction;
                if (to < 0 || to >= 64) break;
                if ((direction == -1) && (to % 8 == 7)) break;
                if ((direction == 1) && (to % 8 == 0)) break;
                if (square == to) return true;
                if (position.allPieces & (1ULL << to)) break;
            }
        }
    }
    uint64_t queens = position.individualPieces[attackerColor][4];
    while (queens) {
        int from = __builtin_ctzll(queens);
        queens &= queens - 1;
        for (int direction : {7, 9, -7, -9, -8, -1, 1, 8}) {
            int to = from;
            while (true) {
                to += direction;
                if (to < 0 || to >= 64) break;
                if ((direction == 7 || direction == -9 || direction == -1) && (to % 8 == 7)) break;
                if ((direction == 9 || direction == -7 || direction == 1) && (to % 8 == 0)) break;
                if (square == to) return true;
                if (position.allPieces & (1ULL << to)) break;
            }
        }
    }
    uint64_t kings = position.individualPieces[attackerColor][5];
    while (kings) {
        int from = __builtin_ctzll(kings);
        kings &= kings - 1;
        for (int i = -1; i <= 1; ++i) {
            for (int j = -1; j <= 1; ++j) {
                if (i == 0 && j == 0) continue;
                int toRank = (from / 8) + i;
                int toFile = (from % 8) + j;
                if (toRank >= 0 && toRank < 8 && toFile >= 0 && toFile < 8) {
                    int to = toRank * 8 + toFile;
                    if (square == to) return true;
                }
            }
        }
    }
    return false;
}
bool isKingInCheck(const Position& position, unsigned char color) {
    uint64_t kingSquare = position.individualPieces[color][5];
    return isSquareAttacked(position, __builtin_ctzll(kingSquare), 1 - color);
}

const int64_t pieceValues[6] = {100, 320, 330, 500, 900, 20000};
const int64_t pieceSquareValues[6][64] = {
    {60, 60, 60, 60, 60, 60, 60, 60,
     40, 40, 40, 40, 40, 40, 40, 40,
     20, 20, 20, 30, 30, 20, 20, 20,
     10, 10, 15, 25, 25, 15, 10, 10,
     0, 0, 10, 20, 20, 10, -5, 0,
     0, 0, 0, 5, 5, -5, 0, 0,
     0, 0, 0, -10, -10, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0},
    {-5, 0, 0, 0, 0, 0, 0, -5,
     -5, 0, 10, 10, 10, 10, 0, -5,
     -5, 0, 10, 10, 10, 10, 0, -5,
     -5, 5, 10, 20, 20, 10, 5, -5,
     -5, 5, 10, 20, 20, 10, 5, -5,
     -5, 0, 12, 10, 10, 12, 0, -5,
     -5, 0, 10, 10, 10, 10, 0, -5,
     -5, 0, 0, 0, 0, 0, 0, -5},
    {-5, -10, -10, -10, -10, -10, -10, -5,
     -10, 0, 0, 0, 0, 0, 0, -10,
     -10, 0, 0, 5, 5, 0, 0, -5,
     0, 0, 5, 10, 10, 5, 0, 0,
     0, 0, 5, 10, 10, 5, 0, 0,
     -10, 0, 5, 5, 5, 5, 0, -5,
     -10, 10, 0, 5, 5, 0, 10, -10,
     -5, -10, -5, -10, -10, -5, -10, -5,},
    {10, 10, 10, 10, 10, 10, 10, 10,
     10, 10, 10, 15, 15, 10, 10, 10,
     0, 0, 0, 5, 5, 0, 0, 0,
     0, 0, 0, 5, 5, 0, 0, 0,
     0, 0, 0, 5, 5, 0, 0, 0,
     0, -1, -1, 5, 5, -1, -1, 0,
     0, -1, -1, 5, 5, -1, -1, 0,
     -5, 0, 0, 10, 10, 10, 0, -5},
    {-5, -10, -10, -10, -10, -10, -10, -5,
     -10, 0, 0, 0, 0, 0, 0, -10,
     -10, 0, 0, 5, 5, 0, 0, -5,
     0, 0, 5, 10, 10, 5, 0, 0,
     0, 0, 5, 10, 10, 5, 0, 0,
     -10, 0, 5, 5, 5, 5, 0, -5,
     -10, 10, 0, 5, 5, 0, 10, -10,
     -5, -10, -5, -10, -10, -5, -10, -5,},
    {0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 10, 10, 10, 10, 0, 0,
     0, 0, 10, 20, 20, 10, 0, 0,
     0, 0, 10, 20, 20, 10, 0, 0,
     0, 0, 10, 10, 10, 10, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0,
     5, 10, 10, 0, -10, 0, 10, 5}
};
int64_t evaluatePosition(const Position& position) {
    int64_t score = 0;
    for (int color = 0; color < 2; ++color) {
        for (int pieceType = 0; pieceType < 6; ++pieceType) {
            uint64_t pieces = position.individualPieces[color][pieceType];
            while (pieces) {
                uint64_t from = __builtin_ctzll(pieces);
                pieces &= pieces - 1;
                score += (color == 0 ? 1 : -1) * pieceValues[pieceType];
                int square = (color == 0) ? from : 63 - from;
                score += (color == 0 ? 1 : -1) * pieceSquareValues[pieceType][square];
            }
        }
    }

    return (position.colorToMove == 0) ? score : -score;
}

void copyBoard(const Position& oldPos, Position& newPos) {
    newPos = oldPos; // Copy the old position to the new position
}
void makeMove(Position& pos, Moves move) {
    const unsigned char color = pos.colorToMove;
    for (int pieceType = 0; pieceType < 6; ++pieceType) {
        if (pos.individualPieces[color][pieceType] & move.from) {
            pos.individualPieces[color][pieceType] &= ~move.from; // Remove the piece from the old position
            pos.individualPieces[color][pieceType] |= move.to;    // Place the piece in the new position
            break;
        }
    }
    if (pos.colorPieces[1 - color] & move.to) {
        for (int pieceType = 0; pieceType < 6; ++pieceType) {
            if (pos.individualPieces[1 - color][pieceType] & move.to) {
                pos.individualPieces[1 - color][pieceType] &= ~move.to; // Remove the captured piece
                break;
            }
        }
    }
    pos.updatePosition(); // Update the colorPieces and allPieces bitboards
    pos.colorToMove = 1 - pos.colorToMove; // Switch the turn to the other player
}
void undoMove(Position& pos, const Position& originalPos) {
    pos = originalPos; // Restore the original position
}

Moves bestMove;
int64_t bestScoreSoFar = -100000, bestScore = -100000;
static inline int64_t quiescenceSearch(const Position& position, int64_t alpha, int64_t beta) {
    int64_t quiescore = evaluatePosition(position);
    if (quiescore >= beta) return beta;
    if (alpha < quiescore) alpha = quiescore;

    const auto& movesList = generateMoves(position, "capture");
    for (const auto& move : movesList) {
        Position mutatingPosition;
        copyBoard(position, mutatingPosition);
        makeMove(mutatingPosition, move);
        int64_t score = -quiescenceSearch(mutatingPosition, -beta, -alpha);

        if (score >= beta) return beta;
        if (score > alpha) {
            alpha = score;
        }
    }
    return alpha;
}
static inline int64_t alphaBetaPruning(const Position& position, int64_t alpha, int64_t beta, int64_t depth) {
    if (depth == 0) {
        //std::cout << "Going into quiescence search at depth 0" << std::endl;
        //return quiescenceSearch(position, alpha, beta, 1);
        return evaluatePosition(position);
    }

    int legalMovesCount = 0;
    int64_t oldAlpha = alpha;
    Moves bestSoFar;
    Position mutatingPosition;
    copyBoard(position, mutatingPosition);

    const auto& movesList = generateMoves(position);
    for (const auto& move : movesList) {
        makeMove(mutatingPosition, move);
        if (isKingInCheck(mutatingPosition, position.colorToMove)) {
            undoMove(mutatingPosition, position);
            continue;
        }
        legalMovesCount++;
        int64_t score = -alphaBetaPruning(mutatingPosition, -beta, -alpha, depth - 1);
        undoMove(mutatingPosition, position);

        if (score >= beta) return beta;
        if (score > alpha) {
            alpha = score;
            if (depth == ROOT_DEPTH) {
                bestSoFar = move;
                bestScoreSoFar = score;
            }
        }
    }

    if (legalMovesCount == 0) {
        if (isKingInCheck(position, position.colorToMove)) {
            return -99000 + (ROOT_DEPTH - depth); // Checkmate
        } else {
            return 0; // Stalemate
        }
    }

    if (alpha != oldAlpha) {
        bestMove = bestSoFar;
        bestScore = bestScoreSoFar;
    }

    return alpha;
}
void searchPosition(Position& position) {
    int64_t score = alphaBetaPruning(position, -100000, 100000, ROOT_DEPTH);
}

std::string numToSquareString(uint64_t square) {
    int index = __builtin_ctzll(square);
    char file = 'a' + (index % 8);
    char rank = '1' + floor(index / 8);
    return std::string(1, file) + std::string(1, rank);
}

void printBitboard(uint64_t bitboard) {
    std::cout << "Bitboard representation:" << std::endl;
    for (int rank = 7; rank >= 0; rank--) {
        for (int file = 0; file < 8; file++) {
            uint64_t mask = 1ULL << (rank * 8 + file);
            std::cout << ((bitboard & mask) ? '1' : '0') << " ";
        }
        std::cout << std::endl;
    }
}
void bitboardMaker() {
    uint64_t bitboard = 0;
    for (int i = 0;i < 8;i++) {
        for (int j = 0;j < 8;j++) {
            if (j == 7) continue;
            bitboard |= 1ULL << (i * 8 + j);
        }
    }
    printBitboard(bitboard);
    std::cout << "Bitboard: " << bitboard << std::endl;
}
void printMoves(const std::vector<Moves>& moves) {
    std::cout << "Generated Moves:" << std::endl;
    for (const auto& move : moves) {
        std::cout << std::hex << "From: " << move.from << ", To: " << move.to << std::endl;
    }
}

int main(int argc, char* argv[]) {
    if (argc < 3) {
        std::cerr << "Usage: " << argv[0] << " <json_string> <color_first_move>" << std::endl;
        return 1;
    }

    std::list<Piece> pieces = parsePiecesFromJson(argv[1]);
    Position position(pieces, argv[2]);
    searchPosition(position);

    std::cout << __builtin_ctzll(bestMove.from) << " " << __builtin_ctzll(bestMove.to) << std::endl;
    std::cerr << "Best Move: From " << numToSquareString(bestMove.from) << " To " << 
        numToSquareString(bestMove.to) << " with score " << bestScore << std::endl;

    return 0;
}