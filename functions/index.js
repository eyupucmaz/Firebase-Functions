const functions = require("firebase-functions");
const admin = require("firebase-admin");
const app = require("express")();
admin.initializeApp();

const firebaseConfig = {
	apiKey: "AIzaSyByVLWQ8m7uNuuV1OfPAdv2WVYlTlSO0gk",
	authDomain: "socialapp-7ddbf.firebaseapp.com",
	databaseURL: "https://socialapp-7ddbf.firebaseio.com",
	projectId: "socialapp-7ddbf",
	storageBucket: "socialapp-7ddbf.appspot.com",
	messagingSenderId: "338619728775",
	appId: "1:338619728775:web:e97546a1cbbac1e4c9c922",
	measurementId: "G-K5YZQ2FZKN",
};

const firebase = require("firebase");
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

app.get("/screams", (req, res) => {
	db.collection("screams")
		.orderBy("createdAt", "desc")
		.get()
		.then((data) => {
			let screams = [];
			data.forEach((doc) => {
				screams.push({
					screamId: doc.id,
					body: doc.data().body,
					userHandle: doc.data().userHandle,
					createdAt: doc.data().createdAt,
				});
			});
			return res.json(screams);
		})
		.catch((err) => console.error(err));
});

app.post("/scream", (req, res) => {
	//!Dont need that cheking in express
	// if (req.method !== "POST") {
	// 	return res.status(400).json({ error: "Method not allowed" });
	// }

	const newScream = {
		body: req.body.body,
		userHandle: req.body.userHandle,
		createdAt: new Date().toISOString(),
	};

	db.collection("screams")
		.add(newScream)
		.then((doc) => {
			res.json({ message: `document ${doc.id} created successfully` });
		})
		.catch((err) => {
			res.status(500).json({ error: "something went wrong" });
			console.error(err);
		});
});

//Singup Route

app.post("/signup", (req, res) => {
	const newUser = {
		email: req.body.email,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword,
		handle: req.body.handle,
	};

	// TODO: validate data
	let token, userId;
	db.doc(`/users/${newUser.handle}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				return res.status(400).json({ handle: "this handle is already taken" });
			} else {
				return firebase
					.auth()
					.createUserWithEmailAndPassword(newUser.email, newUser.password);
			}
		})
		.then((data) => {
			userId = data.user.uid;
			return data.user.getIdToken();
		})
		.then((userToken) => {
			token = userToken;
			const userCredentials = {
				handle: newUser.handle,
				email: newUser.email,
				createdAt: new Date().toISOString(),
				userId,
			};
			db.doc(`/users/${newUser.handle}`).set(userCredentials);
		})
		.then(() => {
			return res.status(201).json({ token });
		})
		.catch((err) => {
			console.error(err);
			if (err.code === "auth/email-already-in-use") {
				return res.status(400).json({ email: "Email is already in use" });
			} else {
				return res.status(500).json({ error: err.code });
			}
		});
});

// https://baseurl.com/api/
exports.api = functions.region("europe-west1").https.onRequest(app);
