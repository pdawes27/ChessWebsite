let row = 8, col = 8;
let pendingPromotion = '';
let prevMove = '';

function diagonalMove(pos, targetPos) {
    const board = document.getElementById('board');
    if (Math.abs(Math.floor(pos/row) - Math.floor(targetPos/row)) !==
        Math.abs(pos%col - targetPos%col)) {
        return false;
    } else if ((Math.floor(pos/row)<Math.floor(targetPos/row) && pos%col<targetPos%col) ||
                (Math.floor(pos/row)>Math.floor(targetPos/row) && pos%col>targetPos%col)) {
        for (let i = Math.min(pos, targetPos)+9; i < Math.max(pos, targetPos); i+=9) {
            if(board.querySelector(`[data-placement="${i}"]`).querySelector('img')) {
                return false;
            }
        }
    } else {
        for (let i = Math.min(pos, targetPos)+7; i < Math.max(pos, targetPos); i+=7) {
            if(board.querySelector(`[data-placement="${i}"]`).querySelector('img') && Math.floor(i/row) !== Math.floor(targetPos/row)) {
                return false;
            }
        }
    }
    return true;
}

function straightMove(pos, targetPos) {
    const board = document.getElementById('board');
    if (Math.floor(pos/row) !== Math.floor(targetPos/row) &&
        pos%col !== targetPos%col) { 
        return false;
    } else if (Math.floor(pos/row) === Math.floor(targetPos/row)) {
        for (let i = Math.min(pos, targetPos)+1; i < Math.max(pos, targetPos); i++) {
            if (board.querySelector(`[data-placement="${i}"]`).querySelector('img')) {
                return false;
            }
        }
    } else {
        for (let i = Math.min(pos, targetPos)+row; i < Math.max(pos, targetPos); i+=row) {
            if (board.querySelector(`[data-placement="${i}"]`).querySelector('img')) {    
                return false;
            }
        }
    }
    return true;
}

function knightMove(pos, targetPos) {
    if ((Math.abs(Math.floor(pos/row) - Math.floor(targetPos/row)) === 2 && Math.abs(pos%col - targetPos%col) === 1) ||
        (Math.abs(Math.floor(pos/row) - Math.floor(targetPos/row)) === 1 && Math.abs(pos%col - targetPos%col) === 2)) {
        return true;
    }
}

function whitePawnMove(pos, targetPos, firstMove, t) {
    if ((targetPos === pos-row && !t) ||
        ((targetPos === pos-row-1 && t) || (targetPos === pos-row+1 && t))) {
        return true;
    } else if (targetPos === pos-2*row && !t && firstMove == 1 &&
        document.getElementById('board').querySelector(`[data-placement="${pos-row}"]`).querySelector('img') === null) {
        return true;
    } else if (prevMove.endsWith('*')) {
        let lastMoveTarget = prevMove.slice(prevMove.indexOf('-')+1, prevMove.indexOf('-')+3);
        let pawnPos = (8 - parseInt(lastMoveTarget[1]))*col + 'hgfedcba'.indexOf(lastMoveTarget[0]);
        if ((targetPos === pos-row-1 || targetPos === pos-row+1) && targetPos === pawnPos-col) {
            document.getElementById('board').querySelector(`[data-placement="${pawnPos}"]`).innerHTML = '';
            return true;
        }
    }
}

function blackPawnMove(pos, targetPos, firstMove, t) {
    if ((targetPos === pos+row && !t) ||
        ((targetPos === pos+row-1 && t) || (targetPos === pos+row+1 && t))) {
        return true;
    } else if (targetPos === pos+2*row && !t && firstMove == 1 &&
        document.getElementById('board').querySelector(`[data-placement="${pos+row}"]`).querySelector('img') === null) {
        return true;
    } else if (prevMove.endsWith('*')) {
        let lastMoveTarget = prevMove.slice(prevMove.indexOf('-')+1, prevMove.indexOf('-')+3);
        let pawnPos = (8 - parseInt(lastMoveTarget[1]))*col + 'hgfedcba'.indexOf(lastMoveTarget[0]);
        if ((targetPos === pos+row-1 || targetPos === pos+row+1) && targetPos === pawnPos+col) {
            document.getElementById('board').querySelector(`[data-placement="${pawnPos}"]`).innerHTML = '';
            return true;
        }
    }
}

