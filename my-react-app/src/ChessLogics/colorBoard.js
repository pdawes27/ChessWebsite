import './boardColors.css';

function colorBoard(board, color = 'classic', row=8, col=8) {
    let light, dark;
    if (color === 'classic') {
        light = 'lightclassic';
        dark = 'darkclassic';
    } else if (color === 'utk') {
        light = 'lightutk';
        dark = 'darkutk';
    } else if (color === 'earth') {
        light = 'lightearth';
        dark = 'darkearth';
    }

    for (let i = 0; i < row; i++) {
        for (let j = 0; j < col; j++) {
            const square = board.children[i*col+j];
            if ((i+j) % 2 === 1) {
                square.classList.add(light);
            } else {
                square.classList.add(dark);
            }
        }
    }
}

export default colorBoard;