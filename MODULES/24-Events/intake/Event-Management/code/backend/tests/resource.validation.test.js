const { bookResourceBody, availabilityQuery } = require('../src/modules/events/resources/resource.validation');

describe('resource.validation', () => {
  test('accepts a valid booking payload', () => {
    const { error } = bookResourceBody.validate({
      resourceId: 1,
      startTime: '2026-08-01T10:00:00.000Z',
      endTime: '2026-08-01T11:00:00.000Z',
    });
    expect(error).toBeUndefined();
  });

  test('rejects a booking where endTime is not after startTime', () => {
    const { error } = bookResourceBody.validate({
      resourceId: 1,
      startTime: '2026-08-01T10:00:00.000Z',
      endTime: '2026-08-01T10:00:00.000Z',
    });
    expect(error).toBeDefined();
  });

  test('allows an availability query with no window specified', () => {
    const { error } = availabilityQuery.validate({});
    expect(error).toBeUndefined();
  });

  test('rejects an availability query with only startTime provided', () => {
    const { error } = availabilityQuery.validate({ startTime: '2026-08-01T10:00:00.000Z' });
    expect(error).toBeDefined();
  });
});
