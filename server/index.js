const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let adminSocket = null; // Track the admin's socket

io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  // Check if user is admin
  socket.on('checkAdmin', () => {
    if (!adminSocket) {
      adminSocket = socket; // First connected user is admin
      socket.emit('adminStatus', true);
    } else {
      socket.emit('adminStatus', false);
    }
  });

  // Listen for page change from admin
  socket.on('pageChange', (page) => {
    if (socket === adminSocket) {
      // Broadcast page change to all viewers
      io.emit('pageChange', page);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected', socket.id);
    if (socket === adminSocket) {
      adminSocket = null; // Reset admin if they disconnect
    }
  });
});

server.listen(4000, () => {
  console.log('Server is running on http://localhost:4000');
});
