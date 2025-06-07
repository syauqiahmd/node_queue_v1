const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');

const validate = require('../middlewares/validate');
const userSchema = require('../validations/user.schema');

/**
 * GET /users
 * @summary Get list of users
 * @tags User
 * @param {string} userName.query.optional - Filter by userName
 * @param {string} fullName.query.optional - Filter by full name
 * @param {boolean} role.query.optional - Filter by role
 * @param {boolean} organization.query.optional - Filter by organization
 * @param {boolean} isActive.query.optional - Filter by active status
 * @param {number} page.query.optional - Page number for pagination - default: 1
 * @param {number} pageSize.query.optional - Number of items per page - default: 10
 */
router.get('/', validate(userSchema.getUserSchema, 'query'), controller.getAll);

/**
 * GET /users/{id}
 * @summary Get user by ID
 * @tags User
 * @param {string} id.path.required - User ID using UUID format
 */
router.get('/:id', validate(userSchema.idUserSchema, 'params'), controller.getById);

/**
 * POST /users
 * @summary Create user data
 * @tags User
 * @param {object} request.body.required - user data
 * @example request - example payload
 * {
 *   "userName": "test",
 *   "fullName": "Test User",
 *   "role": "ADMIN",
 *   "password": "password123",
 *   "organizationId": "123e4567-e89b-12d3-a456-426614174000"
 * }
 */
router.post('/', validate(userSchema.createUserSchema), controller.create);

/**
 * PUT /users/{id}
 * @summary Update user by ID
 * @tags User
 * @param {string} id.path.required - User ID using UUID format
 * @param {object} request.body.required - User data
 * @example request - example payload
 * {
 *   "userName": "test",
 *   "fullName": "Test User",
 *   "role": "ADMIN",
 *   "password": "password123",
 *   "isActive": true,
 *   "organizationId": "123e4567-e89b-12d3-a456-426614174000"
 * }
 */
router.put(
  '/:id',
  validate(userSchema.idUserSchema, 'params'),
  validate(userSchema.updateUserSchema),
  controller.update
);

/**
 * DELETE /users/{id}
 * @summary Delete user by ID
 * @tags User
 * @param {string} id.path.required - User ID using UUID format
 */
router.delete('/:id', validate(userSchema.idUserSchema, 'params'), controller.remove);

module.exports = router;
