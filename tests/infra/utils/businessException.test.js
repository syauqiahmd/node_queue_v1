const {
  BusinessError,
  NotFound,
  Unauthorized,
  ExpiredSession,
  unCalledQueue,
  BadRequest,
} = require('../../../src/infra/utils/businessException');

describe('BusinessException', () => {
  describe('BusinessError', () => {
    it('should create error with default values', () => {
      const err = new BusinessError({});
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('BusinessError');
      expect(err.code).toBe('INTERNAL_SERVER_ERROR');
      expect(err.message).toBe('Something went wrong');
      expect(err.statusCode).toBe(500);
      expect(err.fields).toBeNull();
    });

    it('should create error with provided values', () => {
      const err = new BusinessError({
        code: 'TEST_CODE',
        message: 'Test message',
        statusCode: 418,
        fields: { field: 'error' },
      });
      expect(err.code).toBe('TEST_CODE');
      expect(err.message).toBe('Test message');
      expect(err.statusCode).toBe(418);
      expect(err.fields).toEqual({ field: 'error' });
    });
  });

  describe('Factory methods', () => {
    it('NotFound should return correct error', () => {
      const err = NotFound('User');
      expect(err).toBeInstanceOf(BusinessError);
      expect(err.code).toBe('NOT_FOUND');
      expect(err.message).toBe('User not found');
      expect(err.statusCode).toBe(404);
    });

    it('NotFound should use default message', () => {
      const err = NotFound();
      expect(err.message).toBe('data not found');
    });

    it('Unauthorized should return correct error', () => {
      const err = Unauthorized('Invalid token');
      expect(err).toBeInstanceOf(BusinessError);
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.message).toBe('Invalid token');
      expect(err.statusCode).toBe(401);
    });

    it('Unauthorized should use default message', () => {
      const err = Unauthorized();
      expect(err.message).toBe('Unauthorized');
    });

    it('ExpiredSession should return correct error', () => {
      const err = ExpiredSession();
      expect(err).toBeInstanceOf(BusinessError);
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.message).toBe('Session expired or invalid');
      expect(err.statusCode).toBe(401);
    });

    it('unCalledQueue should return correct error', () => {
      const err = unCalledQueue();
      expect(err).toBeInstanceOf(BusinessError);
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.message).toBe('Queue not yet called');
      expect(err.statusCode).toBe(401);
    });

    it('BadRequest should return correct error', () => {
      const err = BadRequest('Invalid input');
      expect(err).toBeInstanceOf(BusinessError);
      expect(err.code).toBe('BAD_REQUEST');
      expect(err.message).toBe('Invalid input');
      expect(err.statusCode).toBe(400);
    });

    it('BadRequest should use default message', () => {
      const err = BadRequest();
      expect(err.message).toBe('Bad Request');
    });
  });
});
