message=$1

yarn hardhat compile
origin=$(yarn hardhat deploy-message-transceiver --network mumbai | grep "Deployed HyperlaneMessageTransceiver" | awk '{print $4}')
echo "Deployed $origin"
remote=$(yarn hardhat deploy-message-transceiver --network alfajores | grep "Deployed HyperlaneMessageTransceiver" | awk '{print $4}')
echo "Deployed $remote"
yarn hardhat send-syn-message --sender $origin --receiver $remote --remote alfajores --network mumbai
echo "Sent SYN from $origin to $remote!"
# sleep 120
# yarn hardhat send-ack-message --sender $remote --receiver $origin --remote mumbai --network alfajores
# echo "Sent ACK from $remote to $origin!"

