const express = require('express');
const router = express.Router();
const User = require('../models/Users');
const auth = require('../helpers/auth');
const { admin } = require('../helpers/admin');
const { clearCache } = require('../helpers/customFuncs');


router.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "https://www.edustack.uz"); // update to match the domain you will make the request from
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-token");
	res.header("Access-Control-Expose-Headers", "x-token" );
	res.header('Access-Control-Allow-Methods', 'POST, GET, PATCH, DELETE');
	next();
});


router.get('/all', [auth, admin], async (req, res) => {
	try {
		const users = await User.find().select("-password").sort({ registeredDate: -1 })
			.lean().cache('user_all');
		res.status(200).json(users);
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
});

router.get('/:id', auth, async (req, res) => {
	try {
		const user = await User.findById(req.params.id).select("-password -cartList -wishList")
			.lean().cache(`user_${req.params.id}`);
		res.status(200).json(user);
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
});

router.post('/notification', auth, async (req, res) => {
	try {
		const { sender, receiver, message } = req.body;
		await User.findByIdAndUpdate(
			receiver,
			{
				$push: {
					notification: { sender, message, date: new Date() }
				}
			}
		);
		res.status(200).json({ success: true }); 
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
	clearCache([`user_${req.body.receiver}`]);
});


module.exports = router;