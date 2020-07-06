const express = require('express');
const router = express.Router();
const multer = require('multer');
const News = require('../models/News');
const User = require('../models/Users');
const auth = require('../helpers/auth');
const { admin, collaborator, newsCreator } = require('../helpers/admin');

const storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './uploads/newsImages/');
	},
	filename: function(req, file, cb) {
		cb(null, new Date().toISOString() + file.originalname);
	}
});
const upload = multer({ storage: storage });


router.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "http://localhost:3000"); // update to match the domain you will make the request from
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-token");
	res.header("Access-Control-Allow-Methods", "GET, PATCH, DELETE, POST, PUT, HEAD");
	next();
  });

router.get('/', async (req, res) => {
	try {
		const news = await News.find();
		res.status(200).json(news);
	}
	catch(err) {
		res.status(400).json({ message : err });
	}
});

router.get('/:newsID', async (req, res) => {
	try {
		const news = await News.findById(req.params.newsID);
		if(!news) {
			return res.status(404).send('News not found.');
		}
		res.status(200).json(news);
	}
	catch(err) {
		res.status(400).json({ message : err });
	}
});

<<<<<<< HEAD
router.post('/', [upload.single('imageUrl') ,auth, collaborator], async (req, res) => {
=======
router.post('/', [auth, collaborator], async (req, res) => {
	const news = new News({
		title: req.body.title,
		description: req.body.description,
		organization: req.body.organization,
		category: req.body.category,
		imageUrl: req.body.imageUrl,
		isImportant: req.body.isImportant,
		detail: req.body.detail
	});

>>>>>>> efcaafb46eab1c49d8a460608b54ae912109898d
	try {
		let news = new News({
			title: req.body.title,
			description: req.body.description,
			organization: req.body.organization,
			category: req.body.category,
			imageUrl: req.body.imageUrl,
			isImportant: req.body.isImportant,
			detail: req.body.detail
		});
		console.log('req ', req.body);
		news.creatorId = req.user._id;
		const savedNews = await news.save();
		
		res.status(200).json(savedNews);
	}
	catch(err) {
		res.status(400).json({ message : err });
	}
});

router.delete('/:newsID', [auth, newsCreator], async (req, res) => {
	try {
		const removed = await News.remove({ _id: req.params.newsID});
		res.status(200).json(removed);
	}
	catch(err) {
		res.status(400).json({ message : err });
	}
});

router.patch('/:newsID', [auth, newsCreator], async (req, res) => {
	try {
		const update = await News.updateOne(
			{ _id: req.params.newsID},
			{
				$set: {
					title: req.body.title,
					description: req.body.description,
					organization: req.body.organization,
					category: req.body.category,
					imageUrl: req.body.imageUrl,
					isImportant: req.body.isImportant,
					detail: req.body.detail
				} 
			}
		);
		res.status(200).json(update);
	}
	catch(err) {
		res.status(400).json({ message: err });
	}
});

router.post('/approve/:newsID', [auth, admin], async (req, res) => {
	try {
		const news = await News.updateOne(
			{ _id: req.params.newsID},
			{
				$set: {
					status: true
				} 
			}
		);
		res.status(200).json(news);
	}
	catch(err) {
		res.status(400).json( { message : err.message});
	}
});

module.exports = router;