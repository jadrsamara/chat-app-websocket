const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Store rooms data
const rooms = new Map(); // { roomId: { password: string, creatorToken: string } }
const users = new Map(); // { socketId: username }

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Generate secure tokens
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Generate room ID
function generateRoomId() {
  return crypto.randomBytes(2).toString('hex').toUpperCase();
}

// Main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create room endpoint
app.post('/create-room', (req, res) => {
  const password = req.body.password;
  if (!password || password.length < 4) {
    return res.redirect('/?error=Password must be at least 4 characters');
  }

  const roomId = generateRoomId();
  const creatorToken = generateToken();
  
  rooms.set(roomId.toLowerCase(), {
    password,
    creatorToken,
    createdAt: Date.now()
  });

  res.redirect(`/room/${roomId}?creatorToken=${creatorToken}`);
});

// Join room endpoint
app.post('/join-room', (req, res) => {
  const roomId = req.body.roomId.toLowerCase();
  
  if (!rooms.has(roomId)) {
    return res.redirect('/?error=Room not found');
  }
  
  res.redirect(`/room/${roomId}`);
});

// Room access control
app.get('/room/:roomId', (req, res) => {
  const roomId = req.params.roomId.toLowerCase();
  const creatorToken = req.query.creatorToken;
  const isVerified = req.query.verified === 'true';
  const room = rooms.get(roomId);

  if (!room) {
    return res.redirect('/?error=Room not found');
  }

  if ((creatorToken && creatorToken === room.creatorToken) || isVerified) {
    return res.sendFile(path.join(__dirname, 'public', 'chat.html'));
  }

  // Show password prompt
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Room Password</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Poppins', sans-serif; background: #f5f7fa; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 1rem; }
        .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
        h2 { color: #4361ee; margin-bottom: 1.5rem; font-size: 1.5rem; }
        input { width: 100%; padding: 0.75rem; margin: 0.5rem 0 1.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; }
        button { background: #4361ee; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; width: 100%; font-size: 1rem; }
        .error { color: #f72585; margin-bottom: 1rem; font-size: 0.9rem; }
        @media (max-width: 480px) {
          .container { padding: 1.5rem; }
          h2 { font-size: 1.3rem; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Enter Room ${roomId.toUpperCase()}</h2>
        ${req.query.error ? `<div class="error">${req.query.error}</div>` : ''}
        <form action="/verify-password" method="POST">
          <input type="hidden" name="roomId" value="${roomId}">
          <input type="password" name="password" placeholder="Room password" required>
          <button type="submit">Join Room</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// Password verification - FIXED REDIRECT
app.post('/verify-password', (req, res) => {
  const roomId = req.body.roomId.toLowerCase();
  const password = req.body.password;
  const room = rooms.get(roomId);

  if (!room) {
    return res.redirect('/?error=Room not found');
  }

  if (room.password !== password) {
    return res.redirect(`/room/${roomId}?error=Incorrect password`);
  }

  // Successful verification - redirect with verified flag
  res.redirect(`/room/${roomId}?verified=true`);
});

// Socket.IO connection
io.on('connection', (socket) => {
  const roomId = socket.handshake.query.roomId?.toLowerCase();
  const room = rooms.get(roomId);

  if (!roomId || !room) {
    socket.disconnect();
    return;
  }

  // Get or generate username
  let username = socket.handshake.query.username || `User${Math.floor(Math.random() * 10000)}`;
  users.set(socket.id, username);

  socket.join(roomId);
  io.to(roomId).emit('user joined', username);
  
  socket.on('chat message', (msg) => {
    const username = users.get(socket.id);
    io.to(roomId).emit('chat message', { 
      text: msg, 
      sender: username,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  socket.on('set username', (newUsername) => {
    users.set(socket.id, newUsername);
    socket.emit('username set', newUsername);
    socket.emit('set cookie', newUsername);
  });

  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    io.to(roomId).emit('user left', username);
    users.delete(socket.id);
  });
});

// Clean up old rooms
setInterval(() => {
  const oneHour = 60 * 60 * 1000;
  const now = Date.now();

  for (const [roomId, room] of rooms.entries()) {
    if (now - room.createdAt > oneHour) {
      rooms.delete(roomId);
    }
  }
}, 30 * 60 * 1000);

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});