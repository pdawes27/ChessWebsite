import colorBoard from '../ChessLogics/colorBoard.js';
import { useEffect, useRef, useState } from 'react';
import temp from '../assets/react.svg';
import './chess.css';
import './closeSection.css';

let row=8, col=8;
let turn = 'white';
const initialSetup = "RNBQKBNRPPPPPPPP                                pppppppprnbqkbnr";
let pendingPromotion = '';
let draggedPiece = null;
let appendMoveList = null;
let boardState = null;
let computer = null;

function dragStartHandler(event) {
    draggedPiece = event.currentTarget;
    event.dataTransfer.setData('text/plain', 'piece');
    event.dataTransfer.effectAllowed = 'move';
}

function dragOverHandler(event) {
    event.preventDefault();
}

async function dropHandler(event) {
    event.preventDefault();
    const targetSquare = event.currentTarget;

    if (pendingPromotion !== '') return;

    console.log("dragdrop");
    if (draggedPiece && targetSquare && draggedPiece.classList.contains(turn)) {
        const proper = await fetch('/api/compute/properMove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                boardState: boardState,
                piecePos: parseInt(draggedPiece.dataset.position),
                targetPos: parseInt(targetSquare.dataset.placement)
            })
        });
        console.log(proper);
        if (!proper) {
            console.log("Error in move validation");
            return;
        }
        const properResult = await proper.json();
        console.log("Proper move result:", properResult);
        if (!properResult) {
            console.log("Invalid move");
            return;
        }

        const targetPos = parseInt(targetSquare.dataset.placement);
        if ((draggedPiece.classList.contains('p') && (targetPos < col || targetPos >= (row*col)-col))) {
            pendingPromotion = '*';
            promotion(draggedPiece.dataset.position, targetPos, draggedPiece.classList.contains('white') ? 'w' : 'b');
        }
        addingMove(targetSquare);

        turn = (turn === 'white') ? 'black' : 'white';
    }
}

function promotion(piecePos, targetPos, color) {
    const board = document.getElementById('board');
    const promo = document.getElementById('promotion');
    promo.classList.add('open-promotion');
    const buttons = promo.querySelectorAll('button');
    for (let button of buttons) {
        button.addEventListener('click', () => {
            const piece = board.querySelector(`[data-placement="${piecePos}"]`).querySelector('img');
            board.querySelector(`[data-placement="${piecePos}"]`).innerHTML = '';
            board.querySelector(`[data-placement="${targetPos}"]`).innerHTML = '';
            piece.src = `pieces/${color}${(color === 'w') ? button.dataset.piece.toUpperCase() : button.dataset.piece}.png`;
            piece.classList.remove('p');
            piece.classList.add(button.dataset.piece);
            piece.dataset.position = targetPos;
            board.querySelector(`[data-placement="${targetPos}"]`).appendChild(piece);
            promo.classList.remove('open-promotion');
            setPendingPromotion(button.dataset.piece);
        });
    }
}

async function addingMove(targetSquare) {
    const moveWait = await fetch('/api/compute/addMove', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            boardState: boardState,
            piecePos: parseInt(draggedPiece.dataset.position),
            targetPos: parseInt(targetSquare.dataset.placement),
            promoted: pendingPromotion,
            capture: targetSquare.querySelector('img') !== null,
        })
    });
    let move = await moveWait.json();
    if (pendingPromotion === '') {
        targetSquare.innerHTML = '';
        draggedPiece.dataset.position = targetSquare.dataset.placement;
        targetSquare.appendChild(draggedPiece);
    } else setPendingPromotion('');
    draggedPiece = null;

    const mate = await fetch('/api/compute/checkmateTest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            boardState: boardState,
            color: (turn === 'white') ? 'black' : 'white'
        })
    });
    const mateResult = await mate.json();
    if (mateResult === 1) {
        move += '+';
    } else if (mateResult === 2) {
        move += '#';
        endGame(turn);
    } else if (mateResult === 3) {
        move += '½-½';
        endGame('draw');
    }

    if (appendMoveList) {
        appendMoveList((currentMoves) => [...currentMoves, {id: crypto.randomUUID(), text: move}]);
    }
}

function endGame(winner) {
    const winnerDiv = document.querySelector('.winner');
    if (winner !== 'draw') winnerDiv.querySelector('h1').textContent = `${winner.charAt(0).toUpperCase() + winner.slice(1)} Wins!`;
    else winnerDiv.querySelector('h1').textContent = `Draw!`;
    winnerDiv.classList.add('open-winner');
    const playAgainButton = winnerDiv.querySelector('.playagain');
    playAgainButton.addEventListener('click', () => {
        window.location.reload();
    });
}

