const url = require("url");
const debug = require("debug")("demo:router:index");
const Layer = require("./layer");

//const HTTP_METHODS = ["get", "put", "delete", "post"];

function Router() {
  this.stack = [];
}

Router.prototype.use = function(path, fn) {
  let layer = new Layer(path, fn);

  this.stack.push(layer);
};

Router.prototype.match = function(pathname) {
  let layers = [];
  let stack = this.stack;

  for (let i = 0, len = stack.length; i < len; i++) {
    let layer = stack[i];
    //路径正则匹配
    let matched = layer.match(pathname);
    debug("matched:", matched);
    if (matched) {
      layers = layers.concat(layer);
    }
  }
  return layers;
};

Router.prototype.handle = function(req, res, done) {
  let pathname = url.parse(req.url).pathname;

  let layers = this.match(pathname);
  if (layers && layers.length > 0) {
    execute(req, res, layers);
  } else {
    done(req, res);
  }
};

function execute(req, res, layers) {
  let next = function(err) {
    let layer = layers.shift();
    if (!layer) return;

    if (err) {
      // 有异常则传给处理异常的中间件处理
      layer.handle_error(err, req, res, next);
    } else {
      // 传入next()函数，使中间件执行结束后递归
      layer.handle_request(req, res, next);
    }
  };

  next();
}

module.exports = Router;

//TODO
// HTTP_METHODS.forEach(method => {
//   routes[method] = {}
//   Router[method] = function(path, action) {

//   }
// })
