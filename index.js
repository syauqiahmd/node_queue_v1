require('dotenv').config();

const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const organizationRoutes = require('./routes/organizationRoutes');
const errorHandler = require('./middlewares/errorHandler');
const methodBasedLimiter = require('./middlewares/rateLimiter');


app.use(methodBasedLimiter);
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use('/api/organizations', organizationRoutes);
app.get('/test', (req, res) => {
  return successResponse(res, { message: 'Ready to serve' })
})

app.use(errorHandler);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