function kingMove(pos, targetPos, firstMove) {
    if ((Math.abs(Math.floor(pos/row) - Math.floor(targetPos/row)) <= 1) &&
        (Math.abs(pos%col - targetPos%col) <= 1)) {
        return true;
    } else if (firstMove && castling(pos, targetPos)) {
        return true;
    }
}

function castling(pos, targetPos) {
    const board = document.getElementById('board');
    const currKing = board.querySelector(`[data-placement="${pos}"]`).querySelector('img');

    if (canCapture(currKing.dataset.position, currKing.classList.contains('white') ? 'white' : 'black')) return false;

    if (pos-targetPos === 2) {
        for (let i = pos-1;i > pos-3;i--) {
            if (board.querySelector(`[data-placement="${i}"]`).querySelector('img')) {
                return false;
            }
        }
        if (inCheckTest(currKing.classList.contains('white') ? 'white' : 'black', currKing, pos-1)) return false;
        let rook = board.querySelector(`[data-placement="${pos-3}"]`).querySelector('img');

        if (rook.dataset.firstMove) {
            board.querySelector(`[data-placement="${pos-1}"]`).appendChild(rook);
            rook.dataset.position = pos-1;
            rook.dataset.firstMove = 0;
            board.querySelector(`[data-placement="${pos-3}"]`).innerHTML = '';
            return true;
        }
    } else if (targetPos-pos === 2) {
        for (let i = pos+1;i < pos+4;i++) {
            if (board.querySelector(`[data-placement="${i}"]`).querySelector('img')) {
                return false;
            }
        }
        if (inCheckTest(currKing.classList.contains('white') ? 'white' : 'black', currKing, pos+1)) return false;
        let rook = board.querySelector(`[data-placement="${pos+4}"]`).querySelector('img');

        if (rook.dataset.firstMove) {
            board.querySelector(`[data-placement="${pos+1}"]`).appendChild(rook);
            rook.dataset.position = pos+1;
            rook.dataset.firstMove = 0;
            board.querySelector(`[data-placement="${pos+4}"]`).innerHTML = '';
            return true;
        }
        
    }
    return false;
}

function promotion(pos, targetPos, bot = false) {
    if (bot) {
        setPendingPromotion('q');
        return;
    }
    pendingPromotion = '*';
    const board = document.getElementById('board');
    const promo = document.getElementById('promotion');
    promo.classList.add('open-promotion');
    const buttons = promo.querySelectorAll('button');
    for (let button of buttons) {
        button.addEventListener('click', () => {
            promo.classList.remove('open-promotion');
            setPendingPromotion(button.dataset.piece);
        });
    }
}

function setPendingPromotion(value) {
    pendingPromotion = value;
}

function properMove(piece, targetSquare, realMove = true, botMove = false) {
    const targetPiece = targetSquare.querySelector('img');
    let pos = parseInt(piece.dataset.position);
    let targetPos = parseInt(targetSquare.dataset.placement);
    if (pos === targetPos) {
        return false;
    }

    if (piece.classList.contains('p')) {
        if (piece.classList.contains('white')) {
            if (!whitePawnMove(pos, targetPos, piece.dataset.firstMove, targetPiece)) {
                return false;
            }
        } else {
            if (!blackPawnMove(pos, targetPos, piece.dataset.firstMove, targetPiece)) {
                return false;
            }
        }
    } else if (piece.classList.contains('n')) {
        if (!knightMove(pos, targetPos)) {
            return false;
        }
    } else if (piece.classList.contains('b')) {
        if (!diagonalMove(pos, targetPos)) return false;
    } else if (piece.classList.contains('r')) {
        if (!straightMove(pos, targetPos)) return false;
    } else if (piece.classList.contains('q')) {
        if (!diagonalMove(pos, targetPos) && !straightMove(pos, targetPos)) {
            return false;
        }
    } else if (piece.classList.contains('k')) {
        if (!kingMove(pos, targetPos, piece.dataset.firstMove)) {
            return false;
        }
    }

    if (inCheckTest(piece.classList.contains('white') ? 'white' : 'black', piece, targetPos)) {
        return false;
    }

    if (!targetPiece || !(piece.classList.contains('white') && targetPiece.classList.contains('white') ||
            piece.classList.contains('black') && targetPiece.classList.contains('black'))) {
        if (realMove && piece.dataset.firstMove) {
            piece.dataset.firstMove = 0;
        }
        if (realMove && (piece.classList.contains('p') && (targetPos < col || targetPos >= (row*col)-col))) {
            promotion(pos, targetPos, botMove);
        }
        return true;
    }
    return false;
}

