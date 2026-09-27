let row=8, col=8;
let initialSetup = "RNBQKBNRPPPPPPPP                                pppppppprnbqkbnr";

function castling(board, color, side, direction) {
    let oldKing, newKing, oldRook, newRook;
    if (color === 'black') {
        oldKing = 3;
        if (side === 'kingside') {
            newKing = 1;
            oldRook = 0;
            newRook = 2;
        } else {
            newKing = 5;
            oldRook = 7;
            newRook = 4;
        }
    } else {
        oldKing = 59;
        if (side === 'kingside') {
            newKing = 57;
            oldRook = 56;
            newRook = 58;
        } else {
            newKing = 61;
            oldRook = 63;
            newRook = 60;
        }
    }

    if (direction === 'backward') {
        let temp = oldKing;
        oldKing = newKing;
        newKing = temp;
        temp = oldRook;
        oldRook = newRook;
        newRook = temp;
    }

    const newKingSquare = board.querySelector(`[data-placement="${newKing}"]`);
    const oldKingSquare = board.querySelector(`[data-placement="${oldKing}"]`);
    newKingSquare.appendChild(oldKingSquare.querySelector('img'));
    newKingSquare.querySelector('img').dataset.position = oldKing;
    oldKingSquare.innerHTML = '';

    const newRookSquare = board.querySelector(`[data-placement="${newRook}"]`);
    const oldRookSquare = board.querySelector(`[data-placement="${oldRook}"]`);
    newRookSquare.appendChild(oldRookSquare.querySelector('img'));
    newRookSquare.querySelector('img').dataset.position = newRook;
    oldRookSquare.innerHTML = '';

    return board;
}

function getSquare(board, position) {
    const abc = 'hgfedcba';
    const index = col*(8-parseInt(position[1]))+abc.indexOf(position[0]);
    const square = board.querySelector(`[data-placement="${index}"]`);
    return square;
}

function moveForward(boardRef, moveList, turn, setTurn) {
    const board = boardRef.current;
    if (!board || turn >= moveList.length) return board;

    if (moveList[turn].text.includes('O-O')) {
        castling(board, (turn % 2 === 1) ? 'black' : 'white', 
            moveList[turn].text.includes('O-O-O') ? 'queenside' : 'kingside', 'forward');
    } else {
        const moves = moveList[turn].text.split(/[-x]/);
        moves[0] = moves[0].slice(-2);
        let promotionPiece = null;
        if (moves[1].includes('=')) promotionPiece = moves[1].split('=')[1][0];
        moves[1] = moves[1].slice(0, 2);

        let originalSquare = getSquare(board, moves[0]);
        let newSquare = getSquare(board, moves[1]);

        if (!originalSquare || !newSquare) {
            console.log('Error: Square not found');
            return board;
        }

        newSquare.innerHTML = '';
        originalSquare.querySelector('img').dataset.position = newSquare.dataset.placement;
        if (promotionPiece) {
            originalSquare.querySelector('img').src = `pieces/${(turn % 2 === 1) ? `b${promotionPiece.toLowerCase()}` : `w${promotionPiece}`}.png`;
            originalSquare.querySelector('img').classList.remove('p');
            originalSquare.querySelector('img').classList.add(promotionPiece.toLowerCase());
        }
        newSquare.appendChild(originalSquare.querySelector('img'));

        originalSquare.innerHTML = '';
    }

    setTurn(turn+1);
    return board;
}

function moveBackward(boardRef, moveList, turn, setTurn) {
    const board = boardRef.current;
    if (!board || turn < 1) return board;

    if (moveList[turn-1].text.includes('O-O')) {
        castling(board, (turn%2 === 1) ? 'white' : 'black', 
            moveList[turn-1].text.includes('O-O-O') ? 'queenside' : 'kingside', 'backward');
    } else {
        const moves = moveList[turn-1].text.split(/[-x]/);
        moves[0] = (moves[0].length > 2) ? moves[0].slice(-2) : moves[0];
        let promotionPiece = null;
        if (moves[1].includes('=')) promotionPiece = moves[1].split('=')[1][0];
        moves[1] = moves[1].slice(0, 2);

        let oldSquare = getSquare(board, moves[0]);
        let originalSquare = getSquare(board, moves[1]);

        if (!oldSquare || !originalSquare) {
            console.log('Error: Square not found');
            return board;
        }

        oldSquare.innerHTML = '';
        if (promotionPiece) {
            originalSquare.querySelector('img').src = `pieces/${(turn % 2 === 0) ? `bp` : `wP`}.png`;
            originalSquare.querySelector('img').classList.remove(promotionPiece.toLowerCase());
            originalSquare.querySelector('img').classList.add('p');
        }
        oldSquare.appendChild(originalSquare.querySelector('img'));
        const color = (turn % 2 === 1) ? 'black' : 'white';

        originalSquare.innerHTML = '';
        if (moveList[turn-1].text.includes('x')) {
            let capturedPiece = "";
            for (let i = turn-2; i>0; i--) {
                if (moveList[i].text.includes(moves[1])) {
                    capturedPiece = moveList[i].text[0];
                    capturedPiece = (capturedPiece === capturedPiece.toUpperCase()) ? capturedPiece : 'P';
                    break;
                }
            }
            if (!capturedPiece) {
                const pos = col*(8-parseInt(moves[1][1]))+'hgfedcba'.indexOf(moves[1][0]);
                capturedPiece = initialSetup[pos];
            }

            const piece = document.createElement('img');
            piece.src = `pieces/${(color === 'white') ? `w${capturedPiece}` : `b${capturedPiece.toLowerCase()}`}.png`;
            piece.classList.add((color === 'white') ? 'white' : 'black');
            piece.classList.add(capturedPiece.toLowerCase());
            piece.dataset.position = col*(8-parseInt(moves[0][1]))+'hgfedcba'.indexOf(moves[0][0]);

            originalSquare.appendChild(piece);
        }
    }

    setTurn(turn-1);
    return board;
}

export {moveForward, moveBackward};