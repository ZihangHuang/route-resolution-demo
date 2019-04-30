const url = require("url");
const debug = require("debug")("demo:router:index");
const Layer = require("./layer");
const HTTP_METHODS = require("../util/methods").methods;

const doneError = require("../util/done").doneError;
const done = require("../util/done").done;

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

proto.match = function(pathname, reqMethod) {
  let layers = [];
  let stack = this.stack;

  for (let i = 0, len = stack.length; i < len; i++) {
    let layer = stack[i];
    //路径正则匹配
    let matched = layer.match(pathname);
    debug(layer.originalPath, " matched: ", matched);
    if (matched) {
      let isRoute = layer.route;
      //如果是路由中间件，请求方法要对应上
      if (!isRoute || (isRoute && layer.method === reqMethod)) {
        layers = layers.concat(layer);
      }
    }
  }
  return layers;
};

proto.handle = function(req, res, done) {
  let parentUrl = req.baseUrl || ""; //保留上一级的路径

  req.baseUrl = parentUrl; //保存use(path,fn)的path拼接起来的路径
  req.originalUrl = req.originalUrl || req.url; //保留原始的url

  let pathname = getPathname(req.url);
  let reqMethod = req.method.toLowerCase(); //请求方法

  let layers = this.match(pathname, reqMethod);
  //debug("matched layers:", layers);
  if (layers.length > 0) {
    execute(req, res, layers, pathname, parentUrl);
  } else {
    done(req, res); //当嵌套路由时，此done可能实为next
  }
};

function execute(req, res, layers, pathname, parentUrl) {
  let removed;

  let next = function(err) {
    let layer = layers.shift();
    if (!layer) {
      if (!err) return;

      //嵌套路由时，该err为req
      if (err instanceof Error) {
        return doneError(req, res)(err);
      } else {
        return done(req, res);
      }
    }

    let layerPath = layer.path;
    let isRoute = layer.route;

    //是普通中间件且路径不是/
    if (!isRoute && layerPath) {
      let c = pathname[layerPath.length];
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
      //debug("baseUrl:", req.baseUrl);
    }

    req.params = layer.params;
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

//支持四种http方法
HTTP_METHODS.forEach(method => {
  proto[method] = function(path, fn) {
    let layer = new Layer(
      path,
      {
        sensitive: false,
        strict: false,
        end: true
      },
      fn
    );
    layer.route = true; //添加路由中间件标记，与普通中间件区分开
    layer.method = method;
    this.stack.push(layer);
  };
});
