const express = require('express');
const router = express.Router();

const row = 8;
const col = 8;

function kingSafety(boardState, color) {}
function boardSpace(boardState, color) {}


function iteratePieces(boardState, color) {
    let pieces = [];
    for (let i = 0; i < boardState.length; i++) {
        const piece = boardState[i];
        if (!piece) continue;
        if (piece.color === color) {
            pieces.push({piece: piece, position: i});
        }
    }
    return pieces;
}

function legalMoves(boardState, piecePos, targetPos) {
    if (boardState[targetPos] && boardState[targetPos].color === boardState[piecePos].color) {
        return false; // Can't move to a square occupied by own piece
    }
    return true;
}

// Finds all posssible moves for a piece
function possiblePawnMoves(boardState, piecePos) {
    const color = boardState[piecePos].color;
    const possibleMoves = [];
    let pawnDirection = color === 'white' ? -row : row;
    if (!boardState[piecePos+pawnDirection]) {
        possibleMoves.push(piecePos+pawnDirection);
        if (boardState[piecePos].firstMove && !boardState[piecePos+2*pawnDirection]) {
            possibleMoves.push(piecePos+2*pawnDirection);
        }
    }
    if (boardState[piecePos+pawnDirection-1] && boardState[piecePos+pawnDirection-1].color !== color 
        && piecePos % col !== 0) {
        possibleMoves.push(piecePos+pawnDirection-1);
    }
    if (boardState[piecePos+pawnDirection+1] && boardState[piecePos+pawnDirection+1].color !== color
         && piecePos % col !== col - 1) {
        possibleMoves.push(piecePos+pawnDirection+1);
    }
    return possibleMoves;
}
function possibleKnightMoves(boardState, piecePos) {
    const knightMoves = [piecePos-2*col-1, piecePos-2*col+1, piecePos+2*col-1, piecePos+2*col+1,
                         piecePos-col-2, piecePos-col+2, piecePos+col-2, piecePos+col+2]; // All 8 possible knight moves
    const validKnightMoves = knightMoves.filter((targetPos) => targetPos >= 0 && targetPos < row * col &&
        Math.abs(targetPos % col - piecePos % col) <= 2 && Math.abs(Math.floor(targetPos / col) - Math.floor(piecePos / col)) <= 2); // Filter out moves that go off the board
    return validKnightMoves.filter((targetPos) => legalMoves(boardState, piecePos, targetPos)); // Filter bad Moves
}
function possibleDiagonalMoves(boardState, piecePos) {
    const color = boardState[piecePos].color;
    const possibleMoves = [];
    for (let i = piecePos-(col+1); i >= 0; i-=(col+1)) {
        if (i % col === col-1 || i < 0 || boardState[i] && boardState[i].color === color) break;
        possibleMoves.push(i);
        if (boardState[i] && boardState[i].color !== color) break;
    }
    for (let i = piecePos-(col-1); i >= 0; i-=(col-1)) {
        if (i % col === 0 || i < 0 || boardState[i] && boardState[i].color === color) break;
        possibleMoves.push(i);
        if (boardState[i] && boardState[i].color !== color) break;
    }
    for (let i = piecePos+(col-1); i < row*col; i+=(col-1)) {
        if (i % col === col-1 || i >= row*col || boardState[i] && boardState[i].color === color) break;
        possibleMoves.push(i);
        if (boardState[i] && boardState[i].color !== color) break;
    }
    for (let i = piecePos+(col+1); i < row*col; i+=(col+1)) {
        if (i % col === 0 || i >= row*col || boardState[i] && boardState[i].color === color) break;
        possibleMoves.push(i);
        if (boardState[i] && boardState[i].color !== color) break;
    }
    return possibleMoves;
}
function possibleStraightMoves(boardState, piecePos) {
    const color = boardState[piecePos].color;
    const possibleMoves = [];
    for (let i = piecePos-1; i >= 0; i--) {
        if ((boardState[i] && boardState[i].color === color) || i%col === col-1) break;
        possibleMoves.push(i);
        if (boardState[i] && boardState[i].color !== color) break;
    }
    for (let i = piecePos+1; i < row*col; i++) {
        if ((boardState[i] && boardState[i].color === color) || i%col === 0) break;
        possibleMoves.push(i);
        if (boardState[i] && boardState[i].color !== color) break;
    }
    for (let i = piecePos-col; i >= 0; i-=col) {
        if ((boardState[i] && boardState[i].color === color) || i < 0) break;
        possibleMoves.push(i);
        if (boardState[i] && boardState[i].color !== color) break;
    }
    for (let i = piecePos+col; i < row*col; i+=col) {
        if ((boardState[i] && boardState[i].color === color) || i >= row*col) break;
        possibleMoves.push(i);
        if (boardState[i] && boardState[i].color !== color) break;
    }
    return possibleMoves;
}
function possibleKingMoves(boardState, piecePos) {
    const possibleMoves = [];
    for (let i = -1; i <= 1;i++) {
        for (let j = -1; j <= 1;j++) {
            const targetPos = piecePos + i * col + j;
            if (i === 0 && j === 0) continue;
            if (targetPos >= 0 && targetPos < row * col && legalMoves(boardState, piecePos, targetPos) 
                && targetPos % col >= piecePos % col - 1 && targetPos % col <= piecePos % col + 1) {
                possibleMoves.push(targetPos);
            }
        }
    }
    if (boardState[piecePos].firstMove) {
        if (boardState[piecePos+4] && boardState[piecePos+4].piece === 'r' && boardState[piecePos+4].firstMove) {
            let queencastle = true;
            for (let i = piecePos+1; i < piecePos+4; i++) {
                if (boardState[i]) {
                    queencastle = false;
                    break;
                }
            }
            if (inCheckTest(boardState, boardState[piecePos].color, {piecePos: piecePos, targetPos: piecePos+1})) queencastle = false;
            if (queencastle) possibleMoves.push(piecePos+2);
        }
        if (boardState[piecePos-3] && boardState[piecePos-3].piece === 'r' && boardState[piecePos-3].firstMove) {
            let kingscastle = true;
            for (let i = piecePos-1; i > piecePos-3; i--) {
                if (boardState[i]) {
                    kingscastle = false;
                    break;
                }
            }
            if (inCheckTest(boardState, boardState[piecePos].color, {piecePos: piecePos, targetPos: piecePos-1})) kingscastle = false;
            if (kingscastle) possibleMoves.push(piecePos-2);
        }
    }
    return possibleMoves;
}

