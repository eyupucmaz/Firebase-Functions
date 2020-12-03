const { db, admin } = require("../util/admin");
const firebase = require("firebase");
const config = require("../util/config");
const { validateSignUpData, validateLoginData } = require("../util/validators");

firebase.initializeApp(config);

exports.signUp = (req, res) => {
	const newUser = {
		email: req.body.email,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword,
		handle: req.body.handle,
	};

	const { valid, errors } = validateSignUpData(newUser);
	if (!valid) return res.status(400).json(errors);

	const noImg = "no-image.png";

	//* if we do not have any errors
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
				imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
				userId,
			};
			db.doc(`/users/${newUser.handle}`).set(userCredentials);
		})
		.then(() => {
			return res.status(201).json({ token });
		})
		.catch((err) => {
			// console.error(err);
			if (err.code === "auth/email-already-in-use") {
				return res.status(400).json({ email: "Email is already in use" });
			} else {
				return res.status(500).json({ error: err.code });
			}
		});
};

exports.login = (req, res) => {
	const user = {
		email: req.body.email,
		password: req.body.password,
	};

	//Data Validation
	const { valid, errors } = validateLoginData(user);
	if (!valid) return res.status(400).json(errors);

	//! if we have any errors

	//* if we do not have any errors
	firebase
		.auth()
		.signInWithEmailAndPassword(user.email, user.password)
		.then((data) => {
			return data.user.getIdToken();
		})
		.then((token) => {
			return res.json({ token });
		})
		.catch((err) => {
			// console.error(err);
			if (err.code === "auth/wrong-password") {
				return res
					.status(403)
					.json({ general: "Wrong credentials, please try again" });
			} else {
				return res.status(500).json({ error: err.code });
			}
		});
};

exports.uploadImage = (req, res) => {
	const BusBoy = require("busboy");
	const path = require("path");
	const os = require("os");
	const fs = require("fs");

	const busboy = new BusBoy({ headers: req.headers });

	let imageFileName;
	let imageToBeUploded = {};

	busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
		// console.log(fieldname);
		// console.log(filename);
		// console.log(mimetype);

		if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
			return res
				.status(400)
				.json({ error: `Wrong file type, just upload 'png' or 'jpeg' file` });
		}

		//my.image.png
		const imageExtension = filename.split(".")[filename.split(".").length - 1];
		imageFileName = `${Math.round(
			Math.random() * 1000000000000
		)}.${imageExtension}`;
		const filepath = path.join(os.tmpdir(), imageFileName);
		imageToBeUploded = { filepath, mimetype };
		file.pipe(fs.createWriteStream(filepath));
	});
	busboy.on("finish", () => {
		admin
			.storage()
			.bucket()
			.upload(imageToBeUploded.filepath, {
				resumable: false,
				metadata: {
					contentType: imageToBeUploded.mimetype,
				},
			})
			.then(() => {
				const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
				return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
			})
			.then(() => {
				return res.json({ message: "Image uploded successfully" });
			})
			.catch((err) => {
				// console.error(err);
				return res.status(500).json({ error: err.code });
			});
	});
	busboy.end(req.rawBody);
};
