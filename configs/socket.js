const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*', // or your frontend URL
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`, { context: 'Socket.IO' });

    // For client that wants to monitor a specific service
    socket.on('join-service-room', (serviceId) => {
      socket.join(`service-${serviceId}`);
      logger.info(`Socket ${socket.id} joined room service-${serviceId}`, { context: 'Socket.IO' });
    });

    // For queue monitor (monitoring all services)
    socket.on('join-monitor-room', () => {
      socket.join('monitor-room');
      logger.info(`Socket ${socket.id} joined monitor-room`, { context: 'Socket.IO' });
    });
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`, { context: 'Socket.IO' });
    });
  });
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

module.exports = {
  initSocket,
  getIO,
};
