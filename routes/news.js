const express = require('express');
const router = express.Router();
const News = require('../models/News');

router.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "http://localhost:3000"); // update to match the domain you will make the request from
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
  });

router.get('/', async (req, res) => {
	try {
		const news = await News.find();
		res.json(news);
	}
	catch(err) {
		res.json({ message : err });
	}
});

router.get('/:newsID', async (req, res) => {
	try {
		const news = await News.findById(req.params.newsID);
		res.json(news);
	}
	catch(err) {
		res.json({ message : err });
	}
});

router.post('/', async (req, res) => {
	const news = new News({
		title: req.body.title,
		description: req.body.description,
		organization: req.body.organization,
		category: req.body.category,
		imageUrl: req.body.imageUrl,
		isImportant: req.body.isImportant,
	});

	try {
		const savedNews = await news.save();
		res.json(savedNews);
	}
	catch(err) {
		res.json({ message : err });
	}
});

router.delete('/:newsID', async (req, res) => {
	try {
		const removed = await News.remove({ _id: req.params.newsID});
		res.json(removed);
	}
	catch(err) {
		res.json({ message : err });
	}
});

router.patch('/:newsID', async (req, res) => {
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
					isImportant: req.body.isImportant
				} 
			}
		);
		res.json(update);
	}
	catch(err) {
		res.json({ message: err });
	}
});

module.exports = router;