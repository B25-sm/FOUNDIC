import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDrPVBvfussk6lWmqV6NwvkCA9dAU01Cb8",
  authDomain: "foundic-77bc6.firebaseapp.com",
  projectId: "foundic-77bc6",
  storageBucket: "foundic-77bc6.appspot.com",
  messagingSenderId: "89159289678",
  appId: "1:89159289678:web:28f49c184c6976d49aac1f",
  measurementId: "G-H8H6W1BGRY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app; 