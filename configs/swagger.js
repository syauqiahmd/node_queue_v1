const port = process.env.PORT || 8000;
const host = process.env.PRODUCTION_HOST || 'https://your-production-domain.com';
const swaggerOptions = {
  info: {
    version: '1.0.0',
    title: 'API Docs',
    description: 'Swagger auto-generated docs using JSDoc',
  },
  servers: [
    {
      url: `http://localhost:${port}/api/v1`,
      description: 'Local Dev Server',
    },
    {
      url: `${host}/api/v1`,
      description: 'Production Server',
    },
  ],
  baseDir: __dirname,
  filesPattern: '../routes/**/*.js', // adjust based on your folder structure
  swaggerUIPath: '/docs',
  exposeSwaggerUI: true,
  exposeApiDocs: false,
  notRequiredAsNullable: false,
  basePath: '/api',
};

module.exports = swaggerOptions;
