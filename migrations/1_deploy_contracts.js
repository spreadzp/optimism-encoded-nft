
var Marketplace = artifacts.require("Marketplace");
var EncNft = artifacts.require("ENCNFT");

module.exports = async function(deployer) {


  await deployer.deploy(Marketplace); 
  const marketplace = await Marketplace.deployed(); 
  await deployer.deploy(EncNft, marketplace.address);
  const eNft = await EncNft.deployed(); 
  await marketplace.setNFTContract(eNft.address);
}