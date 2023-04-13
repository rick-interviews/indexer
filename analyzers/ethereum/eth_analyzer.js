require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const port = process.argv.slice(2) [0];
const dbModule = require('../../db/db.js');
const app = express();
app.use(bodyParser.json());

app.post('/ethereum/transactions/new', async (req, res) => {
  console.log(`[ETHEREUM] Sent new transaction from scanner with hash ${req.body.hash.replaceAll("\"", "")}`);
  await dbModule.updateOrCreateRow('eth_transactions', 'hash', req.body.hash, req.body);
  await res.status(200).send();
});

console.log(`Ethereum analyzer service listening on port ${port}`);
dbModule.connectDB();
app.listen(port);