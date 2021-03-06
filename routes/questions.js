const express = require('express');
const router = express.Router();

const auth = require('../helpers/auth');
const User = require('../models/Users');
const Question = require('../models/Questions');
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
		const questions = await Question.find().limit(50).sort({ updatedAt: -1 })
			.lean().cache('question');
		res.status(200).json(questions);
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
});

router.get('/category/:category', async (req, res) => {
	try {
		const questions = await Question.find({categories: { $elemMatch: {$eq: req.params.category} }})
			.lean().cache(`question_${req.params.category}`);
		res.status(200).json(questions);
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
});

router.get('/:id', async (req, res) => {
	try {
		const question = await Question.findOne({ _id: req.params.id })
			.lean().cache(`question_${req.params.id}`);
		if(!question) {
			return res.status(404).json({ message: 'Question is not found.' });
		}
		res.status(200).json(question);
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
});


// crud operations only for question
router.post('/', auth, async (req, res) => {
	try {
		let question = new Question({
			question: req.body.question,
			description: req.body.description,
			categories: req.body.categories,
			creator: {
				_id: req.user._id,
				fullName: `${req.user.firstName} ${req.user.lastName}`,
				avatar: req.user.avatar
			}
		});
		const saved = await question.save();
		res.status(200).json(saved);
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
	const clear = req.body.categories;
	clear.push('question');
	clearCache(clear);
});

router.patch('/:id', [auth, creator], async (req, res) => {
	try {
		const updated = await Question.findByIdAndUpdate(
			req.params.id,
			{
				$set: {
					question: req.body.question,
					description: req.body.description,
					categories: req.body.categories,
					updatedAt: new Date()
				}
			},
			{ new: true }
		);
		res.status(200).json(updated);
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
	const clear = req.body.categories;
	clear.push('question');
	clear.push(`question_${req.params.id}`);
	clearCache(clear);
});

router.delete('/:id', [auth, creator], async (req, res) => {
	try {
		await Question.deleteOne({ _id: req.params.id });
		res.status(200).json({ success: true });
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
	clearCache(['question', `question_${req.params.id}`]);
});

// crud operations for answers
router.post('/answer/:id', auth, async (req, res) => {
	try {
		const currentDate = new Date();
		let answer = {
			answer: req.body.answer,
			_id: `${req.user._id}_${currentDate.getTime()}`,
			creator: {
				_id: req.user._id,
				fullName: `${req.user.firstName} ${req.user.lastName}`,
				avatar: req.user.avatar
			},
			like: 0,
			date: currentDate,
			likedUsers: []
		};
		const updated = await Question.findByIdAndUpdate(
			req.params.id,
			{
				$push: {
					answers: answer
				}
			}
		);
		res.status(200).json({ success: true });
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
	clearCache(['question', `question_${req.params.id}`]);
});

router.patch('/answer/:questionId/:answerId', [auth, creator], async (req, res) => {
	try {
		const updated = await Question.findOneAndUpdate(
			{
				_id: req.params.questionId,
				'answers._id': req.params.answerId 
			},
			{
				$set: {
					'answers.$.answer': req.body.answer,
					'answer.$.date': new Date()
				}
			}
		);
		res.status(200).json({ success: true });
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
	clearCache(['question', `question_${req.params.questionId}`]);
});

router.patch('/like/:questionId/:answerId', auth, async (req, res) => {
	try {
		const answer = await Question.findById(req.params.questionId)
			.select({ answers: { $elemMatch: { _id: req.params.answerId } } });
		if(answer.answers.length === 0) {
			return res.status(404).json({ message: 'Answer is not found.' });
		}
		else if(answer.answers[0].likedUsers.includes(req.user._id)) {
			return res.status(400).json({ message: 'You have already liked this answer.' });
		}
		else {
			Promise.all([
				Question.findOneAndUpdate(
					{
						_id: req.params.questionId,
						'answers._id': req.params.answerId
					},
					{
						$inc: {
							'answers.$.like': 1
						},
						$push: {
							'answers.$.likedUsers': req.user._id
						}
					}
				),
				User.findOneAndUpdate(
					{ _id: req.body.creator._id },
					{
						$inc: {
							reputation: 1
						}
					}
				)
			]).then(() => {
				res.status(200).json({ success: true });
			}).catch((err) => {
				res.status(400).json({ message: err.message });
			});
		}	
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
	clearCache(['question', `question_${req.params.questionId}`]);
});

router.patch('/removeanswer/:questionId/:answerId', [auth, creator], async (req, res) => {
	try {
		await Question.findOneAndUpdate(
			{ _id: req.params.questionId },
			{
				$pull: {
					answers: {
						_id: req.params.answerId
					}
				}
			}
		);
		res.status(200).json({ success: true });
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
	clearCache(['question', `question_${req.params.questionId}`]);
});

router.patch('/answered/:id', [auth, creator], async (req, res) => {
	try {
		await Question.findOneAndUpdate(
			{ _id: req.params.id },
			{
				$set: {
					isAnswered: true
				}
			}
		);
		res.status(200).json({ success: true });
	}
	catch (err) {
		res.status(400).json({ message: err.message });
	}
	clearCache(['question', `question_${req.params.id}`]);
});


router.get('/search/:text', async (req, res) => {
	try {	
		const search = await Question.find(
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