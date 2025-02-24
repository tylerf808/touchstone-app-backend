const express = require("express");
const routes = require("./routes");
const db = require("./config/connection");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const PORT = process.env.PORT || 8080;
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

// Serve static files from React build
app.use(express.static(path.join(__dirname, "client", "build")));

// API routes
app.use(routes);

// Serve React app for all non-API requests
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

// Start server
db.once("open", () => {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
});