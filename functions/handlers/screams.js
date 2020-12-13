const { db } = require("../util/admin");

exports.getAllScreams = (req, res) => {
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
		.catch((err) => {
			return res.status(500).json({ error: err.code, message: err.message });
		});
};

exports.postOneScream = (req, res) => {
	//!Dont need that cheking in express
	// if (req.method !== "POST") {
	// 	return res.status(400).json({ error: "Method not allowed" });
	// }

	const newScream = {
		body: req.body.body,
		userHandle: req.user.handle,
		userImage: req.user.imageUrl,
		createdAt: new Date().toISOString(),
		likeCount: 0,
		commentCount: 0,
	};

	db.collection("screams")
		.add(newScream)
		.then((doc) => {
			const resScream = newScream;
			resScream.screamId = doc.id;
			res.json(resScream);
		})
		.catch((err) => {
			res.status(500).json({ error: "something went wrong" });
		});
};

exports.getScream = (req, res) => {
	let screamData = {};
	db.doc(`/screams/${req.params.screamId}`)
		.get()
		.then((doc) => {
			if (!doc.exists) {
				return res.status(404).json({ error: "Scream can not found" });
			}
			screamData = doc.data();
			screamData.screamId = doc.id;
			return db
				.collection("comments")
				.orderBy("createdAt", "desc")
				.where("screamId", "==", req.params.screamId)
				.get();
		})
		.then((data) => {
			screamData.comments = [];
			data.forEach((doc) => {
				screamData.comments.push(doc.data());
			});
			return res.json(screamData);
		})
		.catch((err) => {
			return res.status(500).json({ errors: err.code, message: err.message });
		});
};

exports.deleteScream = (req, res) => {
	let screamId = req.params.screamId;
	db.collection("screams")
		.doc(screamId)
		.get()
		.then((doc) => {
			if (!doc.exists) {
				return res.status(404).json({ message: "Scream can not found" });
			}
			if (doc.data().userHandle !== req.user.handle) {
				return res.status(403).json({ error: "Unauthorized" });
			} else {
				db.doc(`/screams/${screamId}`)
					.delete()
					.then(() => {
						return res.json({
							message: `${screamId} Document deleted succesfully.`,
						});
					})
					.catch((err) => {
						return res.status(500).json({ error: err.code });
					});
			}
		})
		.catch((err) => {
			return res.status(500).json({ error: err.code });
		});
};

exports.addComment = (req, res) => {
	if (req.body.body.trim() === "")
		return res.status(400).json({ error: "Must not be empty" });

	const newComment = {
		body: req.body.body,
		createdAt: new Date().toISOString(),
		screamId: req.params.screamId,
		userHandle: req.user.handle,
		userImage: req.user.imageUrl,
	};

	db.doc(`/screams/${req.params.screamId}`)
		.get()
		.then((doc) => {
			if (!doc.exists) {
				return res.status(404).json({ error: "Scream not found" });
			}
			return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
		})
		.then(() => {
			return db.collection("comments").add(newComment);
		})
		.then(() => {
			res.json(newComment);
		})
		.catch((err) => {
			return res.status(500).json({ error: err.code, message: err.message });
		});
};

exports.likeScream = (req, res) => {
	const likeDoc = db
		.collection("likes")
		.where("userHandle", "==", req.user.handle)
		.where("screamId", "==", req.params.screamId)
		.limit(1);

	const screamDoc = db.doc(`/screams/${req.params.screamId}`);
	let screamData;
	screamDoc
		.get()
		.then((doc) => {
			if (doc.exists) {
				screamData = doc.data();
				screamData.screamId = doc.id;
				return likeDoc.get();
			} else {
				return res.status(404).json({ error: "Scream does not exists." });
			}
		})
		.then((data) => {
			if (data.empty) {
				return db
					.collection("likes")
					.add({
						screamId: req.params.screamId,
						userHandle: req.user.handle,
					})
					.then(() => {
						screamData.likeCount++;
						return screamDoc.update({ likeCount: screamData.likeCount });
					})
					.then(() => {
						return res.json(screamData);
					});
			} else {
				return res.status(400).json({ error: "Scream already liked" });
			}
		})
		.catch((err) => {
			return res.status(500).json({ error: err.code, message: err.messsage });
		});
};

exports.unlikeScream = (req, res) => {
	const likeDoc = db
		.collection("likes")
		.where("userHandle", "==", req.user.handle)
		.where("screamId", "==", req.params.screamId)
		.limit(1);

	const screamDoc = db.doc(`/screams/${req.params.screamId}`);
	let screamData;
	screamDoc
		.get()
		.then((doc) => {
			if (doc.exists) {
				screamData = doc.data();
				screamData.screamId = doc.id;
				return likeDoc.get();
			} else {
				return res.status(404).json({ error: "Scream does not exists." });
			}
		})
		.then((data) => {
			if (data.empty) {
				return res.status(400).json({ error: "Scream already unliked" });
			} else {
				return db
					.doc(`/likes/${data.docs[0].id}`)
					.delete()
					.then(() => {
						screamData.likeCount--;
						return screamDoc.update({ likeCount: screamData.likeCount });
					})
					.then(() => {
						res.json(screamData);
					});
			}
		})
		.catch((err) => {
			return res.status(500).json({ error: err.code, message: err.messsage });
		});
};
