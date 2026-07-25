const express = require('express');
const router = express.Router();

module.exports = ({
  visitorHistoryController,
  authMiddleware,
  validateMiddleware,
  visitorHistorySchema,
}) => {
  /**
   * GET /visitor-histories
   * @summary Get list of visitor histories (ADMIN sees all organizations; USER is scoped to their own)
   * @tags VisitorHistory
   * @security BearerAuth
   * @param {string} visitorId.query - Filter by visitor ID
   * @param {string} name.query - Filter by visitor name
   * @param {string} phoneNumber.query - Filter by visitor phone number
   * @param {string} email.query - Filter by visitor email
   * @param {string} organizationId.query - Filter by organization ID (ADMIN only; USER is scoped to their own organization)
   * @param {string} organizationName.query - Filter by organization name
   * @param {string} organizationFullName.query - Filter by organization full name
   * @param {string} visitDate.query - Filter by visit date (ISO date, e.g. 2026-07-17)
   * @param {number} page.query - Page number for pagination - default: 1
   * @param {number} pageSize.query - Number of items per page - default: 10
   * @param {string} sortBy.query - Sort by field ('visitDate' or 'createdAt') - default: 'createdAt'
   * @param {string} sortOrder.query - Sort order ('asc' or 'desc') - default: 'desc'
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 403 - Forbidden
   * @returns {object} 500 - Internal Server Error
   */
  router.get(
    '/',
    authMiddleware.authorize(['ADMIN', 'USER']),
    validateMiddleware.validate(visitorHistorySchema.getVisitorHistorySchema, 'query'),
    visitorHistoryController.getAll.bind(visitorHistoryController)
  );

  /**
   * POST /visitor-histories/report
   * @summary Export visitor history as CSV (ADMIN sees all organizations; USER is scoped to their own), ordered by Recorded At
   * @tags VisitorHistory
   * @security BearerAuth
   * @param {object} request.body.required - Filter payload
   * @example request - Example payload
   * {
   *   "startDate": "2026-07-01",
   *   "endDate": "2026-07-31"
   * }
   * @returns {string} 200 - CSV content
   * @returns {object} 400 - Bad Request
   * @returns {object} 401 - Unauthorized
   * @returns {object} 403 - Forbidden
   * @returns {object} 404 - Not Found
   * @returns {object} 500 - Internal Server Error
   */
  router.post(
    '/report',
    authMiddleware.authorize(['ADMIN', 'USER']),
    validateMiddleware.validate(visitorHistorySchema.exportVisitorHistoryReportSchema),
    visitorHistoryController.exportReport.bind(visitorHistoryController)
  );

  return router;
};
