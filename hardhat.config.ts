import {
  chainMetadata,
  ChainName,
  hyperlaneCoreAddresses as HyperlaneCoreAddresses,
  MultiProvider,
  objMap,
} from "@hyperlane-xyz/sdk";
import { utils } from "@hyperlane-xyz/utils";
import { InterchainAccountRouter__factory } from "@hyperlane-xyz/core";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";
import { HardhatUserConfig, task, types } from "hardhat/config";
import { ethers, Event } from "ethers";
import { Log } from "@ethersproject/abstract-provider";
import { send } from "process";

// TODO loosen hyperlaneCoreAddresses type in SDK to work with ChainName keys
const hyperlaneCoreAddresses = HyperlaneCoreAddresses;

// Use mnemonic ...
// const accounts = {
//   mnemonic: "test test test test test test test test test test test junk",
//   path: "m/44'/60'/0'/0",
//   initialIndex: 0,
//   count: 20,
//   passphrase: "",
// }
// ... or a direct private key
const accounts = [
  "55295c701e0098e369c582b8b76d43dfa05a45dc237acff893f0d18eab21823f",
];

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: objMap(chainMetadata, (_chain, cc) => ({
    // @ts-ignore
    url: cc.publicRpcUrls[0].http,
    accounts,
  })),
  etherscan: {
    apiKey: {
      // Your etherscan API keys here
      // polygonMumbai: "",
      // goerli: "",
    },
  },
  typechain: {
    outDir: "./types",
    target: "ethers-v5",
    alwaysGenerateOverloads: false,
  },
};

const multiProvider = new MultiProvider();

const MAILBOX_ABI = [
  "function dispatch(uint32 destinationDomain, bytes32 recipient, bytes calldata message) returns (bytes32)",
  "event DispatchId(bytes32 indexed messageId)",
];
const INTERCHAIN_GAS_PAYMASTER_ABI = [
  "function payForGas(bytes32 _messageId, uint32 _destinationDomain, uint256 _gasAmount, address _refundAddress) payable",
  "function quoteGasPayment(uint32 _destinationDomain, uint256 _gasAmount) public view returns (uint256)",
];
const INTERCHAIN_ACCOUNT_ROUTER_ABI = [
  "function dispatch(uint32 _destinationDomain, (address, bytes)[] calldata calls)",
];
const TESTRECIPIENT_ABI = [
  "function fooBar(uint256 amount, string calldata message)",
];

const INTERCHAIN_ACCOUNT_ROUTER = "0xc61Bbf8eAb0b748Ecb532A7ffC49Ab7ca6D3a39D";
const INTERCHAIN_QUERY_ROUTER = "0x6141e7E7fA2c1beB8be030B0a7DB4b8A10c7c3cd";

// A global constant for simplicity
// This is the amount of gas you will be paying for for processing of a message on the destination
const DESTINATIONGASAMOUNT = 1000000;

// task("send-message", "sends a message")
//   .addParam(
//     "remote",
//     "The name of the destination chain of this message",
//     undefined,
//     types.string,
//     false
//   )
//   .addParam("message", "the message you want to send", "Hello World")
//   .setAction(async (taskArgs, hre) => {
//     const signer = (await hre.ethers.getSigners())[0];
//     const recipient = "0x36FdA966CfffF8a9Cdc814f546db0e6378bFef35";
//     const origin = hre.network.name as ChainName;
//     const remote = taskArgs.remote as ChainName;
//     const remoteDomain = multiProvider.getDomainId(remote);
//     const outboxC = hyperlaneCoreAddresses[origin].mailbox;
//     const igpAddress = hyperlaneCoreAddresses[origin].interchainGasPaymaster;

//     const outbox = new hre.ethers.Contract(outboxC, MAILBOX_ABI, signer);
//     console.log(
//       `Sending message "${taskArgs.message}" from ${hre.network.name} to ${taskArgs.remote}`
//     );

