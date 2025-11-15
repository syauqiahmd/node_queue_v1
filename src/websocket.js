require('dotenv').config();
const WebSocketServer = require('./infra/webSocket/WebSocketServer');
const WebSocketGateway = require('./infra/webSocket/WebSocketGateway');
const MessageBroker = require('./infra/messageBroker/MessageBroker');

const webSocketGateway = new WebSocketGateway();
const messageBroker = new MessageBroker({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

const webSocketServer = new WebSocketServer(process.env.WEBSOCKET_PORT, webSocketGateway);
webSocketGateway.server = webSocketServer;

messageBroker.subscribe('websocket', ({ event, data }) => {
  webSocketGateway.broadcast(event, data);
});

const shutdown = (signal) => {
  try {
    webSocketServer.server.close();
    if (typeof messageBroker.close === 'function') messageBroker.close();
  } catch (err) {}
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
