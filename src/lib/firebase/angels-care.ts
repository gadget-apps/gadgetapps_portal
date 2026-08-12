import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/** Config WEB atual do projeto app-angelscare (app: GadgetApps BKF Portal). */
const angelsCareFirebaseConfig = {
  apiKey: "AIzaSyBHGLfKBSBpTQXOu9gEXOplhbJDLcJQ6a4",
  authDomain: "app-angelscare.firebaseapp.com",
  projectId: "app-angelscare",
  storageBucket: "app-angelscare.firebasestorage.app",
  messagingSenderId: "47736989018",
  appId: "1:47736989018:web:8362e506f68d4a57327f63",
  measurementId: "G-KXR9K9DFCL",
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

export function getAngelsCareApp(): FirebaseApp {
  if (!app) {
    app = getApps().length
      ? getApps()[0]!
      : initializeApp(angelsCareFirebaseConfig);
  }
  return app;
}

export function getAngelsCareAuth(): Auth {
  if (!auth) auth = getAuth(getAngelsCareApp());
  return auth;
}

export function getAngelsCareDb(): Firestore {
  if (!db) db = getFirestore(getAngelsCareApp());
  return db;
}
