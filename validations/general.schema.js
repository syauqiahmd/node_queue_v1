const Joi = require('joi');

const emptySchema = Joi.object().max(0);

module.exports = {
  emptySchema,
};
