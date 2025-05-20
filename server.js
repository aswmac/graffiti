const express = require('express');
const http = require('http');
const { readFileSync, writeFileSync } = require('fs');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

// Persistent text storage
let textContent = '';
let isEditing = false;

try {
  // Load existing content from file
  textContent = readFileSync('text.txt', 'utf8');
} catch (err) {
  writeFileSync('text.txt', '');
}

io.on('connection', (socket) => {
  console.log('User connected');

  // Send initial state to the new user
  socket.emit('init', { text: textContent, isEditing });

  socket.on('add_text', (newText) => {
    if (!isEditing) {
      isEditing = true;
      io.emit('start_editing'); // Notify all clients that editing has started

      textContent += '\n' + newText.trim(); // Append new line
      writeFileSync('text.txt', textContent); // Save to file

      io.emit('update_text', textContent);
      isEditing = false;
      io.emit('end_editing'); // Notify all clients that editing has ended
    } else {
      socket.emit('error', 'Another user is currently adding text. Please try again later.');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
