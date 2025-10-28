const { createContainer, asClass, asValue, asFunction } = require('awilix');
const prisma = require('./infra/db/prismaClient'); // Import the prisma client directly
const asyncContext = require('./infra/utils/asyncContext'); // Import asyncContext
const businessException = require('./infra/utils/businessException'); // Import businessException
const RedisClient = require('./infra/clients/RedisClient'); // Import RedisClient

// Import schemas
const counterSchema = require('./api/validation/counter.schema');
const organizationSchema = require('./api/validation/organization.schema');
const generalSchema = require('./api/validation/general.schema');
const queueSchema = require('./api/validation/queue.schema');
const serviceSchema = require('./api/validation/service.schema');
const userSchema = require('./api/validation/user.schema');

// Create the container
const container = createContainer();

// Register logger explicitly (moved up)
container.register({
  logger: asValue(require('./infra/utils/log.helper')),
  code: asValue('INTERNAL_SERVER_ERROR'),
  message: asValue('Something went wrong'),
  statusCode: asValue(500),
  fields: asValue(null),
});

const redisClientInstance = new RedisClient({ logger: container.resolve('logger') });

// Register core services
container.loadModules(
  [
    'core/services/*.js',
    'infra/clients/*.js',
    'infra/db/repositories/*.js',
    'infra/socket/*.js',
    'api/middlewares/*.js',
    'infra/utils/*.js',
    // 'infra/db/dbConnectionChecker.js', // Removed this line
    'core/dto/*.js', // Register DTOs
    'core/interfaces/*.js', // Register interfaces
  ],
  {
    cwd: __dirname,
    formatName: 'camelCase',
    resolverOptions: {
      register: asClass,
    },
  }
);

// Register validation schemas
// container.loadModules(['api/validation/*.js'], { // Removed this block
//   cwd: __dirname,
//   formatName: (name) => `${name}Schema`,
//   resolverOptions: {
//     register: asValue,
//   },
// });

// Register the main router
container.register({
  mainRouter: asFunction(require('./api/routes')).singleton(),
  prismaClient: asValue(prisma), // Register the prisma client instance
  validateMiddleware: asClass(require('./api/middlewares/validate')).singleton(), // Register ValidateMiddleware
  loggerContext: asClass(require('./api/middlewares/loggerContext')).singleton(), // Register LoggerContextMiddleware
  asyncContext: asValue(asyncContext), // Register asyncContext
  rateLimiter: asClass(require('./api/middlewares/rateLimiter')).singleton(), // Register RateLimiterMiddleware
  requestId: asClass(require('./api/middlewares/requestId')).singleton(), // Register RequestIdMiddleware
  asyncContextRunner: asClass(require('./api/middlewares/asyncContextRunner')).singleton(), // Register AsyncContextRunnerMiddleware
  errorHandler: asClass(require('./api/middlewares/errorHandler')).singleton(), // Register ErrorHandlerMiddleware
  // Register ResponseFormatter
  responseFormatter: asClass(require('./api/utils/response.formatter')).singleton(),

  // Register HealthCheck
  healthCheck: asClass(require('./infra/utils/healthCheck')).singleton(),

  authMiddleware: asClass(require('./api/middlewares/auth')).singleton(),

  // Register authUtils explicitly
  authUtils: asClass(require('./api/utils/authUtils')).singleton(),

  // Register IdentityHelper
  identityHelper: asClass(require('./api/utils/identityHelper')).singleton(),

  // Register Controllers explicitly
  authController: asClass(require('./api/controllers/authController')).singleton(),
  counterController: asClass(require('./api/controllers/counterController')).singleton(),
  organizationController: asClass(require('./api/controllers/organizationController')).singleton(),
  ticketController: asClass(require('./api/controllers/ticketController')).singleton(),
  queueController: asClass(require('./api/controllers/queueController')).singleton(),
  serviceController: asClass(require('./api/controllers/serviceController')).singleton(),
  userController: asClass(require('./api/controllers/userController')).singleton(),

  // Register businessException explicitly
  businessException: asValue(businessException),

  // Register socketManager as socket
  socket: asClass(require('./infra/socket/SocketManager')).singleton(),

  // Register RedisClient as a pre-instantiated value
  redisClient: asValue(redisClientInstance),

  // Register S3Client
  s3Client: asClass(require('./infra/clients/S3Client')).singleton(),

  // Register CacheService
  cacheService: asClass(require('./infra/cache/CacheService')).singleton(),
  broadcastService: asClass(require('./core/services/broadcastService')).singleton(),

  // Register OrganizationService and its proxy
  organizationServiceReal: asClass(require('./core/services/OrganizationService')).singleton(),
  organizationService: asClass(require('./core/services/OrganizationServiceProxy')).singleton(),

  // Register CounterService and its proxy
  counterServiceReal: asClass(require('./core/services/CounterService')).singleton(),
  counterService: asClass(require('./core/services/CounterServiceProxy')).singleton(),

  // Register ServiceService and its proxy
  serviceServiceReal: asClass(require('./core/services/ServiceService')).singleton(),
  serviceService: asClass(require('./core/services/ServiceServiceProxy')).singleton(),

  // Register UserService and its proxy
  userServiceReal: asClass(require('./core/services/UserService')).singleton(),
  userService: asClass(require('./core/services/UserServiceProxy')).singleton(),

  queueService: asClass(require('./core/services/queueService')).singleton(),
  queueResponse: asClass(require('./core/dto/queueResponse')).singleton(),

  // Register GoogleTextToSpeechService and its proxy
  googleTextToSpeechServiceReal: asClass(
    require('./core/services/googleTextToSpeechService')
  ).singleton(),
  googleTextToSpeechService: asClass(
    require('./core/services/GoogleTextToSpeechServiceProxy')
  ).singleton(),

  // Register TicketService (no proxy for transactional data)
  ticketService: asClass(require('./core/services/TicketService')).singleton(),

  // Explicitly register all schemas
  counterSchema: asValue(counterSchema),
  organizationSchema: asValue(organizationSchema),
  generalSchema: asValue(generalSchema),
  queueSchema: asValue(queueSchema),
  serviceSchema: asValue(serviceSchema),
  userSchema: asValue(userSchema),
});

module.exports = container;
