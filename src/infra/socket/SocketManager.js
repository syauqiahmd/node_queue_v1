const { Server } = require('socket.io');

class SocketManager {
  constructor({ logger }) {
    this.io = null;
    this.logger = logger;
  }

  initSocket(server) {
    this.io = new Server(server, {
      cors: {
        origin: '*', // or your frontend URL
      },
    });

    this.io.on('connection', (socket) => {
      this.logger.info(`Client connected: ${socket.id}`, { context: 'Socket.IO' });

      // For client that wants to monitor a specific service
      socket.on('join-service-room', (serviceId) => {
        socket.join(`service-${serviceId}`);
        this.logger.info(`Socket ${socket.id} joined room service-${serviceId}`, {
          context: 'Socket.IO',
        });
      });

      // For queue monitor (monitoring all services)
      socket.on('join-monitor-room', () => {
        socket.join('monitor-room');
        this.logger.info(`Socket ${socket.id} joined monitor-room`, { context: 'Socket.IO' });
      });
      socket.on('disconnect', () => {
        this.logger.info(`Client disconnected: ${socket.id}`, { context: 'Socket.IO' });
      });
    });
  }

  getIO() {
    return this.io;
  }
}

module.exports = SocketManager;
