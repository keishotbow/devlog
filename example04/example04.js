// Node.jsのCommonJSでモジュールを読み込む
// I/F' require(moduleName: string) -> any
// 返り値はモジュールのエクスポート。Expressコンストラクタ関数
const express = require("express");

// Node標準のHTTPモジュール（HTTPサーバ生成に使う）
const http = require("http");

// パス操作のユーティリティ（OS差異を吸収）。joinを使う。
const path = require("path");

// Expressアプリ本体を生成。ミドルウェア登録やルーティングなどを行うオブジェクト
const app = express()

// NodeのHTTPサーヴァを作成。Expressアプリをリクエストハンドラとして渡す
const server = http.createServer(app);

// Socket.IOサーバをHTTPサーバに紐づけて生成
// WebSocket/長輪講ポーリング等のTranspotを抽象化
const io = require("socket.io")(server);

// app.get("/", (req, res) => {
//     // res.send("Hello World");
//     res.sendFile(__dirname + "/index.html")
// });

// 静的ファイルを配信するミドルウェアを登録
// __dirnameは現在ファイルの絶対パス
// path.join()でOSに合わせたパス文字列を返す
// console.log(path.join(__dirname, "index.html"));
// Node.jsだけだとindex.htmlやstyle.css, main.jsといったフロントエンド用ファイルをそのまま配信する仕組みがない
// Expressにはexpressという便利な仕組みがあり、これを使うと、指定したフォルダ内のファイルを自動的に公開できる
// ここではpublicフォルダの中をそのまま公開してもいいよという宣言
// HTML/CSS/JS/画像など、ユーザのブラウザに直接送るファイルを置く場所
// サーバ側のロジック（APIなど）とクライアント側のファイルを整理して分けられる。
app.use(express.static(path.join(__dirname, "public")));

// クライアントからの接続確立時に一回よばれるイベントを登録
// サーバ側で新しい接続（クライアントがサーバに接続したとき）を監視するイベントリスナー
// 一度だけ定義しておけば、接続が発生したときにコールバック関数が呼ばれる
// ここでsocketが渡される。これは接続してきたクライアントとの専用通信チャンネルを表す
io.on("connection", (socket) => {
    // デフォルトのユーザ名を乱数で生成（[0, 1)の浮動小数を1000倍し、小数点切り捨て）
    let username = "User_" + Math.floor(Math.random() * 1000);
    // コンソールにユーザ名を表示
    console.log(`${username} joined!`);

    // ユーザ名の設定イベント
    // クライアントから"set username"イベント受信時のハンドラ
    // 特定のクライアント（=socket）から送られてくるカスタムイベントを受け取るためのリスナー
    socket.on("set username", (name) => {
        // falsyなら規定名を維持
        // 左の値がtruthyならnameを返し、そうでないならusernameを返す
        // nameが存在していて、truthyならnameを返す
        // nameが空文字、null, undefined, 0, falseのようなfalsyならusernameを返す
        // デフォルト値を設定するためによく使われる
        username = name || username;

        // 全接続クライアントへイベントをブロードキャスト
        io.emit("chat message", {
            user: "System",
            msg: `${username} joined the chat`,
            // "YYYY-MM-DDTHH:mm:ss.sssZ" 形式の文字列
            time: new Date().toISOString(),
        });
    });

    // メッセージ受信イベント
    // クライアントからのチャット本文を受信
    socket.on("chat message", (msg) => {
        console.log("message: " + msg);

        // 受け取ったメッセージを全員に配信（いわゆるエコーバック/ブロードキャスト）
        io.emit("chat message", {
            user: username,
            msg: msg,
            time: new Date().toISOString(),
        });
    });

    // 切断時イベント
    // 接続が切れたときに発火
    socket.on("disconnect", (reason) => {
        console.log(`A user disconnected. (reason=${reason})`);
        io.emit("chat message", {
            user: "System",
            msg: `${username} left the chat`,
            time: new Date().toISOString(),
        });
    });
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`listening on http://localhost:${PORT}`);
});