const express = require('express');
const router = express.Router();

module.exports = ({
  userController,
  authController,
  authMiddleware,
  validateMiddleware,
  userSchema,
}) => {
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
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 500 - Internal Server Error
   */
  router.get(
    '/',
    authMiddleware.RBAC(['ADMIN']),
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
    authMiddleware.RBAC(['ADMIN']),
    validateMiddleware.validate(userSchema.idUserSchema, 'params'),
    userController.getById.bind(userController)
  );

  /**
   * POST /users
   * @summary Create user data
   * @tags User
   * @security BearerAuth
   * @param {object} request.body.required - user data
   * @returns {object} 201 - Created response
   * @returns {object} 400 - Bad Request
   * @returns {object} 401 - Unauthorized
   * @returns {object} 500 - Internal Server Error
   */
  router.post(
    '/',
    authMiddleware.RBAC(['ADMIN']),
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
   * @returns {object} 200 - Success response
   * @returns {object} 400 - Bad Request
   * @returns {object} 401 - Unauthorized
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   */
  router.put(
    '/:userId',
    authMiddleware.RBAC(['ADMIN']),
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
    authMiddleware.RBAC(['ADMIN']),
    validateMiddleware.validate(userSchema.idUserSchema, 'params'),
    userController.remove.bind(userController)
  );

  /**
   * POST /users/logout
   * @summary Logout user
   * @tags #Authorization
   * @security BearerAuth
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 500 - Internal Server Error
   */
  router.post(
    '/logout',
    authMiddleware.RBAC(['ADMIN', 'USER']),
    authController.logout.bind(authController)
  );

  return router;
};
