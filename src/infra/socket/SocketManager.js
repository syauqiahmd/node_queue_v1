const { Server } = require('socket.io');

class SocketManager {
  constructor({ logger }) {
    this.io = null;
    this.logger = logger;
  }

  initSocket(server) {
    const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push(
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8000'
      );
    }

    this.io = new Server(server, {
      cors: {
        origin: (origin, callback) => {
          const isLocalhost =
            !origin ||
            (typeof origin === 'string' &&
              (origin.startsWith('http://localhost') ||
                origin.startsWith('http://127.0.0.1') ||
                origin.startsWith('https://localhost')));
          if (isLocalhost || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
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
