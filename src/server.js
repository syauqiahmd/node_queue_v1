require('dotenv').config();
const http = require('http');
const createApp = require('./app');
const container = require('./container');
const logger = container.resolve('logger');
const socketManager = container.resolve('socketManager');
const dbConnectionChecker = container.resolve('dbConnectionChecker');
const redisClient = container.resolve('redisClient'); // Resolve RedisClient
const port = process.env.PORT || 3000;

const app = createApp(container);
const server = http.createServer(app);

socketManager.initSocket(server);
dbConnectionChecker.checkDbConnection(); // Check DB connection on startup
(async () => {
  await redisClient.connect(); // Connect Redis client on startup
  logger.info(`[REDIS] Redis client connection status: ${redisClient.status()}`, {
    context: 'Server Startup',
  });

  server.listen(port, () => {
    logger.info(`[APP] Success to serve at ${port}`);
  });
})();

module.exports = server;
