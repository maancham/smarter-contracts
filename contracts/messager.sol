// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@hyperlane-xyz/core/interfaces/IMailbox.sol";

contract Messager {
    IMailbox outbox;
    bytes32 public lastSender;
    string public lastMessage;
    
    event SentMessage(uint32 destinationDomain, bytes32 recipient, string message);
    event ReceivedMessage(uint32 origin, bytes32 sender, bytes message);

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

    //TODO: you need to recieve a methodID and return the method execution result
    //TODO: then as sender it should be able to recieve the execution result, so adding the handle
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
