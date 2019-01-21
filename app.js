const express = require('express');
const app = express();

const expressValidator = require('express-validator');
const {body} = require('express-validator/check');

const session = require('express-session');
const logger = require('morgan');
const flash = require('connect-flash');
const path = require('path');
const nodemailer = require('nodemailer');

//port
app.set('port', process.env.PORT || 3000);

//view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

//body-parser
app.use(express.json());
app.use(express.urlencoded({extended:false}));

//static files
app.use(express.static(path.join(__dirname, 'public')));

//morgan
app.use(logger('dev'));

//express Sessions
app.use(session({
	secret: 'secret',
	saveUninitialized: true,
	resave: true
}));

app.use(flash());

//express validation
app.use(expressValidator({
	errorFormatter: function(param, msg, value){
		var namespace = param.split('.');
		var root = namespace.shift();
		var formParam = root;

		while(namespace.length){
			formParam += `[${namespace.shift()}]`;
		}

		return {
			param: formParam,
			msg,
			value
		};
	}
}));

app.get('/', function(req, res){
	res.render('index', {title:"Computer Not Working?"});
});

app.get('/about', function(req, res){
	res.render('about');
});

app.get('/contact', function(req, res){
	res.render('contact', {errors: req.flash('errors')});
});

app.post(
	'/contact/send',
	[
	body("name", "Name field is required.").exists({checkFalsy: true}),
	body("email", "Email field is invalid.").isEmail(),
	body("message", "Message field is required.").exists({checkFalsy: true})
	],
	function(req, res){
		var errors = req.validationErrors();
		var {name, email, message} = req.body;

		var mailOptions = {
			from: 'Some Guy <techguyinfo@gmail.com>',
			to: 'support@someplace.com',
			subject: 'Website Submission',
			text: `You have a submission with the following details... Name: ${name} Email: ${email} Message: ${message}`,
			html: `<p>You have a submission with the following details...<p><ul><li>Name: ${name}</li><li>Email: ${email}</li><li>Message: ${message}</li></ul>`
		};

		var transporter = nodemailer.createTransport({
			service: 'Gmail',
			auth: {
				user:'techguyinfo@gmail.com',
				pass: ''
			}
		});

		if(errors){
			console.error(`Validation errors: ${JSON.stringify(errors)}`);
			req.flash('errors', errors);
			res.location('/contact');
			res.redirect('/contact');
		} else {
			transporter.sendMail(mailOptions, function(error, info){
				if (error) {
					console.error(`Unable to deliver:\n${error}`);
				} else {
					console.info(`Message Sent: ${info.response}`);
				}
				res.redirect('/');
			});
		}
	}
	);


app.listen(app.get('port'));
console.log(`Listening on port ${app.get('port')}`);