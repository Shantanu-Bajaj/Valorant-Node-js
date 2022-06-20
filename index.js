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
      if(req.query.password.length < 6) {
          res.send({err:"Password length should be at least 6 characters"});
      }
      else{
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
            res.send({ message: "User Registered successfully" });
          });
      }
  } else {
    res.send({ message: "Email already exists" });
  }
});
});

app.get("/user/login", (req, res) => {
  if (req.query.email && req.query.password) {
      var sql = "SELECT * FROM users WHERE email = '" + req.query.email + "' AND password = '" + req.query.password + "'";
      con.query(sql, function (err, result) {
        if (err) throw err;
        if (result.length) {
          let token = jwt.sign({ data: result[0] }, process.env.SECRET_KEY, {
            expiresIn: 604800,
          });
          var sql1 = "INSERT INTO usertoken (email, token) values ('" + req.query.email + "', '" + token + "')";
          con.query(sql1, function (err, result) {
            if (err) throw err;
          });
            res.send({ message: "User Logged in successfully", token: token });
        } else res.send({ Message: "Invalid Credentials" });
      });
    }
    else{
        res.send({err:"Please enter email or password"});
    }
});

const authenticate = function (req, res, next) {
  if (!req.headers.hasOwnProperty("authorization")) {
    // res.status(401).send({err:"There was some error"});
    res.status(401).send({err:"Please login first"});
  }
  let token = req.headers.authorization;
  token = token.split(" ")[1];
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) res.status(401).send({ error: "Unauthorized" });
    req.decoded = decoded;
    // console.log(req.decoded.data.name);
    // console.log(req.decoded);
    next();
  });
};

app.get("/user", authenticate, (req, res) => {
  res.send(req.decoded);
  });
  
  app.get("/user/favourites", authenticate, (req, res) => {
  var sql = "SELECT agents.agentid,agents.name,agents.devname,agents.displayicon FROM agents,favourites,users where agents.agentid = favourites.agentid and users.userid = favourites.userid and favourites.userid='"+ req.decoded.data.userid +"' ORDER BY agents.agentid";
  con.query(sql, function (err, result, fields) {
    if (err) throw err;
    // console.log(result)
    res.send(result); 
  });
  });
  
  



app.listen(PORT, () => {
console.log(`listening on port ${PORT}`);
})

