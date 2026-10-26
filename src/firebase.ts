import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAeYlsIMZQ3jRL1OUWxR51yBVnoRPu1Ybo",
  authDomain: "dimah-pvt-ltd.firebaseapp.com",
  projectId: "dimah-pvt-ltd",
  storageBucket: "dimah-pvt-ltd.firebasestorage.app",
  messagingSenderId: "1050685778163",
  appId: "1:1050685778163:web:7e66db3b1b355f43ffaf86",
  measurementId: "G-5TLSNL7TC0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, analytics };
