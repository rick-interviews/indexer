require('dotenv').config();
var argv = require('yargs/yargs')(process.argv.slice(2)).argv;
const Web3 = require('web3');
const request = require('request');
const dbModule = require('../../db/db.js');

const analyzerService = `${process.env.SERVICES_HOST}:${process.env.ANALYZER_ETHEREUM_PORT}`;

// Create a new instance of Web3
let web3;

// Function to set up Web3 connection
const setupWeb3 = () => {
  return new Promise(async (resolve, reject) => {
    web3 = new Web3(new Web3.providers.WebsocketProvider(`${process.env.INFURA_ETH_WSS}/${process.env.INFURA_API_KEY}`,
      {
      clientConfig:{
      maxReceivedFrameSize: 10000000000,
      maxReceivedMessageSize: 10000000000,
      } 
    }));
    resolve();
  });
}

// Function to close the Web3 connection
const closeWeb3 = () => {
  web3.currentProvider.disconnect();
}

// Function to retrieve the latest block number onchain
const getLatestBlock = () => {
  return new Promise((resolve, reject) => {
    web3.eth.getBlockNumber((error, blockNumber) => {
      if (error) reject(error);
      console.log(`Latest block onchain: ${blockNumber}`);
      resolve(blockNumber);
    }).catch(error => {
      reject(error);
    });
  });
}

// Function to return the latest block previously retrieved
const getLatestBlockDB = () => {
    return new Promise(async (resolve, reject) => {
      const sql = "SELECT max(block_height) as block_height FROM eth_blocks;";
      let result = await dbModule.runQuery(sql);
      console.log(`Latest block in database: ${result[0].block_height}`);
      resolve(result[0].block_height);
    });
}

// Function to send a transaction to the analyzer
const sendTransactionAnalyzer = fieldsToUpdate => {
  return new Promise((resolve, reject) => {
    request.post({
      headers: {'content-type': 'application/json'},
      url: `${analyzerService}/ethereum/transactions/new`,
      body: fieldsToUpdate,
      json: true
    }, (err, analyzerResponse, body) => {
      if (err) reject(err)
      // console.log(`Transaction ${fieldsToUpdate.hash.replaceAll("\"", "")} sent to Analyzer`);
      resolve();
    });
  })
}

// Function to retrieve the transaction data from a specified block
const getBlockTransactions = blockNumber => {
  return new Promise((resolve, reject) => {
    web3.eth.getBlock(blockNumber, true, async (error, block) => {
      if (error) reject(error);
      if (block && block.number != undefined) {
        console.log(`Retrieving ${block.transactions.length} tx from block ${block.number} and sending to analyzer...`);
        const promises = [];
        for (i = 0; i < block.transactions.length; i++) {
            tx = block.transactions[i];
            // Send the tx to the analyzer
            fieldsToUpdate = {
                hash: `"${tx.hash}"`,
                block: tx.blockNumber,
                from: `"${tx.from}"`,
                to: `"${tx.to}"`,
                value: parseFloat(web3.utils.fromWei(tx.value, 'ether')),
                gas_price: parseFloat(tx.gasPrice/1e9),
                gas: parseFloat(tx.gas),
                updated_dt: `"${new Date().toISOString().slice(0, 19).replace('T', ' ')}"`
            }
            promises.push(sendTransactionAnalyzer(fieldsToUpdate));
            await new Promise(resolve => setTimeout(resolve, 250));
        }
        await Promise.all(promises);

        // Update block level data
        fieldsToUpdate = {
          block_height: block.number,
          timestamp: block.timestamp,
          tx_count: block.transactions.length,
          hash: `"${block.hash}"`,
          updated_dt: `"${new Date().toISOString().slice(0, 19).replace('T', ' ')}"`
        }
        await dbModule.updateOrCreateRow('eth_blocks', 'block_height', block.number, fieldsToUpdate);
        resolve();  
      }
    }).catch(error => {
      reject(error);
    });
  });
}

// Function to run in continuous monitoring mode

const continuousMonitor = () => {
  // Listen for new blocks on the blockchain
  web3.eth.subscribe('newBlockHeaders', (error, result) => {
    if (error) {
      console.error(error);
    }
    // Get the block number of the new block
    const blockNumber = result.number;

    // Fetch the block from the blockchain
    web3.eth.getBlock(blockNumber, true, async (error, block) => {
      if (error) {
        console.error(error);
      }
      console.log(`[Continuous Monitoring] Retrieving ${block.transactions.length} tx from block ${block.number} and sending to analyzer...`);
      for (i = 0; i < block.transactions.length; i++) {
        tx = block.transactions[i];
        // Send the tx to the analyzer
        fieldsToUpdate = {
            hash: `"${tx.hash}"`,
            block: tx.blockNumber,
            from: `"${tx.from}"`,
            to: `"${tx.to}"`,
            value: parseFloat(web3.utils.fromWei(tx.value, 'ether')),
            gas_price: parseFloat(tx.gasPrice/1e9),
            gas: parseFloat(tx.gas),
            updated_dt: `"${new Date().toISOString().slice(0, 19).replace('T', ' ')}"`
        }
        await sendTransactionAnalyzer(fieldsToUpdate);
        await new Promise(resolve => setTimeout(resolve, 250));
      }

      // Update block level data
      fieldsToUpdate = {
        block_height: block.number,
        timestamp: block.timestamp,
        tx_count: block.transactions.length,
        hash: `"${block.hash}"`,
        updated_dt: `"${new Date().toISOString().slice(0, 19).replace('T', ' ')}"`
      }
      await dbModule.updateOrCreateRow('eth_blocks', 'block_height', block.number, fieldsToUpdate);
    });
  });  
}

// Main function

const main = async () => {
  let start, end;
  const promises = [];

  await setupWeb3();
  await dbModule.connectDB();

  // Check what data we need to retrieve based on args

  // Retrieve specified block
  if (argv.block) {
    start = end = argv.block;
  // Retrieve latest onchain block
  } else if (argv.latestblock) {
    start = end = await getLatestBlock();
  // Retrieve a specified range of blocks
  } else if (argv.from && argv.to) {
    start = argv.from;
    end = argv.to;
  // Default is to refetch the latest block in the DB
  } else {
    console.log(`Catching up from last recorded block to current...`);
    start = await getLatestBlockDB();
    end = await getLatestBlock();
  }
  
  for (current = start; current <= end; current++) {
    console.log(`Retrieving block: ${current}`);
    promises.push(getBlockTransactions(current));
  }
  await Promise.all(promises);
  continuousMonitor();
  // await dbModule.closeDB();
  // await closeWeb3();
}

// Start app
main();

