const pathToRegexp = require("path-to-regexp");
const debug = require("debug")("demo:router:layer");

const hasOwnProperty = Object.prototype.hasOwnProperty;

module.exports = Layer;

function Layer(path, options, fn) {
  if (!(this instanceof Layer)) return new Layer(path, options, fn);

  debug("new %o", path);
  let opts = options || {};
  let keys = [];

  this.originalPath = path; //记录原始路径，仅供调试

  this.regexp = pathToRegexp(path, keys, opts);
  this.keys = keys; //保存参数等信息，有带类似:id时才有
  this.handle = fn;
  this.name = fn.name;
  this.params = undefined;
  this.path = undefined;

  this.regexp.fast_star = path === "*";
  this.regexp.fast_slash = path === "/";
}

Layer.prototype.match = function(path) {
  let match;
  if (path != null) {
    //if original path is /
    if (this.regexp.fast_slash) {
      this.params = {};
      this.path = "";
      return true;
    }

    //if original path is *
    if (this.regexp.fast_star) {
      this.params = { "0": decode_param(path) };
      this.path = path;
      return true;
    }
    match = this.regexp.exec(path);
  }

  if (!match) {
    this.params = undefined;
    this.path = undefined;
    return false;
  }

  this.params = {}; //保存整理的路径参数
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
  if (fn.length > 3) return next();

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
