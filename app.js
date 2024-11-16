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

let players = {}; // Object to keep track of players

// Set EJS as the view engine and define views directory
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Explicitly set views directory

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, "public")));

// Route for the main page
app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

// Socket.io connection handling
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

    // Handle player disconnection
    uniquesocket.on("disconnect", () => {
        if (uniquesocket.id === players.white) {
            delete players.white;
        } else if (uniquesocket.id === players.black) {
            delete players.black;
        }
        console.log("A player disconnected:", uniquesocket.id);
    });

    // Handle moves from players
    uniquesocket.on("move", (move) => {
        // Validate move based on the player's turn
        if ((chess.turn() === "w" && uniquesocket.id !== players.white) ||
            (chess.turn() === "b" && uniquesocket.id !== players.black)) {
            return; // Ignore the move if it's not the player's turn
        }

        const result = chess.move(move);
        if (result) {
            io.emit("move", move); // Broadcast the move to all players
            io.emit("boardState", chess.fen()); // Send the board state
        } else {
            console.log("Invalid move:", move);
            uniquesocket.emit("invalidMove", move); // Notify the player of invalid move
        }
    });
});

// Use the PORT from environment variables or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});
