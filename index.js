require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const organizationRoutes = require('./routes/organizationRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const errorHandler = require('./middlewares/errorHandler');
const methodBasedLimiter = require('./middlewares/rateLimiter');
const { successResponse } = require('./utils/response');

app.use(methodBasedLimiter);
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use('/api/organizations', organizationRoutes);
app.use('/api/services', serviceRoutes);
app.get('/test', (req, res) => {
  return successResponse(res, { message: 'Ready to serve' });
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
