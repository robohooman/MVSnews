import { initializeApp } from "firebase/app";
import {getDatabase} from 'firebase/database'
import {getStorage} from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyCc5ASHRE6cAY8KKBE44UTJaxGClq-ShqI",
  authDomain: "mvs-news.firebaseapp.com",
  databaseURL: "https://mvs-news-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mvs-news",
  storageBucket: "mvs-news.appspot.com",
  messagingSenderId: "670401932144",
  appId: "1:670401932144:web:c84a3b1e6c4b24ec967db5",
  measurementId: "G-Q3MTFSB4HZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Firebase app:', app);
const database = getDatabase(app);
console.log('Firebase database:', database);
const storage = getStorage(app);
console.log('Firebase storage:', storage);

export {database, storage}


