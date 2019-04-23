const app = require("./app.js");
const url = require("url");

server = app();
server.listen(8888, () => {
  console.log("listening: http://localhost:8888");
});

var str = "";

server.use("/admin", function(req, res, next) {
  str = "hello ";
  req.query = url.parse(req.url, true).query;
  next();
});

server.use("/admin", function(req, res, next) {
  let name = req.query.name ? req.query.name : "world";
  str += name;
  next();
});

server.use("/admin", function(req, res) {
  str += " !!!";
  res.writeHead(200);
  res.end(str);
});
