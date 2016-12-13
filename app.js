let express = require('express');
let morgan = require('morgan');
let config = require('./config/main');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
let cookieParser = require('cookie-parser');
var fs = require('fs');
var path = require('path');

// Create a new Express application.
let app = express();

// Use application-level middleware for common functionality, including logging, parsing, and session handling.
app.use(morgan('tiny'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Set up static pages to hold CSS, static HTML, and client-side JS
app.use(express.static(__dirname + '/public'));

// Initialize Passport and restore authentication state, if any, from the session.
app.set('passport', require('./models/authentication.js').init(app));

// Connect to the database.
mongoose.connect(config.database);

// Define routes.
// fs.readdirSync('./routes').forEach(function (file){
//   if (path.extname(file) == '.js') {
//     console.log("Adding routes in "+file);
//   	require('./routes/'+ file).init(app);
//   	}
// });

const router = require('./routes/router');

router(app);

// Create server.
let server = app.listen(config.port);
console.log('Your server is running on port ' + config.port + '.');
