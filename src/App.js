import React, { useRef, useState } from "react";
import "./App.css";

import firebase from "firebase/compat/app"; //importing firebase sdk
import "firebase/compat/firestore"; //importing firestore for our database
import "firebase/compat/auth"; //importing auth for our authentication
import "firebase/compat/analytics";

import { useAuthState } from "react-firebase-hooks/auth"; //importing hooks for authentication
import { useCollectionData } from "react-firebase-hooks/firestore"; //importing hooks for firestore

firebase.initializeApp({                             //use firebase.initializeApp() to identify the project
  apiKey: "AIzaSyCWitTSbRAXFpLDtxFG815dwfXyIjiQH1M",  //javascipt object code that identifies this project given by firebase
  authDomain: "chatroom101-7a1cd.firebaseapp.com",
  projectId: "chatroom101-7a1cd",
  storageBucket: "chatroom101-7a1cd.appspot.com",
  messagingSenderId: "56738612871",
  appId: "1:56738612871:web:0e0b6c89921852434d9a22",
});

const authInstance = firebase.auth(); //reference to auth and firestore sdks as Global instances
const firestoreInstance = firebase.firestore();
const analyticsInstance = firebase.analytics();

function App() {
  const [user] = useAuthState(authInstance); //useAuthState() hook to know if user is signed in or not.If the user is signed in this will return the user object with userid,email and other info else it will return null

  return (
    <div className="App">
      <header>
        <h1>Chatroom101</h1>
        <SignOutButton />
      </header>

      <section>{user ? <ChatRoom /> : <SignIn />}</section> {/* if user is signed in then show ChatRoom else show SignIn. This here uses the user object returned from the useAuthstate hook*/}
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider(); //creating a new instance of GoogleAuthProvider class from firebase.auth
    authInstance.signInWithPopup(provider); //calling signInWithPopup() method on authInstance and passing the provider object as argument
  };

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>  {/* when you click the button it will run signInWithGoogle function */}
        Sign in with Google
      </button>
      <p>
        Welcome to the chatroom101. Please sign in with your Google account to continue.
      </p>
    </>
  );
}

function SignOutButton() {
  return (
    authInstance.currentUser && ( //checks if user is signed in or not, if signed in then show the sign out button
      <button className="sign-out" onClick={() => authInstance.signOut()}>
        Sign Out
      </button>
    )
  );
}

function ChatRoom() {
  const dummyRef = useRef();
  const messagesCollection = firestoreInstance.collection("messages"); //in firestore we have a collection of messages.When a user adds a new message to the chat it creates a document in this collection with a timestamp and a userID.Here in ur code we are creating a reference to this point in our database by xalling firestoreInstance.collection("messages")
  const query = messagesCollection.orderBy("createdAt").limit(25); //we are creating a query to get the last 25 messages from the messages collection and order them by the time they were created

  const [messagesData] = useCollectionData(query, { idField: "id" }); //useCollectionData() hook to listen to data in a firestore collection. It returns an array of objects with the data from the collection. Here we are passing the query and an object with idField property set to "id" as arguments. This will return an array of objects with the data from the collection and each object will have an id property

  const [formValue, setFormValue] = useState(""); 

  const sendMessage = async (e) => {
    e.preventDefault();

    const { uid, photoURL } = authInstance.currentUser;

    await messagesCollection.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
    });

    setFormValue("");
    dummyRef.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <main>
        {messagesData &&
          messagesData.map((msg) => <ChatMessage key={msg.id} message={msg} />)} 

        <span ref={dummyRef}></span>
      </main>

      <form onSubmit={sendMessage}>  {/*We use a form to send the messages.when the form is submitted it will run sendMessage function which will add the message to the firestore database*/}
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="say something nice"
        />

        <button type="submit" disabled={!formValue}>
          Send
        </button>
      </form>
    </>
  );
}

function ChatMessage(props) {  //this component will be used to display each message in the chat. This is used because when we send chat messages we want to distinguish between messages sent by the user and messages sent by other users
  const { text, uid, photoURL } = props.message;

  const messageClass = uid === authInstance.currentUser.uid ? "sent" : "received"; //this is used to show different styles for sent and received messages.We do this by comparing the userid on the firestore document to the currently logged in user. if the message is sent by the current user then the messageClass will be "sent" else it will be "received". Conditional CSS

  return (
    <>
      <div className={`message ${messageClass}`}>
        <img
          src={
            photoURL || "https://api.adorable.io/avatars/23/abott@adorable.png"
          }
          alt="User Avatar"
        />
        <p>{text}</p>
      </div>
    </>
  );
}

export default App;
