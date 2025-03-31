# Secure Chat Application

A real-time, password-protected chat application with room creation and private messaging features.

## Features

- 🛡️ **Password-protected rooms** - Secure your chat with a password
- 🔑 **Room creator access** - Special link for room creators
- 👥 **User identities** - Custom or random usernames
- 💬 **Real-time messaging** - Instant message delivery
- 📱 **Responsive design** - Works on desktop and mobile
- 🔒 **Secure tokens** - Cryptographic protection for rooms
- 🧹 **Auto-cleanup** - Inactive rooms are automatically removed

## Technologies Used

- **Backend**: Node.js, Express
- **Real-time**: Socket.IO
- **Frontend**: HTML5, CSS3, JavaScript
- **Security**: Cryptographic tokens, password hashing
- **Deployment**: Ready for Heroku/Vercel/Netlify

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/secure-chat-app.git
   cd secure-chat-app
   ```
2. Install dependencies:
```bash
npm install
```
3. Start the server:
```bash
node server.js
```
4. Access the application at:
```
http://localhost:3000
```
## Usage

### Creating a Room:
1. Click "Create Room"
2. Set a password (min 4 chars)
3. Share the room ID
4. Use your creator link to bypass password

### Joining a Room:
1. Click "Join Room" 
2. Enter room ID
3. Provide password

## File Structure
```
secure-chat-app/
├── public/
│   ├── index.html          # Main landing page
│   └── chat.html           # Chat interface
├── server.js               # Backend server
├── package.json            # Project dependencies
└── README.md               # This file
```

## Security Features

- End-to-end room passwords
- Cryptographic tokens
- Input validation
- Rate limiting
- Session management
