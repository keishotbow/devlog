# Node.jsって何？

- サーバまで自分で作れる。サーバサイドもクライアントサイドもいける
- html, cssはクライアントサイド
- Xの例、ホームやフォロー中など、見えてる部分を作るもの
- サーバ側も作れる。jsを使ったサーバサイドの設計手法。クライアントも作れる
- JSを学べばクライアントもサーバも作れる
- LINEなど、リアルタイムのwebアプリを作れる。非同期だから。

# package.json



# npm

- npm init -yでpackage.jsonができる
- パッケージの依存関係やモジュール管理ができる


# node js ドキュメント

- 不明点があればドキュメント見たら良い

# 補足

- GETかPOSTかをreq.methodで判別可能だが、ExpressというFWを使って開発するのが一般的

# リアルタイムアプリ

- メッセージのやり取りができる（ラインみたいな）
- Socketというライブラリを使う
- npm install express
- npm install socket.io

# publicというフォルダを作ることの理由

- webアプリはサーバ側で生成するAPIなどの部分と、そのままユーザに配布する部分（画像やCSS）などの２種類がある。
- そのまま配布する部分を置く場所としてpublicフォルダを作っておくと管理が楽
- 例：index.html, style.css, script.js

この一行を書くと、publicフォルダを自動的にWebで公開してくれる。
例えば、public/index.htmlがあれば、
http://localhost:8080/index.htmlにアクセスすると表示される
app.use(express.static('public'));

必ずしもpublicじゃなくてよいが、世界中のサンプルコードではよくpublicが使われるので、慣習にはとりあえず従っておくのがベター


# io.on, socket.on

- io.on("connection", callback)
サーバ全体で接続を監視
新しいクライアントごとにsocketを渡して監視
サーバの入り口（新しい人が入ってきたか監視）

- socket.on("eventname", callback)
ここのクライアントから送られてくるイベントを監視
そのクライアント専用のやり取り
個別の客（その人との会話を監視）

# io.emit, socket.emit

- io.emit

サーバから全てのクライアントへ送信
全員に送りたい場合に使用する
特定の部屋やグループに送りたい場合
io.to("room名").emit("event名", データ)とする

- socket.emit

現在の接続（socket）に対してだけ送信
サーバとクライアント双方への送信で使う
emitはどちらからでも使える「イベントを送るメソッド」
送信先の範囲によってioかsocketを使い分ける


```server.js
io.on("connection", (socket) => {
  console.log("クライアントが接続しました");

  // そのクライアントにだけメッセージ
  socket.emit("welcome", "ようこそ！");

  // 全員にメッセージ
  io.emit("broadcast", "新しいクライアントが参加しました");
});
```

```client.js
// サーバーへイベントを送信
socket.emit("chat message", "こんにちは！");

// サーバーからの受信
socket.on("welcome", (msg) => {
  console.log("サーバーから:", msg);
});
```