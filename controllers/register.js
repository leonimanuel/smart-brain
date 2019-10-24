const handleRegister = (req, res, db, bcrypt) => {
	const {name, email, password} = req.body //destructuring
	if (!name || !email || !password) //if any of these are empty, this will be true
		return res.status(400).json('incorrect form submission') //remember to say return, otherwise next part still gets run
	const hash = bcrypt.hashSync(password);

		// bcrypt.compareSync("bacon", hash); // true
		// bcrypt.compareSync("veggies", hash); // false
		
	db.transaction(trx => {   // knex method. trx parameter can now take over db. in following lines
		trx.insert({ // 1. inserted hash, email into login
			hash: hash, //the has we just received from bcrypt
			email: email //the email we just got from req.body
		})
		.into('login')
		.returning('email') // 2. the db returned the email if just got
		.then(loginEmail => { // 3. we use the loginEmail to also return another trx transaction to insert into users//we first update the login table, get the loginEmail, and in order to ensure that both trx.insert and trx('users') insert are part of the transaction, 
			return trx('users') //used to be db('users') before wrapping in transaction
				.returning('*') //return all the columns
				.insert({ //inserting following into the database (users)
					email: loginEmail[0], //we want an array returned in our db, not an object. (eg this makes sure you don't get brackets around your value in the DB)
					name: name,
					joined: new Date()
				})
				.then(user => {
					res.json(user[0]); //returning user object
			})
		})
		 .then(trx.commit) //Have to commit to make sure above gets added. if all above operations pass, then send this transaction through
		.catch(trx.rollback) //if not all operations above pass. What actually is rollback though? 
	})
	.catch(err => res.status(400).json('unable to register')) //json(err))   //json(err) returns a more detailed error message
}

module.exports = {
	handleRegister
}