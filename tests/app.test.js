const request = require('supertest');
const express = require('express');
const { successResponse } = require('../utils/response');

const app = express();

app.get('/test', (req, res) => {
  return successResponse(res, { message: 'Ready to serve' });
});

describe('GET /test', () => {
  it('should return 200 OK with a message', async () => {
    const res = await request(app).get('/test');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('message', 'Ready to serve');
  });
});
