const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Vérifie si le nom d'utilisateur est déjà pris (true = disponible)
const isValid = (username) => {
  return !users.some((user) => user.username === username);
};

// Vérifie que le couple nom d'utilisateur / mot de passe existe
const authenticatedUser = (username, password) => {
  return users.some((user) => user.username === username && user.password === password);
};

// Tâche 8 : connexion d'un utilisateur enregistré
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(404).json({ message: "Error logging in: username and password required" });
  }

  if (authenticatedUser(username, password)) {
    const accessToken = jwt.sign({ data: password }, 'access', { expiresIn: 60 * 60 });
    req.session.authorization = { accessToken, username };
    return res.status(200).send("User successfully logged in");
  } else {
    return res.status(208).json({ message: "Invalid Login. Check username and password" });
  }
});

// Tâche 9 : ajouter ou modifier une critique (une par utilisateur)
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }
  if (!review) {
    return res.status(400).json({ message: "Review text is required (?review=...)" });
  }

  books[isbn].reviews[username] = review;
  return res.status(200).json({
    message: `The review for the book with ISBN ${isbn} has been added/updated.`,
    reviews: books[isbn].reviews,
  });
});

// Tâche 10 : supprimer sa propre critique
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }
  if (!books[isbn].reviews[username]) {
    return res.status(404).json({ message: `No review by ${username} for ISBN ${isbn}` });
  }

  delete books[isbn].reviews[username];
  return res.status(200).json({
    message: `Reviews for the ISBN ${isbn} posted by the user ${username} deleted.`,
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
