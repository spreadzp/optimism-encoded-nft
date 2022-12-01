/** @type {import('next').NextConfig} */ 
require("dotenv").config 
const nextConfig = {
 
  env:{
    NEXT_PUBLIC_IPFS_SECRET: process.env.NEXT_PUBLIC_IPFS_SECRET || "",
    NEXT_PUBLIC_IPFS_KEY: process.env.NEXT_PUBLIC_IPFS_KEY || ""
  },
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false
    }

    return config
  }
}

module.exports = nextConfig
