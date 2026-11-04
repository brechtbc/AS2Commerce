const addContext = require('mochawesome/addContext');

// Attach request/response evidence to the test in the Mochawesome report.
function attachEvidence(ctx, label, request, res) {
  addContext(ctx, {
    title: label,
    value: { request, response: { status: res.status, body: res.body } },
  });
}

module.exports = { attachEvidence };
