// やっていること
// - Node.jsに標準で入っているhttpモジュールを使って
// - ポート8080でリクエストを待ち受け
// - アクセスが来たらHTMLを返すサーバを作るコード

// httpサーバ用の機能を読み込み
const http = require("http");
// HTMLを処理するためのモジュールを読み込み
const html = require("fs").readFileSync("example03/index.html");

// サーバを作成する関数を呼ぶ
// req: リクエスト情報（URLやヘッダ）
// res: レスポンス情報：ステータスや本文を設定
const server = http.createServer((req, res) => {
    // ステータスコードとヘッダを送る
    // 200はOK, content-Typeは返すデータの種類。ここではHTMLをUTF-8で返す指定(文字化け防止のため、つづり間違わないように)
    res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});

    // 本文（HTMLの中身）を送る。Writeは何回呼んでもOK（分割送信）
    // res.write("Hello world");
    res.write(html);

    // レスポンスの終了を宣言する
    // これを呼ばないと、ブラウザ側は「まだ続きが来る？」と待ち続ける
    // res.end("<h1>Hello World</h1>")のように、最後の一括送信も可能
    res.end();
});

// 待ち受け番号。Webサーバはこの番号を使って接続を受ける
const port = 8080;

// サーバ起動。この行以降、リクエストを待ち受ける
server.listen(port, () => {
    // 起動メッセージを表示
    console.log("Server listening on port http://localhost:${port}");
});
