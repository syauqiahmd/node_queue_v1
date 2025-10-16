const express = require('express');
const router = express.Router();

module.exports = ({
  organizationController,
  authMiddleware,
  validateMiddleware,
  organizationSchema,
}) => {
  /**
   * GET /organizations
   * @summary Get list of organizations
   * @tags Organization
   * @security BearerAuth
   * @param {string} name.query - Filter by name or acronym
   * @param {string} fullName.query - Filter by full name organization
   * @param {boolean} isActive.query - Filter by active status
   * @param {number} page.query - Page number for pagination - default: 1
   * @param {number} pageSize.query - Number of items per page - default: 10
   * @param {string} sortBy.query - Sort by field (e.g., 'name', 'createdAt') - default: 'createdAt'
   * @param {string} sortOrder.query - Sort order ('asc' or 'desc') - default: 'desc'
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 500 - Internal Server Error
   */
  router.get(
    '/',
    authMiddleware.authorize(['ADMIN']),
    validateMiddleware.validate(organizationSchema.getOrganizationSchema, 'query'),
    organizationController.getAll.bind(organizationController)
  );

  /**
   * GET /organizations/{organizationId}
   * @summary Get organization by ID
   * @tags Organization
   * @security BearerAuth
   * @param {string} organizationId.path.required - Organization ID using UUID format
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   */
  router.get(
    '/:organizationId',
    authMiddleware.authorize(['ADMIN']),
    validateMiddleware.validate(organizationSchema.idOrganizationSchema, 'params'),
    organizationController.getById.bind(organizationController)
  );

  /**
   * POST /organizations
   * @summary Create organization data
   * @tags Organization
   * @security BearerAuth
   * @param {object} request.body.required - Organization data
   * @example request - Example payload
   * {
   *   "name": "Main Branch",
   *   "fullName": "Main Branch Office"
   * }
   * @returns {object} 201 - Created response
   * @returns {object} 400 - Bad Request
   * @returns {object} 401 - Unauthorized
   * @returns {object} 500 - Internal Server Error
   */
  router.post(
    '/',
    authMiddleware.authorize(['ADMIN']),
    validateMiddleware.validate(organizationSchema.createOrganizationSchema),
    organizationController.create.bind(organizationController)
  );

  /**
   * PUT /organizations/{organizationId}
   * @summary Update organization by ID
   * @tags Organization
   * @security BearerAuth
   * @param {string} organizationId.path.required - Organization ID using UUID format
   * @param {object} request.body.required - Organization data
   * @example request - Example payload
   * {
   *   "name": "Main Branch Updated",
   *   "fullName": "Main Branch Office (Renovated)",
   *   "isActive": false
   * }
   * @returns {object} 200 - Success response
   * @returns {object} 400 - Bad Request
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   */
  router.put(
    '/:organizationId',
    authMiddleware.authorize(['ADMIN']),
    validateMiddleware.validate(organizationSchema.idOrganizationSchema, 'params'),
    validateMiddleware.validate(organizationSchema.updateOrganizationSchema),
    organizationController.update.bind(organizationController)
  );

  /**
   * DELETE /organizations/{organizationId}
   * @summary Delete organization by ID
   * @tags Organization
   * @security BearerAuth
   * @param {string} organizationId.path.required - Organization ID using UUID format
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   */
  router.delete(
    '/:organizationId',
    authMiddleware.authorize(['ADMIN']),
    validateMiddleware.validate(organizationSchema.idOrganizationSchema, 'params'),
    organizationController.remove.bind(organizationController)
  );

  return router;
};
