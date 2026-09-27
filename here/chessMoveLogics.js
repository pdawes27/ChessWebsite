const express = require('express');
const router = express.Router();
console.log("chessMoveLogics loaded");

let row = 8, col = 8;
let prevMove = '';

function diagonalMove(boardState, PiecePos, targetPos) {
    const board = document.getElementById('board');
    if (Math.abs(Math.floor(PiecePos/row) - Math.floor(targetPos/row)) !==
        Math.abs(PiecePos%col - targetPos%col)) {
        return false;
    } else if ((Math.floor(PiecePos/row)<Math.floor(targetPos/row) && PiecePos%col<targetPos%col) ||
                (Math.floor(PiecePos/row)>Math.floor(targetPos/row) && PiecePos%col>targetPos%col)) {
        for (let i = Math.min(PiecePos, targetPos)+9; i < Math.max(PiecePos, targetPos); i+=9) {
            if(!!boardState[i]) {
                return false;
            }
        }
    } else {
        for (let i = Math.min(PiecePos, targetPos)+7; i < Math.max(PiecePos, targetPos); i+=7) {
            if(!!boardState[i] && Math.floor(i/row) !== Math.floor(targetPos/row)) {
                return false;
            }
        }
    }
    return true;
}

function straightMove(boardState, PiecePos, targetPos) {
    if (Math.floor(PiecePos/row) !== Math.floor(targetPos/row) &&
        PiecePos%col !== targetPos%col) { 
        return false;
    } else if (Math.floor(PiecePos/row) === Math.floor(targetPos/row)) {
        for (let i = Math.min(PiecePos, targetPos)+1; i < Math.max(PiecePos, targetPos); i++) {
            if(!!boardState[i]) {
                return false;
            }
        }
    } else {
        for (let i = Math.min(PiecePos, targetPos)+row; i < Math.max(PiecePos, targetPos); i+=row) {
            if(!!boardState[i]) {    
                return false;
            }
        }
    }
    return true;
}

function knightMove(piecePos, targetPos) {
    if ((Math.abs(Math.floor(piecePos/row) - Math.floor(targetPos/row)) === 2 && Math.abs(piecePos%col - targetPos%col) === 1) ||
        (Math.abs(Math.floor(piecePos/row) - Math.floor(targetPos/row)) === 1 && Math.abs(piecePos%col - targetPos%col) === 2)) {
        return true;
    }
}

function whitePawnMove(boardState, piecePos, targetPos) {
    console.log("Testing white pawn move from", piecePos, "to", targetPos);
    if ((targetPos === piecePos-row && !boardState[targetPos]) ||
        ((targetPos === piecePos-row-1 && !!boardState[targetPos]) || (targetPos === piecePos-row+1 && !!boardState[targetPos]))) {
            return true;
    } else if (targetPos === piecePos-2*row && !boardState[targetPos] && boardState[piecePos].firstMove == 1 &&
        !boardState[piecePos-row]) {
        return true;
    } else if (prevMove.endsWith('*')) {
        let lastMoveTarget = prevMove.slice(prevMove.indexOf('-')+1, prevMove.indexOf('-')+3);
        let pawnPos = (8 - parseInt(lastMoveTarget[1]))*col + 'hgfedcba'.indexOf(lastMoveTarget[0]);
        if ((targetPos === piecePos-row-1 || targetPos === piecePos-row+1) && targetPos === pawnPos-col) {
            boardState[pawnPos] = null;
            return true;
        }
    }
    console.log(targetPos === piecePos-row, !boardState[targetPos], targetPos === piecePos-row-1, 
        boardState[targetPos], targetPos === piecePos-row+1, boardState[targetPos]);
    console.log(targetPos === piecePos-2*row, !boardState[targetPos], boardState[piecePos].firstMove == 1, !boardState[piecePos-row]);
    console.log(prevMove.endsWith('*'), targetPos === piecePos-row-1, targetPos === piecePos-row+1, targetPos === pawnPos-col);
    return false;
}

function blackPawnMove(boardState, piecePos, targetPos) {
    if ((targetPos === piecePos+row && !boardState[targetPos]) ||
        ((targetPos === piecePos+row-1 && boardState[targetPos]) || (targetPos === piecePos+row+1 && boardState[targetPos]))) {
        return true;
    } else if (targetPos === piecePos+2*row && !boardState[targetPos] && boardState[piecePos].firstMove == 1 &&
        !!boardState[piecePos+row]) {
        return true;
    } else if (prevMove.endsWith('*')) {
        let lastMoveTarget = prevMove.slice(prevMove.indexOf('-')+1, prevMove.indexOf('-')+3);
        let pawnPos = (8 - parseInt(lastMoveTarget[1]))*col + 'hgfedcba'.indexOf(lastMoveTarget[0]);
        if ((targetPos === piecePos+row-1 || targetPos === piecePos+row+1) && targetPos === pawnPos+col) {
            boardState[pawnPos] = null;
            return true;
        }
    }
}

