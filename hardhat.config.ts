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
require("dotenv").config();

// TODO loosen hyperlaneCoreAddresses type in SDK to work with ChainName keys
const hyperlaneCoreAddresses = HyperlaneCoreAddresses;

const privateKey = process.env.PRIVATE_KEY?.toString();
const accounts = privateKey ? [privateKey] : [];

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
  .addParam("first", "First integer", undefined, types.int, false)
  .addParam("second", "Second integer", undefined, types.int, false)
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
      `Sending operands "${taskArgs.first}" and "${taskArgs.second}" from ${hre.network.name} to ${taskArgs.remote}`
    );

    const tx = await sender.execute(
      remoteDomain,
      utils.addressToBytes32(taskArgs.receiver),
      taskArgs.first,
      taskArgs.second,
      taskArgs.operator
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

task("get-result", "Get the result stored in HyperlaneMessageTransceiver")
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
    console.log(`Last result in the origin chain: ${lastResult}`);
  });

async function chain_estimator(source_network, igp) {
  let remote_arr = ["alfajores", "fuji", "mumbai"];
  // let remote_arr = ["arbitrum", "avalanche", "bsc", "celo", "ethereum", "polygon"];
  let gas_fee_dict = new Map<string, number>();
  let min = Infinity;
  let min_remote = "";

  for (var remote_srt of remote_arr) {
    if (source_network == remote_srt) continue;

    const remote = remote_srt as ChainName;
    const network = source_network as ChainName;
    const remoteDomain = multiProvider.getDomainId(remote);

    const gasPayment = await igp.quoteGasPayment(
      remoteDomain,
      DESTINATIONGASAMOUNT
    );

    gas_fee_dict.set(remote_srt, gasPayment);
    if (gasPayment - min < 0) {
      min = gasPayment;
      min_remote = remote_srt;
    }
  }
  console.log(gas_fee_dict);
  return [min_remote, min];
}

task(
  "chain-estimator",
  "sends a message via a deployed HyperlaneMessageTransceiver"
).setAction(async (taskArgs, hre) => {
  const signer = (await hre.ethers.getSigners())[0];

  const igpAddress =
    hyperlaneCoreAddresses[hre.network.name].interchainGasPaymaster;

  const igp = new hre.ethers.Contract(
    igpAddress,
    INTERCHAIN_GAS_PAYMASTER_ABI,
    signer
  );

  let min_remote = await chain_estimator(hre.network.name, igp);
  // console.log(result);
  console.log(`Chain: ${min_remote[0]} Estimation: ${min_remote[1]}`);
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
