const url = require("url");
const path = require("path");
const fs = require("fs");
const debug = require("debug")("demo:middleware:static");
const done = require("../util/done").done;
const doneError = require("../util/done").doneError;

function staticMiddleware(staticPath) {
  return function(req, res, next) {
    if (req.method.toLowerCase() !== "get") {
      res.writeHead(405, { Allow: "GET", "Content-Length": 0 });
      res.end();
    }

    let pathname = url.parse(req.url, true).pathname;
    let filepath = path.join(staticPath, pathname);
    debug(filepath);
    fs.stat(filepath, function(err, stat) {
      if (err) {
        if (err.code == "ENOENT") {
          done(req, res);
        } else {
          doneError(req, res)(err);
        }
      } else {
        let stream = fs.createReadStream(filepath);
        stream.pipe(res);

        stream.on("error", function(err) {
          if (err) {
            doneError(req, res)(err);
          }
        });
      }
    });
  };
}

module.exports = staticMiddleware;
