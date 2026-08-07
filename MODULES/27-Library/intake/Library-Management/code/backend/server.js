require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

const booksRouter = require("./src/routes/books");
const copiesRouter = require("./src/routes/copies");
const issueRouter = require("./src/routes/issue");
const myBooksRouter = require("./src/routes/myBooks");
const statsRouter = require("./src/routes/stats");
const usersRouter = require("./src/routes/users");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "success", message: "WisWits Library API is running", data: null }));

app.use("/api/books", booksRouter);
app.use("/api/copies", copiesRouter);
app.use("/api/issue-register", issueRouter);
app.use("/api/my-books", myBooksRouter);
app.use("/api/stats", statsRouter);
app.use("/api/users", usersRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found", data: null });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ status: "error", message: "Internal server error", data: null });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`WisWits Library API listening on port ${PORT}`));
});
