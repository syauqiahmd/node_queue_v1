const express = require('express');
const router = express.Router();

module.exports = ({ serviceController, authMiddleware, validateMiddleware, serviceSchema }) => {
  /**
   * GET /services
   * @summary Get list of services
   * @tags Service
   * @security BearerAuth
   * @param {string} name.query - Filter by service name
   * @param {string} prefix.query - Filter by service prefix
   * @param {string} organizationName.query - Filter by name organization
   * @param {boolean} isActive.query - Filter by active status
   * @param {number} page.query - Page number for pagination - default: 1
   * @param {number} pageSize.query - Number of items per page - default: 10
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 500 - Internal Server Error
   */
  router.get(
    '/',
    authMiddleware.RBAC(['ADMIN', 'USER']),
    validateMiddleware.validate(serviceSchema.getServiceSchema, 'query'),
    serviceController.getAll.bind(serviceController)
  );

  /**
   * GET /services/{serviceId}
   * @summary Get services by ID
   * @tags Service
   * @security BearerAuth
   * @param {string} serviceId.path.required - Service ID using UUID format
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   */
  router.get(
    '/:serviceId',
    authMiddleware.RBAC(['ADMIN', 'USER']),
    validateMiddleware.validate(serviceSchema.idServiceSchema, 'params'),
    serviceController.getById.bind(serviceController)
  );

  /**
   * POST /services
   * @summary Create service data
   * @tags Service
   * @security BearerAuth
   * @param {object} request.body.required - Service data
   * @returns {object} 201 - Created response
   * @returns {object} 400 - Bad Request
   * @returns {object} 401 - Unauthorized
   * @returns {object} 500 - Internal Server Error
   */
  router.post(
    '/',
    authMiddleware.RBAC(['ADMIN']),
    validateMiddleware.validate(serviceSchema.createServiceSchema),
    serviceController.create.bind(serviceController)
  );

  /**
   * PUT /services/{serviceId}
   * @summary Update services by ID
   * @tags Service
   * @security BearerAuth
   * @param {string} serviceId.path.required - Service ID using UUID format
   * @param {object} request.body.required - Service data
   * @returns {object} 200 - Success response
   * @returns {object} 400 - Bad Request
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   */
  router.put(
    '/:serviceId',
    authMiddleware.RBAC(['ADMIN']),
    validateMiddleware.validate(serviceSchema.idServiceSchema, 'params'),
    validateMiddleware.validate(serviceSchema.updateServiceSchema),
    serviceController.update.bind(serviceController)
  );

  /**
   * DELETE /services/{serviceId}
   * @summary Delete services by ID
   * @tags Service
   * @security BearerAuth
   * @param {string} serviceId.path.required - Service ID using UUID format
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   */
  router.delete(
    '/:serviceId',
    authMiddleware.RBAC(['ADMIN']),
    validateMiddleware.validate(serviceSchema.idServiceSchema, 'params'),
    serviceController.remove.bind(serviceController)
  );

  return router;
};
