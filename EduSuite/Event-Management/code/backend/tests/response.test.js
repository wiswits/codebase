const AppError = require('../src/utils/AppError');
const { success, error } = require('../src/utils/response');

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('response helpers', () => {
  test('success() returns the standard success envelope', () => {
    const res = mockRes();
    success(res, { foo: 'bar' }, 201);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ success: true, data: { foo: 'bar' } });
  });

  test('error() returns the standard error envelope', () => {
    const res = mockRes();
    error(res, 404, 'EVENT_NOT_FOUND', 'Event not found.');
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'EVENT_NOT_FOUND', message: 'Event not found.' },
    });
  });
});

describe('AppError', () => {
  test('carries statusCode and code', () => {
    const err = new AppError(409, 'RESOURCE_CONFLICT', 'Overlapping booking.');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('RESOURCE_CONFLICT');
    expect(err.isOperational).toBe(true);
  });
});
