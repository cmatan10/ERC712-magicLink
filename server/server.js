require('dotenv').config(); // enables loading .env vars
const express = require('express');
const app = express();
const { Magic } = require('@magic-sdk/admin');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const Web3 = require('web3');

// Initiating Magic instance for server-side methods
const magic = new Magic(process.env.MAGIC_SECRET_KEY);

// Allow requests from client-side
app.use(cors({ origin: process.env.CLIENT_URL }));

app.post('/api/login', async (req, res) => {
  try {
    // Change here: use `substring` instead of `substr`
    const didToken = req.headers.authorization.substring(7);
    await magic.token.validate(didToken);
    res.status(200).json({ authenticated: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// For heroku deployment
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Check if RPC_URL is set before creating the web3 instance
if (!process.env.RPC_URL) {
  console.error("RPC_URL is not set in environment variables.");
  process.exit(1);
}

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_URL));

const GREETER_CONTRACT_ADDRESS = '0xEFDe655279C1b02CA25C1226F10cdb8B8260e88d';
const BACKEND_WALLET_ADDRESS = '0x37b866D9B2abC358043f3cA0b38576a41c83c114';
const GREETER_CONTRACT_ABI_PATH = './Greeter.json';
const PORT = 8080;
var greeterContract = null;

const loadContract = async (data) => {
  data = JSON.parse(data);
  greeterContract = new web3.eth.Contract(
    data,
    GREETER_CONTRACT_ADDRESS
  );
}

async function initAPI() {
  fs.readFile(GREETER_CONTRACT_ABI_PATH, 'utf8', function (err, data) {
    if (err) {
      return console.log(err);
    }
    loadContract(data);
  });

  app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}`);
  });
  app.use(cors({
    origin: '*'
  }));
}

async function relayMinting(greetingDeadline, greetingSender, v, r, s) {
  const nonce = await web3.eth.getTransactionCount(BACKEND_WALLET_ADDRESS, 'latest'); // nonce starts counting from 0
  const transaction = {
    'from': BACKEND_WALLET_ADDRESS,
    'to': GREETER_CONTRACT_ADDRESS,
    'value': 0,
    'gas': 900000,
    'nonce': nonce,
    'data': greeterContract.methods.safeMint(
      { deadline: greetingDeadline }, // Assuming this is the correct structure for Minting
      greetingSender,
      v,
      r,
      s
    ).encodeABI()
  };
  const { PRIVATE_KEY } = process.env;
  const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);

  web3.eth.sendSignedTransaction(signedTx.rawTransaction, function (error, hash) {
    if (!error) {
      console.log('🎉 The hash of your transaction is: ', hash, '\n');
    } else {
      console.log('❗Something went wrong while submitting your transaction:', error);
    }
  });
}

app.get('/relayMint', (req, res) => {
  var greetingDeadline = req.query['greetingDeadline'];
  var greetingSender = req.query['greetingSender'];
  var v = req.query['v'];
  var r = req.query['r'];
  var s = req.query['s'];
  relayMinting(greetingDeadline, greetingSender, v, r, s);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ status: 'Minting request sent' }));
});

initAPI();

