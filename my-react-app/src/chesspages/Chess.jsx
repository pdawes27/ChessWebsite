import colorBoard from '../ChessLogics/colorBoard.js';
import { useEffect, useRef, useState } from 'react';
import temp from '../assets/react.svg';
import {properMove, pendingPromotion, setPendingPromotion, addMove, checkmateTest} from '../ChessLogics/chessMoveLogic.js';
import './chess.css';
import './closeSection.css';

let row=8, col=8;
let turn = 'white';
let fiftyMoveRule = 0;
const initialSetup = "RNBQKBNRPPPPPPPP                                pppppppprnbqkbnr";
let draggedPiece = null;
let appendMoveList = null;
let boardPrim = null;
let computer = null;
const computerFile = 'api/computer/cppMove';

function dragStartHandler(event) {
    if (computer === turn) return;
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

    if (draggedPiece && targetSquare && draggedPiece.classList.contains(turn)) {
        await playMove(draggedPiece, targetSquare);
    }
    draggedPiece = null;
}

async function playMove(piece, targetSquare) {
    if (!properMove(piece, targetSquare, true, (computer === turn) ? true : false)) return;
    while (pendingPromotion === '*') {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    addingMove(piece, targetSquare);
    turn = (turn === 'white') ? 'black' : 'white';
    
    if (computer === turn) {
        setTimeout(async () => {
            const moveJson = await fetch(computerFile, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                boardState: boardPrim,
                color: computer
            })
        })
        const moveData = await moveJson.json();
        
        const piece = document.querySelector(`img[data-position="${moveData.move.piecePos}"]`);
        const targetSquare = document.querySelector(`div[data-placement="${moveData.move.targetPos}"]`);
        await playMove(piece, targetSquare);
        }, 100);
    }
}

function addingMove(piece, targetSquare) {
    const piecePos = parseInt(piece.dataset.position);
    const targetPos = parseInt(targetSquare.dataset.placement);

    let move = addMove(piece, targetSquare, pendingPromotion, 
        targetSquare.querySelector('img') !== null);
 
    if (targetSquare.querySelector('img') !== null || piece.classList.contains('p')) {
        fiftyMoveRule = 0;
    } else fiftyMoveRule++;

    if (move[0] === 'O') updateBoardPrim(piecePos, targetPos, true);
    else if (move.includes('*')) {
        updateBoardPrim(piecePos, targetPos, false, true);
        move = move.replace('*', '');
    }
    else if (pendingPromotion !== '') {
        updateBoardPrim(piecePos, targetPos, false, false, pendingPromotion);
        piece.classList.remove('p');
        piece.classList.add(pendingPromotion);
        const color = piece.classList.contains('white') ? 'w' : 'b';
        piece.src = `pieces/${color}${(color === 'w') ? pendingPromotion.toUpperCase() : pendingPromotion}.png`;
        setPendingPromotion('');
    }
    else updateBoardPrim(piecePos, targetPos);

    // if (piece.classList.conatins('p') || targetSquare.querySelector('img') !== null) {
    //     fiftyMoveRule = 0;
    // } else fiftyMoveRule++;

    targetSquare.innerHTML = '';
    piece.dataset.position = targetSquare.dataset.placement;
    targetSquare.appendChild(piece);

    const mate = checkmateTest((turn === 'white') ? 'black' : 'white');
    if (mate == 1) {
        move += '+';
    } else if (mate == 2) {
        move += '#';
        endGame(turn);
    } else if (mate == 3) {
        endGame('draw', 'Stalemate');
    } else if (fiftyMoveRule >= 100) { // 100 because counted in half steps
        endGame('draw', 'Fifty-Move Rule');
    }

    if (appendMoveList) {
        appendMoveList((currentMoves) => [...currentMoves, {id: crypto.randomUUID(), text: move}]);
    }
}

function endGame(winner, reason='na') {
    const winnerDiv = document.querySelector('.winner');
    if (winner === 'draw') {
        winnerDiv.querySelector('h1').textContent = reason;
    } else {
        winnerDiv.querySelector('h1').textContent = `${winner.charAt(0).toUpperCase() + winner.slice(1)} Wins!`;
    }
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
                piece.src = `pieces/${(i > 3) ? 'b' : 'w'}${initialSetup[i*col+j]}.png`;
                piece.classList.add((i > 3) ? 'black' : 'white');
                piece.classList.add(initialSetup[i*col+j].toLowerCase());
                piece.draggable = true;
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

function updateBoardPrim(piecePos, targetPos, castled=false, enPassant=false, promotionPiece=null) {
    boardPrim[piecePos].firstMove = 0;
    boardPrim[targetPos] = structuredClone(boardPrim[piecePos]);
    boardPrim[piecePos] = null;
    if (castled) {
        if (targetPos < piecePos) {
            boardPrim[targetPos+1] = structuredClone(boardPrim[targetPos-1]);
            boardPrim[targetPos-1] = null;
            boardPrim[targetPos+1].firstMove = 0;
        } else {
            boardPrim[targetPos-1] = structuredClone(boardPrim[targetPos+2]);
            boardPrim[targetPos+2] = null;
            boardPrim[targetPos-1].firstMove = 0;
        }
    }
    if (enPassant) {
        if (boardPrim[targetPos].color === 'white') {
            boardPrim[targetPos+col] = null;
        } else {
            boardPrim[targetPos-col] = null;
        }
    }
    
    if (!!promotionPiece) {
        boardPrim[targetPos].piece = promotionPiece;
    }
}

function gameplay(type, color) {
    if (type === 'pvc' && color === 'none') {
        document.querySelector('.localPlayPvC').classList.remove('closeSection');
        return;
    } else if (type === 'pvc') {
        computer = (color === 'white') ? 'black' : 'white';
        const compPieces = document.getElementById('board').querySelectorAll(`img.${computer}`);
        for (let piece of compPieces) {
            piece.draggable = false;
        }
        document.querySelector('.localPlayPvC').classList.add('closeSection');
    }
    document.querySelector('.backChess').classList.remove('closeSection');
    document.getElementById('board').classList.remove('closeSection');
    document.getElementById('moveList').classList.remove('closeSection');
    document.querySelector('.localPlay').classList.add('closeSection');

    if (computer === 'white') {
        setTimeout(async () => {
            const moveJson = await fetch(computerFile, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    boardState: boardPrim,
                    color: computer
                })
            });
            const moveData = await moveJson.json();

            const piece = document.querySelector(`img[data-position="${moveData.move.piecePos}"]`);
            const targetSquare = document.querySelector(`div[data-placement="${moveData.move.targetPos}"]`);
            
            playMove(piece, targetSquare);
        }, 100);
    }
}

function Chess(props) {
    const boardRef = useRef(null);
    const [moveList, setMoveList] = useState([]);
    const boardColor = props.boardColor;

    appendMoveList = setMoveList;

    useEffect(() => {
        if (boardRef.current) {
            initializeBoard(boardRef.current, boardColor);
            boardPrim = initializeBoardPrimitive();
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
                <button className="localPlayButton" onClick={() => gameplay('pvp', 'none')}>Player vs Player</button>
                <button className="localPlayButton" onClick={() => gameplay('pvc', 'none')}>Player vs Computer</button>
                <div className="localPlayPvC closeSection">
                    <p>Pick Side</p>
                    <button onClick={() => gameplay('pvc', 'white')}>White</button>
                    <button onClick={() => gameplay('pvc', 'black')}>Black</button>
                </div>
            </div>
            <div className="backChess closeSection">
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
                <div id="board" className="closeSection" ref={boardRef}></div>
                <div id="moveList" className="closeSection">
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