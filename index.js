// index.js

const http = require("http");
const express = require("express");
const { Server: SocketIO } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new SocketIO(server);
const PORT = process.env.PORT || 8000;

app.use(express.static(path.resolve("./public")));
const users = new Map();

app.get("/users", (req, res) => {
  return res.json(Array.from(users));
});
io.on("connection", (socket) => {
  console.log(`user connected: ${socket.id}`);

  // emit that a new user has joined as soon as someone joins
  socket.on("i:joined", (data) => {
    const { name } = data;
    socket.broadcast.emit("user:joined", { name, id: socket.id });
    socket.emit("ugotconnected", socket.id);
    users.set(socket.id, { name, id: socket.id });
  });

  socket.on("disconnect", () => {
    console.log(`user disconnected: ${socket.id}`);
  });

  // making a connection
  socket.on("outgoing:call", (data) => {
    const { fromOffer, to } = data;
    socket.to(to).emit("incomming:call", { from: socket.id, offer: fromOffer });
  });
  socket.on("call:accepted", (data) => {
    const { answer, to } = data;
    socket.to(to).emit("incomming:answer", { from: socket.id, offer: answer });
  });

  socket.on("disconnect", () => {
    console.log(`user disconnected: ${socket.id}`);
    users.delete(socket.id);
  });
});
server.listen(PORT, () => console.log(`Server started at PORT:${PORT}`));
