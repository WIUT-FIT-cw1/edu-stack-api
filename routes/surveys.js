const express = require('express');
const router = express.Router();

const User = require('../models/Users');
const Survey = require('../models/Surveys');
const auth = require('../helpers/auth');
const { admin, collaborator, creator } = require('../helpers/admin');
const { clearCache } = require('../helpers/customFuncs');


router.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "https://www.edustack.uz"); // update to match the domain you will make the request from
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-token");
	res.header("Access-Control-Allow-Methods", "GET, PATCH, DELETE, POST");
	next();
});


router.get('/', async (req, res) => {
	try {
		const surveys = await Survey.find().sort({ responceCount: 1 })
			.lean().cache('survey');
		res.status(200).json(surveys);
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
});

router.get('/:id', async (req, res) => {
	try {
		const survey = await Survey.findById(req.params.id)
			.lean().cache(`survey_${req.params.id}`);
		res.status(200).json(survey);
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
});

router.post('/', auth, async (req, res) => {
	try {
		const survey = new Survey({
			title: req.body.title,
			description: req.body.description,
			inputFields: req.body.inputFields,
			isPrivate: req.body.isPrivate,
			creator: {
				_id: req.user._id,
				fullName: `${req.user.firstName} ${req.user.lastName}`,
				avatar: req.user.avatar
			}
		});
		await survey.save();
		res.status(200).json({ success: true });
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
	clearCache(['survey']);
});

router.post('/answer/:id', [auth, creator], async (req, res) => {
	try {
		const survey = await Survey.findById(req.params.id).select("+answers +answeredUsers").lean();
		res.status(200).json(survey);
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
});

router.patch('/answer/:id', auth, async (req, res) => {
	try {
		const { answeredUsers } = await Survey.findById(req.params.id).select("_id +answeredUsers");

		if(answeredUsers.length > 0 && answeredUsers.includes(req.user._id)) {
			return res.status(400).json({ message: 'You have already answered.' });
		}

		await Survey.findByIdAndUpdate(req.params.id, {
			$push: {
				answers: req.body.answer,
				answeredUsers: req.user._id
			},
			$inc: {
				responceCount: 1
			}
		});
		res.status(200).json({ success: true });
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
	clearCache(['survey', `survey_${req.params.id}`]);
});

router.patch('/toggle/:id', [auth, creator], async (req, res) => {
	try {
		const toggle = await Survey.findById(req.params.id);
		toggle.isActive = !toggle.isActive;
		await toggle.save();
		res.status(200).json({ success: true });
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
	clearCache(['survey', `survey_${req.params.id}`]);
});

router.delete('/:id', [auth, creator], async (req, res) => {
	try {
		await Survey.findByIdAndDelete(req.params.id);
		res.status(200).json({ success: true });
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
	clearCache(['survey', `survey_${req.params.id}`]);
});

router.get('/search/:text', async (req, res) => {
	try {
		const search = await Survey.find(
			{ 
				$text: { 
					$search: req.params.text 
				}, 
			},
			{
				score: {
					$meta: "textScore"
				}
			}).sort({ score : { $meta : 'textScore' } }).lean(); 
		res.status(200).json(search);	
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
});


module.exports = router;