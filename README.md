# Smarter Contracts

## Setup

```shell
$ yarn install
```

## Hardhat

```shell
$ yarn hardhat compile
```

### Using Message Transceiver

```shell
$ yarn hardhat deploy-message-transceiver --network $originChain
$ yarn hardhat deploy-message-transceiver --network $remoteChain
```

### Sending Syn and Ack Messages

```shell
# Syn
$ yarn hardhat send-syn-message --sender $origin --receiver $remote --remote $remoteChain --network $originChain --first $first --second $second --operator $operator

# Ack
$ yarn hardhat send-ack-message --sender $remote --receiver $origin --remote $originChain --network $remoteChain
```


## Foundry

_More details coming soon_
