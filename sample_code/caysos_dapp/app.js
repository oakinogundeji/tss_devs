'use strict';
require('dotenv').config();
//=============================================================================
/**
 * dependencies
 */
//=============================================================================
const
  express = require('express'),
  bParser = require('body-parser'),
  path = require('path'),
  http = require('http'),
  fs = require('fs'),
  solc = require('solc'),
  cp = require('child_process'),
  Promise = require('bluebird'),
  session = require('express-session'),
  mongoose = require('mongoose'),
  mongoStore = require('connect-mongo')(session),
  emailSender = require('./utils/sendgrid'),
  Contract = require('./models/contract'),
  app = express(),
  server = http.createServer(app);
//=============================================================================
/**
 * variables
 */
//=============================================================================
const
  PORT = process.env.PORT,
  ENV = process.env.NODE_ENV || 'development',
  dbURL = process.env.dbURL,
  SESSION_SECRET = process.env.SESSION_SECRET,
  authRoutes = require('./routes');

let
  sessStore,
  db;
//=============================================================================
/**
 * dbase connection
 */
//=============================================================================
mongoose.Promise = Promise;

const mongooseConnection = mongoose.connect(dbURL, {
  useMongoClient: true
});

mongooseConnection.then(function (dbConn) {
  db = dbConn;
  db.on('error', function (err) {
    console.error('There was a db connection error');
    return  console.error(err.message);
  });
  db.once('connected', function () {
    return console.log('Successfully connected to ' + dbURL);
  });
  db.once('disconnected', function () {
    return console.error('Successfully disconnected from ' + dbURL);
  });
});

process.on('SIGINT', function () {
  db.close(function () {
    console.error('dBase connection closed due to app termination');
    return process.exit(0);
  });
});

sessStore = new mongoStore({
  mongooseConnection: mongoose.connection,
  touchAfter: 24 * 3600});
//=============================================================================
/**
 * middleware
 */
//=============================================================================
if(ENV != 'production') {
    app.use(require('morgan')('dev'));
    require('clarify');
}
app.use(bParser.json());
app.use(bParser.urlencoded({extended: true}));
app.use(session({
  name: 'caysodapp.sess', store: sessStore, secret: SESSION_SECRET, resave: true,
  saveUninitialized: false, cookie: {maxAge: 1000 * 60 * 15}}));
app.use(express.static(path.join(__dirname, 'static')));
app.use('/auth', authRoutes);
//=============================================================================
/**
 * helpers
 */
//=============================================================================
function getContractByteCode() {
  return new Promise((resolve, reject) => {
    const solc = cp.spawn('solc', ['--bin', './Caysos.sol']);
    let output;
    solc.stdout.on('data', (data) => {
      output = data.toString();
    });

    solc.stderr.on('data', (err) => {
      console.log(`stderr: ${err}`);
      return reject(err);
    });

    solc.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      console.log('final bytecode');
      let newOut = output.replace(/[\s\S]*Binary\:/, '');
      console.log('new code out \n');
      console.log(newOut.trim());
      return resolve(newOut.trim());
    });
  });
}

function getContractAbiDef() {
  return new Promise((resolve, reject) => {
    const solc = cp.spawn('solc', ['--abi', './Caysos.sol']);
    let output;
    solc.stdout.on('data', (data) => {
      output = data.toString();
    });

    solc.stderr.on('data', (err) => {
      console.log(`stderr: ${err}`);
      return reject(err);
    });

    solc.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      console.log('abiDef');
      let newOut = output.replace(/[\s\S]*ABI/, '');
      console.log('new abi out \n');
      console.log(newOut.trim());
      return resolve(newOut.trim());
    });
  });
}

function sendEmail(sender, senderName, recipient, content, res) {
  return new Promise((resolve, reject) => {
    return emailSender(sender, senderName, recipient, content)
      .then(ok => res.status(200).json({success: true}))
      .catch(err => res.status(500).json({success: false}));
  });
}

