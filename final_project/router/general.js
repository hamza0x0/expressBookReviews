const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

// Tâche 7 : inscription d'un nouvel utilisateur
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(404).json({ message: "Unable to register user. Username and password required." });
  }
  if (!isValid(username)) {
    return res.status(404).json({ message: "User already exists!" });
  }

  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// ---------- Fonctions utilisant des promesses ----------

const getAllBooks = () =>
  new Promise((resolve) => {
    resolve(books);
  });

const getBookByISBN = (isbn) =>
  new Promise((resolve, reject) => {
    if (books[isbn]) resolve(books[isbn]);
    else reject({ status: 404, message: `Book with ISBN ${isbn} not found` });
  });

const getBooksByAuthor = (author) =>
  new Promise((resolve, reject) => {
    const result = Object.keys(books)
      .filter((isbn) => books[isbn].author.toLowerCase() === author.toLowerCase())
      .map((isbn) => ({ isbn, title: books[isbn].title, reviews: books[isbn].reviews }));
    if (result.length > 0) resolve(result);
    else reject({ status: 404, message: `No books found for author ${author}` });
  });

const getBooksByTitle = (title) =>
  new Promise((resolve, reject) => {
    const result = Object.keys(books)
      .filter((isbn) => books[isbn].title.toLowerCase() === title.toLowerCase())
      .map((isbn) => ({ isbn, author: books[isbn].author, reviews: books[isbn].reviews }));
    if (result.length > 0) resolve(result);
    else reject({ status: 404, message: `No books found with title ${title}` });
  });

// Tâche 2 : liste de tous les livres (async/await)
public_users.get('/', async (req, res) => {
  try {
    const allBooks = await getAllBooks();
    return res.status(200).send(JSON.stringify(allBooks, null, 4));
  } catch (err) {
    return res.status(500).json({ message: "Error retrieving books" });
  }
});

// Tâche 3 : livre par ISBN (promesse)
public_users.get('/isbn/:isbn', (req, res) => {
  getBookByISBN(req.params.isbn)
    .then((book) => res.status(200).send(JSON.stringify(book, null, 4)))
    .catch((err) => res.status(err.status || 500).json({ message: err.message }));
});

// Tâche 4 : livres par auteur (async/await)
public_users.get('/author/:author', async (req, res) => {
  try {
    const booksbyauthor = await getBooksByAuthor(req.params.author);
    return res.status(200).send(JSON.stringify({ booksbyauthor }, null, 4));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

// Tâche 5 : livres par titre (async/await)
public_users.get('/title/:title', async (req, res) => {
  try {
    const booksbytitle = await getBooksByTitle(req.params.title);
    return res.status(200).send(JSON.stringify({ booksbytitle }, null, 4));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
});

// Tâche 6 : critiques d'un livre
public_users.get('/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }
  return res.status(200).send(JSON.stringify(books[isbn].reviews, null, 4));
});

// ---------- Tâche 11 : récupération des livres avec Axios (async/await et promesses) ----------
// Chaque route /async/... récupère la liste complète des livres via Axios (route "/"),
// puis sélectionne/filtre le résultat, renvoie une réponse de succès,
// et gère les erreurs (catch) ainsi que le cas "non trouvé" (404).

// Tous les livres — async/await + Axios
public_users.get('/async/books', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    const allBooks = response.data;
    if (!allBooks || Object.keys(allBooks).length === 0) {
      return res.status(404).json({ message: "No books found" });
    }
    return res.status(200).send(JSON.stringify(allBooks, null, 4));
  } catch (error) {
    return res.status(500).json({ message: "Error fetching books", error: error.message });
  }
});

// Livre par ISBN — promesse (.then/.catch) + Axios
public_users.get('/async/isbn/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  axios
    .get(`${BASE_URL}/`)
    .then((response) => {
      const book = response.data[isbn];
      if (book) {
        return res.status(200).send(JSON.stringify(book, null, 4));
      }
      return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    })
    .catch((error) => {
      return res.status(500).json({ message: "Error fetching book by ISBN", error: error.message });
    });
});

// Livres par auteur — async/await + Axios
public_users.get('/async/author/:author', async (req, res) => {
  const author = req.params.author;
  try {
    const response = await axios.get(`${BASE_URL}/`);
    const allBooks = response.data;
    const booksbyauthor = Object.keys(allBooks)
      .filter((isbn) => allBooks[isbn].author.toLowerCase() === author.toLowerCase())
      .map((isbn) => ({ isbn, title: allBooks[isbn].title, reviews: allBooks[isbn].reviews }));
    if (booksbyauthor.length > 0) {
      return res.status(200).send(JSON.stringify({ booksbyauthor }, null, 4));
    }
    return res.status(404).json({ message: `No books found for author ${author}` });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching books by author", error: error.message });
  }
});

// Livres par titre — async/await + Axios
public_users.get('/async/title/:title', async (req, res) => {
  const title = req.params.title;
  try {
    const response = await axios.get(`${BASE_URL}/`);
    const allBooks = response.data;
    const booksbytitle = Object.keys(allBooks)
      .filter((isbn) => allBooks[isbn].title.toLowerCase() === title.toLowerCase())
      .map((isbn) => ({ isbn, author: allBooks[isbn].author, reviews: allBooks[isbn].reviews }));
    if (booksbytitle.length > 0) {
      return res.status(200).send(JSON.stringify({ booksbytitle }, null, 4));
    }
    return res.status(404).json({ message: `No books found with title ${title}` });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching books by title", error: error.message });
  }
});

module.exports.general = public_users;
