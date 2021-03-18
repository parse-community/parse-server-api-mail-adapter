'use strict';

const Errors = require('../src/Errors');

describe('Errors', () => {
  it('should create a custom error', () => {
    const message = "Example Error";
    const error = Errors.customError(message);
    expect(error.message).toBe(message);
    expect(error instanceof Error).toBeTrue();
  });
});
