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




app.listen(PORT, () => {
console.log(`listening on port ${PORT}`);
})

