// Standard EduSuite API response shape: { status, message, data }

function ok(res, message, data = null, code = 200) {
  return res.status(code).json({ status: "success", message, data });
}

function fail(res, message, code = 400, data = null) {
  return res.status(code).json({ status: "error", message, data });
}

module.exports = { ok, fail };
