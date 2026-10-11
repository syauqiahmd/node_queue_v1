// Identifies this process in logs; the API, cron and websocket services share log files.
process.env.SERVICE_NAME ??= 'node-queue-websocket';
require('dotenv').config();
const WebSocketServer = require('./infra/webSocket/WebSocketServer');
const WebSocketGateway = require('./infra/webSocket/WebSocketGateway');
const MessageBroker = require('./infra/messageBroker/MessageBroker');
const logger = require('./infra/utils/log.helper');
const { registerProcessHandlers } = require('./infra/lifecycle/processHandlers');

// Signals are handled by shutdown() below; this only adds crash logging.
registerProcessHandlers({ logger, name: 'websocket' });

const webSocketGateway = new WebSocketGateway();
const messageBroker = new MessageBroker({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

const webSocketServer = new WebSocketServer(process.env.WEBSOCKET_PORT, webSocketGateway, {
  // Events reach this service through Redis pub/sub, so it is only useful while subscribed.
  getChecks: () => ({ redis: messageBroker.subscriber.isReady ? 'up' : 'down' }),
});
webSocketGateway.webSocketServer = webSocketServer;

messageBroker.subscribe('websocket', ({ event, data }) => {
  webSocketGateway.broadcast(event, data);
});

const shutdown = async () => {
  try {
    webSocketServer.server.close();
    if (typeof messageBroker.close === 'function') {
      await messageBroker.close();
    }
  } catch (err) {
    logger.error('Error during websocket shutdown', { error: err, context: 'WebSocketService' });
  }
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
