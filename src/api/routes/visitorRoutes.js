const express = require('express');
const router = express.Router();

module.exports = ({ visitorController, authMiddleware, validateMiddleware, visitorSchema }) => {
  /**
   * GET /visitors
   * @summary Get list of visitors (ADMIN only)
   * @tags Visitor
   * @security BearerAuth
   * @param {string} name.query - Filter by name
   * @param {string} phoneNumber.query - Filter by phone number
   * @param {string} email.query - Filter by email
   * @param {string} organizationId.query - Filter by organization ID
   * @param {number} page.query - Page number for pagination - default: 1
   * @param {number} pageSize.query - Number of items per page - default: 10
   * @param {string} sortBy.query - Sort by field (e.g., 'name', 'phoneNumber', 'email', 'createdAt') - default: 'createdAt'
   * @param {string} sortOrder.query - Sort order ('asc' or 'desc') - default: 'desc'
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 500 - Internal Server Error
   */
  router.get(
    '/',
    authMiddleware.authorize(['ADMIN']),
    validateMiddleware.validate(visitorSchema.getVisitorSchema, 'query'),
    visitorController.getAll.bind(visitorController)
  );

  return router;
};
