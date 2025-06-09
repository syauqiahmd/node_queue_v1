const express = require('express');
const router = express.Router();
const controller = require('../controllers/organizationController');

const validate = require('../middlewares/validate');
const organizationSchema = require('../validations/organization.schema');

/**
 * GET /organizations
 * @summary Get list of organizations
 * @tags Organization
 * @param {string} name.query.optional - Filter by name or acronym
 * @param {string} fullName.query.optional - Filter by full name organization
 * @param {boolean} isActive.query.optional - Filter by active status
 * @param {number} page.query.optional - Page number for pagination - default: 1
 * @param {number} pageSize.query.optional - Number of items per page - default: 10
 */
router.get('/', validate(organizationSchema.getOrganizationSchema, 'query'), controller.getAll);

/**
 * GET /organizations/{organizationId}
 * @summary Get organization by ID
 * @tags Organization
 * @param {string} organizationId.path.required - Organization ID using UUID format
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
 * @param {object} request.body.required - Organization data
 * @example request - example payload
 * {
 *   "name": "test",
 *   "fullName": "Test Organization"
 * }
 */
router.post('/', validate(organizationSchema.createOrganizationSchema), controller.create);

/**
 * PUT /organizations/{organizationId}
 * @summary Update organization by ID
 * @tags Organization
 * @param {string} organizationId.path.required - Organization ID using UUID format
 * @param {object} request.body.required - Organization data
 * @example request - example payload
 * {
 *   "name": "test",
 *   "fullName": "Test Organization",
 *   "isActive": true
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
 * @param {string} organizationId.path.required - Organization ID using UUID format
 */
router.delete(
  '/:organizationId',
  validate(organizationSchema.idOrganizationSchema, 'params'),
  controller.remove
);

module.exports = router;
