const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const validate = require('../middlewares/validate');
const userSchema = require('../validations/user.schema');

/**
 * GET /users
 * @summary Get list of users
 * @tags User
 * @security BearerAuth
 * @param {string} userName.query.optional - Filter by userName
 * @param {string} fullName.query.optional - Filter by full name
 * @param {boolean} role.query.optional - Filter by role
 * @param {boolean} organization.query.optional - Filter by organization
 * @param {boolean} isActive.query.optional - Filter by active status
 * @param {number} page.query.optional - Page number for pagination - default: 1
 * @param {number} pageSize.query.optional - Number of items per page - default: 10
 */
router.get('/', validate(userSchema.getUserSchema, 'query'), userController.getAll);

/**
 * GET /users/{userId}
 * @summary Get user by ID
 * @tags User
 * @security BearerAuth
 * @param {string} userId.path.required - User ID using UUID format
 */
router.get('/:userId', validate(userSchema.idUserSchema, 'params'), userController.getById);

/**
 * POST /users
 * @summary Create user data
 * @tags User
 * @security BearerAuth
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
router.post('/', validate(userSchema.createUserSchema), userController.create);

/**
 * PUT /users/{userId}
 * @summary Update user by ID
 * @tags User
 * @security BearerAuth
 * @param {string} userId.path.required - User ID using UUID format
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
  '/:userId',
  validate(userSchema.idUserSchema, 'params'),
  validate(userSchema.updateUserSchema),
  userController.update
);

/**
 * DELETE /users/{userId}
 * @summary Delete user by ID
 * @tags User
 * @security BearerAuth
 * @param {string} userId.path.required - User ID using UUID format
 */
router.delete('/:userId', validate(userSchema.idUserSchema, 'params'), userController.remove);

/**
 * POST /users/logout
 * @summary Logout user by ID
 * @tags #Authorization
 * @security BearerAuth
 */

router.post('/logout', authController.logout);

module.exports = router;
