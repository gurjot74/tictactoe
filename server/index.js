const mongoose = require('mongoose');
const express = require("express");
const bcrypt = require('bcryptjs');
const { createServer } = require("http");
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
const app = express();
const jwt = require('jsonwebtoken');
const cors = require("cors");
const setheader = require('./utils/setheader')
const httpServer = createServer(app);
const joinRoom=require('./routes/joinroom')
const userAuth=require('./routes/auth')
const home=require('./routes/home')
const game=require('./routes/game');
const Gamedata = require('./models/gamedata');
const {setSocket} = require('./controllers/gameController')
const io = new Server(httpServer, {
  cors: {
  origin: ["http://localhost:3000", "https://admin.socket.io"],
  credentials: true,
  },
});
mongoose.connect('mongodb+srv://dbuser:Waheguru747477%40@cluster0.pkxnk.mongodb.net/tictactoe?retryWrites=true&w=majority')
  .then(() => console.log('Connected to MongoDB...'))
  .catch((err) => console.error(`${err}`));

instrument(io, {
  auth: false,
});

app.use(express.json());
app.use(setheader);
app.use(
  cors({
    origin: "*",
    credentials: "true",
  }));

 app.use('/api',home);
 app.use('/api',game);
 app.use('/api',userAuth)
 app.use('/api',joinRoom)

    io.on("connection", (socket) => {
    setSocket(socket);
    console.log(socket.id);
    socket.on("joinRoom", (roomId) => {
    console.log("joinRoom", roomId);
    const room = roomId.toString();
    if (
      io.sockets.adapter.rooms.get(room) &&
      io.sockets.adapter.rooms.get(room).size === 2
    ) {
      socket.emit("roomFull");
    } else {
      socket.emit("roomAvailable");
      socket.join(room);
    }
      socket.on("leaveRoom", async () => {
       await Gamedata.deleteOne({roomId:room})
      socket.leave(room);
    });
    socket.on("opponentTurnPayload", (arg) => {
      socket.to(room).emit("message", arg);
    });
    socket.on("nextturn", () => {
      socket.to(room).emit("setturn");
    });
    socket.on("onGameComponentMount", () => {
      io.sockets.adapter.rooms.get(room) &&
      io.sockets.adapter.rooms.get(room).size === 1 &&
      socket.emit("inWaiting");
      io.sockets.adapter.rooms.get(room) &&
      io.sockets.adapter.rooms.get(room).size === 2 &&
      socket.to(room).emit("startGame");
    });
    socket.on("disconnect", () => {
      socket.to(room).emit("anotherplayerdisconnected"); // undefined
    })
  })
});
httpServer.listen(5000);
module.exports = io;
