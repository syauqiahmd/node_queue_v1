const express = require('express');

module.exports = ({ privateController }) => {
  const router = express.Router();

  /**
   * GET /private/ping
   * @summary Verify service-to-service authentication
   * @tags #Private
   * @security ServiceApiKey
   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized (missing/invalid X-Service-Key header)
   * @example response - 200 - Example success response
   * {
   *   "success": true,
   *   "message": "pong",
   *   "data": { "service": "exampleService" }
   * }
   */
  router.get('/ping', privateController.ping);

  return router;
};
