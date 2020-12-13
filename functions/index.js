const functions = require("firebase-functions");
const app = require("express")();
const {
	getAllScreams,
	postOneScream,
	getScream,
	deleteScream,
	addComment,
	likeScream,
	unlikeScream,
} = require("./handlers/screams");
const {
	signUp,
	login,
	uploadImage,
	addUserDetails,
	getUserDetails,
} = require("./handlers/users");
const FBAuth = require("./util/fbAuth");

//! SCREAM ROUTES
//Get all posts - scream route
app.get("/screams", getAllScreams);
//Create a post
app.post("/scream", FBAuth, postOneScream);
//Get scream
app.get("/scream/:screamId", getScream);
//Delete scream
app.delete("/scream/:screamId",FBAuth, deleteScream);
// TODO: like scream
app.get("/scream/:screamId/like", FBAuth, likeScream);
// TODO: unlike scream
app.get("/scream/:screamId/unlike", FBAuth, unlikeScream);
//Comment scream
app.post("/scream/:screamId/comment", FBAuth, addComment);

//! USER ROUTES
//Singup Route
app.post("/signup", signUp);
//Login Route
app.post("/login", login);
//Image Upload
app.post("/user/image", FBAuth, uploadImage);
//add user details
app.post("/user", FBAuth, addUserDetails);
//get user details
app.get("/user", FBAuth, getUserDetails);

// Exporting express request, it should looks like that https://baseurl.com/api/${OUR_REQUESTS}
exports.api = functions.region("europe-west1").https.onRequest(app);
