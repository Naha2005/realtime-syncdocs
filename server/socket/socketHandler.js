import Document from '../models/Document.js';
import { memoryDb, isDbConnected } from '../config/inMemoryDB.js';

// In-memory store for active users per document room
// Format: { [documentId]: [ { socketId, userId, name, email, avatar } ] }
const roomUsers = {};

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join Document Room
    socket.on('join-document', async ({ documentId, user }) => {
      if (!documentId || !user) return;

      socket.join(documentId);
      console.log(`User ${user.name} (${user._id}) joined room ${documentId}`);

      // Initialize room array if not exists
      if (!roomUsers[documentId]) {
        roomUsers[documentId] = [];
      }

      // Add user if not already in the list for this socket session
      const userExists = roomUsers[documentId].some((u) => u.socketId === socket.id);
      if (!userExists) {
        roomUsers[documentId].push({
          socketId: socket.id,
          userId: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        });
      }

      // Send the list of current users in the room back to the joined user
      socket.emit('user-list', roomUsers[documentId]);

      // Broadcast to other users that a new user is online
      socket.broadcast.to(documentId).emit('user-online', roomUsers[documentId]);
    });

    // Handle incoming editing changes and broadcast to other collaborators
    socket.on('send-changes', ({ documentId, content, selectionStart, selectionEnd, user }) => {
      socket.broadcast.to(documentId).emit('receive-changes', {
        content,
        selectionStart,
        selectionEnd,
        user,
      });
    });

    // Save document to DB (Mongoose or Memory DB)
    socket.on('save-document', async ({ documentId, content }) => {
      try {
        if (isDbConnected()) {
          await Document.findByIdAndUpdate(documentId, { content });
          console.log(`Auto-saved document ${documentId} to MongoDB`);
        } else {
          const doc = memoryDb.documents.find((d) => d._id === documentId);
          if (doc) {
            doc.content = content;
            doc.updatedAt = new Date();
            console.log(`Auto-saved document ${documentId} to Memory DB`);
          }
        }
      } catch (error) {
        console.error(`Error saving document ${documentId} via socket:`, error.message);
      }
    });

    // User is typing indicator
    socket.on('typing', ({ documentId, user }) => {
      socket.broadcast.to(documentId).emit('typing', user);
    });

    // User stopped typing indicator
    socket.on('stop-typing', ({ documentId, user }) => {
      socket.broadcast.to(documentId).emit('stop-typing', user);
    });

    // Leave Document Room
    socket.on('leave-document', ({ documentId, userId }) => {
      socket.leave(documentId);
      console.log(`User ${userId} left room ${documentId}`);

      if (roomUsers[documentId]) {
        roomUsers[documentId] = roomUsers[documentId].filter(
          (u) => !(u.userId === userId && u.socketId === socket.id)
        );

        // Clean up empty room
        if (roomUsers[documentId].length === 0) {
          delete roomUsers[documentId];
        } else {
          io.to(documentId).emit('user-offline', roomUsers[documentId]);
        }
      }
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);

      // Search all rooms to remove this socket connection
      Object.keys(roomUsers).forEach((documentId) => {
        const initialLength = roomUsers[documentId].length;
        roomUsers[documentId] = roomUsers[documentId].filter(
          (u) => u.socketId !== socket.id
        );

        if (roomUsers[documentId].length < initialLength) {
          if (roomUsers[documentId].length === 0) {
            delete roomUsers[documentId];
          } else {
            // Notify remaining users
            io.to(documentId).emit('user-offline', roomUsers[documentId]);
          }
        }
      });
    });
  });
};

export default socketHandler;
