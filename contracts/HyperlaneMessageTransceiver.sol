// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@hyperlane-xyz/core/interfaces/IMailbox.sol";

contract HyperlaneMessageTransceiver {
    // Sender

    IMailbox outbox;
    uint256 public result;

    event SentExecutionMessage(uint32 destinationDomain, bytes32 recipient, uint256 a, uint256 b);
    event SentResolutionMessage(uint32 destinationDomain, bytes32 recipient, uint256 result);

    constructor(address _outbox) {
        outbox = IMailbox(_outbox);
        result = 0;
    }

    function add (
        uint32 _destinationDomain,
        bytes32 _recipient,
        uint256 a,
        uint256 b
    ) external {
        uint256 tag = 0;
        bytes memory modifiedPayload = abi.encode(tag, a, b);

        outbox.dispatch(_destinationDomain, _recipient, modifiedPayload);
        emit SentExecutionMessage(_destinationDomain, _recipient, a, b);
    }

    // Receiver

    bytes32 public lastSender;
    uint32 public lastDomain;

    event ReceivedExecutionMessage(uint32 origin, bytes32 sender, uint256 a, uint256 b);
    event ReceivedResolutionMessage(uint32 origin, bytes32 sender, uint256 result);

    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata payload
    ) external {
      lastSender = _sender;
      lastDomain = _origin;

			uint256 tag = (uint256)((bytes32)(payload[0:32]));

			if (tag == 0) {
				uint256 a = (uint256)((bytes32)(payload[32:64]));
				uint256 b = (uint256)((bytes32)(payload[64:96]));
				result = a + b;
				emit ReceivedExecutionMessage(_origin, _sender, a, b);
			} else if (tag == 1) {
				uint256 _result = (uint256)((bytes32)(payload[32:64]));
				result = _result;
				emit ReceivedResolutionMessage(_origin, _sender, result);
			}
    }

    function returnRes(
        uint32 _destinationDomain,
        bytes32 _recipient
    ) external {
        uint256 tag = 1;
        bytes memory modifiedPayload = abi.encode(tag, result);

        outbox.dispatch(_destinationDomain, _recipient, modifiedPayload);
        emit SentResolutionMessage(_destinationDomain, _recipient, result);
    }
}
