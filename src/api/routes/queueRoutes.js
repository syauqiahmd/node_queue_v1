const express = require('express');
const router = express.Router();

module.exports = ({
  queueController,
  authMiddleware,
  validateMiddleware,
  serviceSchema,
  queueSchema,
}) => {
  /**
   * POST /queues/call
   * @summary Call next queue by serviceId
   * @tags Queue
   * @security BearerAuth
   * @param {object} request.body.required - call to counter data
   * @example request - example payload
   * {
   *   "serviceId": "123123-1234-1234-1234-123456789012",
   *   "counterId": "123123-1234-1234-1234-123456789012"
   * }
   * @returns {object} 200 - Success response
   * @returns {object} 400 - Bad Request
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   * @example response - 200 - Example success response
   * {
   *   "success": true,
   *   "data": { "id": "uuid", "ticketNumber": "A001", "status": "calling" }
   * }
   */
  router.post(
    '/call',
    authMiddleware.RBAC(['ADMIN', 'USER']),
    validateMiddleware.validate(queueSchema.callQueueSchema),
    queueController.callNextQueue.bind(queueController)
  );

  /**
   * POST /queues/action
   * @summary Recall or resolve queue by queueId
   * @tags Queue
   * @security BearerAuth
   * @param {object} request.body.required - call to counter data
   * @example request - example payload
   * {
   *   "action": "retry",
   *   "queueId": "123123-1234-1234-1234-123456789012",
   *   "counterId": "123123-1234-1234-1234-123456789012"
   * }
   * @returns {object} 200 - Success response
   * @returns {object} 400 - Bad Request
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   * @example response - 200 - Example success response
   * {
   *   "success": true,
   *   "data": { "id": "uuid", "ticketNumber": "A001", "status": "recalled" }
   * }
   */
  router.post(
    '/action',
    authMiddleware.RBAC(['ADMIN', 'USER']),
    validateMiddleware.validate(queueSchema.actionQueueSchema),
    queueController.actionQueueById.bind(queueController)
  );

  /**
   * GET /queues/{serviceId}
   * @summary Get queue list by serviceId
   * @tags Queue
   * @security BearerAuth
   * @param {string} serviceId.path.required - Service ID using UUID format
   * @param {string} status.query - get status 'in-progress' or 'completed'
   * @param {string} counterId.query - get queue by counterId
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   * @example response - 200 - Example success response
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": "uuid",
   *       "ticketNumber": "A001",
   *       "status": "in-progress",
   *       "serviceId": "uuid",
   *       "counterId": "uuid"
   *     }
   *   ]
   * }
   */
  router.get(
    '/:serviceId',
    authMiddleware.RBAC(['ADMIN', 'USER']),
    validateMiddleware.validate(serviceSchema.idServiceSchema, 'params'),
    validateMiddleware.validate(queueSchema.getQueueListSchema, 'query'),
    queueController.getQueueListByServiceId.bind(queueController)
  );

  /**
   * GET /queues/{serviceId}/summary
   * @summary Get total queue by serviceId
   * @tags Queue
   * @security BearerAuth
   * @param {string} serviceId.path.required - Service ID using UUID format
   * @param {string} status.query - get status 'in-progress' or 'completed'
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   * @example response - 200 - Example success response
   * {
   *   "success": true,
   *   "data": {
   *     "total": 10,
   *     "inProgress": 5,
   *     "completed": 5
   *   }
   * }
   */
  router.get(
    '/:serviceId/summary',
    authMiddleware.RBAC(['ADMIN', 'USER']),
    validateMiddleware.validate(serviceSchema.idServiceSchema, 'params'),
    validateMiddleware.validate(queueSchema.getSummaryQueueSchema, 'query'),
    queueController.getTotalQueueByServiceId.bind(queueController)
  );

  /**
   * @typedef {object} PrioritizeTicketResponse
   * @property {boolean} success - Indicates if the request was successful
   * @property {object} data - The updated ticket object
   * @property {string} message - A message indicating the result
   */
  /**
   * PUT /queues/{queueId}/prioritize
   * @summary Prioritize a ticket
   * @tags Queue
   * @security BearerAuth
   * @param {string} queueId.path.required - The ID of the ticket to prioritize
   * @return {PrioritizeTicketResponse} 200 - Success response
   */
  router.put(
    '/:queueId/prioritize',
    authMiddleware.RBAC(['ADMIN', 'USER']),
    validateMiddleware.validate(queueSchema.idQueueSchema, 'params'),
    queueController.prioritizeTicket.bind(queueController)
  );

  return router;
};
