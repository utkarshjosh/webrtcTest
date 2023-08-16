// index.js

const http = require("http");
const express = require("express");
const { Server: SocketIO } = require("socket.io");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const app = express();
const server = http.createServer(app);

const io = new SocketIO(server);
const PORT = process.env.PORT || 8000;
app.set("view engine", "ejs");
app.use(express.static(path.resolve("./public")));
const roomUsers = new Map();

app.get("/users", (req, res) => {
  return res.json(Array.from(users));
});
app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});
io.on("connection", (socket) => {
  console.log(`user connected: ${socket.id}`);

  socket.on("join-room", (roomId, userId) => {
    const currUsers = roomUsers.get(roomId) || [];
    socket.emit("curr-users", currUsers);
    currUsers.push(userId);
    roomUsers.set(roomId, currUsers);

    console.log(roomId, userId);
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      console.log(`user disconnected: ${socket.id}`);
      socket.broadcast.to(roomId).emit("user-disconnected", userId);
      const currUsers = roomUsers.get(roomId) || [];
      const index = currUsers.indexOf(userId);
      if (index > -1) {
        // only splice array when item is found
        currUsers.splice(index, 1); // 2nd parameter means remove one item only
      }
      roomUsers.set(roomId, currUsers);
    });
  });

  // making a connection
});
server.listen(PORT, () => console.log(`Server started at PORT:${PORT}`));
