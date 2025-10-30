import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

io.on('connection', (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('chat message', (msg: string) => {
    console.log(`Message from ${socket.id}: ${msg}`);
    io.emit('chat message', `${socket.id}: ${msg}`); // Broadcast to all connected clients
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.get('/', (req, res) => {
  res.send('<h1>Socket.IO server is running</h1>');
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
