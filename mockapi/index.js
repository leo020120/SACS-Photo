const express = require("express");

const app = express();

app.listen(3000, () => {
  console.log("Listening on 3000");
});

app.get("/users", (request, response) => {
  response.json([
    { id: 546, username: "John" },
    { id: 894, username: "Mary" },
    { id: 326, username: "Jane" },
  ]);
});

app.delete("/users", (request, response) => {
  response.json({ result: "success" });
});