function iterateMoves(boardState, piecePos, pieceType) {
    let moves = [];
    switch (pieceType) {
        case 'p':
            const pawnMoves = possiblePawnMoves(boardState, piecePos);
            for (let targetPos of pawnMoves) {
                moves.push({piecePos: piecePos, targetPos: targetPos});
            }
            break;
        case 'n':
            const knightMoves = possibleKnightMoves(boardState, piecePos);
            for (let targetPos of knightMoves) {
                moves.push({piecePos: piecePos, targetPos: targetPos});
            }
            break;
        case 'b':
            const diagonalMoves = possibleDiagonalMoves(boardState, piecePos);
            for (let targetPos of diagonalMoves) {
                moves.push({piecePos: piecePos, targetPos: targetPos});
            }
            break;
        case 'r':
            const straightMoves = possibleStraightMoves(boardState, piecePos);
            for (let targetPos of straightMoves) {
                moves.push({piecePos: piecePos, targetPos: targetPos});
            }
            break;
        case 'q':
            const queenDiagonalMoves = possibleDiagonalMoves(boardState, piecePos);
            for (let targetPos of queenDiagonalMoves) {
                moves.push({piecePos: piecePos, targetPos: targetPos});
            }
            const queenStraightMoves = possibleStraightMoves(boardState, piecePos);
            for (let targetPos of queenStraightMoves) {
                moves.push({piecePos: piecePos, targetPos: targetPos});
            }
            break;
        case 'k':
            const kingMoves = possibleKingMoves(boardState, piecePos);
            for (let targetPos of kingMoves) {
                moves.push({piecePos: piecePos, targetPos: targetPos});
            }
            break;
    }
    return moves;
}

