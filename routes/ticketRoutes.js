const express = require('express');
const router = express.Router();
const controller = require('../controllers/ticketController');

const validate = require('../middlewares/validate');
const ticketSchema = require('../validations/ticket.schema');

/**
 * POST /tickets
 * @summary Create ticket data
 * @tags Tickets
 * @param {object} request.body.required - ticket to serviceId data
 * @example request - example payload
 * {
 *   "serviceId": "123123-1234-1234-1234-123456789012"
 * }
 */
router.post('/', validate(ticketSchema.createTicketSchema), controller.create);

module.exports = router;
