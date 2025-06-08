const Joi = require('joi');

const createTicketSchema = Joi.object({
  serviceId: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .required(),
}).required();

module.exports = {
  createTicketSchema,
};