function inCheckTest(color, piece, targetPos) {
    const board = document.getElementById('board');
    const originalPos = piece.dataset.position;
    const targetSquare = board.querySelector(`[data-placement="${targetPos}"]`);
    const originalSquare = board.querySelector(`[data-placement="${originalPos}"]`);
    const targetPiece = targetSquare.querySelector('img');
    piece.dataset.position = targetPos;
    if (originalSquare.contains(piece)) originalSquare.removeChild(piece);
    targetSquare.innerHTML = '';
    targetSquare.appendChild(piece);
    let res = canCapture(parseInt(board.querySelector(`img.${(color === 'white') ? 'white' : 'black'}.k`).dataset.position), color);
    piece.dataset.position = originalPos;
    targetSquare.innerHTML = '';
    if (targetPiece) targetSquare.appendChild(targetPiece);
    originalSquare.appendChild(piece);
    return res;
}

function canCapture(piecePos, color) {
    const board = document.getElementById('board');
    const otherPieces = board.querySelectorAll(`img.${color === 'white' ? 'black' : 'white'}`);

    for (let otherPiece of otherPieces) {
        if (captureTest(otherPiece, piecePos) !== -1) {
            return true;
        }
    }
    return false;
}

function captureTest(piece, targetPos) {
    const board = document.getElementById('board');
    const pos = parseInt(piece.dataset.position);
    switch (piece.classList[1]) {
        case 'p':
            if (piece.classList.contains('white')) {
                if (targetPos === pos-row+1 || targetPos === pos-row-1) return pos;
            } else {
                if (targetPos === pos+row+1 || targetPos === pos+row-1) return pos;
            }
            break;
        case 'n':
            if (knightMove(pos, targetPos)) return pos;
            break;
        case 'b':
            if (diagonalMove(pos, targetPos)) return pos;
            break;
        case 'r':
            if (straightMove(pos, targetPos)) return pos;
            break;
        case 'q':
            if (diagonalMove(pos, targetPos) || straightMove(pos, targetPos)) return pos;
            break;
        case 'k':
            if (kingMove(pos, targetPos)) return pos;
            break;
    }
    return -1;
}

function blockTest(piece, targetPos) {
    const pos = parseInt(piece.dataset.position);
    switch (piece.classList[1]) {
        case 'p':
            const t = board.querySelector(`[data-placement="${targetPos}"]`).querySelector('img');
            if (piece.classList.contains('white')) {
                if ((targetPos === pos-row && !t) ||
                (targetPos === pos-2*row && !t && piece.dataset.firstMove == 1 &&
                board.querySelector(`[data-placement="${pos-row}"]`).querySelector('img') === null)) return pos;
            } else {
                if ((targetPos === pos+row && !t) ||
                (targetPos === pos-2*row && !t && piece.dataset.firstMove == 1 &&
                board.querySelector(`[data-placement="${pos+row}"]`).querySelector('img') === null)) return pos;
            }
            break;
        case 'n':
            if (knightMove(pos, targetPos)) return pos;
            break;
        case 'b':
            if (diagonalMove(pos, targetPos)) return pos;
            break;
        case 'r':
            if (straightMove(pos, targetPos)) return pos;
            break;
        case 'q':
            if (diagonalMove(pos, targetPos) || straightMove(pos, targetPos)) return pos;
            break;
        case 'k':
            return -1;
    }
    return -1;
}

