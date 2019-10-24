const express = require("express"); //same as importing
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
var knex = require('knex');
const Clarifai = require('clarifai');
const register = require('./controllers/register');

const db = knex({ //check out website's instructions. everywhere you see db from now on, we're prob using knex syntax.
  client: 'pg',
  connection: {
    host : '127.0.0.1', //this means localhost
    user : 'leonmalisov', //owner of DB (check in terminal using \d). Techincally there's actually no user rn though?
    password : '',
    database : 'smart-brain'
  }
}); //this is all bascially the same thing as we enter when starting up psequel

// db.select("*").from('users').then(data => {
// 	console.log(data)
// });


const app = express();

app.use(bodyParser.json()); //comes after the app variable ahs been created

app.use(cors());

app.get("/", (req, res) => {
	res.send(database.users); //just a check
})

//THE SIGNIN:
app.post("/signin", (req, res) => { 
	db.select('email', 'hash').from('login') //this doesn't need to be a transaction because we're just checking, we're not modifying any database items.
		.where('email', '=', req.body.email)
		.then(data => {
			const isValid = bcrypt.compareSync(req.body.password, data[0].hash) //checking that the password is right.
			//console.log(isValid)
			if (isValid) {
				return db.select('*').from('users') //always wanna make sure you're returning this so that DB knows
					.where('email', '=', req.body.email)
					.then(user => {
						// console.log(user);
						// console.log(user[0]);
						// res.json("HIIIII ")
						res.json(user[0])


					})
					.catch(err => res.status(400).json("unable to get user"))
			} else {
				res.status(400).json('wrong credentials')	
			}
	
		})
		.catch(err => res.status(400).json("WRONG CREDENTIALS"))
	// if (req.body.email === database.users[0].email && 
	// 	req.body.password === database.users[0].password) {
	// 	res.json(database.users[0])
	// } else {
	// 	res.status(400).json('error logging in');
	// }
	// //res.json("signingin")
})

// 													dependency injection
app.post("/register", (req, res) => { register.handleRegister(req, res, db, bcrypt) })// other way to phrase this (286. 22:00)
// 	const {email, name, password} = req.body //destructuring
// 	const hash = bcrypt.hashSync(password);

// 		// bcrypt.compareSync("bacon", hash); // true
// 		// bcrypt.compareSync("veggies", hash); // false
// 	db.transaction(trx => {   // knex method. trx parameter can now take over db. in following lines
// 		trx.insert({ // 1. inserted hash, email into login
// 			hash: hash, //the has we just received from bcrypt
// 			email: email //the email we just got from req.body
// 		})
// 		.into('login')
// 		.returning('email') // 2. the db returned the email if just got
// 		.then(loginEmail => { // 3. we use the loginEmail to also return another trx transaction to insert into users//we first update the login table, get the loginEmail, and in order to ensure that both trx.insert and trx('users') insert are part of the transaction, 
// 			return trx('users') //used to be db('users') before wrapping in transaction
// 				.returning('*') //return all the columns
// 				.insert({ //inserting following into the database (users)
// 					email: loginEmail[0], //we want an array returned in our db, not an object. (eg this makes sure you don't get brackets around your value in the DB)
// 					name: name,
// 					joined: new Date()
// 				})
// 				.then(user => {
// 					res.json(user[0]); //returning user object
// 			})
// 		})
// 		 .then(trx.commit) //Have to commit to make sure above gets added. if all above operations pass, then send this transaction through
// 		.catch(trx.rollback) //if not all operations above pass. What actually is rollback though? 
// 	})
// 	.catch(err => res.status(400).json('unable to register')) //json(err))   //json(err) returns a more detailed error message
// })

//we don't actually have a profile page yet, but we'll work on it anyway. Here, we want a specific user ID.
//            with : we can enter anything in the subroute and get it through the req.params property
app.get("/profile/:id", (req, res) => {
	const { id } = req.params; //destructuring
	let found = false;
	db.select('*').from('users').where({    //.where({id}) <-- could also do this since in this case, property and value are the same
		id: id //id that we received in the params
	})
		.then(user => {
			console.log(user); //what's the difference between user and user[0] ??
			if (user.length) {
				res.json(user[0]);
			} else {
				res.status(400).json("Not Found")
			}


		})
		.catch(err => res.status(400).json("error getting user"))
	// if (!found) {
	// 	res.status(400).json("not found");
	// }
})

app.put("/image", (req, res) => {
	const { id } = req.body; //destructuring
	let found = false;
	db('users').where('id', '=', id) //where the id equals the id that we received in the body
  		.increment('entries', 1) //knex method: increment the value by 1
  		.returning('entries') //?? Gives you the latest figure maybe?
  		.then(entries => {
  			res.json(entries[0]); //[0] returns first array... ?
  		})
  		.catch(err => res.status(400).json('unable to get entry count'))
})
	// database.users.forEach(user => {
	// 	if (user.id === id) {
	// 		found = true;
	// 		user.entries++
	// 		return res.json(user.entries);
	// 	}
	// })
	// if (!found) {
	// res.status(400).json("image not found");
	// }


// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });

//which port to listen to,
app.listen(process.env.PORT || 3000, () => { //basically saying if we get a port from the environment, use that, otherwise, 3000
	console.log(`app is running on port ${process.env.PORT}`);
})


//---> res = this is working
// /signin --> POST = success or fail // anytime we're sending password, we want to hide it in the body over HTTPS.
// /register --> POST = user
// /profile/:userId --> GET = user   We want to get the user onto the homepage
// /image --> PUT --> user

//SECTION 23: building routes for our apps: signin and register. 
// vocab: endpoints

//express comes with built-in JSON method. res.json (instead of res.send) returns json string


//Ann wasn't added the first time we POSTed because we changed the root route to include
// database.users, which meant nodemon, aka the server, had to restart and start over.
// Every time we restart the server, everything gets run all over again, so the "database" 
//initiates with just the two users. This is why we need databases. 

//we don't use variable for info that we need to "persist", that is to last and be memorized by the system.
// databases on really good because they run on disk out there in the world and they're good at
// keeping information and not going down. So that users always get added and we don't lose information.

//can't set headers after they are sent: because we're looping through our database and
//instead of returning from the loop, we keep going. But once we find our user, we don't need to keep looping. (254. 3:30)






