import { Web3InstanceProps } from './../interfaces/types';
import Web3 from 'web3';
import Web3Modal from 'web3modal';
import Marketplace from '../contracts/optimism-contracts/Marketplace.json'
import EncodedNft from '../contracts/optimism-contracts/ENCNFT.json'


export async function getWeb3Instance(): Promise<Web3InstanceProps> {
    try{
        const web3Modal = new Web3Modal()
        const provider = await web3Modal.connect()
        const web3 = new Web3(provider)
        const networkId = await web3.eth.net.getId()
        const accounts = await web3.eth.getAccounts();
        const currentAddress = accounts[0]    
        // Get all listed NFTs
        if(networkId !== 420) {
            throw Error("it works for only Optimism-Goerly network now")
        }
        const marketPlaceContract = new web3.eth.Contract(Marketplace.abi as any, Marketplace.networks[`${networkId}` as keyof typeof Marketplace.networks]?.address)
    
        const encodedNftContract = new web3.eth.Contract(EncodedNft.abi as any, EncodedNft.networks[`${networkId}` as keyof typeof EncodedNft.networks]?.address)    
    
        return { currentAddress: currentAddress, marketPlaceContract: marketPlaceContract, encNftContract: encodedNftContract, web3Instance: web3 }
    } catch(err) {
        console.log('err', err)
        alert('Need to use Metamask wallet with Optimism-Goerly network')
        return {} as Web3InstanceProps
    }
}