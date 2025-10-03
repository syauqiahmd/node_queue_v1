const express = require('express');
const expressJSDocSwagger = require('express-jsdoc-swagger');

const createApp = (container) => {
  const app = express();
  const swaggerOptions = require('./api/swagger'); // This path will need to be fixed
  const errorHandler = container.resolve('errorHandler').errorHandler; // Resolve the method
  const rateLimiter = container.resolve('rateLimiter').methodBasedLimiter; // Resolve the method
  const requestIdMiddleware = container.resolve('requestId').requestIdMiddleware; // Resolve the method
  const loggerContext = container.resolve('loggerContext').loggerContext; // Resolve the method
  const mainRouter = container.resolve('mainRouter');

  expressJSDocSwagger(app)(swaggerOptions);

  app.use(requestIdMiddleware);
  app.use(rateLimiter);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(loggerContext);

  app.use('/api/v1', mainRouter);

  app.use(errorHandler);

  return app;
};

module.exports = createApp;
