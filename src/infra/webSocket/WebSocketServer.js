const WebSocket = require('ws');
const logger = require('../utils/log.helper');

class WebSocketServer {
  constructor(port, webSocketGateway) {
    this.webSocketGateway = webSocketGateway;
    this.server = new WebSocket.Server({ port });
    this.server.on('connection', this.handleConnection.bind(this));
    this.server.on('error', (err) => {
      logger.error('WebSocket server error', { error: err, context: 'WebSocket' });
    });
    this.heartbeatInterval = setInterval(() => {
      this.server.clients.forEach((ws) => {
        if (ws.isAlive === false) ws.terminate();
        ws.isAlive = false;
        try { ws.ping(); } catch (err) {}
      });
    }, 30000);
    this.server.on('close', () => {
      clearInterval(this.heartbeatInterval);
      logger.info('WebSocket server closed', { context: 'WebSocket' });
    });
    logger.info(`WebSocket server started on port ${port}`, { context: 'WebSocket' });
  }

  handleConnection(ws) {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    logger.info('Client connected', { context: 'WebSocket' });
    ws.on('message', (message) => {
      this.webSocketGateway.handleMessage(ws, message);
    });
    ws.on('error', (err) => {
      logger.error('Client socket error', { error: err, context: 'WebSocket' });
    });
    ws.on('close', (code, reason) => {
      logger.info('Client disconnected', { context: 'WebSocket', code, reason: reason?.toString?.() });
    });
  }
}

module.exports = WebSocketServer;
