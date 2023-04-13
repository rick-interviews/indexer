# Coinshift - Senior Backend Engineer Assignment - March 2023

## Problem Statement

Design and implement the architecture for a production-ready transaction indexing service for EVM compatible blockchains.

## Requirements

1. The system should be able to scan blockchain and save all the transactions to a database like MySQL
2. The system should provide APIs to
	* get the transaction history of multiple addresses across different networks
	* start indexing the transactions of an address if it’s not being tracked already
3. The system should have an adapter where we can plugin any transaction analyzer to understand the transaction internal details such as
	* which and how many tokens are transferred
	* which protocol that address was interacting with, etc.,

## Testing Addresses

- 0x5e14ed9dCeE22ba758E8de482301028b261c4a14
- 0xF1D8c2eED95D5fC2EaDe4E6Bb15a5969453E89a9
- 0x89C51828427F70D77875C6747759fB17Ba10Ceb0
- 0xf26d1Bb347a59F6C283C53156519cC1B1ABacA51

## Acceptance Criteria

1. Come up with a design document that covers the system design on how to run this service with features like resilience to backfill in case our systems crash or go out of sync with the blockchain
2. Create a PoC service using JavaScript and Node.js that indexes data of Goerli Testnet. This doesn’t need to have all the features mentioned in your design for it to be a production-ready system

## Time Limit

4 days

## Submission

* Please create a public GitHub repository to publish the code.
* Add a README.md file with instructions to run the code.
* Also add an NOTES.md with any assumptions and notes that we should know about the system
* Any attachment containing the system design with both a HLD and notes to describe it

