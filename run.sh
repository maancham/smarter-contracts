originChain="mumbai"
remoteChain="alfajores"

yarn hardhat compile
origin=$(yarn hardhat deploy-message-transceiver --network $originChain | grep "Deployed HyperlaneMessageTransceiver" | awk '{print $4}')
echo "Deployed $origin"
remote=$(yarn hardhat deploy-message-transceiver --network $remoteChain | grep "Deployed HyperlaneMessageTransceiver" | awk '{print $4}')
echo "Deployed $remote"
yarn hardhat send-syn-message --sender $origin --receiver $remote --remote $remoteChain --network $originChain --first 13 --second 14
echo "Sent SYN from $origin to $remote!"
sleep 120
yarn hardhat send-ack-message --sender $remote --receiver $origin --remote $originChain --network $remoteChain
echo "Sent ACK from $remote to $origin!"
sleep 120
echo "Getting result!"
yarn hardhat get-result --sender $origin --receiver $remote --remote $remoteChain --network $originChain