//     const tx = await outbox.dispatch(
//       remoteDomain,
//       utils.addressToBytes32(recipient),
//       hre.ethers.utils.arrayify(hre.ethers.utils.toUtf8Bytes(taskArgs.message))
//     );

//     const receipt = await tx.wait();
//     console.log(
//       `Send message at txHash ${tx.hash}. Check the explorer at https://explorer.hyperlane.xyz/?search=${tx.hash}`
//     );

//     console.log(
//       "Pay for processing of the message via the InterchainGasPaymaster"
//     );
//     const messageId = getMessageIdFromDispatchLogs(receipt.logs);
//     const igp = new hre.ethers.Contract(
//       igpAddress,
//       INTERCHAIN_GAS_PAYMASTER_ABI,
//       signer
//     );
//     const gasPayment = await igp.quoteGasPayment(
//       remoteDomain,
//       DESTINATIONGASAMOUNT
//     );
//     const igpTx = await igp.payForGas(
//       messageId,
//       remoteDomain,
//       DESTINATIONGASAMOUNT,
//       await signer.getAddress(),
//       { value: gasPayment }
//     );
//     await igpTx.wait();

//     const recipientUrl = await multiProvider.tryGetExplorerAddressUrl(
//       remote,
//       recipient
//     );
//     console.log(
//       `Check out the explorer page for recipient ${recipientUrl}#events`
//     );
//   });

// task("make-ica-call", "Makes an Interchain Account call")
//   .addParam(
//     "remote",
//     "The name of the remote chain as the destination of this message",
//     undefined,
//     types.string,
//     false
//   )
//   .addParam("message", "the message you want to send", "Hello World")
//   .setAction(async (taskArgs, hre) => {
//     const signer = (await hre.ethers.getSigners())[0];
//     const recipient = "0xBC3cFeca7Df5A45d61BC60E7898E63670e1654aE";
//     const interchainAccountAddress =
//       "0x28DB114018576cF6c9A523C17903455A161d18C4";
//     const remote = taskArgs.remote as ChainName;
//     const remoteDomain = multiProvider.getDomainId(remote);
//     // Arbitrary values
//     const amount = 42;

//     const interchainAccountRouter = new hre.ethers.Contract(
//       interchainAccountAddress,
//       INTERCHAIN_ACCOUNT_ROUTER_ABI,
//       signer
//     );

//     const recipientInterface = new hre.ethers.utils.Interface(
//       TESTRECIPIENT_ABI
//     );
//     const calldata = recipientInterface.encodeFunctionData("fooBar", [
//       amount,
//       taskArgs.message,
//     ]);

//     console.log(
//       `Sending message "${taskArgs.message}" from ${hre.network.name} to ${taskArgs.remote}`
//     );

//     const tx = await interchainAccountRouter.dispatch(remoteDomain, [
//       [recipient, calldata],
//     ]);

//     const receipt = await tx.wait();
//     console.log(
//       `Sent message at txHash ${tx.hash}. Check the explorer at https://explorer.hyperlane.xyz/?search=${tx.hash}`
//     );

//     console.log(
//       "Pay for processing of the message via the InterchainGasPaymaster"
//     );
//     const messageId = getMessageIdFromDispatchLogs(receipt.logs);
//     const igpAddress = hyperlaneCoreAddresses[origin].interchainGasPaymaster;
//     const igp = new hre.ethers.Contract(
//       igpAddress,
//       INTERCHAIN_GAS_PAYMASTER_ABI,
//       signer
//     );
//     const gasPayment = await igp.quoteGasPayment(
//       remoteDomain,
//       DESTINATIONGASAMOUNT
//     );
//     const igpTx = await igp.payForGas(
//       messageId,
//       remoteDomain,
//       DESTINATIONGASAMOUNT,
//       await signer.getAddress(),
//       { value: gasPayment }
//     );
//     await igpTx.wait();

