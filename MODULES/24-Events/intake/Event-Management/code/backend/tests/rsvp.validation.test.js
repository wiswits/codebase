const { eventIdParams, submitRsvpBody, summaryQuery } = require('../src/modules/events/rsvp/rsvp.validation');

describe('rsvp.validation', () => {
  test('accepts a valid eventId param', () => {
    const { error, value } = eventIdParams.validate({ eventId: '42' });
    expect(error).toBeUndefined();
    expect(value.eventId).toBe(42);
  });

  test('rejects a non-numeric eventId param', () => {
    const { error } = eventIdParams.validate({ eventId: 'abc' });
    expect(error).toBeDefined();
  });

  test.each(['going', 'maybe', 'not_going'])('accepts RSVP status "%s"', (status) => {
    const { error } = submitRsvpBody.validate({ status });
    expect(error).toBeUndefined();
  });

  test('rejects an invalid RSVP status', () => {
    const { error } = submitRsvpBody.validate({ status: 'attending' });
    expect(error).toBeDefined();
  });

  test('applies default pagination for the summary query', () => {
    const { error, value } = summaryQuery.validate({});
    expect(error).toBeUndefined();
    expect(value.page).toBe(1);
    expect(value.limit).toBe(20);
  });
});
