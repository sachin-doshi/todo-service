require('./config/config');
const uncaught = require('uncaught');
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID,MongoClient} = require('mongodb');
const AWSXRay = require('aws-xray-sdk');
const express_graphql = require('express-graphql');
const { buildSchema } = require('graphql');
const ncschema = require('./api/graphql/GraphQL');
const assert = require('assert');
const http = AWSXRay.captureHTTPs(require('http'));

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate');

uncaught.start();
uncaught.addListener(function (error) {
    console.error('Uncaught error or rejection: ', error);        
});
process.on('exit', (code) => {
  console.error(`About to exit with code: ${code}`);
});

var app = express();
app.set('json spaces', 2);

const port = process.env.PORT;

app.use(bodyParser.json());

app.get('/health', function(req, res) {
  res.status(200).send('200 OK');
});

//#region GraphQL test

MongoClient.connect(process.env.MONGODB_URI,(err,mPool)=>{

  assert.equal(err,null);

  app.use('/graphql', express_graphql({
    schema: ncschema,
    graphiql: true,
    context: {mPool}
  }));
});


//app.use('/api', api);

//#endregion

//#region ///////////////// Todos /////////////////

app.post('/todos', authenticate, (req, res) => {
  var todo = new Todo({
    text: req.body.text,
    _creator: req.user._id
  });

  todo.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/todos', authenticate, (req, res) => {
  Todo.find({
    _creator: req.user._id
  }).then((todos) => {
    res.send({todos});
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/todos/:id', authenticate, (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findOne({
    _id: id,
    _creator: req.user._id
  }).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }

    res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  });
});

app.delete('/todos/:id', authenticate, (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findOneAndRemove({
    _id: id,
    _creator: req.user._id
  }).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }

    res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  });
});

app.patch('/todos/:id', authenticate, (req, res) => {
  var id = req.params.id;
  var body = _.pick(req.body, ['text', 'completed']);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findOneAndUpdate({_id: id, _creator: req.user._id}, {$set: body}, {new: true}).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }

    res.send({todo});
  }).catch((e) => {
    res.status(400).send();
  })
});

//#endregion //

//#region ///////// users
app.post('/signup', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);
  var user = new User(body);

  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => {
    res.header('x-auth', token).send(user);
  }).catch((e) => {
    res.status(400).send(e);
  })
});

app.post('/users/login', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);

  User.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user);
    });
  }).catch((e) => {
    res.status(400).send();
  });
});

app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user);
});

app.delete('/users/me/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).send();
  }, () => {
    res.status(400).send();
  });
});

//#endregion /////

app.use((err, req, res, next) => {
  console.error(err.stack);
  // if error thrown from jwt validation check
  if (err.name === 'UnauthorizedError') {
    res.status(401).send('Invalid token');
    return;
  }
  if (req.xhr) {
    console.error(err.stack);
    res.status(200).send('Sorry AJAX Error happened...' + err)
  } else {
    console.error(err.stack);
    res.status(200).send('Sorry Error happened...' + err)
  }

  
});


app.listen(port, () => {
  console.log(`Started up at port ${port}`);
});

module.exports = {app};
