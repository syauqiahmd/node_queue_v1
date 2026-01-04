const Joi = require('joi');
const CRON_TYPES = require('../../core/constants/cronTypes');

const triggerCron = Joi.object({
  date: Joi.date().iso().required(),
  cronType: Joi.string()
    .valid(...Object.values(CRON_TYPES))
    .required(),
  masterPassword: Joi.string().required(),
});

module.exports = {
  triggerCron,
};