// legalMoves test if the target position is able to be reached by the piece
function legalPawnMove(boardState, piecePos, targetPos) {
    const color = boardState[piecePos].color;
    let pawnDirection = color === 'white' ? -row : row;
    if (targetPos === piecePos+pawnDirection && !boardState[targetPos]) return true;
    if (targetPos === piecePos+2*pawnDirection && boardState[piecePos].firstMove && 
        !boardState[targetPos] && !boardState[piecePos+pawnDirection]) return true;
    if (targetPos === piecePos+pawnDirection-1 && boardState[targetPos] && 
        boardState[targetPos].color !== color && piecePos % col !== 0) return true;
    if (targetPos === piecePos+pawnDirection+1 && boardState[targetPos] && 
        boardState[targetPos].color !== color && piecePos % col !== col - 1) return true;
    return false;
}
function legalKnightMove(piecePos, targetPos) {
    if ((Math.abs(Math.floor(piecePos/row) - Math.floor(targetPos/row)) === 2 && Math.abs(piecePos%col - targetPos%col) === 1) ||
        (Math.abs(Math.floor(piecePos/row) - Math.floor(targetPos/row)) === 1 && Math.abs(piecePos%col - targetPos%col) === 2)) {
        return true;
    }
}
function legalDiagonalMove(boardState, piecePos, targetPos) {
    if (Math.abs(Math.floor(piecePos/row) - Math.floor(targetPos/row)) !==
        Math.abs(piecePos%col - targetPos%col)) {
        return false;
    } else if ((Math.floor(piecePos/row)<Math.floor(targetPos/row) && piecePos%col<targetPos%col) ||
                (Math.floor(piecePos/row)>Math.floor(targetPos/row) && piecePos%col>targetPos%col)) {
        for (let i = Math.min(piecePos, targetPos)+9; i < Math.max(piecePos, targetPos); i+=9) {
            if (boardState[i]) {
                return false;
            }
        }
    } else {
        for (let i = Math.min(piecePos, targetPos)+7; i < Math.max(piecePos, targetPos); i+=7) {
            if (boardState[i] && Math.floor(i/row) !== Math.floor(targetPos/row)) {
                return false;
            }
        }
    }
    return true;
}
function legalStraightMove(boardState, piecePos, targetPos) {
    if (Math.floor(piecePos/row) !== Math.floor(targetPos/row) &&
        piecePos%col !== targetPos%col) { 
        return false;
    } else if (Math.floor(piecePos/row) === Math.floor(targetPos/row)) {
        for (let i = Math.min(piecePos, targetPos)+1; 
        i < Math.max(piecePos, targetPos); i++) {
            if (boardState[i]) {
                return false;
            }
        }
    } else {
        for (let i = Math.min(piecePos, targetPos)+row; 
        i < Math.max(piecePos, targetPos); i+=row) {
            if (boardState[i]) {
                return false;
            }
        }
    }
    return true;
}
function legalKingMove(boardState, piecePos, targetPos) {
    if (Math.abs(Math.floor(piecePos/row) - Math.floor(targetPos/row)) <= 1 &&
        Math.abs(piecePos%col - targetPos%col) <= 1 &&
        legalMoves(boardState, piecePos, targetPos)) {
        return true;
    }
    return false;
}

function inCheckTest(boardState, color, move) {
    const tempState = structuredClone(boardState);
    tempState[move.targetPos] = structuredClone(tempState[move.piecePos]);
    tempState[move.piecePos] = null;
    
    const opponentColor = color === 'white' ? 'black' : 'white';
    const otherPieces = iteratePieces(tempState, opponentColor);
    const kingPos = tempState.findIndex(piece => piece && 
        piece.piece === 'k' && piece.color === color);


    for (let otherPiece of otherPieces) {
        const digit = captureTest(tempState, otherPiece.position, kingPos)
        if (digit !== -1) {
            return true;
        }
    }
    return false;
}

function captureTest(boardState, piecePos, targetPos) {
    const piece = boardState[piecePos];
    switch (piece.piece) {
        case 'p':
            if (piece.color === 'white') {
                if (targetPos === piecePos-row+1 || targetPos === piecePos-row-1) return piecePos;
            } else {
                if (targetPos === piecePos+row+1 || targetPos === piecePos+row-1) return piecePos;
            }
            break;
        case 'n':
            if (legalKnightMove(piecePos, targetPos)) return piecePos;
            break;
        case 'b':
            if (legalDiagonalMove(boardState, piecePos, targetPos)) return piecePos;
            break;
        case 'r':
            if (legalStraightMove(boardState, piecePos, targetPos)) return piecePos;
            break;
        case 'q':
            if (legalDiagonalMove(boardState, piecePos, targetPos) || legalStraightMove(boardState, piecePos, targetPos)) return piecePos;
            break;
        case 'k':
            if (legalKingMove(boardState, piecePos, targetPos)) return piecePos;
            break;
    }
    return -1;
}