//     const recipientUrl = await multiProvider.tryGetExplorerAddressUrl(
//       remote,
//       recipient
//     );
//     console.log(
//       `Check out the explorer page for recipient ${recipientUrl}#events`
//     );
//   });


// task(
//   "deploy-message-sender",
//   "deploys the HyperlaneMessageSender contract"
// ).setAction(async (taskArgs, hre) => {
//   console.log(`Deploying HyperlaneMessageSender on ${hre.network.name}`);
//   const origin = hre.network.name as ChainName;
//   const outbox = hyperlaneCoreAddresses[origin].mailbox;

//   const factory = await hre.ethers.getContractFactory("HyperlaneMessageSender");

//   const contract = await factory.deploy(outbox);
//   await contract.deployTransaction.wait();

//   console.log(
//     `Deployed HyperlaneMessageSender to ${contract.address} on ${hre.network.name} with transaction ${contract.deployTransaction.hash}`
//   );

//   console.log(`You can verify the contracts with:`);
//   console.log(
//     `$ yarn hardhat verify --network ${hre.network.name} ${contract.address} ${outbox}`
//   );
// });

// task(
//   "deploy-message-receiver",
//   "deploys the HyperlaneMessageReceiver contract"
// ).setAction(async (taskArgs, hre) => {
//   console.log(
//     `Deploying HyperlaneMessageReceiver on ${hre.network.name} for messages`
//   );
//   const remote = hre.network.name as ChainName;
//   const mailbox = hyperlaneCoreAddresses[remote].mailbox;

//   const factory = await hre.ethers.getContractFactory(
//     "HyperlaneMessageReceiver"
//   );

//   const contract = await factory.deploy(mailbox);
//   await contract.deployTransaction.wait();

//   console.log(
//     `Deployed HyperlaneMessageReceiver to ${contract.address} on ${hre.network.name} with transaction ${contract.deployTransaction.hash}`
//   );
//   console.log(`You can verify the contracts with:`);
//   console.log(
//     `$ yarn hardhat verify --network ${hre.network.name} ${contract.address} ${mailbox}`
//   );
// });

// task(
//   "send-message-via-HyperlaneMessageSender",
//   "sends a message via a deployed HyperlaneMessageSender"
// )
//   .addParam(
//     "sender",
//     "Address of the HyperlaneMessageSender",
//     undefined,
//     types.string,
//     false
//   )
//   .addParam(
//     "receiver",
//     "address of the HyperlaneMessageReceiver",
//     undefined,
//     types.string,
//     false
//   )
//   .addParam(
//     "remote",
//     "Name of the remote chain on which HyperlaneMessageReceiver is on",
//     undefined,
//     types.string,
//     false
//   )
//   .addParam("message", "the message you want to send", "HelloWorld")
//   .setAction(async (taskArgs, hre) => {
//     const signer = (await hre.ethers.getSigners())[0];
//     const remote = taskArgs.remote as ChainName;
//     const remoteDomain = multiProvider.getDomainId(remote);
//     const senderFactory = await hre.ethers.getContractFactory(
//       "HyperlaneMessageSender"
//     );
//     const sender = senderFactory.attach(taskArgs.sender);

//     console.log(
//       `Sending message "${taskArgs.message}" from ${hre.network.name} to ${taskArgs.remote}`
//     );

//     const tx = await sender.sendString(
//       remoteDomain,
//       utils.addressToBytes32(taskArgs.receiver),
//       taskArgs.message
//     );

//     const receipt = await tx.wait();
//     console.log(
//       `Send message at txHash ${tx.hash}. Check the explorer at https://explorer.hyperlane.xyz/?search=${tx.hash}`
//     );

