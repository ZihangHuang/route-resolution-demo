const pathToRegexp = require("path-to-regexp");
const debug = require("debug")("demo:router:layer");

const hasOwnProperty = Object.prototype.hasOwnProperty;

function Layer(path, fn) {
  if (!(this instanceof Layer)) return new Layer(path.fn);

  debug("new %o", path);
  let keys = [];
  this.regexp = pathToRegexp(path, keys);
  this.keys = keys; //保存参数等信息
  this.handle = fn;
  this.params = undefined;
  this.path = undefined;
}

Layer.prototype.match = function(path) {
  let match = this.regexp.exec(path);

  if (!match) {
    this.params = undefined;
    this.path = undefined;
    return false;
  }

  this.params = {};
  this.path = match[0];

  let keys = this.keys;
  let params = this.params;
  for (let i = 1, len = match.length; i < len; i++) {
    let key = keys[i - 1];
    let prop = key.name; //例如路由参数为:id时，key.name为id
    let val = decode_param(match[i]);
    if (val !== undefined || !hasOwnProperty.call(params, prop)) {
      params[prop] = val;
    }
  }
  return true;
};

Layer.prototype.handle_request = function(req, res, next) {
  let fn = this.handle;

  try {
    fn(req, res, next);
  } catch (err) {
    next(err);
  }
};

Layer.prototype.handle_error = function handle_error(err, req, res, next) {
  let fn = this.handle;

  //处理异常的中间件必须有四个参数，否则继续传递下去
  if (fn.length !== 4) return next(err);

  try {
    fn(err, req, res, next);
  } catch (error) {
    next(error);
  }
};

module.exports = Layer;

function decode_param(val) {
  if (typeof val !== "string" || val.length === 0) {
    return val;
  }

  try {
    return decodeURIComponent(val);
  } catch (err) {
    if (err instanceof URIError) {
      err.message = "Failed to decode param '" + val + "'";
      err.status = err.statusCode = 400;
    }
    throw err;
  }
}
