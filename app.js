let express = require('express');
let morgan = require('morgan');
let config = require('./config/main');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');

let app = express();

app.use(morgan('tiny'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.set('passport', require('./models/authentication.js').init(app));

mongoose.connect(config.database);

fs.readdirSync('./routes').forEach(function (file){
  if (path.extname(file) == '.js') {
    console.log("Adding routes in "+file);
  	require('./routes/'+ file).init(app);
  	}
});

let server = app.listen(config.port);
console.log('Your server is running on port ' + config.port + '.');