//     console.log(
//       "Pay for processing of the message via the InterchainGasPaymaster"
//     );
//     const messageId = getMessageIdFromDispatchLogs(receipt.logs);
//     const igpAddress =
//       hyperlaneCoreAddresses[hre.network.name].interchainGasPaymaster;
//     const igp = new hre.ethers.Contract(
//       igpAddress,
//       INTERCHAIN_GAS_PAYMASTER_ABI,
//       signer
//     );
//     const gasPayment = await igp.quoteGasPayment(
//       remoteDomain,
//       DESTINATIONGASAMOUNT
//     );
//     const igpTx = await igp.payForGas(
//       messageId,
//       remoteDomain,
//       DESTINATIONGASAMOUNT,
//       await signer.getAddress(),
//       { value: gasPayment }
//     );
//     await igpTx.wait();

//     const recipientUrl = await multiProvider.tryGetExplorerAddressUrl(
//       remote,
//       taskArgs.receiver
//     );
//     console.log(
//       `Check out the explorer page for receiver ${recipientUrl}#events`
//     );
//   });


// task(
//   "get-ica-address",
//   "Gets the ICA account address for an address on a given chain"
// )
//   .addParam(
//     "address",
//     "The address on the origin chain",
//     undefined,
//     types.string,
//     false
//   )
//   .setAction(async (taskArgs, hre) => {
//     const router = await InterchainAccountRouter__factory.connect(
//       INTERCHAIN_ACCOUNT_ROUTER,
//       hre.ethers.getDefaultProvider()
//     );
//     const originDomain = multiProvider.getDomainId(hre.network.name);
//     const ica = await router["getInterchainAccount(uint32,address)"](
//       originDomain,
//       taskArgs.address
//     );
//     console.info(
//       `The ICA of ${taskArgs.address} on ${hre.network.name} (${originDomain}) is ${ica}`
//     );
//   });

// task(
//   "set-remote-fee",
//   "Allows an Owner contract to set the fee on a remote Ownee contract"
// )
//   .addParam(
//     "owner",
//     "Owner address on the origin chain",
//     undefined,
//     types.string,
//     false
//   )
//   .addParam(
//     "ownee",
//     "Ownee address on the remote chain",
//     undefined,
//     types.string,
//     false
//   )
//   .addParam(
//     "remote",
//     "The name of the remote chain on which the Ownee lives",
//     undefined,
//     types.string,
//     false
//   )
//   .addParam("newFee", "the new fee that should be set", 42, types.float)
//   .setAction(async function (taskArgs, hre) {
//     const factory = await hre.ethers.getContractFactory("Owner");
//     const owner = await factory.attach(taskArgs.owner);
//     const destinationDomain = multiProvider.getDomainId(taskArgs.remote);
//     const tx = await owner.setRemoteFee(
//       destinationDomain,
//       taskArgs.ownee,
//       taskArgs.newFee
//     );
//     await tx.wait();

//     console.log(
//       `Set the fee on Ownee at ${taskArgs.ownee} on ${taskArgs.remote} at transaction ${tx.hash}.`
//     );
//   });

// task("get-fee", "Reads the fee of an Ownee")
//   .addParam("ownee", "The address of the Ownee", undefined, types.string, false)
//   .setAction(async (taskArgs, hre) => {
//     const factory = await hre.ethers.getContractFactory("Ownee");
//     const ownee = factory.attach(taskArgs.ownee);

//     const fee = await ownee.fee();
//     console.info(
//       `The current set fee of ${taskArgs.ownee} on ${hre.network.name} is ${fee}`
//     );
//   });

// task(
//   "deploy-reader",
//   "deploys the OwnerReader contract that can owners of remote contracts"
// ).setAction(async (_, hre) => {
//   console.log(`Deploying OwnerReader on ${hre.network.name}`);
//   const factory = await hre.ethers.getContractFactory("OwnerReader");
//   const contract = await factory.deploy(INTERCHAIN_QUERY_ROUTER);
//   await contract.deployTransaction.wait();

