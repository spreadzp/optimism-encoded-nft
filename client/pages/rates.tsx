import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import Web3 from 'web3';
import { ACTOR, ResponseLoadNfts, Web3InstanceProps, NFTProps } from "../interfaces/types"
import { loadNFTs } from "../utils/nft-commands";
import { getWeb3Instance } from "../utils/web3"
import Loader from "./loader"

function Rates() {
    const router = useRouter()
    const headerNames = ['#', 'NFT ID', 'Show NFT', 'My current bet', 'Action']
    const [marketPlaceContract, setMarketPlaceContract] = useState(null || {} as any)
    const [encodedNftContract, setEncodedNftContract] = useState(null || {} as any)
    const [isOwner, setIsOwner] = useState(false) 
    const [soldNfts, setSoldNfts] = useState([] as SoldNft[])
    const [ids, setIds] = useState([] as number[])
    const [isWithdraw, setIsWithdraw] = useState(false)
    const [nfts, setNfts] = useState([] as NFTProps[])
  const [loadingState, setLoadingState] = useState('not-loaded')
  const [account, setAccount] = useState('')

    type SoldNft = {
        id: string,
        soldSum: string,
        currentOwner: string
    }
    useEffect(() => {
        (async () => {
          const resLoad: ResponseLoadNfts = await loadNFTs({ typeAction: ACTOR.All })
          const notOwnedNft = resLoad.nfts.filter((item: NFTProps) => item.owner !== resLoad.currentAddress)
          console.log("🚀 ~ file: rates.tsx:31 ~ notOwnedNft", notOwnedNft)
          setNfts(notOwnedNft) 
          const notOwnedIds = notOwnedNft.map((item: NFTProps) => item.tokenId)
          setIds(notOwnedIds)
          setAccount(resLoad.currentAddress)
          setMarketPlaceContract(resLoad.marketPlaceContract)
          setEncodedNftContract(resLoad.encNftContract)
          setLoadingState('loaded')
        })()
      }, [])

      useEffect(() => {
        
        getBuyersById
      }, [ids, marketPlaceContract]);

    // useEffect(() => {
    //     getWeb3Instance()
    //         .then((inst: Web3InstanceProps) => {
    //             setAccount(inst.currentAddress)
    //             setMarketPlaceContract(inst.marketPlaceContract)
    //             setEncodedNftContract(inst.encNftContract)
    //         }).catch((err: any) => {
    //             console.log('err', err)
    //         })
    // }, [])

//     useEffect(() => { 
//             const loadNFTInfo = async () => {
//               const resLoad = await loadNFTs({ typeAction: ACTOR.Marketplace, nftId: nftId })
//               console.log("🚀 ~ file: [id].tsx ~ line 33 ~ loadNFTInfo ~ resLoad", resLoad.nfts[0])
//               setNft(resLoad.nfts[0])
//               setAccount(resLoad.currentAddress)
//               console.log('resLoad?.nfts[0]?.buyers', resLoad?.nfts[0]?.buyers)
//               setBuyersList(resLoad?.nfts[0]?.buyers as BuyersList[])
//               // setMarketPlaceContract(resLoad.marketPlaceContract)
//               setLoadingState('loaded')
      
//             }
//             loadNFTInfo() 
//                   console.log("🚀 ~ file: sold-board.tsx:39 ~ .then ~ ids", ids)
//                 //   bettersList.map((item: any) => {
//                 //     const [buyerAddress, buyerPublicKey, buyerBet, goalOfPurchase] = item
//                 //     bl = { buyerAddress, buyerBet, buyerPublicKey, goalOfPurchase } 
//                 //     const bBet = (+Web3.utils.fromWei(bl.buyerBet, "ether")) 
// //                   listed
// // : 
// // true
// // nftContract
// // : 
// // "0xCd3e88efD1Ecc4ddDe004C63E59511955fb3184f"
// // owner
// // : 
// // "0xe3821b4Ab191d0E776b108Ea3bFb395286CB7010"
// // price
// // : 
// // "200000000000000000"
// // seller
// // : 
// // "0xe3821b4Ab191d0E776b108Ea3bFb395286CB7010"
// // tokenId
// // : 
// // "1"
//                     // setIdsHistory(() => [...idsHistory, ...ids])
//                 })
//         }

//     }, [marketPlaceContract, account, encodedNftContract]);

    // useEffect(() => {
    //     (async () => {

    //         // const nfts = await Promise.all(idsHistory?.map(async (id: string) => {
    //         //     const balance = await marketPlaceContract.methods.getOwnerInfo(id, account).call()
    //         //     const currentOwnerInfo = await encodedNftContract.methods.getTokenInfoLastOwner(id).call()
    //         //     const nftInfo: SoldNft = { id: id, currentOwner: currentOwnerInfo.owner, soldSum: Web3.utils.fromWei(balance) }
    //         //     return nftInfo
    //         // }))
    //         // setSoldNfts(() => [...soldNfts, ...nfts])
    //     })()

    // }, [idsHistory, account]);
    const makeAction = async (nft: NFTProps) => {
        try {
            setIsWithdraw(true)
            await marketPlaceContract.methods.sellerWithdrawSum(nft.id)
                .send({ from: account }).on('receipt', function () { 
                    alert('withdraw successfully') 
                })
        } catch (err) {
            console.log("🚀 ~ file: sold-board.tsx:73 ~ makeAction ~ err", err)
            setIsWithdraw(false)
        } finally {
            setIsWithdraw(false) 
            router.push(`/`)
        }
    }
    const showNft = (nft: NFTProps) => {
        router.push(`/nft-market/${nft.tokenId}`)
    }
    return (<>
        {isWithdraw ? <Loader /> :
            <div className="flex flex-col">
                <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="border-b">
                                    <tr>
                                        {headerNames.map((name: string, ind: number) => {
                                            return (<th key={ind + 50} scope="col" className="text-sm font-medium text-white px-6 py-4 text-left">
                                                {name}
                                            </th>)
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {nfts?.length > 0 && nfts.map((item: NFTProps, ind: number) => {
                                        return (
                                            <>
                                                <tr className="border-b" key={ind}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{ind + 1}</td>
                                                    <td className="text-sm text-white font-light px-6 py-4 whitespace-nowrap">
                                                        {item.tokenId}
                                                    </td>
                                                    <td className="text-sm text-white font-light px-6 py-4 whitespace-nowrap">
                                                        <button className="px-6 board-btn rounded" onClick={() => showNft(item)}>
                                                            Show the NFT
                                                        </button>
                                                    </td>
                                                    <td className="text-sm text-white font-light px-6 py-4 whitespace-nowrap">
                                                        {item.soldSum} ETH
                                                    </td>
                                                    {item.currentOwner !== account ? +item.soldSum > 0 ?
                                                        <td className="text-sm text-white font-light  whitespace-nowrap">
                                                            <button className="px-6 board-btn rounded" onClick={() => makeAction(item)}>
                                                                Withdraw sum
                                                            </button>
                                                        </td> : <td className="whitespace-nowrap text-white">
                                                            Sum was withdrew
                                                        </td> : <td className="whitespace-nowrap text-white">
                                                        For sell now
                                                    </td>}

                                                </tr>
                                            </>
                                        )
                                    })
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        }
    </>);
}

export default Rates;