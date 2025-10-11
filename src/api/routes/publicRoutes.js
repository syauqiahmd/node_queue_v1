const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const queueController = require('../controllers/queueController');
const authController = require('../controllers/authController');
const serviceController = require('../controllers/serviceController');
const organizationController = require('../controllers/organizationController');

const RateLimiterMiddleware = require('../middlewares/rateLimiter');
const rateLimiter = new RateLimiterMiddleware();

const validate = require('../middlewares/validate');
const serviceSchema = require('../validations/service.schema');
const generalSchema = require('../validations/general.schema');
const queueSchema = require('../validations/queue.schema');

router.use(rateLimiter.methodBasedLimiter);

/**
 * POST /public/login
 * @summary Login user
 * @tags #Authorization
 * @param {object} request.body.required - ticket to serviceId data
 * @example request - example payload
 * {
 *   "userName": "test",
 *   "password": "password123"
 * }
 * @returns {object} 200 - Success response
 * @returns {object} 401 - Unauthorized
 * @returns {object} 500 - Internal Server Error
 * @example response - 200 - Example success response
 * {
 *   "success": true,
 *   "data": {
 *     "userDetail": {
 *       "id": "uuid",
 *       "userName": "test",
 *       "fullName": "Test User",
 *       "role": "user",
 *       "isActive": true,
 *       "organization": {
 *         "organizationId": "uuid",
 *         "name": "Test Org",
 *         "fullName": "Test Organization"
 *       }
 *     },
 *     "token": "jwt_token_string"
 *   }
 * }
 */
router.post('/login', authController.login);

/**
 * POST /public/tickets
 * @summary Create ticket data
 * @tags #Public
 * @param {object} request.body.required - ticket to serviceId data
 * @example request - example payload
 * {
 *   "serviceId": "123123-1234-1234-1234-123456789012"
 * }
 * @returns {object} 201 - Created response
 * @returns {object} 400 - Bad Request
 * @returns {object} 500 - Internal Server Error
 * @example response - 201 - Example created response
 * {
 *   "success": true,
 *   "data": { "id": "uuid", "ticketNumber": "A001", "serviceId": "123123-1234-1234-1234-123456789012" },
 *   "message": "Created"
 * }
 */
router.post('/tickets', validate(serviceSchema.idServiceSchema), ticketController.create);

/**
 * GET /public/services
 * @summary Get services list
 * @tags #Public
 * @returns {object} 200 - Success response
 * @returns {object} 500 - Internal Server Error
 * @example response - 200 - Example success response
 * {
 *   "success": true,
 *   "data": {
 *     "totalRecord": 1,
 *     "data": [
 *       {
 *         "id": "uuid",
 *         "name": "Service 1",
 *         "prefix": "S1",
 *         "organization": {
 *           "id": "uuid",
 *           "name": "Org 1",
 *           "fullName": "Organization 1"
 *         }
 *       }
 *     ]
 *   }
 * }
 */
router.get(
  '/services',
  validate(generalSchema.emptySchema, 'query'),
  serviceController.publicServiceList
);

/**
 * GET /public/organizations
 * @summary Get organizations with all services list
 * @tags #Public
 * @returns {object} 200 - Success response
 * @returns {object} 500 - Internal Server Error
 * @example response - 200 - Example success response
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "name": "Org 1",
 *       "fullName": "Organization 1",
 *       "services": [
 *         {
 *           "id": "uuid",
 *           "name": "Service 1",
 *           "prefix": "S1"
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
router.get(
  '/organizations',
  validate(generalSchema.emptySchema, 'query'),
  organizationController.getPublicList
);

/**
 * GET /public/queues
 * @summary Get current calling queue
 * @tags #Public
 * @returns {object} 200 - Success response
 * @returns {object} 500 - Internal Server Error
 * @example response - 200 - Example success response
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "ticketNumber": "A001",
 *       "counterNumber": "C01",
 *       "serviceName": "Service 1",
 *       "organizationName": "Org 1"
 *     }
 *   ]
 * }
 */
router.get(
  '/queues',
  validate(generalSchema.emptySchema, 'query'),
  queueController.getCallingQueue
);

/**
 * GET /public/call-queue/{queueId}
 * @summary get queue calling sound
 * @tags #Public
 * @param {string} queueId.path.required - User ID using UUID format
 * @returns {object} 200 - Success response (audio file)
 * @returns {object} 400 - Bad Request
 * @returns {object} 404 - Not Found
 * @returns {object} 500 - Internal Server Error
 * @example response - 200 - Example success response (audio file)
 * // Binary audio data
 */
router.get(
  '/call-queue/:queueId',
  validate(queueSchema.idQueueSchema, 'params'),
  queueController.generateQueueCallingSound
);

module.exports = router;
