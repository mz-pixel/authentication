import {} from "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import bcrypt from "bcrypt";

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const url = "mongodb://0.0.0.0:27017/userDB";
const dbname = "userDB";
const client = new MongoClient(url, { useNewUrlParser: true });

async function main() {
  try {
    await client.connect();
    console.log("Connected correctly to server");

    const usersCollection = await client.db(dbname).collection("users");

    app.get("/", (req, res) => {
      res.render("home.ejs");
    });

    app.get("/login", (req, res) => {
      res.render("login.ejs");
    });
    app
      .route("/register")
      .post((req, res) => {
        bcrypt.hash(req.body.password, 10, async function (err, hash) {
          const username = req.body.username;
          const password = hash;
          await usersCollection.insertOne({
            username: username,
            password: password,
          });
          res.render("secrets.ejs");
        });
      })
      .get((req, res) => {
        res.render("register.ejs");
      });

    app.post("/login", async (req, res) => {
      const username = req.body.username;
      const password = req.body.password;
      const user = await usersCollection.findOne({ username: username });
      if (user) {
        bcrypt.compare(password, user.password, function (err, result) {
          if (result === true) {
            res.render("secrets.ejs");
          } else {
            res.send("Wrong password");
          }
        });
      } else {
        res.send("User not found");
      }
    });

    app.listen(3000, function () {
      console.log("Server is running on port 3000");
    });
  } catch (e) {
    console.error(e);
  } finally {
    // await client.close();
  }
}
main().catch(console.error);
