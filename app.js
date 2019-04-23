"use strict";
const http = require("http");
const mixin = require("merge-descriptors");
const debug = require("debug")("demo:app");
const Router = require("./router");
const done = require("./util/done");

let app = {};

app.handle = function(req, res) {
  if (!this._router) {
    debug("no routes defined on app");
    done(req, res);
    return;
  }
  this._router.handle(req, res);
};

app.use = function(path, fn) {
  if (!this._router) {
    this._router = new Router();
  }

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

  this._router.use(path, fn);
};

app.listen = function() {
  const server = http.createServer(this);
  return server.listen.apply(server, arguments);
};

function createApp() {
  let application = function(req, res) {
    application.handle(req, res);
  };

  mixin(application, app, false);
  return application;
}

module.exports = createApp;
