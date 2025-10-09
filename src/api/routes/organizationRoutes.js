const express = require('express');
const router = express.Router();
const controller = require('../controllers/organizationController');

const validate = require('../middlewares/validate');
const organizationSchema = require('../validations/organization.schema');

/**
 * GET /organizations
 * @summary Get list of organizations
 * @tags Organization
 * @security BearerAuth
 * @param {string} name.query.optional - Filter by name or acronym
 * @param {string} fullName.query.optional - Filter by full name organization
 * @param {boolean} isActive.query.optional - Filter by active status
 * @param {number} page.query.optional - Page number for pagination - default: 1
 * @param {number} pageSize.query.optional - Number of items per page - default: 10
 * @returns {object} 200 - Success response
 * @returns {object} 401 - Unauthorized
 * @returns {object} 500 - Internal Server Error
 * @example response - 200 - Example success response
 * {
 *   "success": true,
 *   "data": [
 *     { "id": "uuid", "name": "test", "fullName": "Test Organization", "isActive": true }
 *   ]
 * }
 */
router.get('/', validate(organizationSchema.getOrganizationSchema, 'query'), controller.getAll);

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
 * @example response - 200 - Example success response
 * {
 *   "success": true,
 *   "data": { "id": "uuid", "name": "test", "fullName": "Test Organization", "isActive": true }
 * }
 */
router.get(
  '/:organizationId',
  validate(organizationSchema.idOrganizationSchema, 'params'),
  controller.getById
);

/**
 * POST /organizations
 * @summary Create organization data
 * @tags Organization
 * @security BearerAuth
 * @param {object} request.body.required - Organization data
 * @example request - example payload
 * {
 *   "name": "test",
 *   "fullName": "Test Organization"
 * }
 * @returns {object} 201 - Created response
 * @returns {object} 400 - Bad Request
 * @returns {object} 401 - Unauthorized
 * @returns {object} 500 - Internal Server Error
 * @example response - 201 - Example created response
 * {
 *   "success": true,
 *   "data": { "id": "uuid", "name": "test", "fullName": "Test Organization" },
 *   "message": "Created"
 * }
 */
router.post('/', validate(organizationSchema.createOrganizationSchema), controller.create);

/**
 * PUT /organizations/{organizationId}
 * @summary Update organization by ID
 * @tags Organization
 * @security BearerAuth
 * @param {string} organizationId.path.required - Organization ID using UUID format
 * @param {object} request.body.required - Organization data
 * @example request - example payload
 * {
 *   "name": "test",
 *   "fullName": "Test Organization",
 *   "isActive": true
 * }
 * @returns {object} 200 - Success response
 * @returns {object} 400 - Bad Request
 * @returns {object} 401 - Unauthorized
 * @returns {object} 404 - Not Found
 * @returns {object} 500 - Internal Server Error
 * @example response - 200 - Example success response
 * {
 *   "success": true,
 *   "data": { "id": "uuid", "name": "test", "fullName": "Test Organization", "isActive": true },
 *   "message": "Updated"
 * }
 */
router.put(
  '/:organizationId',
  validate(organizationSchema.idOrganizationSchema, 'params'),
  validate(organizationSchema.updateOrganizationSchema),
  controller.update
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
 * @example response - 200 - Example success response
 * {
 *   "success": true,
 *   "data": { "id": "uuid" },
 *   "message": "Deleted"
 * }
 */
router.delete(
  '/:organizationId',
  validate(organizationSchema.idOrganizationSchema, 'params'),
  controller.remove
);

module.exports = router;
