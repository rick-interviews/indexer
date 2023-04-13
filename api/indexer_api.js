require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const port = process.argv.slice(2) [0];
const app = express();
const dbModule = require('../db/db.js');
app.use(bodyParser.json());

// Function to retrieve the transaction history hashes of a specified address
const getAccountTransactions = (address) => {
    return new Promise(async (resolve, reject) => {
        const sql = `SELECT \`hash\` FROM eth_transactions WHERE \`from\` = "${address}" OR \`to\` = "${address}";`;
        let result = await dbModule.runQuery(sql);
        let txs = result.map(res => res.hash);
        resolve(txs);
    });
}

// Endpoint for retrieving transactions for a specific address
app.get('/api/account/transactions', async (req, res) => {
    console.log(`API request received for transactions for account ${req.body.address}`); 
    let txs = await getAccountTransactions(req.body.address);
    res.status(200).send(txs);
});

console.log(`Indexer API service listening on port ${port}`);
dbModule.connectDB();
app.listen(port);