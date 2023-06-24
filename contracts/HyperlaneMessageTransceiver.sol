// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@hyperlane-xyz/core/interfaces/IMailbox.sol";

contract HyperlaneMessageTransceiver {
    // Sender

    IMailbox outbox;
    event SentMessage(uint32 destinationDomain, bytes32 recipient, string message);

    constructor(address _outbox) {
        outbox = IMailbox(_outbox);
    }

    function sendString(
        uint32 _destinationDomain,
        bytes32 _recipient,
        string calldata _message
    ) external {
        outbox.dispatch(_destinationDomain, _recipient, bytes(_message));
        emit SentMessage(_destinationDomain, _recipient, _message);
    }

    // Receiver

    bytes32 public lastSender;
    string public lastMessage;

    event ReceivedMessage(uint32 origin, bytes32 sender, bytes message);

    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _message
    ) external {
      lastSender = _sender;
      lastMessage = string(_message);
      emit ReceivedMessage(_origin, _sender, _message);
    }

}
