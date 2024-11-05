require('dotenv').config();

const express = require("express");
const socket = require("socket.io");
const { Chess } = require("chess.js");
const http = require("http");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);
const chess = new Chess();

let players = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", (uniquesocket) => {
    console.log("A player connected:", uniquesocket.id);

    // Assign roles to players
    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    } else {
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on("disconnect", () => {
        if (uniquesocket.id === players.white) {
            delete players.white;
        } else if (uniquesocket.id === players.black) {
            delete players.black;
        }
        console.log("A player disconnected:", uniquesocket.id);
    });

    uniquesocket.on("move", (move) => {
        // Ensure only the current player can make a move
        if ((chess.turn() === "w" && uniquesocket.id !== players.white) ||
            (chess.turn() === "b" && uniquesocket.id !== players.black)) {
            return;
        }

        const result = chess.move(move);
        if (result) {
            io.emit("move", move); // Broadcast the move to all players
            io.emit("boardState", chess.fen()); // Update the board state
        } else {
            console.log("Invalid move:", move);
            uniquesocket.emit("invalidMove", move); // Send invalid move message to the player
        }
    });
});

// Use the PORT from the environment variables
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});
