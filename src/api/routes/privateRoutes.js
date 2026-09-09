const express = require('express');

module.exports = ({
  privateController,
  serviceController,
  queueController,
  visitorController,
  ticketController,
  validateMiddleware,
  generalSchema,
  serviceSchema,
  queueSchema,
  ticketSchema,
  visitorSchema,
}) => {
  const router = express.Router();

  /**
   * GET /private/ping
   * @summary Verify service-to-service authentication
   * @tags #Private
   * @security ServiceApiKey
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized (missing/invalid X-Service-Key header)
   * @example response - 200 - Example success response
   * {
   *   "success": true,
   *   "message": "pong",
   *   "data": { "service": "exampleService" }
   * }
   */
  router.get('/ping', privateController.ping);

  /**
   * GET /private/services
   * @summary Get services list
   * @tags #Private
   * @security ServiceApiKey
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 500 - Internal Server Error
   */
  router.get(
    '/services',
    validateMiddleware.validate(generalSchema.emptySchema, 'query'),
    serviceController.publicServiceList.bind(serviceController)
  );

  /**
   * GET /private/queues
   * @summary Get current calling queue
   * @tags #Private
   * @security ServiceApiKey
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 500 - Internal Server Error
   */
  router.get(
    '/queues',
    validateMiddleware.validate(generalSchema.emptySchema, 'query'),
    queueController.getCallingQueue.bind(queueController)
  );

  /**
   * POST /private/visitors
   * @summary Upsert visitor by phone number
   * @tags #Private
   * @security ServiceApiKey
   * @param {object} request.body.required - Visitor data
   * @example request - example payload
   * {
   *   "name": "John Doe",
   *   "phoneNumber": "08123456789",
   *   "email": "john@example.com"
   * }
   * @returns {object} 200 - Success response
   * @returns {object} 400 - Bad Request
   * @returns {object} 401 - Unauthorized
   * @returns {object} 500 - Internal Server Error
   */
  router.post(
    '/visitors',
    validateMiddleware.validate(visitorSchema.upsertVisitorSchema),
    visitorController.upsert.bind(visitorController)
  );

  /**
   * POST /private/tickets
   * @summary Create ticket data
   * @tags #Private
   * @security ServiceApiKey
   * @param {object} request.body.required - ticket to serviceId data
   * @example request - example payload
   * {
   *   "serviceId": "123123-1234-1234-1234-123456789012"
   * }
   * @returns {object} 201 - Created response
   * @returns {object} 400 - Bad Request
   * @returns {object} 401 - Unauthorized
   * @returns {object} 500 - Internal Server Error
   */
  router.post(
    '/tickets',
    validateMiddleware.validate(serviceSchema.idServiceSchema),
    ticketController.create.bind(ticketController)
  );

  /**
   * GET /private/queues/{serviceId}/summary
   * @summary Get total queue by serviceId
   * @tags #Private
   * @security ServiceApiKey
   * @param {string} serviceId.path.required - Service ID using UUID format
   * @param {string} status.query - get status 'in-progress' or 'completed'
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   */
  router.get(
    '/queues/:serviceId/summary',
    validateMiddleware.validate(serviceSchema.idServiceSchema, 'params'),
    validateMiddleware.validate(queueSchema.getSummaryQueueSchema, 'query'),
    queueController.getTotalQueueByServiceId.bind(queueController)
  );

  /**
   * GET /private/tickets/{ticketId}/position
   * @summary Get a ticket's position in its service's queue
   * @description Returns where a specific ticket currently stands in line for its
   * service, accounting for priority tickets (which are always served before
   * non-priority ones, oldest-first within each group - see queueService.callNextQueue).
   * `status` is one of `waiting`, `calling` (currently being served), or `resolved`.
   * `peopleAhead`/`queueRank` are only meaningful while `status` is `waiting` - they are
   * `null` once the ticket has been called or resolved. `peopleAhead` is 0-indexed
   * (0 = next up); `queueRank` is the 1-indexed version (`peopleAhead + 1`).
   * `totalWaiting` counts every ticket still waiting for the service today, including
   * this one.
   * @tags #Private
   * @security ServiceApiKey
   * @param {string} ticketId.path.required - Ticket ID using UUID format
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   * @example response - 200 - Example success response (waiting)
   * {
   *   "success": true,
   *   "data": {
   *     "ticketId": "123123-1234-1234-1234-123456789012",
   *     "serviceId": "223123-1234-1234-1234-123456789012",
   *     "queueNumber": "A-005",
   *     "status": "waiting",
   *     "peopleAhead": 3,
   *     "queueRank": 4,
   *     "totalWaiting": 12
   *   }
   * }
   * @example response - 200 - Example success response (calling)
   * {
   *   "success": true,
   *   "data": {
   *     "ticketId": "123123-1234-1234-1234-123456789012",
   *     "serviceId": "223123-1234-1234-1234-123456789012",
   *     "queueNumber": "A-005",
   *     "status": "calling",
   *     "peopleAhead": null,
   *     "queueRank": null,
   *     "totalWaiting": 11
   *   }
   * }
   */
  router.get(
    '/tickets/:ticketId/position',
    validateMiddleware.validate(ticketSchema.idTicketSchema, 'params'),
    ticketController.getPosition.bind(ticketController)
  );

  return router;
};
