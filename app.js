require('dotenv').config();

const express = require('express');
const app = express();
const expressJSDocSwagger = require('express-jsdoc-swagger');

// helpers and configs
const port = process.env.PORT || 3000;
const swaggerOptions = require('./configs/swagger');
const errorHandler = require('./middlewares/errorHandler');
const methodBasedLimiter = require('./middlewares/rateLimiter');
const { successResponse } = require('./utils/response');
const logger = require('./utils/logger');
const { checkDbConnection } = require('./configs/prismaClient');
const requestIdMiddleware = require('./middlewares/requestId');

// Routes list
const organizationRoutes = require('./routes/organizationRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const counterRoutes = require('./routes/counterRoutes');
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

expressJSDocSwagger(app)(swaggerOptions);

app.use(requestIdMiddleware); // Apply rate limiting middleware
app.use(methodBasedLimiter); // Apply rate limiting middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
checkDbConnection();
app.get('/test', (req, res) => {
  return successResponse(res, { message: 'Ready to serve' });
});

app.use('/api/v1/tickets', ticketRoutes);

// Register routes
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/counters', counterRoutes);
app.use('/api/v1/users', userRoutes);

app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Success to serve at ${port}`, { context: 'Initial Service', port });
});
