
# インストール
$ node -v
v22.19.0

# Webサーバの構築


# 実行環境
プロセッサ：
メモリ：
OS：
node.js：
npm：v22.19.0
yarn：

# モジュール
- http

# npmとは
- Node.js公式のパッケージマネージャー
- Node.jsをインストールすると一緒に入る
- 世界最大のオープンソースライブラリの公開場所（npm registry）を利用

# yarnとは
- Facebook（Meta）が2016年に開発したパッケージマネージャー
- 当時のnpmは「遅い」「依存関係が壊れやすい」と言われていた
- それを解決するために登場
- npmより速く・確実に依存関係を管理できるのが強み

# npmインストール
$ npm install http
added 1 package in 1s

$ npm ls
devlog@ C:\Users\Owner\Documents\git\devlog
└── http@0.0.1-security


main.js
```
console.log("Hello World");
```

## JS Hello world
$ node main.js 
Hello World

## サーバをリッスン状態に設定
$ node main.js 
Server listen on port 8080


停止はターミナルでctrl+c
