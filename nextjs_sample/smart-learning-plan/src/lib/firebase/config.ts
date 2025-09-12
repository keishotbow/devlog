// src/lib/firebase/config.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Firebaseアプリを初期化
// console.log("apiKey:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
// console.log("apiKey:", firebaseConfig.apiKey);
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase Authenticationのインスタンスを取得
export const auth = getAuth(app);

// // src/lib/firebase/config.ts
// import { initializeApp, getApps } from "firebase/app";
// import { getAuth } from "firebase/auth";

// const firebaseConfig = {
//     apiKey: process.env.apiKey,
//     authDomain: process.env.authDomain,
//     projectId: process.env.projectId,
//     storageBucket: process.env.storageBucket,
//     messagingSenderId: process.env.messagingSenderId,
//     appId: process.env.appId
// };

// // Firebaseアプリを初期化
// const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// // Firebase Authenticationのインスタンスを取得
// export const auth = getAuth(app);