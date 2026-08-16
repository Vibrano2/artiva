import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDZcq5lOksvPAoG5NM1Almxt97kc4W_BIQ",
  authDomain: "artiva-f24a8.firebaseapp.com",
  projectId: "artiva-f24a8",
  storageBucket: "artiva-f24a8.firebasestorage.app",
  messagingSenderId: "982788741499",
  appId: "1:982788741499:web:eb198aafb9f6f43adb45de"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "default");

async function test() {
  try {
    console.log("Fetching users...");
    const snapshot = await getDocs(collection(db, "users"));
    console.log("Success! Found", snapshot.size, "users.");
  } catch (error) {
    console.error("Firestore Error:", error);
  }
}

test();
