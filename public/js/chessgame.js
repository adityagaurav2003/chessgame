const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard(); // Render the board when the role is assigned
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard(); // Render the board after a move
});

socket.on("boardState", (fen) => {
    chess.load(fen); // Load the board state from the FEN string
    renderBoard(); // Render the board with the updated state
});

socket.on("invalidMove", (move) => {
    console.log("Invalid move received from server:", move);
});

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = ""; // Clear the board element
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );

                pieceElement.innerText = getPieceUnicode(square.type);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });
                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });
};

const handleMove = (from, to) => {
    const move = chess.move({
        from: `${String.fromCharCode(97 + from.col)}${8 - from.row}`,
        to: `${String.fromCharCode(97 + to.col)}${8 - to.row}`,
        promotion: "q" // Promote to a queen
    });

    if (move) {
        renderBoard();
        socket.emit("move", move);
    } else {
        console.log("Invalid move");
    }
};

const getPieceUnicode = (type) => {
    const pieceUnicode = {
        p: "♟",
        r: "♖",
        n: "♘",
        b: "♗",
        q: "♕",
        k: "♔",
        P: "♙",
        R: "♖",
        N: "♘",
        B: "♗",
        Q: "♕",
        K: "♔"
    };
    return pieceUnicode[type] || "";
};

// Initial render of the board
renderBoard();
