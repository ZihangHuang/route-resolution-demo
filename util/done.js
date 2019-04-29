const finalhandler = require("finalhandler");

let done = (req, res) =>
  finalhandler(req, res, {
    onerror: logerror
  })();

let doneError = (req, res) => finalhandler(req, res);

exports.done = done;
exports.doneError = doneError;

function logerror(err) {
  console.error(err.stack || err.toString());
}
