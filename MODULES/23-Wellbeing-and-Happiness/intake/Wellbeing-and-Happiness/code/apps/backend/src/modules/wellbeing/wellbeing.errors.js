// wellbeing.errors.js
// Typed errors used across the Care Layer. Each carries an HTTP status so the
// route layer can translate without leaking internals.

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

class BadRequest extends HttpError {
  constructor(message = 'Bad request') { super(400, message); }
}

class Forbidden extends HttpError {
  constructor(message = 'Forbidden') { super(403, message); }
}

class NotFound extends HttpError {
  constructor(message = 'Not found') { super(404, message); }
}

// ⚠️ A guardrail violation is never a normal error. It means someone tried to
// do something the module promised a child it would never do. It is logged
// loudly and (in prod) alerts the platform owner.
class GuardrailViolation extends HttpError {
  constructor(message = 'Guardrail violation') {
    super(403, message);
  }
}

module.exports = { HttpError, BadRequest, Forbidden, NotFound, GuardrailViolation };
