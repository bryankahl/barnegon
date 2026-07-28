import admin from "firebase-admin";
import { config } from "./src/config.js";

// Now we use the validated config instead of process.env
const serviceAccount = JSON.parse(config.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

export { admin, db };
