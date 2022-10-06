// const Sauce = require("./models/sauce");

//afficheur de requetes:
const morgan = require("morgan");


const express = require("express");

const app = express();
const mongoose = require("mongoose");
mongoose
  .connect(
    "mongodb+srv://ilagam:mdpTest@cluster0.inae4xq.mongodb.net/?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

app.use(express.json());

app.use(morgan("dev"));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

const path = require("path");
const userRoutes = require("./routes/user");
const sauceRoutes = require("./routes/sauce");

app.use("/api/sauce", sauceRoutes);
app.use("/api/auth", userRoutes);
app.use("/images", express.static(path.join(__dirname, "images")));

module.exports = app;
