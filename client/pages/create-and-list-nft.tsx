import { use, useEffect, useState } from 'react'
import Web3 from 'web3'
import Web3Modal from 'web3modal'
import { useRouter } from 'next/router'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { BeakerIcon, VideoCameraSlashIcon } from '@heroicons/react/24/solid'
import Marketplace from '../contracts/optimism-contracts/Marketplace.json'
import ENCNFT from '../contracts/optimism-contracts/ENCNFT.json'
import { encryptData, getNewAccount } from '../utils/cypher'
import { metamaskEncryptData } from '../utils/metamask'
import { env } from './../next.config'
import { getTemplateByTypeFile } from '../utils/common'
import Loader from './loader'


const auth =
  'Basic ' + Buffer.from(env.NEXT_PUBLIC_IPFS_KEY + ':' + env.NEXT_PUBLIC_IPFS_SECRET).toString('base64');

const client = ipfsHttpClient({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
});

export default function CreateItem() {
  // const [fileUrl, setFileUrl] = useState(null as null | string)
  const [isUploadToIpfs, setIsUploadToIpfs] = useState(false)
  const [newPrivateKey, setNewPrivateKey] = useState('')
  const [enableMint, setEnableMint] = useState(false)
  const [newPublicKey, setNewPublicKey] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [base64FileData, setBase64FileData] = useState('')
  const [encryptedData, setEncryptedData] = useState('');
  const [encPrKByOwnerAddress, setEncPrKByOwnerAddress] = useState('');
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })
  const [typeFile, setTypeFile] = useState("")
  const router = useRouter()
  const [isProcessMint, setIsProcessMint] = useState(false)

  useEffect(() => {
    if (base64FileData) {
      const encryptPrivateKeyForNFTFile = async () => {
        const web3Modal = new Web3Modal()
        const provider = await web3Modal.connect()
        const web3 = new Web3(provider)
        const accounts = await web3.eth.getAccounts()
        const encData = await encryptData(accounts[0], newPrivateKey)
        if (encData !== '') {
          setEncPrKByOwnerAddress(encData)
        }
      }
      encryptPrivateKeyForNFTFile()

    }
  }, [base64FileData]);

  useEffect(() => {
    const encodeFile = async () => {
      try {

        if (base64FileData && newPublicKey) {

          const encData = await metamaskEncryptData(base64FileData, newPublicKey)
          if (encData !== '') {
            setEncryptedData(encData)
          }

        }
      } catch (error) {
        console.log('Error uploading file: ', error)
      }
    }
    encodeFile()
  }, [newPublicKey, base64FileData]);

  async function onChange(e: any) {
    const file = e.target.files[0]
    generateKeys()
    createImage(file)
  }

  const defineTypeFile = (base64Code: string) => {
    return base64Code.split(';')[0].split('/')[0].split(":")[1];
  }
  const createImage = async (file: any) => {
    const reader = new FileReader()
    // eslint-disable-next-line
    reader.onload = async (e: any) => {
      // this.image = e.target.result
      const res = await reader.result?.toString()
      if (res) {
        setBase64FileData(res)
        setTypeFile(defineTypeFile(res))
      }
    }
    reader.readAsDataURL(file)
  }
  const generateKeys = () => {
    const newIdentity = getNewAccount()
    setNewPrivateKey(newIdentity.privateKey)
    setNewPublicKey(newIdentity.publicKey)
    setNewAddress(newIdentity.address)
  }

  useEffect(() => {
    const { name, description, price } = formInput
    if (name && description && +price > 0 && encryptedData && encPrKByOwnerAddress) {
      setEnableMint(true)

    } else {
      setEnableMint(false)
    }
  }, [formInput, encryptedData, encPrKByOwnerAddress]);

  async function uploadToIPFS() {
    const { name, description, price } = formInput
    if (!name || !description || !price || !encryptedData) {
      return
    } else {

      try {

        const uploadedEncImage = await client.add(encryptedData)
        if (uploadedEncImage) {
          const uploadedEncImageUrl = `https://caravan.infura-ipfs.io/ipfs/${uploadedEncImage.path}`
          console.log("🚀 ~ file: create-and-list-nft.tsx:136 ~ uploadToIPFS ~ uploadedEncImageUrl", uploadedEncImageUrl)
          const data = JSON.stringify({
           
            name, description: `${typeFile};${description}`, image: uploadedEncImageUrl
          })
          const added = await client.add(data)
          const url = `https://caravan.infura-ipfs.io/ipfs/${added.path}`
          console.log("🚀 ~ file: create-and-list-nft.tsx ~ line 158 ~ uploadToIPFS ~ url", url)
          return url
        }

      } catch (error) {
        console.log('Error uploading file: ', error)
      } finally {
        setBase64FileData("")
        setIsUploadToIpfs(false)
      }
    }
  }

  async function listNFTForSale() {
    const web3Modal = new Web3Modal()
    const provider = await web3Modal.connect()
    const web3 = new Web3(provider)
    setIsUploadToIpfs(true)
    const url = await uploadToIPFS()

    setIsProcessMint(true)
    const networkId = await web3.eth.net.getId()
    // Mint the NFT
    const encodedNftContractAddress = ENCNFT.networks[`${networkId}` as keyof typeof ENCNFT.networks].address
    const encodedNftContract = new web3.eth.Contract(ENCNFT.abi as any, encodedNftContractAddress)
    const accounts = await web3.eth.getAccounts()
    const marketPlaceContract = new web3.eth.Contract(Marketplace.abi as any, Marketplace.networks[`${networkId}` as keyof typeof Marketplace.networks].address)
    let listingFee = await marketPlaceContract.methods.getListingFee().call()
    listingFee = listingFee.toString()
    encodedNftContract.methods.mint(url, encPrKByOwnerAddress).send({
      from: accounts[0], 
    }).on('receipt', function (receipt: any) {
      // List the NFT
      const tokenId = receipt.events.NFTMinted.returnValues[0];
      console.log("🚀 ~ file: create-and-list-nft.tsx ~ line 199 ~ encodedNftContract.methods.mint ~ tokenId", tokenId)
      if (tokenId) {

        marketPlaceContract.methods.moveTokenForSell(tokenId, "Listing announce", Web3.utils.toWei(formInput.price, "ether"), encodedNftContractAddress)//Web3.utils.toWei(formInput.price, "ether"))
          .send({ from: accounts[0], value: listingFee }).on('receipt', function () {
            console.log('listed')
            setIsProcessMint(false)
            router.push('/')
          });
      }
    }).on('error', (err: any) => {
      console.log("🚀 ~ file: create-and-list-nft.tsx ~ line 200 ~ encodedNftContract.methods.mint ~ err", err)
      setIsProcessMint(false)
    });
  }


  return (
    <div className="flex items-start justify-center main-h brand-bg">
      <div className="flex flex-col  create-form border-rose-500 p-5">
        <label htmlFor="name-nft" className='text-xl font-bold text-white' >NAME </label>
        <input
          name="name-nft"
          placeholder="Asset Name"
          className="mb-5 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
        />

        <label htmlFor="description" className='text-xl font-bold text-white' >Description </label>
        <textarea
          placeholder="Asset Description" name="description"
          className="mb-5 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
        />
        <label htmlFor="price" className='text-xl font-bold text-white' >Price </label>
        <input
          name="price"
          type="number"
          placeholder="Asset Price in Eth"
          className="mb-5 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
        />
        {/* <label htmlFor="file" className='text-xl font-bold text-white' >Choose content for the NFT </label> */}
        <input
          name="file"
          type="file"
          className="my-4"
          onChange={onChange}
        />
        {
          base64FileData &&
          getTemplateByTypeFile(base64FileData, typeFile)
        }
        {isUploadToIpfs && enableMint &&
        <Loader />
       
        }
        {!isUploadToIpfs && enableMint && !isProcessMint && <button onClick={listNFTForSale} className="font-bold mint-btn rounded mt-10 p-4 shadow-lg">
          Mint and list NFT
        </button>}
        {isProcessMint && enableMint && <button type="button" className="font-bold mint-btn text-white rounded mt-10 p-4 shadow-lg" disabled>Approve in Metamask</button>}
      </div>
    </div>
  )
}
 
        