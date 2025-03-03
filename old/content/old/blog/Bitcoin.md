+++
date = "2020-11-11T12:00:00+01:00"
title = "My experience with Bitcoin and forks since 2011 (Multibit to Electrum wallet migration)"
tags = ["bitcoin", "Multibit", "Electrum", "DeFi"]
categories = ["bitcoin", "cryptocurrency", "howto"]
+++


## Introduction
I was a pioneer of Bitcoin, I began my adventure mining Bitcoin in 2011. Nowadays there is a huge hype around Bitcoin and in generally speaking around Alternative Coins and Decentralized Finance (#DeFi) but was very geeky at the beginning.
It was fun to be able to create some coins with only my computer power.
My little capital survived some windstorms like [2014 bitcoin exchange Mt.Gox bankrupt](https://en.wikipedia.org/wiki/Mt._Gox), [2018 speculative financial Cryptocurrency bubble](https://en.wikipedia.org/wiki/Cryptocurrency_bubble), [bitcoin halving](https://medium.com/coinmonks/how-the-bitcoin-halving-impacts-bitcoins-price-ac7ba87706f1), [bitcoin forks](https://en.wikipedia.org/wiki/List_of_bitcoin_forks), [Segregated Witness (SegWit)](https://en.wikipedia.org/wiki/SegWit), and the upcoming Nov 2020 [Bitcoin Cash Node (BCHN)](https://bitcoincashnode.org/).
You could find more [up-to-date information and chats about Bitcoin](https://www.coinwarz.com/mining/bitcoin) and some cryptocurrency mining profitability calculator.


## Bitcoin (BTC) since 2011: mining and saving
At the time the world was completed different and this technology was known mostly by nerdy geeks. It was possible to mine Bitcoin from your home workstations. The mining program was text only because was focus on performance and not on beauty output so it was very similar to Matrix. The algorithm started to become difficult and difficult so someone thinks to join forces and split the profit with [pooled mining](https://en.bitcoin.it/wiki/Pooled_mining). So I joined [
Slush Pool: Worlds's first Bitcoin mining pool](https://slushpool.com/stats/).
My equipment was only a [Macbook Pro notebook with Nvidia GeForce 320M model MC374T/A](https://en.wikipedia.org/wiki/MacBook_Pro#Second_generation_(Unibody)) and a dual processors custom made home server.

## CGMiner
I was using [cgminer](https://github.com/ckolivas/cgminer), an open-source program optimized for CPU and Nvidia GPU.
Believe me or not the GPU superiority was already touchable.
Once I reach the payout threshold the mining pool split the gain between the people that shared resources.
I was mining the only Bitcoin because at the time was the upstream technology but some friends also tried  [Litecoin](https://en.wikipedia.org/wiki/Litecoin), [Monero](https://en.wikipedia.org/wiki/Monero_(cryptocurrency)), [Zcash](https://en.wikipedia.org/wiki/Zcash), and the funny [Dogecoin](https://en.wikipedia.org/wiki/Dogecoin) that were easy to mine. Some money exchanged also that, some required to convert in Bitcoin. Everything was so vibrant at the time.

## Store Bitcoin in a local wallet
I preferred to store my Bitcoin in a local wallet application.
This was a wise decision considering [February 2014 bitcoin exchange Mt.Gox bankrupt](https://en.wikipedia.org/wiki/Mt._Gox).

## Bitcoin (BTC): Multibit - a deprecated local wallet
I stored my virtual coins in [Multibit client](https://directory.fsf.org/wiki/MultiBit) since 2011 because it was reliable, open-source project, multi-platform, and local wallet working in the Bitcoin network (BTC).


### DEPRECATED since 2017
The only drawback was the requirement to download the full blockchain before being able to execute any operation [16.5GB as of April 2014](https://www.blockchain.com/charts/blocks-size). [An interesting article about the scalability of the Bitcoin Blockchain size](https://towardsdatascience.com/the-blockchain-scalability-problem-the-race-for-visa-like-transaction-speed-5cce48f9d44).
It was a great wallet but deprecated since July 26, 2017.
I was storing my Bitcoin in it till November 2020.


## Export private keys
Essentially Multibit is a Java application so you only need to type the right command and it will start.

1. start the dashboard

Open your `Terminal` and type:
```
$ java -jar /Applications/MultiBit.app/Contents/Resources/Java/multibit-exe.jar
```

![Multibit dashboard](img/bitcoin/multibit.png)

2. export private keys from the dashboard

Select in the menu Tools > Export Private Keys. Please mark the `Do not password protect file` option.
![Multibit private key export process](img/bitcoin/multibit_export.png)

3. copy and paste your private keys in a safe place

After the export was successful you could find your private keys encoded in Base58 format in this file 
```
$ cat "/Users/luca/Library/Application Support/MultiBit/portafoglio.key"
# KEEP YOUR PRIVATE KEYS SAFE !
# Anyone who can read this file can spend your bitcoin. 
#
# Format: 
#   <Base58 encoded private key>[<whitespace>[<key createdAt>]] 
#
#   The Base58 encoded private keys are the same format as
#   produced by the Satoshi client/ sipa dumpprivkey utility. 
#
#   Key createdAt is in UTC format as specified by ISO 8601
#   e.g: 2011-12-31T16:42:00Z . The century, 'T' and 'Z' are mandatory
#
fakePrivateKeyDoNotCopyAndPAstePlease00000000000000 2011-01-01T00:00:01Z
# End of private keys
```
Once you got your private key you're able to import in a modern client like Electrum.


## PyWallet CLI tool
[PyWallet](https://github.com/jackjack-jj/pywallet) could be a useful tool if you need to handle any old `wallet.dat` files:
```
$ python2 pywallet.py --web
```

## Bitcoin (BTC): Electrum - a modern local wallet

[Electrum](https://electrum.org/) is a modern wallet to operate in the Bitcoin (BTC) network.

![Electrum dashboard](img/bitcoin/electrum.png)



# Bitcoin forks
The bitcoin community grows up and also the culture and the discussions about alternative implementations and possible [bitcoin forks](https://en.wikipedia.org/wiki/List_of_bitcoin_forks) like  Bitcoin XT, Bitcoin Classic, Bitcoin Unlimited.
The major discussions are about the scalability of the platform because the [Blockchain](https://en.wikipedia.org/wiki/Blockchain), the base technology for the registry of any transaction, are becoming huge and CPU intensive.
More technical details are inside the [Segregated Witness (SegWit)](https://en.wikipedia.org/wiki/SegWit).

The following hard forks created some independent alternative coins:
* [Bitcoin Cash (BCH)](https://www.bitcoincash.org/): 1 August 2017, for each bitcoin (BTC) since block 478558
	* [Bitcoin SV (BSV)](https://bitcoinsv.io/): 15 November 2018, for each Bitcoin Cash (BCH) since block 556766
	* [Bitcoin Cash Node (BCHN)](https://bitcoincashnode.org/): 15 November 2020, for each Bitcoin Cash (BCH) since block TBD
* [Bitcoin Gold (BTG)](https://bitcoingold.org/): 24 October 2017, for each bitcoin (BTC) since block 491407

Since 2011 Bitcoin had a lot of evolution and some fork too. The funny thing is that my keys were so old that are valid in the various networks.

## Bitcoin Cash (BCH): Electron Cash
[Electron Cash](https://electroncash.org/) is a fork of [Electrum](https://electrum.org/) to operate in the Bitcoin Cash (BCH) network.

![Electron Cash dashboard](img/bitcoin/electronCash.png)

## Bitcoin SV (BSV): Electrum SV
[Electrum SV](https://electrumsv.io/) is a fork of [Electrum](https://electrum.org/) to operate in the Bitcoin SV (BSV) network.

![Electron SV dashboard](img/bitcoin/electronSV.png)

## Bitcoin Gold (BTG): ElectrumG
[ElectrumG](https://bitcoingold.org/electrumg-guide/) is a fork of [Electrum](https://electrum.org/) to operate in the Bitcoin Gold (BTG) network.

![ElectrumG dashboard](img/bitcoin/electrumG.png)

## Bitcoin Diamond (BCD): Electrum-BCD
[Electrum-BCD](https://electrum-bcd.org/) is a fork of [Electrum](https://electrum.org/) to operate in the Bitcoin Diamond (BCD) network.

![Electrum-BCD dashboard](img/bitcoin/ElectrumBCD.png)

{{< buymeapizza >}}