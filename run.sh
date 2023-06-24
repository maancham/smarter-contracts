yarn hardhat compile
yarn hardhat deploy-message-transceiver --network mumbai
yarn hardhat deploy-message-transceiver --network alfajores
yarn hardhat send-syn-message --sender "0xe14d26CE33b5BF40e894979A61994dd0C92B6A64" --receiver "0x85aAFeF595192d03c57844Cbaf6574Fbff575165" --remote alfajores --network mumbai --message "211:Hello Eth Waterloo"
yarn hardhat send-ack-message --sender "0x85aAFeF595192d03c57844Cbaf6574Fbff575165" --receiver "0xe14d26CE33b5BF40e894979A61994dd0C92B6A64" --remote mumbai --network alfajores