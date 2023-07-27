const express = require("express");
const router = express.Router();
const { storageService } = require("./storageService");

router.get("/store/:key/:value", (req, res) => {
  const { key, value } = req.params;
  storageService.toLocalStorage(key, value);
  res.send("Stored successfully");
});

router.get("/retrieve/:key", (req, res) => {
  const { key } = req.params;
  const storedValue = storageService.fromLocalStorage(key);
  res.send(storedValue);
});

router.get("/remove/:key", (req, res) => {
  const { key } = req.params;
  storageService.removeFromLocalStorage(key);
  res.send("Removed successfully");
});

module.exports = router;