function checkmateTest(color) {
    const board = document.getElementById('board');
    const king = board.querySelector(`img.${color}.k`);
    const kingPos = parseInt(king.dataset.position);

    let checks = [];
    const pieces = board.querySelectorAll(`img.${color === 'white' ? 'black' : 'white'}`);
    for (let piece of pieces) {
        if (captureTest(piece, kingPos) !== -1) {
            checks.push(piece);
        }
    }
    if (checks.length === 0) return stalemateTest(color);

    for (let i = -1; i <= 1;i++) {
        for (let j = -1; j <= 1;j++) {
            const targetPos = kingPos + i*col + j;
            if (targetPos < 0 || targetPos >= row*col || (i === 0 && j === 0) || kingPos%col+j < 0 || kingPos%col+j >= col) {
                continue;
            }
            const t = board.querySelector(`[data-placement="${targetPos}"]`).querySelector('img');
            if (t && t.classList.contains(color)) {
                continue;
            }
            if (!inCheckTest(color, king, targetPos)) {
                return 1;
            }
        }
    }

    if (checks.length >= 2) {
        return 2;
    }

    const piecePos = parseInt(checks[0].dataset.position);
    for (let allyPiece of board.querySelectorAll(`img.${color}`)) {
        if (captureTest(allyPiece, piecePos) !== -1) {
            if (!inCheckTest(color, allyPiece, piecePos)) {
                return 1;
            }
        }
    }


    if (checks[0].classList.contains('n') || checks[0].classList.contains('p')) return 2;
    let rowCheck = Math.floor(piecePos/row)-Math.floor(kingPos/row);
    if (rowCheck !== 0) rowCheck = rowCheck/Math.abs(rowCheck);
    let colCheck = (piecePos%col)-(kingPos%col);
    if (colCheck !== 0) colCheck = colCheck/Math.abs(colCheck);
    
    let currPos = kingPos + rowCheck*col + colCheck;
    while (currPos !== piecePos) {
        for (let allyPiece of board.querySelectorAll(`img.${color}`)) {
            if (blockTest(allyPiece, currPos) !== -1) {
                if (!inCheckTest(color, allyPiece, currPos)) {
                    return 1;
                }
            }
        }
        currPos += rowCheck*col + colCheck;
    }

    return 2;
}