function pieceValue(type) {
    switch (type) {
        case 'p':
            return 1;
        case 'n':
            return 3;
        case 'b':
            return 3;
        case 'r':
            return 5;
        case 'q':
            return 9;
        default:
            return 0;
    }
}
function materialDifference(boardState) {
    let materialScore = 0;
    for (let piecePos in boardState) {
        const piece = boardState[piecePos];
        if (!piece) continue;
        if (piece.color === 'white') {
            materialScore += pieceValue(piece.piece);
        } else {
            materialScore -= pieceValue(piece.piece);
        }
    }
    return materialScore;
}
function spaceControl(boardState, color) {
    let controlScore = 0;
    const pieces = iteratePieces(boardState, color);
    const pawnPieces = pieces.filter(piece => piece.piece.piece === 'p');
    const otherPieces = pieces.filter(piece => piece.piece.piece !== 'p');

    const startingRow = color === 'white' ? col-2 : 1;
    for (let pawn of pawnPieces) {
        const row = Math.floor(pawn.position / 8);
        controlScore += (startingRow - row) * 0.15;
    }

    const center = [27, 28, 35, 36];
    for (let piece of otherPieces) {
        const amountOfMoves = iterateMoves(boardState, piece.position, piece.piece.piece);
        for (let move of amountOfMoves) {
            if (center.includes(move.targetPos)) {
                controlScore += 0.05;
            }
        }
        controlScore += amountOfMoves.length * 0.1;
    }

    return controlScore;
}
function kingSafety(boardState, color) {
    return 0;
}
function hangingPieces(boardState, color) {
    let hangingScore = 0;
    const pieces = iteratePieces(boardState, color);
    for (let piece of pieces) {
        let defended = false;
        for (let piece2 of pieces) {
            if (piece === piece2) continue;
            if (captureTest(boardState, piece2.position, piece.position) !== -1) {
                defended = true;
                hangingScore += pieceValue(piece.piece.piece) * 0.02;
                break;
            }
        }
        if (!defended) {
            hangingScore -= pieceValue(piece.piece.piece) * 0.01;
        }
    }
    return hangingScore;
}
function captureChain(boardState, move) {
    let captureScore = 0;
    if (move.piecePos === -1) return captureScore;
    const thisPiece = pieceValue(boardState[move.targetPos].piece);
    let getPiece = 0;
    let capPos;
    const pieces = iteratePieces(boardState, (boardState[move.targetPos].color) === 'white' ? 'black' : 'white');
    
    for (let piece of pieces) {
        capPos = captureTest(boardState, piece.position, move.targetPos);
        if (capPos !== -1) {
            let pieceVal = pieceValue(boardState[capPos].piece);
            getPiece = (getPiece === 0 || pieceVal < getPiece) ? pieceVal : getPiece;
            if (getPiece === 1) break;
        }
    }
    if (getPiece) {
        const tempState = structuredClone(boardState);
        tempState[move.targetPos] = structuredClone(tempState[capPos]);
        tempState[capPos] = null;
        captureScore += getPiece - thisPiece + 
            captureChain(tempState, {piecePos: capPos, targetPos: move.targetPos});
    }

    return captureScore;
}

function calculateScore(boardState, color, move, depth) {
    if (inCheckTest(boardState, color, move)) {
        return -Infinity;
    }

    let capture = false;
    if (boardState[move.targetPos]) capture = true;
    const tempState = structuredClone(boardState);
    tempState[move.targetPos] = structuredClone(tempState[move.piecePos]);
    tempState[move.piecePos] = null;

    let capChn = 0;
    if (capture) capChn = captureChain(tempState, move);
    const matDif = materialDifference(tempState) * .6;
    const spCtrl = spaceControl(tempState, color) * 1;
    const hang = hangingPieces(tempState, color) * 2;
    const overallScore = (color === 'white' ? matDif : -matDif) + spCtrl + hang + capChn;
    console.log(overallScore, " = ", (color === 'white' ? matDif : -matDif), " + ", spCtrl, " + ", hang, " + ", capChn, " for ", color, " for move: ", move, " at depth: ", depth);
    return overallScore;
}

class MoveTreeNode {
    constructor(move, score) {
        this.move = move;
        this.score = score;
        this.children = [];
    }
}
class MoveTree {
    constructor(color) {
        this.root = new MoveTreeNode();
        this.color = color;
    }