function saveContractAddress(addr) {
  return new Promise((resolve, reject) => {
    return Contract.findOne({address: addr}, function (err, contract) {
      if(err) {
        console.log('dbase error while searching for contract');
        return reject(err);
      }
      if(contract) {
        console.log('a contract with that address already exists...');
        const err = new Error('a contract with that address already exists...');
        return reject(err.message);
      }
      let newContract = new Contract();
      newContract.address = addr;
      newContract.save(function (err) {
        if(err) {
          console.log('there was an error saving the new contract address');
          return reject(err);
        } else {
          console.log('new contract address successfully saved');
          return resolve(newContract.address);
        }
      });
    });
  });
}

function deleteContractAddress(addr) {
  return new Promise((resolve, reject) => {
    return Contract.remove({address: addr}, function (err, contract) {
        if(err) {
            console.log(`There was a dBase access error, while trying to delete contract with addr: ${addr}`);
            return reject(err);
        } else {
          console.log(`contract with addr: ${addr} was successfully removed`);
          return resolve(true);
        }
    });
  });
}

function checkContractExist() {
  return new Promise((resolve, reject) => {
    return Contract.find({}, function (err, contract) {
        if(err) {
            console.log(`There was a dBase access error, while trying to find existing contract`);
            return reject(err);
        } else {
            if(contract.length < 1) {
                console.log(`no contract exists`);
                const err = new Error(`no contract exists`);
                return reject(err.message);
            } else {
              console.log(`contract exists`);
              console.log(contract);
              return resolve(contract[0].address);
            }
        }
    });
  });
}
//=============================================================================
/**
 * routes
 */
//=============================================================================
app.get('/test', (req, res) => res.status(200).json('OK!'));

app.get('/', (req, res) => {
    const options = {
        root: __dirname,
        dotfiles: 'deny'
    };
    return res.sendFile('index.html', options, err => {
        if(err) {
            console.error(`Couldn't send index.html`);
            return res.status(500).json({error: err});
        } else {
            return console.log('Index.html sent');
        }
    });
});

app.get('/checkContractExists', (req, res) => {
  console.log('/checkContractExists calledd...');
  return checkContractExist()
    .then(addr => res.status(200).json(addr))
    .catch(err => res.status(404).json(err));
});

app.post('/adminLogin', (req, res) => {
  const
    username = req.body.data.username,
    pwd = req.body.data.password;
  console.log(`data from dapp, username is ${username}, password is ${pwd}`);
  if(pwd == 'P3rc@y50') {
    return setTimeout(function () {
      res.status(200).json('ok');
    }, 2000);
  } else {
    return res.status(404).json(null);
  }
});

app.get('/getContractFile', (req, res) => {
  let promiseArray = [];
  promiseArray.push(getContractByteCode());
  promiseArray.push(getContractAbiDef());
  return Promise.all(promiseArray)
    .then(ok => {
      return res.status(200).json({code: ok[0], abi: ok[1]});
    })
    .catch(err => res.status(500).json(err));
});

app.post('/sendRecommendationEmail', (req, res) => {
  const
    sender = req.body.sender,
    senderName = req.body.senderName,
    recipient = req.body.recipient,
    content = req.body.content;
  console.log(`data from UI: sender email: ${sender}, sender name: ${senderName}, recipient: ${recipient}, content: ${content}`);
  return sendEmail(sender, senderName, recipient, content, res);
});

app.post('/saveContractAddress', (req, res) => {
  console.log('/saveContractAddress invoked...');
  console.log(`contract address: ${req.body.address}`);
  return saveContractAddress(req.body.address)
    .then(addr => res.status(200).json(addr))
    .catch(err => res.status(500).json(err));
});

app.post('/deleteContractAddress', (req, res) => {
  console.log('/deleteContractAddress invoked...');
  console.log('req.body obj...');
  console.log(req.body);
  console.log(`contract address: ${req.body.address}`);
  return deleteContractAddress(req.body.address)
    .then(addr => res.status(200).json(true))
    .catch(err => res.status(500).json(err));
});
//=============================================================================
/**
 * listen
 */
//=============================================================================
server.listen(PORT, () => console.log(`Cayso dapp Server up on port:${server.address().port} in ${ENV} mode`));
//=============================================================================
