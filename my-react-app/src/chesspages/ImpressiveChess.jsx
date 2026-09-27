import {useEffect, useRef, useState} from 'react';
import colorBoard from '../ChessLogics/colorBoard.js';
import {moveForward, moveBackward} from '../ChessLogics/navigateGameLogic.js';
import './impressivechess.css';
import './chess.css';
import './closeSection.css';

let row=8, col=8;
let initialSetup = "RNBQKBNRPPPPPPPP                                pppppppprnbqkbnr";

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
                if (initialSetup[i*col+j].toLowerCase() === 'p' ||
                    initialSetup[i*col+j].toLowerCase() === 'k' ||
                    initialSetup[i*col+j].toLowerCase() === 'r') {
                    piece.dataset.firstMove = 1;
                }
                piece.dataset.position = row*col - (i*col+j) - 1;
                square.appendChild(piece);
            }
            square.dataset.placement = row*col - (i*col+j) - 1;

            board.appendChild(square);
        }
    }
    colorBoard(board, color);
}

async function gamePicked(game, setMoveList) {
    document.querySelector('.gameList').classList.add('closeSection');
    document.querySelector('.backChess').classList.remove('closeSection');
    document.getElementById('board').classList.remove('closeSection');
    document.getElementById('moveList').classList.remove('closeSection');

    const gameData = await import(`./chessGames/${game}.txt?raw`);
    if (!gameData) {
        console.error('Error loading game: File not found');
        return;
    }

    const moves = gameData.default.split(/[ \n\r]/).filter(move => move.trim() !== '')
        .map((move, index) => ({ id: index, text: move }));
    setMoveList(moves.slice(0, -1));
}

function returnToMenu(boardRef, setMoveList, setTurn) {
    document.querySelector('.gameList').classList.remove('closeSection');
    document.querySelector('.backChess').classList.add('closeSection');
    document.getElementById('board').classList.add('closeSection');
    document.getElementById('moveList').classList.add('closeSection');

    boardRef.current.innerHTML = '';
    initializeBoard(boardRef.current);
    setMoveList([]);
    setTurn(0);
}

function ImpressiveChess(props) {
    const boardRef = useRef(null);
    const boardColor = props.boardColor;
    const [moveList, setMoveList] = useState([]);
    const [turn, setTurn] = useState(0);
    
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
            <div className="gameList">
                <h1>Impressive Chess Games</h1>
                <p>Here you can view impressive chess games!</p>
                <ul>
                    <li><button onClick={() => gamePicked("OperaHouse", setMoveList)}>View Opera House Game</button></li>
                    <li><button onClick={() => gamePicked("GoldCoins", setMoveList)}>View Gold Coins Game</button></li>
                    <li><button onClick={() => gamePicked("QuickPromotion", setMoveList)}>View Quick Promotion Game</button></li>
                </ul>
            </div>
            <div className="backChess closeSection">
                <div id="board" className="closeSection" ref={boardRef}/>
                <div id="moveList" className="closeSection impressiveMoveList">
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
                    <div className="navigateGame">
                        <button onClick={() => moveForward(boardRef, moveList, turn, setTurn)}>Continue</button>
                        <button onClick={() => moveBackward(boardRef, moveList, turn, setTurn)}>Back</button>
                        <button onClick={() => returnToMenu(boardRef, setMoveList, setTurn)}>Return</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ImpressiveChess;