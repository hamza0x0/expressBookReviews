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

// ---------- Tâche 11 : mêmes requêtes avec Axios (async/await et promesses) ----------

// Tous les livres — async/await + Axios
const fetchAllBooksAxios = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching all books: ${error.message}`);
  }
};

// Livre par ISBN — promesse + Axios
const fetchBookByISBNAxios = (isbn) => {
  return axios
    .get(`${BASE_URL}/isbn/${isbn}`)
    .then((response) => response.data)
    .catch((error) => {
      throw new Error(`Error fetching book ${isbn}: ${error.message}`);
    });
};

// Livres par auteur — async/await + Axios
const fetchBooksByAuthorAxios = async (author) => {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching books by ${author}: ${error.message}`);
  }
};

// Livres par titre — async/await + Axios
const fetchBooksByTitleAxios = async (title) => {
  try {
    const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching books titled ${title}: ${error.message}`);
  }
};

module.exports.general = public_users;
module.exports.fetchAllBooksAxios = fetchAllBooksAxios;
module.exports.fetchBookByISBNAxios = fetchBookByISBNAxios;
module.exports.fetchBooksByAuthorAxios = fetchBooksByAuthorAxios;
module.exports.fetchBooksByTitleAxios = fetchBooksByTitleAxios;
