const app = require("./app.js");
const url = require("url");

let server = app();
server.listen(8888, () => {
  console.log("listening: http://localhost:8888");
});

//中间件传递
var str = "";
server.use("/admin", function(req, res, next) {
  str = "hello ";
  req.query = url.parse(req.url, true).query;
  next();
});

server.use("/admin", function(req, res, next) {
  let name = req.query.name ? req.query.name : "world";
  str += name;

  try {
    throw new Error("happen error");
  } catch (error) {
    next(error);
  }
});

server.use("/admin", function(req, res) {
  str += " !!!";
  res.writeHead(200);
  res.end(str);
});

//处理错误中间件(4个参数)
server.use("/admin", function(err, req, res, next) {
  console.log("log err");
  let status = err.status || 500;
  let msg = err.message || "服务器错误";
  res.writeHead(status);
  res.end(msg);
});

//支持get,post,put,delete方法，路径要精确匹配
var str2 = "";
server.get("/info", function info1(req, res, next) {
  str2 += "hello ";
  next();
});

server.get("/info", function info2(req, res) {
  str2 += "jack";
  res.end(str2);
});

//嵌套路由
const router = app.Router();
router.get("/abc/:id", function abc(req, res, next) {
  let obj = {
    baseUrl: req.baseUrl, //'/index'
    url: req.url, //'/abc/123'
    originalUrl: req.originalUrl, //'/index/abc/123'
    params: req.params //{id: 123}
  };
  //console.log(obj);
  res.end(JSON.stringify(obj));
});

server.use("/index", router);

server.use("/static", app.static(__dirname + "/static"));

//404(应该写在最后)
server.use("*", function(req, res) {
  res.end("404");
});
