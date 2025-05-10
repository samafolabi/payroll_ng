/*******************************/

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, createUserWithEmailAndPassword, signOut as signOut1 } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB1JMFUXvpmYSemtVeI-KnFs6bD5klJI-4",
  authDomain: "payroll-ng.firebaseapp.com",
  projectId: "payroll-ng",
  storageBucket: "payroll-ng.appspot.com",
  messagingSenderId: "720456822907",
  appId: "1:720456822907:web:a1d41f8de27d1663f032de",
  measurementId: "G-WMMM499XBZ",
  databaseURL: "https://payroll-ng-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const fbApp = initializeApp(firebaseConfig);
const fbAnalytics = getAnalytics(fbApp);

const auth1 = getAuth();
function signInFunc(email: string, password: string) {
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in 
      const user = userCredential.user;
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      alert(errorMessage);
    });
}

export const app = fbApp;
export const analytics = fbAnalytics;
export const auth = auth1;
export const signIn = signInFunc;
export const onAuth = onAuthStateChanged;
export const signOut = signOut1;
export const signUp = createUserWithEmailAndPassword;


export const setCookie = function(cname : string, cvalue : string, exdays : number) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  let expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

export const getCookie = function(cname : string) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}



/*******************************/