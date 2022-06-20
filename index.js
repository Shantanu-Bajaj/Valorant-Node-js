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




app.listen(PORT, () => {
console.log(`listening on port ${PORT}`);
})

