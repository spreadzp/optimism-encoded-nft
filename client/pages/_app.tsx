import '../styles/globals.css'
import Link from 'next/link'

type MyAppProps = { Component: any, pageProps: any };
function MyApp({ Component, pageProps }: MyAppProps) {
  return (
    <div className='brand-bg main-h'>
      <nav className="border-b p-6">
       
        <div className="flex mt-4 nav-align">
        <p className="brand-logo "></p>
          <Link href="/" className="mr-4 brand-color text-xl font-bold nav-btn ">
            Marketplace
          </Link>
          <Link href="/create-and-list-nft" className="mr-6 brand-color text-xl font-bold nav-btn">
            Create a new NFT
          </Link>
          <Link href="/my-nfts" className="mr-6 brand-color text-xl font-bold nav-btn">
            My NFTs
          </Link>
          <Link href="/my-listed-nfts" className="mr-6 brand-color text-xl font-bold nav-btn">
            My Listed NFTs
          </Link>
          <Link href="/help" className="mr-6 brand-color text-xl font-bold nav-btn">
            Help
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}

export default MyApp