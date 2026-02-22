const canvas = document.getElementById("board");
const context = canvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nextContext = nextCanvas.getContext("2d");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const linesEl = document.getElementById("lines");
const startButton = document.getElementById("start");
const pauseButton = document.getElementById("pause");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");

const gridWidth = 10;
const gridHeight = 20;
const blockSize = 30;

context.scale(blockSize, blockSize);
nextContext.scale(24, 24);

const colors = {
    I: "#38bdf8",
    J: "#818cf8",
    L: "#f59e0b",
    O: "#facc15",
    S: "#22c55e",
    T: "#a855f7",
    Z: "#f43f5e",
};

const shapes = {
    I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
    ],
    O: [
        [1, 1],
        [1, 1],
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
    ],
};

const state = {
    board: createMatrix(gridWidth, gridHeight),
    current: null,
    next: null,
    score: 0,
    lines: 0,
    level: 1,
    dropInterval: 1000,
    dropCounter: 0,
    lastTime: 0,
    running: false,
    paused: false,
};

function createMatrix(width, height) {
    return Array.from({ length: height }, () => Array(width).fill(null));
}

function createPiece(type) {
    return {
        type,
        matrix: shapes[type].map((row) => row.map((cell) => (cell ? type : null))),
        position: { x: Math.floor(gridWidth / 2) - 1, y: 0 },
    };
}

function drawMatrix(matrix, offset, ctx = context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = colors[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                ctx.strokeStyle = "rgba(15, 23, 42, 0.6)";
                ctx.lineWidth = 0.05;
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function drawBoard() {
    context.fillStyle = "#020617";
    context.fillRect(0, 0, gridWidth, gridHeight);
    drawMatrix(state.board, { x: 0, y: 0 });
    if (state.current) {
        drawMatrix(state.current.matrix, state.current.position);
    }
}

function drawNext() {
    nextContext.fillStyle = "#020617";
    nextContext.fillRect(0, 0, 5, 5);
    if (!state.next) return;
    const preview = state.next.matrix;
    const offsetX = Math.floor((4 - preview[0].length) / 2);
    const offsetY = Math.floor((4 - preview.length) / 2);
    const colored = preview.map((row) => row.map((cell) => (cell ? state.next.type : null)));
    drawMatrix(colored, { x: offsetX, y: offsetY }, nextContext);
}

function merge(board, piece) {
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[y + piece.position.y][x + piece.position.x] = piece.type;
            }
        });
    });
}

function collide(board, piece) {
    return piece.matrix.some((row, y) =>
        row.some((value, x) => {
            if (!value) return false;
            const newY = y + piece.position.y;
            const newX = x + piece.position.x;
            return (
                newX < 0 ||
                newX >= gridWidth ||
                newY >= gridHeight ||
                (newY >= 0 && board[newY][newX])
            );
        })
    );
}

function rotate(matrix) {
    const rotated = matrix.map((row, index) => matrix.map((col) => col[index]).reverse());
    return rotated;
}

function playerRotate() {
    if (!state.current || state.paused) return;
    const original = state.current.matrix;
    state.current.matrix = rotate(state.current.matrix);
    if (collide(state.board, state.current)) {
        state.current.matrix = original;
    }
}

function playerMove(direction) {
    if (!state.current || state.paused) return;
    state.current.position.x += direction;
    if (collide(state.board, state.current)) {
        state.current.position.x -= direction;
    }
}

function playerDrop() {
    if (!state.current || state.paused) return;
    state.current.position.y += 1;
    if (collide(state.board, state.current)) {
        state.current.position.y -= 1;
        merge(state.board, state.current);
        resetPiece();
        sweepLines();
        updateScore();
    }
    state.dropCounter = 0;
}

function hardDrop() {
    if (!state.current || state.paused) return;
    while (!collide(state.board, state.current)) {
        state.current.position.y += 1;
    }
    state.current.position.y -= 1;
    merge(state.board, state.current);
    resetPiece();
    sweepLines();
    updateScore();
    state.dropCounter = 0;
}

function sweepLines() {
    let rowsCleared = 0;
    outer: for (let y = state.board.length - 1; y >= 0; y -= 1) {
        for (let x = 0; x < state.board[y].length; x += 1) {
            if (!state.board[y][x]) {
                continue outer;
            }
        }
        const row = state.board.splice(y, 1)[0].fill(null);
        state.board.unshift(row);
        rowsCleared += 1;
        y += 1;
    }

    if (rowsCleared > 0) {
        const lineScores = [0, 100, 300, 500, 800];
        state.score += lineScores[rowsCleared] * state.level;
        state.lines += rowsCleared;
        if (state.lines >= state.level * 10) {
            state.level += 1;
            state.dropInterval = Math.max(200, state.dropInterval - 100);
        }
    }
}

function resetPiece() {
    if (!state.next) {
        state.next = createPiece(randomType());
    }
    state.current = state.next;
    state.current.position = {
        x: Math.floor(gridWidth / 2) - Math.ceil(state.current.matrix[0].length / 2),
        y: -1,
    };
    state.next = createPiece(randomType());
    drawNext();
    if (collide(state.board, state.current)) {
        endGame();
    }
}

function randomType() {
    const types = Object.keys(shapes);
    return types[Math.floor(Math.random() * types.length)];
}

function updateScore() {
    scoreEl.textContent = state.score;
    levelEl.textContent = state.level;
    linesEl.textContent = state.lines;
}

function update(time = 0) {
    if (!state.running) return;
    const delta = time - state.lastTime;
    state.lastTime = time;

    if (!state.paused) {
        state.dropCounter += delta;
        if (state.dropCounter > state.dropInterval) {
            playerDrop();
        }
    }

    drawBoard();
    requestAnimationFrame(update);
}

function startGame() {
    state.board = createMatrix(gridWidth, gridHeight);
    state.score = 0;
    state.lines = 0;
    state.level = 1;
    state.dropInterval = 1000;
    state.dropCounter = 0;
    state.lastTime = 0;
    state.running = true;
    state.paused = false;
    overlay.classList.add("hidden");
    resetPiece();
    updateScore();
    pauseButton.disabled = false;
    pauseButton.textContent = "Pausar";
    requestAnimationFrame(update);
}

function togglePause() {
    if (!state.running) return;
    state.paused = !state.paused;
    pauseButton.textContent = state.paused ? "Reanudar" : "Pausar";
    overlay.classList.toggle("hidden", !state.paused);
    overlayTitle.textContent = state.paused ? "Pausa" : "";
    overlayText.textContent = state.paused ? "Presiona P o reanudar." : "";
}

function endGame() {
    state.running = false;
    overlay.classList.remove("hidden");
    overlayTitle.textContent = "¡Game Over!";
    overlayText.textContent = "Presiona iniciar para volver a jugar.";
    pauseButton.disabled = true;
}

startButton.addEventListener("click", () => {
    startGame();
});

pauseButton.addEventListener("click", () => {
    togglePause();
});

document.addEventListener("keydown", (event) => {
    if (!state.running) return;
    switch (event.key) {
        case "ArrowLeft":
            playerMove(-1);
            break;
        case "ArrowRight":
            playerMove(1);
            break;
        case "ArrowDown":
            playerDrop();
            break;
        case "ArrowUp":
            playerRotate();
            break;
        case " ":
            event.preventDefault();
            hardDrop();
            break;
        case "p":
        case "P":
            togglePause();
            break;
        default:
            break;
    }
});

drawBoard();
