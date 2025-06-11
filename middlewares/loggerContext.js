const { setRequestContext, clearRequestContext } = require('../utils/logger');

const loggerContext = (req, res, next) => {
  setRequestContext(req);

  res.on('finish', () => {
    clearRequestContext(); // clean up after response
  });

  next();
};

module.exports = loggerContext;
