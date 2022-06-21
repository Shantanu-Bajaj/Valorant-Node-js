import express from "express";
const app = express();
const PORT = 8080;
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import dotenv from "dotenv";
import mysql from "mysql";

dotenv.config();

var con = mysql.createConnection({
  host: process.env.host,
  port: process.env.port,
  user: process.env.user,
  database: process.env.database,
  password: process.env.password,
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected");
});

app.get("/allcharacters", (req, res) => {
  con.query("SELECT * FROM agents", function (err, result, fields) {
    if (err) throw err;
    res.send(result);
  });
});

app.post("/user/register", (req, res) => {
  var sqll = "SELECT email FROM users WHERE email='" + req.query.email + "'";
  con.query(sqll, function (err, result) {
    if (err) throw err;
    if (!result.length) {
      if (req.query.password.length < 6) {
        res.status(401).send({ err: "Password length should be at least 6 characters" });
      } else {
        var sql =
          "INSERT INTO users (name, email, password) VALUES ('" +
          req.query.name +
          "','" +
          req.query.email +
          "','" +
          req.query.password +
          "')";
        con.query(sql, function (err, results) {
          if (err) throw err;
          res.send({ message: "Success"},{data:{"name": req.query.name, "email": req.query,"password": req.query.password}});
        });
      }
    } else {
      res.status(401).send({ err: "Email already exists" });
    }
  });
});

app.get("/user/login", (req, res) => {
  if (req.query.email && req.query.password) {
    var sql =
      "SELECT * FROM users WHERE email = '" +
      req.query.email +
      "' AND password = '" +
      req.query.password +
      "'";
    con.query(sql, function (err, result) {
      if (err) throw err;
      if (result.length) {
        let token = jwt.sign({ data: result[0] }, process.env.SECRET_KEY, {
          expiresIn: 604800,
        });
        var sql1 =
          "INSERT INTO usertoken (email, token) values ('" +
          req.query.email +
          "', '" +
          token +
          "')";
        con.query(sql1, function (err, result) {
          if (err) throw err;
        });
        res.send({ message: "success", token: token ,data:{"userid": result[0].userid,"name":result[0].name, "email":result[0].email, "password":result[0].password}});
      } else res.status(401).send({err: "Invalid Credentials" });
    });
  } else {
    res.status(204).send({ err: "Please enter email or password" });
  }
});

const authenticate = function (req, res, next) {
  if (!req.headers.hasOwnProperty("authorization")) {
    // res.status(401).send({err:"There was some error"});
    res.status(401).send({ err: "Please login first" });
  }
  let token = req.headers.authorization;
  token = token.split(" ")[1];
  var sql = "SELECT token FROM usertoken where token='"+ token +"'";
  con.query(sql, function (err,result) {    
    if(result.length)
    // console.log(result);
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) res.status(401).send({ error: "Unauthorized" });
      req.decoded = decoded; 
    });
    // console.log(req.decoded.data.name);
    // console.log(req.decoded);
    else
    res.status(401).send({ error: "Please Login First"});
    next();
  });
};

app.get("/user", authenticate, (req, res) => {
  res.send(req.decoded);
});

app.get("/user/favourites", authenticate, (req, res) => {
  var sql =
    "SELECT agents.agentid,agents.name,agents.devname,agents.displayicon FROM agents,favourites,users where agents.agentid = favourites.agentid and users.userid = favourites.userid and favourites.userid='" +
    req.decoded.data.userid +
    "' ORDER BY agents.agentid";
  con.query(sql, function (err, result, fields) {
    if (err) throw err;
    // console.log(result)
    res.send(result);
  });
});

app.post("/user/addfav", authenticate, (req, res) => {
  if (!req.query.agentid)
    res.status(400).send({ err: "Enter agent id"});
  else {
    var sqll =
      "SELECT agentid FROM favourites WHERE userid='" +
      req.decoded.data.userid +
      "' and agentid='" +
      req.query.agentid +
      "'";
    con.query(sqll, function (err, result) {
      if (err) throw err;
      if (result.length)
        res.status(406).send({ err: "Already added" });
      else {
        var sql =
          "INSERT INTO favourites (userid,agentid) VALUES ('" +
          req.decoded.data.userid +
          "', '" +
          req.query.agentid +
          "')";
        con.query(sql, function (err, results) {
          if (err) throw err;
        });
        var sql2 = "SELECT * FROM agents WHERE agentid='" + req.query.agentid + "'";
        con.query(sql2, function (err, resultss) {
          if (err) throw err;
          // console.log(resultss);
          res.send({ message: "success" ,data:{"agentid":resultss[0].agentid , "name":resultss[0].name, "devname":resultss[0].devname,"displayicon":resultss[0].displayicon}});
        })
      }
    });
  }
});

app.post("/user/removefav", authenticate, (req, res) => {
  if (!req.query.agentid)
    res.status(400).send({err: "enter agent id"});
  else {
    var sqll =
      "SELECT agentid FROM favourites WHERE userid='" +
      req.decoded.data.userid +
      "' and agentid='" +
      req.query.agentid +
      "'";
    con.query(sqll, function (err, result) {
      if (err) throw err;
      if (!result.length)
        res.status(404).send({err: "Not found"});
      else {
        var sql =
          "DELETE FROM favourites where userid='" +
          req.decoded.data.userid +
          "' and agentid='" +
          req.query.agentid +
          "'";
        con.query(sql, function (err, results) {
          if (err) throw err;
        });
        var sql2 = "SELECT * FROM agents WHERE agentid='" + req.query.agentid + "'";
        con.query(sql2, function (err, resultss) {
          if (err) throw err;
          // console.log(resultss);
          res.send({message: "success",data:{"agentid":resultss[0].agentid , "name":resultss[0].name, "devname":resultss[0].devname,"displayicon":resultss[0].displayicon}});
        })
      }
    });
  }
});

app.post("/user/logout", authenticate, (req, res) => {
  var sql =
    "DELETE FROM usertoken WHERE email='" + req.decoded.data.email + "'";
  con.query(sql, function (err, results) {
    if (err) throw err;
    res.send("success");
  });
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
