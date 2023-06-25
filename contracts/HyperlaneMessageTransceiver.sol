// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@hyperlane-xyz/core/interfaces/IMailbox.sol";

contract HyperlaneMessageTransceiver {
    uint256 public constant ADD = 0;
    uint256 public constant SUB = 1;
    uint256 public constant MUL = 2;

    uint256 public constant EXEC = 0;
    uint256 public constant RET = 1;

    IMailbox outbox;
    uint256 public result;
    bytes32 public lastSender;
    uint32 public lastDomain;

    event SentExecutionMessage(uint32 destinationDomain, bytes32 recipient, uint256 a, uint256 b);
    event SentResolutionMessage(uint32 destinationDomain, bytes32 recipient, uint256 result);

    event ReceivedExecutionMessage(uint32 origin, bytes32 sender, uint256 a, uint256 b);
    event ReceivedResolutionMessage(uint32 origin, bytes32 sender, uint256 result);

    constructor(address _outbox) {
        outbox = IMailbox(_outbox);
        result = 0;
    }

    function execute (
        uint32 _destinationDomain,
        bytes32 _recipient,
        uint256 a,
        uint256 b,
        uint256 op
    ) external {
        bytes memory modifiedPayload = abi.encode(EXEC, op, a, b);

        outbox.dispatch(_destinationDomain, _recipient, modifiedPayload);
        emit SentExecutionMessage(_destinationDomain, _recipient, a, b);
    }

    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata payload
    ) external {
        lastSender = _sender;
        lastDomain = _origin;

        uint256 handleType = (uint256)((bytes32)(payload[0:32]));

        if (handleType == EXEC) {
            uint256 op = (uint256)((bytes32)(payload[32:64]));
            uint256 a = (uint256)((bytes32)(payload[64:96]));
            uint256 b = (uint256)((bytes32)(payload[96:128]));

            if (op == ADD) {
                result = a + b;
            } else if (op == SUB) {
                result = a - b;
            } else if (op == MUL) {
                result = a * b;
            } else {
                revert("Execution: Invalid operator");
            }

            emit ReceivedExecutionMessage(_origin, _sender, a, b);

        } else if (handleType == RET) {
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