//   console.log(
//     `Deployed OwnerReader to ${contract.address} on ${hre.network.name} with transaction ${contract.deployTransaction.hash}`
//   );
//   console.log(`You can verify the contracts with:`);
//   console.log(
//     `$ yarn hardhat verify --network ${hre.network.name} ${contract.address} ${INTERCHAIN_QUERY_ROUTER}`
//   );
// });

// task("read-remote-owner", "Allows readRemoteOwner on a OwnerReader contract")
//   .addParam(
//     "reader",
//     "OwnerReader address on the origin chain",
//     undefined,
//     types.string,
//     false
//   )
//   .addParam(
//     "target",
//     "contract to read owner() on the remote chain",
//     undefined,
//     types.string,
//     false
//   )
//   .addParam(
//     "remote",
//     "The name of the remote chain on which the target lives",
//     undefined,
//     types.string,
//     false
//   )
//   .setAction(async function (taskArgs, hre) {
//     const factory = await hre.ethers.getContractFactory("OwnerReader");
//     const reader = await factory.attach(taskArgs.reader);
//     const destinationDomain = multiProvider.getDomainId(taskArgs.remote);

//     const tx = await reader.readRemoteOwner(destinationDomain, taskArgs.target);
//     await tx.wait();

//     console.log(
//       `Initiated the owner() query on the contract at ${taskArgs.target} on ${taskArgs.remote} at transaction ${tx.hash}.`
//     );
//   });

// task("get-query-result", "Reads the queryResult on an OwnerReader")
//   .addParam(
//     "reader",
//     "OwnerReader address on the origin chain",
//     undefined,
//     types.string,
//     false
//   )
//   .setAction(async (taskArgs, hre) => {
//     const factory = await hre.ethers.getContractFactory("OwnerReader");
//     const reader = factory.attach(taskArgs.reader);

//     const lastOwner = await reader.lastOwner();
//     const lastTarget = await reader.lastTarget();
//     const lastQueryDomainNumber = await reader.lastDomain();
//     const lastQueryDomain = multiProvider.getDomainId(lastQueryDomainNumber);

//     console.info(
//       `The currently recorded query result on ${taskArgs.reader} is that the owner of ${lastTarget} is ${lastOwner} on ${lastQueryDomain}`
//     );
//   });


task(
  "deploy-message-transceiver",
  "deploys the HyperlaneMessageTransceiver contract"
).setAction(async (taskArgs, hre) => {
  console.log(`Deploying HyperlaneMessageTransceiver on ${hre.network.name}`);
  const origin = hre.network.name as ChainName;
  const outbox = hyperlaneCoreAddresses[origin].mailbox;

  const factory = await hre.ethers.getContractFactory(
    "HyperlaneMessageTransceiver"
  );

  const contract = await factory.deploy(outbox);
  await contract.deployTransaction.wait();

  console.log(
    `Deployed HyperlaneMessageTransceiver to ${contract.address} on ${hre.network.name} with transaction ${contract.deployTransaction.hash}`
  );

  console.log(`You can verify the contracts with:`);
  console.log(
    `$ yarn hardhat verify --network ${hre.network.name} ${contract.address} ${outbox}`
  );
});


