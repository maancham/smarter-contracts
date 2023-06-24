yarn hardhat compile
yarn hardhat deploy-message-sender --network mumbai
yarn hardhat deploy-message-sender --network sepolia
yarn hardhat send-message-via-HyperlaneMessageSender --sender "0xD387E293222ff370b327242AEE5A191aa064624D" --receiver "0xF432ac34f73f449406f82107259DCe0d31DFC410" --remote sepolia --network mumbai --message "Hello Eth Waterloo"