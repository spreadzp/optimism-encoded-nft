var ENCNFT = artifacts.require("ENCNFT");
var Marketplace = artifacts.require("Marketplace");

const ether = (n) => {
  return new web3.utils.BN(
    web3.utils.toWei(n.toString(), 'ether')
  )
}

async function logNftLists(marketplace) {
    let listedNfts = await marketplace.getListedNfts.call()
    const accountAddress = '0xe3Cde08A5508c1179cC690a093F6Be7270790b88'
    let myNfts = await marketplace.getMyNfts.call({from: accountAddress})
    let myListedNfts = await marketplace.getMyListedNfts.call({from: accountAddress})
    console.log(`listedNfts: ${listedNfts.length}`)
    console.log(`myNfts: ${myNfts.length}`)
    console.log(`myListedNfts ${myListedNfts.length}\n`)
}

const main = async (cb) => {
  try {
    const accounts = await web3.eth.getAccounts()

    // // Fetch the deployed exchange
    // const exchange = await Exchange.deployed()
    // console.log('Exchange fetched', exchange.address)

    // // Set up exchange users
    // const user1 = accounts[0]

    // // User 1 Deposits Ether
    // amount = 2
    // await exchange.depositEther({ from: user1, value: ether(amount) })
    // console.log(`Deposited ${amount} Ether from ${user1}`)
    const encNFT = await ENCNFT.deployed()
    const marketplace = await Marketplace.deployed()
console.log('accounts :>>', accounts)
    console.log('MINT AND LIST 3 NFTs')
    let listingFee = await marketplace.getListingFee()
    listingFee = listingFee.toString() 
    console.log("🚀 ~ file: run.js ~ line 41 ~ main ~ listingFee", listingFee)
    let txn1 = await encNFT.mint("URI1", "SECRET1")
    // console.dir( txn1.logs)
    let tokenId1 = txn1.logs[2].args[0].toNumber()
    console.log("🚀 ~ file: run.js ~ line 25 ~ main ~ tokenId1", tokenId1) 
    const sellerTx = await marketplace.moveTokenForSell( tokenId1, "Seller message", listingFee, encNFT.address, {from: accounts[0], value: listingFee})
    console.log("🚀 ~ file: run.js ~ line 47 ~ main ~ sellerTx", sellerTx.logs)
    const makeBetTx = await marketplace.makeBet(  tokenId1,"publKey",  accounts[1], "goalPurchase", {value: listingFee, from: accounts[1]})
    console.log("🚀 ~ file: run.js ~ line 47 ~ main ~ makeBetTx", makeBetTx.logs)
    const acceptTx = await marketplace.acceptRateAndTransferToken( tokenId1, accounts[1], "0xDDAA", {from: accounts[0]})
    console.log("🚀 ~ file: run.js ~ line 48 ~ main ~ acceptTx", acceptTx.logs)
    // 
    // console.log(`Minted and listed ${tokenId1}`)
    // let txn2 = await encNFT.mint("URI1", "SECRET2")
    // let tokenId2 = txn2.logs[2].args[0].toNumber()
    // await marketplace.listNft(encNFT.address, tokenId2, 1, {value: listingFee})
    // console.log(`Minted and listed ${tokenId2}`)
    // let txn3 = await encNFT.mint("URI1", "SECRET3")
    // let tokenId3 = txn3.logs[2].args[0].toNumber()
    // await marketplace.listNft(encNFT.address, tokenId3, 1, {value: listingFee})
    // console.log(`Minted and listed ${tokenId3}`)
    //await logNftLists(marketplace)

    // console.log('BUY 2 NFTs')
    // await marketplace.buyNft(encNFT.address, tokenId1, {value: 1})
    // await marketplace.buyNft(encNFT.address, tokenId2, {value: 1})
   // await logNftLists(marketplace)

    // console.log('RESELL 1 NFT')
    // await marketplace.resellNft(encNFT.address, tokenId2, 1, {value: listingFee})
    // await logNftLists(marketplace)

  } catch(err) {
    console.log('Doh! ', err);
  }
  cb();
}

module.exports = main;