task(
  "send-syn-message",
  "sends a message via a deployed HyperlaneMessageTransceiver"
)
  .addParam(
    "sender",
    "Address of the HyperlaneMessageTransceiver",
    undefined,
    types.string,
    false
  )
  .addParam(
    "receiver",
    "address of the HyperlaneMessageTransceiver",
    undefined,
    types.string,
    false
  )
  .addParam(
    "remote",
    "Name of the remote chain on which HyperlaneMessageTransceiver is on",
    undefined,
    types.string,
    false
  )
  .addParam("message", "the message you want to send", "HelloWorld")
  .addParam(
    "first",
    "First integer",
    undefined,
    types.int,
    false
  )
  .addParam(
    "second",
    "Second integer",
    undefined,
    types.int,
    false
  )
  .addParam(
    "operator",
    "ADD = 0, SUB = 1, MUL = 2",
    undefined,
    types.int,
    false
  )
  .setAction(async (taskArgs, hre) => {
    const signer = (await hre.ethers.getSigners())[0];
    const remote = taskArgs.remote as ChainName;
    const network = hre.network.name as ChainName;
    const remoteDomain = multiProvider.getDomainId(remote);
    const originDomain = multiProvider.getDomainId(network);
    const senderFactory = await hre.ethers.getContractFactory(
      "HyperlaneMessageTransceiver"
    );
    const sender = senderFactory.attach(taskArgs.sender);

    console.log(
      `Sending message "${taskArgs.message}" from ${hre.network.name} to ${taskArgs.remote}`
    );

    const tx = await sender.execute(
      remoteDomain,
      utils.addressToBytes32(taskArgs.receiver),
      taskArgs.first, taskArgs.second, taskArgs.operator
    );

    const receipt = await tx.wait();
    console.log(
      `Send message at txHash ${tx.hash}. Check the explorer at https://explorer.hyperlane.xyz/?search=${tx.hash}`
    );

    console.log(
      "Pay for processing of the message via the InterchainGasPaymaster"
    );
    const messageId = getMessageIdFromDispatchLogs(receipt.logs);
    const igpAddress =
      hyperlaneCoreAddresses[hre.network.name].interchainGasPaymaster;
    const igp = new hre.ethers.Contract(
      igpAddress,
      INTERCHAIN_GAS_PAYMASTER_ABI,
      signer
    );
    const gasPayment = await igp.quoteGasPayment(
      remoteDomain,
      DESTINATIONGASAMOUNT
    );
    const igpTx = await igp.payForGas(
      messageId,
      remoteDomain,
      DESTINATIONGASAMOUNT,
      await signer.getAddress(),
      { value: gasPayment }
    );
    await igpTx.wait();

    const recipientUrl = await multiProvider.tryGetExplorerAddressUrl(
      remote,
      taskArgs.receiver
    );
    console.log(
      `Check out the explorer page for receiver ${recipientUrl}#events`
    );
});
  
  
  task(
    "send-ack-message",
    "sends a message via a deployed HyperlaneMessageTransceiver"
  )
    .addParam(
      "sender",
      "Address of the HyperlaneMessageTransceiver",
      undefined,
      types.string,
      false
    )
    .addParam(
      "receiver",
      "address of the HyperlaneMessageTransceiver",
      undefined,
      types.string,
      false
    )
    .addParam(
      "remote",
      "Name of the remote chain on which HyperlaneMessageTransceiver is on",
      undefined,
      types.string,
      false
    )
    .addParam("message", "the message you want to send", "HelloWorld")
    .setAction(async (taskArgs, hre) => {
      const signer = (await hre.ethers.getSigners())[0];
      const remote = taskArgs.remote as ChainName;
      const network = hre.network.name as ChainName;
      const remoteDomain = multiProvider.getDomainId(remote);
      const originDomain = multiProvider.getDomainId(network);
      const senderFactory = await hre.ethers.getContractFactory(
        "HyperlaneMessageTransceiver"
      );
      const sender = senderFactory.attach(taskArgs.sender);
  
      console.log(
        `Echoing message from ${hre.network.name} to ${taskArgs.remote}`
      );
  
      const tx = await sender.returnRes(
        remoteDomain,
        utils.addressToBytes32(taskArgs.receiver)
      );

      const receipt = await tx.wait();
      console.log(
        `Send message at txHash ${tx.hash}. Check the explorer at https://explorer.hyperlane.xyz/?search=${tx.hash}`
      );
  
      console.log(
        "Pay for processing of the message via the InterchainGasPaymaster"
      );
      const messageId = getMessageIdFromDispatchLogs(receipt.logs);
      const igpAddress =
        hyperlaneCoreAddresses[hre.network.name].interchainGasPaymaster;
      const igp = new hre.ethers.Contract(
        igpAddress,
        INTERCHAIN_GAS_PAYMASTER_ABI,
        signer
      );
      const gasPayment = await igp.quoteGasPayment(
        remoteDomain,
        DESTINATIONGASAMOUNT
      );
      const igpTx = await igp.payForGas(
        messageId,
        remoteDomain,
        DESTINATIONGASAMOUNT,
        await signer.getAddress(),
        { value: gasPayment }
      );
      await igpTx.wait();
  
      const recipientUrl = await multiProvider.tryGetExplorerAddressUrl(
        remote,
        taskArgs.receiver
      );
      console.log(
        `Check out the explorer page for receiver ${recipientUrl}#events`
      );
  
    });


