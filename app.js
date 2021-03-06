// all needed packages
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv/config');

// all needed routes 
const newsRoute = require('./routes/news');
const registerRoute = require('./routes/register');
const loginRoute = require('./routes/login');
const userSettings = require('./routes/me');
const usersRoute = require('./routes/allUsers');
const resourcesRoute = require('./routes/resources');
const questionsRoute = require('./routes/questions');
const blogRoute = require('./routes/blogs');
const surveyRoute = require('./routes/surveys');
const exercisesRoute = require('./routes/exercises')
const uploadRoute = require('./routes/upload');
const coursesRoute = require('./routes/courses');
const home = require('./routes/home');

// patched mongoose
require('./helpers/customFuncs');

// database connection
const ConnectionString = process.env.ConnectionString;
mongoose.connect(
	ConnectionString, 
	{
		useUnifiedTopology: true, 
		useNewUrlParser: true,
		useFindAndModify: false,
		useCreateIndex: true
	}
);


// all middleware functions
app.disable('x-powered-by');
app.use(bodyParser.json({
		limit: '50mb', extended: true 
	}));
app.use(bodyParser.urlencoded({
		limit: "50mb", extended: true, parameterLimit:50000
	}));

app.use('/ES/api/news', newsRoute);
app.use('/ES/api/register', registerRoute);
app.use('/ES/api/login', loginRoute);
app.use('/ES/api/me', userSettings);
app.use('/ES/api/users', usersRoute);
app.use('/ES/api/resources', resourcesRoute);
app.use('/ES/api/questions', questionsRoute);
app.use('/ES/api/blogs', blogRoute);
app.use('/ES/api/surveys', surveyRoute);
app.use('/ES/api/exercises', exercisesRoute);
app.use('/ES/api/upload', uploadRoute);
app.use('/ES/api/courses', coursesRoute);
app.use('/', home);

const port = 8000;
app.listen(port);
//app.listen(4000);
