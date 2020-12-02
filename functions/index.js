const functions = require("firebase-functions");
const app = require("express")();
const { getAllScreams, postOneScream } = require("./handlers/screams");
const { signUp, login } = require("./handlers/user");
const FBAuth = require("./util/fbAuth");



//Get all posts - scream route
app.get("/screams", getAllScreams);
//Create a post
app.post("/scream", FBAuth, postOneScream);


//Singup Route
app.post("/signup", signUp);
//Login Route
app.post("/login", login);

// Exporting express request, it should looks like that https://baseurl.com/api/${OUR_REQUESTS}
exports.api = functions.region("europe-west1").https.onRequest(app);
