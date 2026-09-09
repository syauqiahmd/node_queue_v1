const Joi = require('joi');

const idTicketSchema = Joi.object({
  ticketId: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .required(),
}).required();

module.exports = {
  idTicketSchema,
};
