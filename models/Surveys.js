const mongoose = require('mongoose');
const { Schema } = mongoose;

const surveySchema = new Schema({
	title: {
		type: String,
		required: true
	},
	description: {
		type: String,
		default: " "
	},
	inputFields: [{}],
	isPrivate: {
		type: Boolean,
		default: false
	},
	date: {
		type: Date,
		default: Date.now
	},
	answers: {
		type: [{}],
		select: false
	},
	answeredUsers: {
		type: [String],
		select: false
	},
	responceCount: {
		type: Number,
		default: 0
	},
	creator: {
		_id: String,
		fullName: String,
		avatar: String
	},
	isActive: {
		type: Boolean,
		default: true
	}
});

surveySchema.index({ title: 'text' });

module.exports = mongoose.model('Surveys', surveySchema);