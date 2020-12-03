const functions = require("firebase-functions");
const app = require("express")();
const { getAllScreams, postOneScream } = require("./handlers/screams");
const { signUp, login, uploadImage } = require("./handlers/user");
const FBAuth = require("./util/fbAuth");

//! SCREAM ROUTES
//Get all posts - scream route
app.get("/screams", getAllScreams);
//Create a post
app.post("/scream", FBAuth, postOneScream);

//! USER ROUTES
//Singup Route
app.post("/signup", signUp);
//Login Route
app.post("/login", login);
//Image Upload
app.post("/user/image", FBAuth, uploadImage);

// Exporting express request, it should looks like that https://baseurl.com/api/${OUR_REQUESTS}
exports.api = functions.region("europe-west1").https.onRequest(app);