function initializeBoard(board, color='classic') {
    board.innerHTML = '';

    for (let i = 0; i < row; i++) {
        for (let j = 0; j < col; j++) {
            const square = document.createElement('div');
            square.classList.add('square');

            if (initialSetup[i*col+j] !== ' ') {
                const piece = document.createElement('img');
                piece.draggable = true;
                piece.src = `pieces/${(i > 3) ? 'b' : 'w'}${initialSetup[i*col+j]}.png`;
                piece.classList.add((i > 3) ? 'black' : 'white');
                piece.classList.add(initialSetup[i*col+j].toLowerCase());
                if (initialSetup[i*col+j].toLowerCase() === 'p' ||
                    initialSetup[i*col+j].toLowerCase() === 'k' ||
                    initialSetup[i*col+j].toLowerCase() === 'r') {
                    piece.dataset.firstMove = 1;
                }
                piece.dataset.position = row*col - (i*col+j) - 1;
                piece.addEventListener('dragstart', dragStartHandler);
                square.appendChild(piece);
            }
            square.dataset.placement = row*col - (i*col+j) - 1;
            square.addEventListener('dragover', dragOverHandler);
            square.addEventListener('drop', dropHandler);

            board.appendChild(square);
        }
    }

    colorBoard(board, color);
    turn = 'white';
}

function initializeBoardPrimitive() {
    const boardArray = Array(row*col).fill(null);
    const size = row*col;
    for (let i = 0; i < row*col; i++) {
        const size_t = size - i - 1;
        if (initialSetup[size_t] !== ' ') {
            boardArray[i] = {piece: initialSetup[size_t].toLowerCase(),
                firstMove: (initialSetup[size_t].toLowerCase() === 'p' ||
                    initialSetup[size_t].toLowerCase() === 'k' ||
                    initialSetup[size_t].toLowerCase() === 'r') ? 1 : 0,
                color: (initialSetup[size_t] === initialSetup[size_t].toUpperCase()) ? 'white' : 'black'
            };
        }
    }
    return boardArray;
}

function gameplay(type) {
    document.querySelector('.backChess').classList.remove('close-backChess');
    document.getElementById('board').classList.remove('close-board');
    document.getElementById('moveList').classList.remove('close-moveList');
    document.querySelector('.localPlay').classList.add('close-localPlay');
}

function Chess(props) {
    const boardRef = useRef(null);
    const [moveList, setMoveList] = useState([]);
    const boardColor = props.boardColor;

    appendMoveList = setMoveList;
    boardState = initializeBoardPrimitive();

    useEffect(() => {
        if (boardRef.current) {
            initializeBoard(boardRef.current, boardColor);
        }
    }, []);

    useEffect(() => {
        if (boardRef.current) {
            colorBoard(boardRef.current, boardColor);
        }
    }, [boardColor]);

    return (
        <div>
            <div className="localPlay">
                        <h1>Local Play</h1>
                        <ul>
                            <li><button onClick={() => gameplay('pvp')}>Player vs Player</button></li>
                            <li><button onClick={() => gameplay('pvc')}>Player vs Computer</button></li>
                        </ul>
                    </div>
            <div className="backChess close-backChess">
                <div id="promotion" className="promotion">
                    <p>Promote to:</p>
                    <button type="button" className="promobutton" data-piece="n">
                        Knight
                    </button>
                    <button type="button" className="promobutton" data-piece="b">
                        Bishop
                    </button>
                    <button type="button" className="promobutton" data-piece="r">
                        Rook
                    </button>
                    <button type="button" className="promobutton" data-piece="q">
                        Queen
                    </button>
                </div>
                <div className="winner">
                    <h1>Winner!</h1>
                    <button type="button" className="playagain">
                        Play Again
                    </button>
                </div>
                <div id="board" className="close-board" ref={boardRef}></div>
                <div id="moveList" className="close-moveList">
                    <table>
                        <thead>
                            <tr>
                                <th>White</th>
                                <th>Black</th>
                            </tr>
                        </thead>
                        <tbody>
                            {moveList.map((move, i) => (i % 2 === 0) ?
                            (<tr key={move.id}>
                                <td>{`${Math.floor(i/2) + 1}.\t${move.text}`}</td>
                                <td>{(i === moveList.length - 1) ? "" : moveList[i+1]?.text}</td>
                            </tr>) : null
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Chess;