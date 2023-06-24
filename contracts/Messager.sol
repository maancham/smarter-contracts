// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@hyperlane-xyz/core/interfaces/IMailbox.sol";

contract Messager {
    IMailbox outbox;
    IMailbox inbox;
    bytes32 public lastSender;
    string public lastMessage;
    string public newMessage;
    uint32 public arg1;
    uint32 public arg2;
    
    event SentMessage(uint32 destinationDomain, bytes32 recipient, string message);
    event ReceivedMessage(uint32 origin, bytes32 sender, bytes message);

    constructor(address _inbox, address _outbox) {
        inbox = IMailbox(_inbox);
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

      //TODO: execute F(a,b), when it's done return the result for F(a,b)
      newMessage = string(abi.encodePacked("Hi ", _message));
      outbox.dispatch(_origin, _sender, bytes(newMessage));
      emit SentMessage(_origin, _sender, newMessage);
    }
}
