const express = require('express');
const request = require('supertest');
const LogoUploadMiddleware = require('../../../src/api/middlewares/logoUpload');
const businessException = require('../../../src/infra/utils/businessException');

const buildApp = () => {
  const upload = new LogoUploadMiddleware({ businessException });
  const app = express();
  app.post('/logo', upload.single, (req, res) =>
    res.json({ size: req.file ? req.file.buffer.length : null, field: req.file?.fieldname })
  );
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) =>
    res.status(err.statusCode || 500).json({ message: err.message })
  );
  return app;
};

describe('LogoUploadMiddleware', () => {
  it('puts the uploaded file in req.file.buffer', async () => {
    const res = await request(buildApp())
      .post('/logo')
      .attach('logo', Buffer.from('png-bytes'), 'logo.png');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ size: 9, field: 'logo' });
  });

  it('rejects files larger than 1 MB with 400', async () => {
    const tooBig = Buffer.alloc(LogoUploadMiddleware.MAX_LOGO_BYTES + 1);
    const res = await request(buildApp()).post('/logo').attach('logo', tooBig, 'big.png');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Logo must be 1 MB or smaller');
  });

  it('rejects a file sent in another field with 400', async () => {
    const res = await request(buildApp())
      .post('/logo')
      .attach('image', Buffer.from('x'), 'logo.png');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/^Invalid logo upload/);
  });

  it('rejects extra text fields with 400', async () => {
    const res = await request(buildApp()).post('/logo').field('logo', 'not a file');

    expect(res.status).toBe(400);
  });

  it('leaves req.file empty when the request is not multipart', async () => {
    const res = await request(buildApp()).post('/logo').send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ size: null });
  });
});