    traverseBestScore(node) {
        if (!node) return 0;
        if (node.children.length === 0) return node.score;
        let bestScore = 0;
        for (let child of node.children) {
            let leafScore = this.traverseBestScore(child);
            if (leafScore > bestScore) {
                bestScore = leafScore;
            }
        }
        node.score = bestScore;
        return bestScore;
    }

    bestMove() {
        let bestScore = this.traverseBestScore(this.root);
        let bestMove = null;
        for (let child of this.root.children) {
            if (child.score === bestScore) {
                console.log("best move: ", child.move, " with score: ", child.score);
                bestMove = child.move;
                for (let grandchild of child.children) {
                    if (grandchild.score === bestScore) {
                        console.log("best move: ", grandchild.move, " with score: ", grandchild.score);
                        for (let greatGrandchild of grandchild.children) {
                            if (greatGrandchild.score === bestScore) {
                                console.log("best move: ", greatGrandchild.move, " with score: ", greatGrandchild.score);
                            }
                        }
                    }
                }
            }
        }
        return bestMove;
    }
}
function evaluateMoves(boardState, movesTree, color, depth) {
    const pieces = iteratePieces(boardState, color);
    let allMoves = [];
    for (let piece of pieces) {
        const moves = iterateMoves(boardState, piece.position, piece.piece.piece);
        allMoves.push(...moves);
    }

    allMoves = allMoves.map((move) => 
        ({move, score: calculateScore(boardState, color, move, depth)}));
    allMoves.sort((a, b) => b.score - a.score);
    
    for (let i = 0; i < 3; i++) {
        if (i >= allMoves.length) break;
        movesTree.children.push(new MoveTreeNode(allMoves[i].move, allMoves[i].score));
    }

    if (depth === 0) return movesTree;
    for (let child of movesTree.children) {
        const tempState = structuredClone(boardState);
        tempState[child.move.targetPos] = structuredClone(tempState[child.move.piecePos]);
        tempState[child.move.piecePos] = null;
        evaluateMoves(tempState, child, color === 'white' ? 'black' : 'white', depth-1);
    }
    return movesTree;
}

async function cppMove(boardState, color) {
    return new Promise((resolve, reject) => {
        const { spawn } = require('child_process');
        const child = spawn('./cppMove.exe', [JSON.stringify(boardState), color]);
        let move = {piecePos: -1, targetPos: -1};

        child.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
            const [piecePos, targetPos] = data.toString().trim().split(' ').map(Number);
            move = {piecePos: 63 - piecePos, targetPos: 63 - targetPos};
        });
        child.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
        child.on('close', (code) => {
            console.log(`child process exited with code ${code} with move: ${JSON.stringify(move)}`);
            resolve(move);
        });
        child.on('error', (err) => {
            console.error(`Failed to start child process: ${err}`);
            reject(err);
        });
    });
}

function randomMove(boardState, color) {
    let allPieces = iteratePieces(boardState, color);
    const allMoves = [];
    for (let piece of allPieces) {
        const pieceMoves = iterateMoves(boardState, piece.position, piece.piece.piece);
        allMoves.push(...pieceMoves);
    }

    for (let i = 0; i < allMoves.length; i++) {
        const randomIndex = Math.floor(Math.random() * allMoves.length);
        const move = allMoves[randomIndex];
        if (!inCheckTest(boardState, color, move)) return move;
    }
    return "um hit a wall";
}

router.post('/randomMove', (req, res) => {
    const { boardState, color } = req.body;
    const move = randomMove(boardState, color);
    res.json({ move });
});

router.post('/botMove', (req, res) => {
    const { boardState, color } = req.body;
    const depth = 1;
    const moveTree = new MoveTree(color);
    evaluateMoves(boardState, moveTree.root, color, depth*2);
    const bestMove = moveTree.bestMove();
    console.log("best: ", bestMove);
    res.json({ move: bestMove });
});

router.post('/cppMove', async (req, res) => {
    try {
        const { boardState, color } = req.body;

        const result = await cppMove(boardState, color);
        console.log("cppMove result: ", result);

        //const move = randomMove(boardState, color);
        res.json({ move: result });
    } catch (error) {
        console.error("Error occurred while fetching cppMove:", error);
        res.status(500).json({ piecePos: -1, targetPos: -1 });
    }
});

module.exports = router;