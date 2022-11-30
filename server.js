const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
} = require("./utils/users");
const formatMessage = require("./utils/messages");

// Setup
// app.set('view engine', 'html');
// app.set("views", path.join(__dirname, "../client", "views"));

// app.engine('html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname, "public")));

const botName = "Coconnect";



io.on("connection", socket => {
    console.log("Started WS connection")

    console.log(io.of("/").adapter);
    socket.on("joinRoom", ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        console.log(socket.id, username, room)

        socket.join(user.room);

        // Welcome current user
        socket.emit("message", formatMessage(botName, "Welcome to Coconnect!"));

        // Broadcast when a user connects
        socket.broadcast
            .to(user.room)
            .emit(
                "message",
                formatMessage(botName, `${user.username} has joined the chat`)
            );

        // Send users and room info
        io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room),
        });
    });

    socket.on("chatMessage", (msg) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit("message", formatMessage(user.username, msg));
    });

    // Runs when client disconnects
    socket.on("disconnect", () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit(
                "message",
                formatMessage(botName, `${user.username} has left the chat`)
            );

            // Send users and room info
            io.to(user.room).emit("roomUsers", {
                room: user.room,
                users: getRoomUsers(user.room),
            });
        }
    });
})

// Routes
// app.use("/chat", (_req, res) => {
//     res.render("chat.html")
// })
// app.use("/", (_req, res) => {
//     res.render("index.html")
// })

app.use("/api/message", (_req, res) => {
    res.status(200).json({
        message: "Hello, this is Coconnect"
    })
})



const PORT = 3001 || process.env.PORT;
server.listen(PORT, () => console.log(`Coconnect runs on port ${PORT}`))