const http = require('http');
const WebSocket = require('ws');
const logger = require('../utils/log.helper');

class WebSocketServer {
  /**
   * @param {number|string} port
   * @param {object} webSocketGateway
   * @param {object} [options]
   * @param {Function} [options.getChecks] - Returns dependency states, e.g. { redis: 'up' }.
   */
  constructor(port, webSocketGateway, { getChecks = () => ({}) } = {}) {
    this.webSocketGateway = webSocketGateway;
    this.getChecks = getChecks;
    // Plain HTTP server so uptime monitors can call GET /health; WebSocket upgrades on the
    // same port are handled by ws as before.
    this.httpServer = http.createServer(this.handleHttpRequest.bind(this));
    this.server = new WebSocket.Server({ server: this.httpServer });
    this.httpServer.listen(port);
    this.server.on('connection', this.handleConnection.bind(this));
    this.server.on('error', (err) => {
      logger.error('WebSocket server error', { error: err, context: 'WebSocket' });
    });
    this.heartbeatInterval = setInterval(() => {
      this.server.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          ws.terminate();
        }
        ws.isAlive = false;
        try {
          ws.ping();
        } catch (err) {
          logger.error('WebSocket ping error', { error: err, context: 'WebSocket' });
        }
      });
    }, 30000);
    this.server.on('close', () => {
      clearInterval(this.heartbeatInterval);
      this.httpServer.close();
      logger.info('WebSocket server closed', { context: 'WebSocket' });
    });
    logger.info(`WebSocket server started on port ${port}`, { context: 'WebSocket' });
  }

  handleHttpRequest(req, res) {
    if (req.method === 'GET' && req.url.split('?')[0] === '/health') {
      const checks = this.getChecks();
      const healthy = Object.values(checks).every((state) => state === 'up');
      res.writeHead(healthy ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: healthy,
          data: {
            status: healthy ? 'ok' : 'degraded',
            checks,
            clients: this.server.clients.size,
            uptimeSeconds: Math.round(process.uptime()),
          },
        })
      );
      return;
    }
    // Same response ws gives non-upgrade requests when it owns the port.
    res.writeHead(426, { 'Content-Type': 'text/plain' });
    res.end('Upgrade Required');
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
      logger.info('Client disconnected', {
        context: 'WebSocket',
        code,
        reason: reason?.toString?.(),
      });
    });
  }
}

module.exports = WebSocketServer;
