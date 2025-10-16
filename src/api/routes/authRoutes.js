const express = require('express');

module.exports = ({ authController }) => {
  const router = express.Router();

  /**
   * POST /auth/logout
   * @summary Logout user by ID
   * @tags #Authorization
   * @security BearerAuth
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 500 - Internal Server Error
   * @example response - 200 - Example success response
   * {
   *   "success": true,
   *   "data": { "message": "logout success" }
   * }
   */
  router.post('/logout', authController.logout.bind(authController));

  /**
   * GET /auth/validate-token
   * @summary Validate the current user's token
   * @tags #Authorization
   * @security BearerAuth
   * @returns {object} 200 - Success response when token is valid
   * @returns {object} 401 - Unauthorized response when token is invalid or expired
   * @example response - 200 - Example success response
   * {
   *   "success": true,
   *   "message": "Token is valid",
   *   "data": {
   *     "id": "uuid",
   *     "userName": "test",
   *     "fullName": "Test User",
   *     "role": "ADMIN",
   *     "isActive": true,
   *     "organization": {
   *       "organizationId": "uuid",
   *       "name": "Test Org",
   *       "fullName": "Test Organization"
   *     },
   *     "expiresAt": "2025-10-26T12:00:00.000Z"
   *   }
   * }
   * @example response - 401 - Example error response
   * {
   *   "success": false,
   *   "error": {
   *     "code": "UNAUTHORIZED",
   *     "message": "Invalid or expired token"
   *   }
   * }
   */
  router.get('/validate-token', authController.validateToken.bind(authController));

  return router;
};
