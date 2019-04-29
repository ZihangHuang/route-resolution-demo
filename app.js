"use strict";
const http = require("http");
const mixin = require("merge-descriptors");
const debug = require("debug")("demo:app");
const Router = require("./router");
const done = require("./util/done").done;
const HTTP_METHODS = require("./util/methods").methods;

exports = module.exports = createApp;
exports.Router = Router;

let app = {};

app.handle = function(req, res, cb) {
  var _done = cb || done;
  if (!this._router) {
    debug("no routes defined on app");
    done(req, res);
    return;
  }
  this._router.handle(req, res, _done);
};

app.use = function(path, fn) {
  if (!this._router) {
    this._router = new Router();
  }

  let args = verify(path, fn);

  this._router.use(args.path, args.fn);
};

app.listen = function() {
  const server = http.createServer(this);
  return server.listen.apply(server, arguments);
};

//支持四种http方法
HTTP_METHODS.forEach(function(method) {
  app[method] = function(path, fn) {
    if (!this._router) {
      this._router = new Router();
    }

    let args = verify(path, fn);

    this._router[method](args.path, args.fn);
  };
});

//出口函数
function createApp() {
  let application = function(req, res) {
    application.handle(req, res);
  };

  mixin(application, app, false);
  return application;
}

function verify(path, fn) {
  if (typeof path === "function" && typeof fn === "undefined") {
    fn = path;
    path = "/";
  }

  if (typeof path !== "string") {
    throw new TypeError("Expected path is a string.");
  }

  if (typeof fn === "undefined") {
    throw new Error("Expected a middleware function as second argument.");
  } else {
    if (typeof fn !== "function") {
      throw new TypeError("Expected middleware is a function.");
    }
  }

  return {
    path,
    fn
  };
}
