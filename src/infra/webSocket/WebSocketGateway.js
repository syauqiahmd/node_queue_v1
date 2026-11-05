const WebSocket = require('ws');
const logger = require('../utils/log.helper');

class WebSocketGateway {
  constructor(webSocketServer) {
    this.webSocketServer = webSocketServer;
    this.handlers = new Map();
  }

  registerHandler(event, handler) {
    this.handlers.set(event, handler);
  }

  handleMessage(ws, message) {
    try {
      const { event, data } = JSON.parse(message);
      const handler = this.handlers.get(event);
      if (handler) {
        handler(ws, data);
        return;
      }
      this.broadcast(event, data);
    } catch (error) {
      logger.error('Failed to parse message or handle event', { error, context: 'WebSocket' });
    }
  }

  broadcast(event, data) {
    if (!this.webSocketServer || !this.webSocketServer.server) {
      logger.warn('WebSocket server not initialized', { context: 'WebSocket', event });
      return;
    }
    this.webSocketServer.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event, data }));
      }
    });
  }
}

module.exports = WebSocketGateway;
