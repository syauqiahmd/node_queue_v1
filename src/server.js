require('dotenv').config();
const http = require('http');
const createApp = require('./app');
const container = require('./container');
const logger = container.resolve('logger');
const socketManager = container.resolve('socketManager');
const healthCheck = container.resolve('healthCheck');
const redisClient = container.resolve('redisClient'); // Resolve RedisClient
const port = process.env.PORT || 3000;

const app = createApp(container);
const server = http.createServer(app);

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
})();

module.exports = server;
