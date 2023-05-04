const express = require("express");
const server = express();

server.all("/", (req, res) => {
  console.log("Bot is Running");
});

function keepAlive() {
  server.listen(3000, () => {
    console.log("Server is ready.");
  });
}

module.exports = keepAlive;
