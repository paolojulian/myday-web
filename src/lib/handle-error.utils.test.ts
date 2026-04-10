import { handleError } from './handle-error.utils';

describe('handleError', () => {
  it('returns the original Error when passed an Error instance', () => {
    const original = new Error('original');
    const result = handleError(original);
    expect(result).toBe(original);
  });

  it('returns the fallback Error when the thrown value is not an Error', () => {
    const fallback = new Error('fallback');
    const result = handleError('some string error', fallback);
    expect(result).toBe(fallback);
  });

  it('wraps a fallback string in a new Error', () => {
    const result = handleError('not an Error', 'fallback message');
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('fallback message');
  });

  it('returns a generic error when no fallback is provided and thrown value is not an Error', () => {
    const result = handleError('something bad');
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Something went wrong.');
  });

  it('preserves the thrown Error even when a fallback is provided', () => {
    const thrown = new TypeError('type mismatch');
    const result = handleError(thrown, new Error('ignored fallback'));
    expect(result).toBe(thrown);
  });
});
