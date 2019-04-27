const url = require("url");
const debug = require("debug")("demo:router:index");
const Layer = require("./layer");

//const HTTP_METHODS = ["get", "put", "delete", "post"];

module.exports = proto;

function proto() {
  function router(req, res, next) {
    router.handle(req, res, next);
  }
  Object.setPrototypeOf(router, proto);

  router.stack = [];

  return router;
}

proto.use = function(path, fn) {
  let layer = new Layer(
    path,
    {
      sensitive: false,
      strict: false,
      end: false
    },
    fn
  );
  this.stack.push(layer);
};

proto.match = function(pathname) {
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

proto.handle = function(req, res, done) {
  let parentUrl = req.baseUrl || ""; //保留上一级的路径

  req.baseUrl = parentUrl; //保存所有use(path,fn)的path拼接起来的路径
  req.originalUrl = req.originalUrl || req.url; //保留原始的url

  let pathname = getPathname(req.url);

  let layers = this.match(pathname);

  if (layers && layers.length > 0) {
    execute(req, res, layers, pathname, parentUrl);
  } else {
    done(req, res);
  }
};

function execute(req, res, layers, path, parentUrl) {
  let removed;

  let next = function(err) {
    let layer = layers.shift();
    if (!layer) return;

    let layerPath = layer.path;

    if (layerPath !== undefined) {
      let c = path[layerPath.length];
      if (c && c !== "/" && c !== ".") return next(err);

      removed = layerPath;
      req.url = req.url.slice(removed.length);

      if (req.url[0] !== "/") {
        req.url = "/" + req.url;
      }

      req.baseUrl =
        parentUrl +
        (removed[removed.length - 1] === "/"
          ? removed.substring(0, removed.length - 1)
          : removed);

      debug("baseUrl:", req.baseUrl);
    }

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

function getPathname(reqUrl) {
  return url.parse(reqUrl).pathname;
}
//TODO
// HTTP_METHODS.forEach(method => {
//   Router[method] = function(path, fn) {

//   }
// })