function kingMove(boardState, piecePos, targetPos) {
    if ((Math.abs(Math.floor(piecePos/row) - Math.floor(targetPos/row)) <= 1) &&
        (Math.abs(piecePos%col - targetPos%col) <= 1)) {
        return true;
    } else if (boardState[piecePos].firstMove && castling(boardState,piecePos, targetPos)) {
        return true;
    }
}

function castling(boardState, piecePos, targetPos) {
    const currentKing = boardState[piecePos];

    if (canCapture(piecePos, currKing.classList.contains('white') ? 'white' : 'black')) return false;

    if (pos-targetPos === 2) {
        for (let i = pos-1;i > pos-3;i--) {
            if (!boardState[i]) {
                return false;
            }
        }
        if (inCheckTest(currentKing.color, currentKing, pos-1)) return false;
        
        const rook = boardState[pos-3];
        if (rook.firstMove) {
            rook.firstMove = 0;
            boardState[pos-1] = rook;
            boardState[pos-3] = null;
            return true;
        }
    } else if (targetPos-pos === 2) {
        for (let i = pos+1;i < pos+4;i++) {
            if (!!boardState[i]) {
                return false;
            }
        }
        if (inCheckTest(currentKing.color, currentKing, pos+1)) return false;
        
        const rook = boardState[pos+4];
        if (rook.firstMove) {
            rook.firstMove = 0;
            boardState[pos+1] = rook;
            boardState[pos+4] = null;
            return true;
        }
    }
    return false;
}

function inCheckTest(boardState, piecePos, targetPos) {
    const color = boardState[piecePos].color;
    const temp = boardState[targetPos];
    boardState[targetPos] = boardState[piecePos];
    boardState[piecePos] = null;
    let res = canCapture(boardState, piecePos, color);
    boardState[piecePos] = boardState[targetPos];
    boardState[targetPos] = temp;
    return res;
}

function canCapture(boardState, piecePos, color) {
    const otherPieces = boardState.filter(color === 'white' ? 
        piece => piece && piece.color === 'black' : piece => piece && piece.color === 'white');
    for (let otherPiece of otherPieces) {
        if (captureTest(boardState, otherPiece, piecePos) !== -1) {
            return true;
        }
    }
    return false;
}

function captureTest(boardState, piecePos, targetPos) {
    const piece = boardState[piecePos];
    switch (piece.classList[1]) {
        case 'p':
            if (piece.classList.contains('white')) {
                if (targetPos === piecePos-row+1 || targetPos === piecePos-row-1) return piecePos;
            } else {
                if (targetPos === piecePos+row+1 || targetPos === piecePos+row-1) return piecePos;
            }
            break;
        case 'n':
            if (knightMove(piecePos, targetPos)) return piecePos;
            break;
        case 'b':
            if (diagonalMove(boardState, piecePos, targetPos)) return piecePos;
            break;
        case 'r':
            if (straightMove(boardState, piecePos, targetPos)) return piecePos;
            break;
        case 'q':
            if (diagonalMove(boardState, piecePos, targetPos) || straightMove(boardState, piecePos, targetPos)) return piecePos;
            break;
        case 'k':
            if (kingMove(boardState, piecePos, targetPos)) return piecePos;
            break;
    }
    return -1;
}

function blockTest(boardState, piecePos, targetPos) {
    const piece = boardState[piecePos];
    switch (piece.piece) {
        case 'p':
            const target = boardState[targetPos];
            if (piece.color === 'white') {
                if ((targetPos === piecePos-row && !target) ||
                (targetPos === piecePos-2*row && !target && piece.firstMove == 1 &&
                !!boardState[piecePos-row])) return piecePos;
            } else {
                if ((targetPos === piecePos+row && !target) ||
                (targetPos === piecePos-2*row && !target && piece.firstMove == 1 &&
                !!boardState[piecePos+row])) return piecePos;
            }
            break;
        case 'n':
            if (knightMove(piecePos, targetPos)) return piecePos;
            break;
        case 'b':
            if (diagonalMove(boardState, piecePos, targetPos)) return piecePos;
            break;
        case 'r':
            if (straightMove(boardState, piecePos, targetPos)) return piecePos;
            break;
        case 'q':
            if (diagonalMove(boardState, piecePos, targetPos) || straightMove(boardState, piecePos, targetPos)) return piecePos;
            break;
        case 'k':
            return -1;
    }
    return -1;
}