function stalemateTest(color) {
    const board = document.getElementById('board');
    const king = board.querySelector(`img.${color}.k`);
    const kingPos = parseInt(king.dataset.position);
    for (let i = -1; i <= 1;i++) {
        for (let j = -1; j <= 1;j++) {
            const targetPos = kingPos + i*col + j;
            if (targetPos < 0 || targetPos >= row*col || 
                (i === 0 && j === 0) || kingPos%col+j < 0 || kingPos%col+j >= col) {
                continue;
            }
            const t = board.querySelector(`[data-placement="${targetPos}"]`).querySelector('img');
            if (t && t.classList.contains(color)) {
                continue;
            }
            if (!inCheckTest(color, king, targetPos)) {
                return 0;
            }
        }
    }

    const pieces = board.querySelectorAll(`img.${color}`);
    for (let piece of pieces) {
        const piecePos = parseInt(piece.dataset.position);
        switch (piece.classList[1]) {
            case 'p':
                let pawnMoves;
                if (piece.classList.contains('white')) {
                    pawnMoves = [piecePos-row, piecePos-row-1, piecePos-row+1, piecePos-2*row];
                } else {
                    pawnMoves = [piecePos+row, piecePos+row-1, piecePos+row+1, piecePos+2*row];
                }
                for (let targetPos of pawnMoves) {
                    if (targetPos < 0 || targetPos >= row*col 
                        || piecePos%col-1 < 0 || piecePos%col+1 >= col) {
                        continue;
                    }
                    if (properMove(piece, board.querySelector(`[data-placement="${targetPos}"]`), false)) {
                        return 0;
                    }
                }
                break;
            case 'n':
                const verticalKnightMoves = [piecePos-2*col-1, piecePos-2*col+1, piecePos+2*col-1, piecePos+2*col+1];
                const horizontalKnightMoves = [piecePos-col-2, piecePos-col+2, piecePos+col-2, piecePos+col+2];
                for (let targetPos of verticalKnightMoves) {
                    if (targetPos < 0 || targetPos >= row*col || piecePos%col-1 < 0 || piecePos%col+1 >= col) {
                        continue;
                    }
                    if (properMove(piece, board.querySelector(`[data-placement="${targetPos}"]`), false)) {
                        return 0;
                    }
                }
                for (let targetPos of horizontalKnightMoves) {
                    if (targetPos < 0 || targetPos >= row*col || piecePos%col-2 < 0 || piecePos%col+2 >= col) {
                        continue;
                    }
                    if (properMove(piece, board.querySelector(`[data-placement="${targetPos}"]`), false)) {
                        return 0;
                    }
                }
                break;
            case 'b':
                for (let i = piecePos-9; i >= 0; i-=9) {
                    if (properMove(piece, board.querySelector(`[data-placement="${i}"]`), false)) return 0;
                }
                for (let i = piecePos-7; i >= 0; i-=7) {
                    if (properMove(piece, board.querySelector(`[data-placement="${i}"]`), false)) return 0;
                }
                for (let i = piecePos+7; i < row*col; i+=7) {
                    if (properMove(piece, board.querySelector(`[data-placement="${i}"]`), false)) return 0;
                }
                for (let i = piecePos+9; i < row*col; i+=9) {
                    if (properMove(piece, board.querySelector(`[data-placement="${i}"]`), false)) return 0;
                }
                break;
            case 'r':
                for (let i = piecePos-col; i >= 0; i-=col) {
                    if (properMove(piece, board.querySelector(`[data-placement="${i}"]`), false)) return 0;
                }
                for (let i = piecePos+col; i < row*col; i+=col) {
                    if (properMove(piece, board.querySelector(`[data-placement="${i}"]`), false)) return 0;
                }
                for (let i = piecePos-1; i >= 0 && Math.floor(i/col) === Math.floor(piecePos/col); i--) {
                    if (properMove(piece, board.querySelector(`[data-placement="${i}"]`), false)) return 0;
                }
                for (let i = piecePos+1; i < row*col && Math.floor(i/col) === Math.floor(piecePos/col); i++) {
                    if (properMove(piece, board.querySelector(`[data-placement="${i}"]`), false)) return 0;
                }
                break;
            case 'q':
                for (let i = piecePos-col; i >= 0; i-=col) {
                    if (properMove(piece, board.querySelector(`[data-placement="${i}"]`), false)) return 0;
                }
                for (let i = piecePos+col; i < row*col; i+=col) {
                    if (properMove(piece, board.querySelector(`[data-placement="${i}"]`), false)) return 0;
                }
                for (let i = piecePos-1; i >= 0 && Math.floor(i/col) === Math.floor(piecePos/col); i--) {
                    if (properMove(piece, board.querySelector(`[data-placement="${i}"]`), false)) return 0;
                }
                for (let i = piecePos+1; i < row*col && Math.floor(i/col) === Math.floor(piecePos/col); i++) {
                    if (properMove(piece, board.querySelector(`[data-placement="${i}"]`), false)) return 0;
                }
                for (let i = piecePos-9; i >= 0; i-=9) {
                    if (properMove(piece, board.querySelector(`[data-placement="${i}"]`), false)) return 0;
                }
                for (let i = piecePos-7; i >= 0; i-=7) {
                    if (properMove(piece, board.querySelector(`[data-placement="${i}"]`), false)) return 0;
                }
                for (let i = piecePos+7; i < row*col; i+=7) {
                    if (properMove(piece, board.querySelector(`[data-placement="${i}"]`), false)) return 0;
                }
                for (let i = piecePos+9; i < row*col; i+=9) {
                    if (properMove(piece, board.querySelector(`[data-placement="${i}"]`), false)) return 0;
                }
                break;
            case 'k':
                break;
        }
    }
    return 3;
}

function addMove(piece, targetSquare, promoted, capture) {
    let move = '';
    const rank = 'hgfedcba';
    const pos = parseInt(piece.dataset.position);

    if (piece.classList.contains('k') && Math.abs(pos-targetSquare.dataset.placement) === 2) {
        if (pos-targetSquare.dataset.placement === 2) {
            move = 'O-O';
        } else {
            move = 'O-O-O';
        }
    } else {
        if (!piece.classList.contains('p')) {
            move += piece.classList[1].toUpperCase();
        }

        move += rank[pos%col];
        move += 8 - Math.floor(pos/row);

        if (capture) move += 'x';
        else move += '-';

        move += rank[targetSquare.dataset.placement%col];
        move += 8 - Math.floor(targetSquare.dataset.placement/row);
    }

    if (promoted !== '') {
        move += `=${promoted.toUpperCase()}`;
    }
    
    if (piece.classList.contains('p') && Math.abs(pos-targetSquare.dataset.placement) === col*2) prevMove += '*';
    
    prevMove = move;
    return move;
}

export {properMove, inCheckTest, pendingPromotion, setPendingPromotion, addMove, checkmateTest};