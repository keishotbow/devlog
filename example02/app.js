const express = require("express")
const app = express();

// ルートにアクセスされたときに、Hello Worldを返す
app.get("/", (req, res) => {
    res.send("Hello World!");
});

// サーバを起動（http://localhost:8080でアクセス可能）
app.listen(8080, () => {
    console.log("Server running at http://localhost:8080/");
});