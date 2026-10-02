// Identifies this process in logs; the API, cron and websocket services share log files.
process.env.SERVICE_NAME ??= 'node-queue-api';
require('dotenv').config();
const http = require('http');
const createApp = require('./app');
const container = require('./container');
const { registerProcessHandlers, exitAfterFlush } = require('./infra/lifecycle/processHandlers');
const logger = container.resolve('logger');
const socketManager = container.resolve('socket');
const healthCheck = container.resolve('healthCheck');
const redisClient = container.resolve('redisClient'); // Resolve RedisClient
const port = process.env.PORT || 3000;

const app = createApp(container);
const server = http.createServer(app);

registerProcessHandlers({
  logger,
  name: 'api',
  onShutdown: async () => {
    // Stop accepting connections and let in-flight requests finish.
    socketManager.getIO()?.close();
    await new Promise((resolve) => server.close(() => resolve()));
    await container.resolve('prismaClient').$disconnect();
    await redisClient.disconnect();
    container.resolve('messageBroker').close();
  },
});

(async () => {
  socketManager.initSocket(server);
  await redisClient.connect(); // Ensure Redis client is connected before health checks
  logger.info(`[REDIS] Redis client connection status: ${redisClient.status()}`, {
    context: 'Server Startup',
  });
  await healthCheck.runChecks(); // Run all infrastructure checks

  server.listen(port, () => {
    logger.info(`[APP] Success to serve at port ${port} with pid ${process.pid}`);
  });
})().catch((error) => {
  logger.error('[APP] Failed to start server', { context: 'Server Startup', error });
  exitAfterFlush(1);
});

module.exports = server;
