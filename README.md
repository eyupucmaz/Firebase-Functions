# Firebase-Functions

## 📝 Config File

- _In the utils folder you should add `config.js` file and it should look likes that._

```
module.exports = {
	apiKey: "YOUR_API_KEY",
	authDomain: "YOUR_DOMAIN",
	databaseURL: "YOUR_URL",
	projectId: "YOUR_ID",
	storageBucket: "YOUR_BUCKET",
	messagingSenderId: "YOUR_SENDER_ID",
	appId: "YOUR_APP_ID",
	measurementId: "YOUR_MEA_ID",
};
```

## 🔗 Deployment

To deploy the functions run this command. (You Should Authorized the firebase CLI)

```
firebase deploy
```

Also you can run the functions localy. I'm using this while developing because its faster than the deployment

```
firebase serve
```