task(
  "get-result",
  "Get the result stored in HyperlaneMessageTransceiver"
)
  .addParam(
    "sender",
    "Address of the HyperlaneMessageTransceiver",
    undefined,
    types.string,
    false
  )
  .addParam(
    "receiver",
    "address of the HyperlaneMessageTransceiver",
    undefined,
    types.string,
    false
  )
  .addParam(
    "remote",
    "Name of the remote chain on which HyperlaneMessageTransceiver is on",
    undefined,
    types.string,
    false
  )
  .addParam("message", "the message you want to send", "HelloWorld")
  .setAction(async (taskArgs, hre) => {

    const senderFactory = await hre.ethers.getContractFactory(
      "HyperlaneMessageTransceiver"
    );
    const sender = senderFactory.attach(taskArgs.sender);

    console.log(
      `Echoing message from ${hre.network.name} to ${taskArgs.remote}`
    );

    const lastResult = await sender.result();
    console.log(
      `Last result in the origin chain: ${lastResult}`
    );
  });

  async function chain_estimator(source_network, igp){
    let remote_arr = ["alfajores", "fuji", "goerli", "sepolia", "mumbai"];
    // let remote_arr = ["arbitrum", "avalanche", "bsc", "celo", "ethereum", "polygon"];
    let gas_fee_dict = new Map<string, number>();
    let min = Infinity;
    let min_remote = "";
  
    for (var remote_srt of remote_arr){
      if (source_network == remote_srt)
        continue;
      
      const remote = remote_srt as ChainName;
      const network = source_network as ChainName;
      const remoteDomain = multiProvider.getDomainId(remote);
  
      const gasPayment = await igp.quoteGasPayment(
        remoteDomain,
        DESTINATIONGASAMOUNT
      );
  
      gas_fee_dict.set(remote_srt, gasPayment);
      if(gasPayment - min < 0){
        min = gasPayment;
        min_remote = remote_srt;
      }
  
    }
    console.log(gas_fee_dict);
    return min_remote;
  }
  
  task(
    "chain-estimator",
    "sends a message via a deployed HyperlaneMessageTransceiver"
  )
    .setAction(async (taskArgs, hre) => {
      const signer = (await hre.ethers.getSigners())[0];
      
      const igpAddress = hyperlaneCoreAddresses[hre.network.name].interchainGasPaymaster;
  
      const igp = new hre.ethers.Contract(
      igpAddress,
      INTERCHAIN_GAS_PAYMASTER_ABI,
      signer
      );
      
      const min_remote = await chain_estimator(hre.network.name, igp);
      // console.log(result);
      console.log(min remote: ${min_remote})
  });

export default config;

function getMessageIdFromDispatchLogs(logs: Log[]) {
  const mailboxInterface = new ethers.utils.Interface(MAILBOX_ABI);
  for (const log of logs) {
    try {
      const parsedLog = mailboxInterface.parseLog(log);
      if (parsedLog.name === "DispatchId") {
        return parsedLog.args.messageId;
      }
    } catch (e) {}
  }
  return undefined;
}

