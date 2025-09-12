import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// サービスアカウントキーのパスを環境変数から取得
const serviceAccountKeyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;

if (!serviceAccountKeyPath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY_PATH is not set in .env.local');
}

// プロジェクトのルートからの絶対パスを解決
const absolutePath = path.resolve(process.cwd(), serviceAccountKeyPath);

const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

// すでに初期化されている場合はスキップ
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export const verifyIdToken = (token: string) => {
    return admin.auth().verifyIdToken(token);
};