function checkmateTest(boardState, color) {
    const kingPos = boardState.findIndex(piece => piece && piece.piece === 'k' && piece.color === color);
    let checks = [];
    const oppositeColor = color === 'white' ? 'black' : 'white';
    const otherPieces = boardState.map((piece, index) => piece && piece.color === oppositeColor ? index : null).filter((x) => x !== null);
    
    for (let piecePos of otherPieces) {
        if (captureTest(boardState, piecePos, kingPos) !== -1) {
            checks.push(piecePos);
        }
    }
    if (checks.length === 0) return 0;

    for (let i = -1; i <= 1;i++) {
        for (let j = -1; j <= 1;j++) {
            const targetPos = kingPos + i*col + j;
            if (targetPos < 0 || targetPos >= row*col || (i === 0 && j === 0) || kingPos%col+j < 0 || kingPos%col+j >= col) {
                continue;
            }
            const target = boardState[targetPos];
            if (target && target.color === color) {
                continue;
            }
            if (!inCheckTest(boardState, kingPos, targetPos)) {
                return 1;
            }
        }
    }

    if (checks.length >= 2) {
        return 2;
    }

    const piecePos = checks[0];
    const allyPieces = boardState.map((piece, index) => piece && piece.color === color ? index : null).filter((x) => x !== null);
    for (let allyPiece of allyPieces) {
        if (captureTest(boardState, allyPiece, piecePos) !== -1) {
            if (!inCheckTest(boardState, allyPiece, piecePos)) {
                return 1;
            }
        }
    }

    if (boardState[piecePos]?.piece === 'p' || boardState[piecePos]?.piece === 'n') return 2;

    let rowCheck = Math.floor(piecePos/row)-Math.floor(kingPos/row);
    if (rowCheck !== 0) rowCheck = rowCheck/Math.abs(rowCheck);
    let colCheck = (piecePos%col)-(kingPos%col);
    if (colCheck !== 0) colCheck = colCheck/Math.abs(colCheck);
    
    let currPos = kingPos + rowCheck*col + colCheck;
    while (currPos !== piecePos) {
        for (let allyPiece of allyPieces) {
            if (blockTest(boardState, allyPiece, currPos) !== -1) {
                if (!inCheckTest(boardState, allyPiece, currPos)) {
                    return 1;
                }
            }
        }
        currPos += rowCheck*col + colCheck;
    }

    return 2;
}

function properMove(boardState, piecePos, targetPos) {
    console.log("Proper move test:", {boardState, piecePos, targetPos}, "testing");
    const piece = boardState[piecePos];
    const target = boardState[targetPos];
    if (piecePos === targetPos) {
        console.log("Same position");
        return false;
    }

    console.log("Testing move for piece:", piece, "to target:", target);
    if (piece.piece === 'p') {
        console.log("Testing pawn move");
        if (piece.color === 'white') {
            if (!whitePawnMove(boardState, piecePos, targetPos)) {
                console.log("Illegal pawn move");
                return false;
            }
        } else {
            if (!blackPawnMove(boardState, piecePos, targetPos)) {
                return false;
            }
        }
    } else if (piece.piece === 'n') {
        if (!knightMove(piecePos, targetPos)) {
            return false;
        }
    } else if (piece.piece === 'b') {
        if (!diagonalMove(boardState, piecePos, targetPos)) return false;
    } else if (piece.piece === 'r') {
        if (!straightMove(boardState, piecePos, targetPos)) return false;
    } else if (piece.piece === 'q') {
        if (!diagonalMove(boardState, piecePos, targetPos) && !straightMove(boardState, piecePos, targetPos)) {
            return false;
        }
    } else if (piece.piece === 'k') {
        if (!kingMove(boardState, piecePos, targetPos)) {
            return false;
        }
    }

    console.log("Move is legal, checking for checks");

    if (inCheckTest(boardState, piecePos, targetPos)) {
        return false;
    }

    console.log("Move does not put own king in check");

    if (!(piece.color === 'white' && target.color === 'white' ||
                piece.color === 'black' && target.color === 'black')) {
        if (piece.firstMove) {
            piece.firstMove = 0;
        }
        return true;
    }
    return false;
}

function addMove(boardState, piecePos, targetPos, promoted, capture) {
    let move = '';
    const rank = 'hgfedcba';
    const piece = boardState[piecePos].piece;

    if (piece === 'k' && Math.abs(piecePos-targetPos) === 2) {
        if (piecePos-targetPos === 2) {
            move = '0-0';
        } else {
            move = '0-0-0';
        }
    } else {
        if (piece !== 'p') {
            move += piece.toUpperCase();
        }

        move += rank[piecePos%col];
        move += 8 - Math.floor(piecePos/row);

        if (capture) move += 'x';
        else move += '-';

        move += rank[targetPos%col];
        move += 8 - Math.floor(targetPos/row);
    }

    if (promoted !== '') {
        move += `=${promoted.toUpperCase()}`;
    }

    prevMove = move;
    if (piece === 'p' && Math.abs(piecePos-targetPos) === col*2) prevMove += '*';
    return move;
}

router.post('/checkmateTest', (req, res) => {
    const { boardState, color } = req.body;
    const result = checkmateTest(boardState, color);
    res.json(result);
});

router.post('/properMove', (req, res) => {
    const { boardState, piecePos, targetPos } = req.body;
    const result = properMove(boardState, piecePos, targetPos);
    res.json(result);
});

router.post('/addMove', (req, res) => {
    const { boardState, piecePos, targetPos, promoted, capture } = req.body;
    const move = addMove(boardState, piecePos, targetPos, promoted, capture);
    res.json(move);
});

module.exports = router;