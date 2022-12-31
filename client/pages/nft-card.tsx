
import { useState } from 'react';
import Link from "next/link";
import axios from 'axios';
import { DocumentChartBarIcon, GifIcon, MusicalNoteIcon, DocumentTextIcon, VideoCameraIcon } from '@heroicons/react/24/solid'
import { NFTProps } from "../interfaces/types";
import { getTemplateByTypeFile } from "../utils/common";
import { decryptPrivateKey, decryptUriFile } from '../utils/metamask';
import Loader from './loader';

type NftCardProps = {
  nftItem: NFTProps,
  index: number,
  userAddress: string
}
function NftCard({ nftItem, index, userAddress }: NftCardProps) {
  const [decodedFile, setDecodedFile] = useState(nftItem?.image?.split(',')[0].split(";")[1])
  const [nft, setNft] = useState(nftItem)
  const [expanded, setExpanded] = useState(false)
  const handledDescription = nft?.description?.split(';') ?? ['']
  const [isLoadedContent, setIsLoadedContent] = useState(false)

  const decryptData = async (nft: NFTProps) => {
    try{
      setIsLoadedContent(true)
      const dk = await decryptPrivateKey(nft.encodedInfo, userAddress);
      const encodedImageData = await axios.get(nft?.image ?? '')
      if (dk && encodedImageData) {
        const dm = await decryptUriFile(encodedImageData.data, dk);
        nft.image = dm
        setNft(nft)
        setDecodedFile(nft.image?.split(',')[0].split(";")[1])
      }
    }catch (err: any) {
      console.log('err', err)
    } finally{
      setIsLoadedContent(false)
    } 
  }

  const getTypeContentIcon = (type: string) => {
    switch (type) {
      case 'image': return (<GifIcon className="h-60 w-60 brand-color" title='Encrypted image content'> </GifIcon>)
      case 'video': return (<VideoCameraIcon className="h-60 w-60 brand-color" title='Encrypted video content'> </VideoCameraIcon>)
      case 'audio': return (<MusicalNoteIcon className="h-60 w-60 brand-color" title='Encrypted audio content'> </MusicalNoteIcon>)
      case 'application': return (<DocumentChartBarIcon className="h-60 w-60 brand-color" title='Encrypted application content'> </DocumentChartBarIcon>)
      case 'text': return (<DocumentTextIcon className="h-60 w-60 brand-color" title='Encrypted text content'> </DocumentTextIcon>)
      default: return (<DocumentTextIcon className="h-60 w-60 brand-color" title='Encrypted any content'> </DocumentTextIcon>)
    }
  }
  return (<>
    <div key={index} className="border shadow rounded-xl overflow-hidden">
      {isLoadedContent ? <Loader /> : decodedFile === 'base64' ? <div className='m-4 pl-1'>{getTemplateByTypeFile(nft?.image ?? "", handledDescription[0])}</div> :
        <div className="ml-16">{getTypeContentIcon(handledDescription[0])}</div>
      }
      <div className="p-4">
      <p style={{ height: '20px' }} className="text-sm font-semibold text-gray-400">ID: {nft?.tokenId}</p>
        <p style={{ height: '20px' }} className="text-sm font-semibold text-gray-400">NAME: {nft?.name}</p>
      </div>
      <div id="accordion-collapse" data-accordion="collapse">
        <h2 id="accordion-collapse-heading-1">
          <button type="button" className="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-b-0 border-gray-200 rounded-t-xl focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setExpanded(!expanded)} data-accordion-target="#accordion-collapse-body-1" aria-expanded="true" aria-controls="accordion-collapse-body-1">
            <span>Description of the encoded content</span>
            <svg data-accordion-icon className="w-6 h-6 rotate-180 shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
          </button>
        </h2>
        <div id="accordion-collapse-body-1" className={!expanded ? "hidden" : ""} aria-labelledby="accordion-collapse-heading-1">
          <div className="p-5 font-light border border-b-0 border-gray-200 dark:border-gray-700 dark:bg-gray-900">
            <p className="mb-2 text-xl font-bold text-white"> {handledDescription[1]}</p>
          </div>
        </div>
        <div className="p-4">
          <p style={{ height: '30px' }} className="text-sm font-semibold text-gray-400">Seller: {nft?.owner}</p>
        </div>
      </div>
      <div className="p-4 bg-slate-400">
        <p className="text-xl font-bold text-white">Seller's price:  {nft?.price} ETH</p>
        <p className="text-xl font-bold text-white">Max bet: {nft?.maxPrice} ETH</p>
        <p className="text-xl font-bold text-white">Buyers: {nft?.buyers?.length} </p>
        <p className="text-xl font-bold text-white">Tonal sum of bets: {nft?.totalSum} ETH</p>
        <div className="mt-4 w-full brand-btn text-white font-bold py-2 px-12 rounded">
          <Link href={`/nft-market/${nft?.tokenId}`} className="mt-4   brand-color text-white text-xl font-bold py-2 rounded">
            Go to auction board
          </Link>
        </div>
        {isLoadedContent ? <Loader /> :
        nft?.image?.split(',')[0].split(";")[1] !== 'base64' && userAddress === nft?.seller &&
          <button className="mt-4  w-full brand-btn text-white text-xl font-bold py-2 px-12 rounded" onClick={() => decryptData(nft)}>Decrypt the NFT content</button>}
      </div>
    </div>
  </>);
}

export default NftCard;