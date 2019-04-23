const finalhandler = require("finalhandler");

let done = (req, res) =>
  finalhandler(req, res, {
    onerror: logerror
  })();

module.exports = done;

function logerror(err) {
  console.error(err.stack || err.toString());
}
