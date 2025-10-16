const express = require('express');
const router = express.Router();

module.exports = ({ counterController, authMiddleware, validateMiddleware, counterSchema }) => {
  /**
   * GET /counters
   * @summary Get list of counters
   * @tags Counter
   * @security BearerAuth
   * @param {string} counterNumber.query - Filter by counter number
   * @param {string} serviceName.query - Filter by service name
   * @param {string} organizationName.query - Filter by name organization
   * @param {boolean} isActive.query - Filter by active status
   * @param {number} page.query - Page number for pagination - default: 1
   * @param {number} pageSize.query - Number of items per page - default: 10
   * @param {string} sortBy.query - Sort by field (e.g., 'counterNumber', 'createdAt') - default: 'createdAt'
   * @param {string} sortOrder.query - Sort order ('asc' or 'desc') - default: 'desc'
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 500 - Internal Server Error
   */
  router.get(
    '/',
    authMiddleware.authorize(['ADMIN', 'USER']),
    validateMiddleware.validate(counterSchema.getCounterSchema, 'query'),
    counterController.getAll.bind(counterController)
  );

  /**
   * GET /counters/{counterId}
   * @summary Get counter by ID
   * @tags Counter
   * @security BearerAuth
   * @param {string} counterId.path.required - Service ID using UUID format
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   */
  router.get(
    '/:counterId',
    authMiddleware.authorize(['ADMIN', 'USER']),
    validateMiddleware.validate(counterSchema.idCounterSchema, 'params'),
    counterController.getById.bind(counterController)
  );

  /**
   * POST /counters
   * @summary Create service data
   * @tags Counter
   * @security BearerAuth
   * @param {object} request.body.required - Service data
   * @example request - Example payload
   * {
   *   "counterNumber": "A01",
   *   "serviceId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
   * }
   * @returns {object} 201 - Created response
   * @returns {object} 400 - Bad Request
   * @returns {object} 401 - Unauthorized
   * @returns {object} 500 - Internal Server Error
   */
  router.post(
    '/',
    authMiddleware.authorize(['ADMIN']),
    validateMiddleware.validate(counterSchema.createCounterSchema),
    counterController.create.bind(counterController)
  );

  /**
   * PUT /counters/{counterId}
   * @summary Update counter by ID
   * @tags Counter
   * @security BearerAuth
   * @param {string} counterId.path.required - Service ID using UUID format
   * @param {object} request.body.required - Service data
   * @example request - Example payload
   * {
   *   "counterNumber": "A02",
   *   "serviceId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
   *   "isActive": true
   * }
   * @returns {object} 200 - Success response
   * @returns {object} 400 - Bad Request
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   */
  router.put(
    '/:counterId',
    authMiddleware.authorize(['ADMIN']),
    validateMiddleware.validate(counterSchema.idCounterSchema, 'params'),
    validateMiddleware.validate(counterSchema.updateCounterSchema),
    counterController.update.bind(counterController)
  );

  /**
   * DELETE /counters/{counterId}
   * @summary Delete counter by ID
   * @tags Counter
   * @security BearerAuth
   * @param {string} counterId.path.required - Service ID using UUID format
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   */
  router.delete(
    '/:counterId',
    authMiddleware.authorize(['ADMIN']),
    validateMiddleware.validate(counterSchema.idCounterSchema, 'params'),
    counterController.remove.bind(counterController)
  );

  return router;
};
