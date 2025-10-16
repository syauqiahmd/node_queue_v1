const express = require('express');
const router = express.Router();

module.exports = ({ userController, authMiddleware, validateMiddleware, userSchema }) => {
  /**
   * GET /users
   * @summary Get list of users
   * @tags User
   * @security BearerAuth
   * @param {string} userName.query - Filter by userName
   * @param {string} fullName.query - Filter by full name
   * @param {string} role.query - Filter by role
   * @param {string} organization.query - Filter by organization
   * @param {boolean} isActive.query - Filter by active status
   * @param {number} page.query - Page number for pagination - default: 1
   * @param {number} pageSize.query - Number of items per page - default: 10
   * @param {string} sortBy.query - Sort by field (e.g., 'userName', 'fullName', 'role', 'createdAt') - default: 'createdAt'
   * @param {string} sortOrder.query - Sort order ('asc' or 'desc') - default: 'desc'
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 500 - Internal Server Error
   */
  router.get(
    '/',
    authMiddleware.authorize(['ADMIN']),
    validateMiddleware.validate(userSchema.getUserSchema, 'query'),
    userController.getAll.bind(userController)
  );

  /**
   * GET /users/{userId}
   * @summary Get user by ID
   * @tags User
   * @security BearerAuth
   * @param {string} userId.path.required - User ID using UUID format
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   */
  router.get(
    '/:userId',
    authMiddleware.authorize(['ADMIN']),
    validateMiddleware.validate(userSchema.idUserSchema, 'params'),
    userController.getById.bind(userController)
  );

  /**
   * POST /users
   * @summary Create user data
   * @tags User
   * @security BearerAuth
   * @param {object} request.body.required - user data
   * @example request - For 'USER' role
   * {
   *   "userName": "john.doe",
   *   "fullName": "John Doe",
   *   "password": "password123",
   *   "role": "USER",
   *   "organizationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
   * }
   * @example request - For 'ADMIN' role
   * {
   *   "userName": "admin.user",
   *   "fullName": "Admin User",
   *   "password": "password123",
   *   "role": "ADMIN"
   * }
   * @returns {object} 201 - Created response
   * @returns {object} 400 - Bad Request
   * @returns {object} 401 - Unauthorized
   * @returns {object} 500 - Internal Server Error
   */
  router.post(
    '/',
    authMiddleware.authorize(['ADMIN']),
    validateMiddleware.validate(userSchema.createUserSchema),
    userController.create.bind(userController)
  );

  /**
   * PUT /users/{userId}
   * @summary Update user by ID
   * @tags User
   * @security BearerAuth
   * @param {string} userId.path.required - User ID using UUID format
   * @param {object} request.body.required - User data
   * @example request - Example payload for updating a 'USER'
   * {
   *   "userName": "john.doe.updated",
   *   "fullName": "John Doe Updated",
   *   "password": "newPassword123",
   *   "role": "USER",
   *   "organizationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
   *   "isActive": true
   * }
   * @returns {object} 200 - Success response
   * @returns {object} 400 - Bad Request
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   */
  router.put(
    '/:userId',
    authMiddleware.authorize(['ADMIN']),
    validateMiddleware.validate(userSchema.idUserSchema, 'params'),
    validateMiddleware.validate(userSchema.updateUserSchema),
    userController.update.bind(userController)
  );

  /**
   * DELETE /users/{userId}
   * @summary Delete user by ID
   * @tags User
   * @security BearerAuth
   * @param {string} userId.path.required - User ID using UUID format
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   */
  router.delete(
    '/:userId',
    authMiddleware.authorize(['ADMIN']),
    validateMiddleware.validate(userSchema.idUserSchema, 'params'),
    userController.remove.bind(userController)
  );

  return router;
};
