const express = require('express');

const RateLimiterMiddleware = require('../middlewares/rateLimiter');

module.exports = ({
  ticketController,
  queueController,
  authController,
  serviceController,
  organizationController,
  validateMiddleware,
  serviceSchema,
  generalSchema,
}) => {
  const router = express.Router();
  const rateLimiter = new RateLimiterMiddleware();
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
  router.post('/login', authController.login.bind(authController));

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
  router.post(
    '/tickets',
    validateMiddleware.validate(serviceSchema.idServiceSchema),
    ticketController.create.bind(ticketController)
  );

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
    validateMiddleware.validate(generalSchema.emptySchema, 'query'),
    serviceController.publicServiceList.bind(serviceController)
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
    validateMiddleware.validate(generalSchema.emptySchema, 'query'),
    organizationController.getPublicList.bind(organizationController)
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
    validateMiddleware.validate(generalSchema.emptySchema, 'query'),
    queueController.getCallingQueue.bind(queueController)
  );

  return router;
};
