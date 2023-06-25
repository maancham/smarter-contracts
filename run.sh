#!/bin/bash

# Run it as ./run.sh <origin_chain> <operator> <first_operand> <second_operand>
# OP_CODE: ADD = 0, SUB = 1, MUL = 2

originChain=$1
operator=$2
first=$3
second=$4

yarn hardhat compile

cheapestChainLine=$(yarn hardhat chain-estimator --network  $originChain | grep "Estimation:")

remoteChain=$(echo $cheapestChainLine | awk '{print $2}')
remoteChainCost=$(echo $cheapestChainLine | awk '{print $4}')
echo "The cheapest chain is $remoteChain$ with the gas fee of $remoteChainCost"

origin=$(yarn hardhat deploy-message-transceiver --network $originChain | grep "Deployed HyperlaneMessageTransceiver" | awk '{print $4}')
echo "Deployed $origin"
remote=$(yarn hardhat deploy-message-transceiver --network $remoteChain | grep "Deployed HyperlaneMessageTransceiver" | awk '{print $4}')
echo "Deployed $remote"
yarn hardhat send-syn-message --sender $origin --receiver $remote --remote $remoteChain --network $originChain --first $first --second $second --operator $operator
echo "Sent SYN from $origin to $remote!"
sleep 120
yarn hardhat send-ack-message --sender $remote --receiver $origin --remote $originChain --network $remoteChain
echo "Sent ACK from $remote to $origin!"
sleep 60
echo "Getting result!"
yarn hardhat get-result --sender $origin --receiver $remote --remote $remoteChain --network $originChain

