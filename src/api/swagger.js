const port = process.env.PORT || 8000;
const host = process.env.PRODUCTION_HOST || 'https://your-production-domain.com';

module.exports = {
  info: {
    version: '1.0.0',
    title: 'API Docs',
    description: 'Swagger auto-generated docs using JSDoc',
  },
  security: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
    },
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
  filesPattern: './routes/**/*.js',
  swaggerUIPath: '/docs',
  exposeSwaggerUI: true,
  exposeApiDocs: true,
  apiDocsPath: '/api-docs',
  notRequiredAsNullable: false,
  basePath: '/api/v1',
};
