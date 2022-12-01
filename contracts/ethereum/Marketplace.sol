// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";
import "./EncNft.sol";

contract Marketplace is ReentrancyGuard {
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _nftsSold;
    Counters.Counter private _nftCount;
    uint256 public LISTING_FEE = 0.0001 ether;
    ENCNFT encNftContract;
    address payable private _marketOwner;
    mapping(uint256 => NFT) private _idToNFT;
    struct NFT {
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool listed;
    }
    event NFTListed(
        address nftContract,
        uint256 tokenId,
        address seller,
        address owner,
        uint256 price
    );
    event NFTSold(
        address nftContract,
        uint256 tokenId,
        address seller,
        address owner,
        uint256 price
    );

    struct BuyerData {
        address buyerAddress;
        string buyerPublicKey;
        uint256 buyerBet;
        string goalOfPurchase;
    }

    struct SellerData {
        address sellerAddress;
        uint256 deadline;
        uint256 sellerSum;
    }
    mapping(uint256 => BuyerData[]) public buyersBoard; // to do private
    mapping(uint256 => SellerData[]) public sellersBoard; // to do private

    event NewOwner(uint256 idToken, address buyerAddress);
    event TokenForSell(uint256 idToken, address buyerAddress, string message);
    event BuyerMadeBet(uint256 idToken, address buyerAddress, uint256 bet);
    event BuyerWithdrewBet(uint256 idToken, address buyerAddress, uint256 bet);
    event sellerWithdrewSum(
        uint256 idToken,
        address sellerAddress,
        uint256 sum
    );

    constructor() {
        _marketOwner = payable(msg.sender);
    }

    function setNFTContract(address _nftContract) public {
        encNftContract = ENCNFT(_nftContract);
    }

    // List the NFT on the marketplace
    function listNft(
        address _nftContract,
        uint256 _tokenId,
        uint256 _price
    ) public payable nonReentrant {
        require(_price > 0, "Price must be at least 1 wei");
        require(msg.value == LISTING_FEE, "Not enough ether for listing fee");

        // IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);

        _nftCount.increment();

        _idToNFT[_tokenId] = NFT(
            _nftContract,
            _tokenId,
            payable(msg.sender),
            payable(msg.sender), // payable(address(this)),
            _price,
            true
        );

        emit NFTListed(
            _nftContract,
            _tokenId,
            msg.sender,
            address(this),
            _price
        );
    }

    // Buy an NFT
    function buyNft(address _nftContract, uint256 _tokenId)
        public
        payable
        nonReentrant
    {
        NFT storage nft = _idToNFT[_tokenId];
        require(
            msg.value >= nft.price,
            "Not enough ether to cover asking price"
        );

        address payable buyer = payable(msg.sender);
        payable(nft.seller).transfer(msg.value);
        IERC721(_nftContract).transferFrom(address(this), buyer, nft.tokenId);
        _marketOwner.transfer(LISTING_FEE);
        nft.owner = buyer;
        nft.listed = false;

        _nftsSold.increment();
        emit NFTSold(_nftContract, nft.tokenId, nft.seller, buyer, msg.value);
    }

    // Resell an NFT purchased from the marketplace
    function resellNft(
        address _nftContract,
        uint256 _tokenId,
        uint256 _price
    ) public payable nonReentrant {
        require(_price > 0, "Price must be at least 1 wei");
        require(msg.value == LISTING_FEE, "Not enough ether for listing fee");

        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);

        NFT storage nft = _idToNFT[_tokenId];
        nft.seller = payable(msg.sender);
        nft.owner = payable(address(this));
        nft.listed = true;
        nft.price = _price;

        _nftsSold.decrement();
        emit NFTListed(
            _nftContract,
            _tokenId,
            msg.sender,
            address(this),
            _price
        );
    }

    function getListingFee() public view returns (uint256) {
        return LISTING_FEE;
    }

    function getListedNfts() public view returns (NFT[] memory) {
        uint256 nftCount = _nftCount.current();
        uint256 unsoldNftsCount = nftCount - _nftsSold.current();

        NFT[] memory nfts = new NFT[](unsoldNftsCount);
        uint nftsIndex = 0;
        for (uint i = 0; i < nftCount; i++) {
            if (_idToNFT[i + 1].listed) {
                nfts[nftsIndex] = _idToNFT[i + 1];
                nftsIndex++;
            }
        }
        return nfts;
    }

    function getMyNfts() public view returns (NFT[] memory) {
        uint nftCount = _nftCount.current();
        uint myNftCount = 0;
        for (uint i = 0; i < nftCount; i++) {
            if (_idToNFT[i + 1].owner == msg.sender) {
                myNftCount++;
            }
        }

        NFT[] memory nfts = new NFT[](myNftCount);
        uint nftsIndex = 0;
        for (uint i = 0; i < nftCount; i++) {
            if (_idToNFT[i + 1].owner == msg.sender) {
                nfts[nftsIndex] = _idToNFT[i + 1];
                nftsIndex++;
            }
        }
        return nfts;
    }

    function getMyListedNft(uint256 nftId) public view returns (NFT memory) {

      return _idToNFT[nftId];
    }

    function getMyListedNfts() public view returns (NFT[] memory) {
        uint nftCount = _nftCount.current();
        uint myListedNftCount = 0;
        for (uint i = 0; i < nftCount; i++) {
            if (
                _idToNFT[i + 1].seller == msg.sender && _idToNFT[i + 1].listed
            ) {
                myListedNftCount++;
            }
        }

        NFT[] memory nfts = new NFT[](myListedNftCount);
        uint nftsIndex = 0;
        for (uint i = 0; i < nftCount; i++) {
            if (
                _idToNFT[i + 1].seller == msg.sender && _idToNFT[i + 1].listed
            ) {
                nfts[nftsIndex] = _idToNFT[i + 1];
                nftsIndex++;
            }
        }
        return nfts;
    }

    function makeBet(
        uint256 idToken,
        string memory buyerPublicKey,
        address buyerAddress,
        string memory goalPurchase
    ) public payable {
        require(msg.value != 0, "Rate must be more 0");
        uint256 buyerIndex = getBuyerIndex(idToken, buyerAddress);
        if (
            buyersBoard[idToken].length > 0 &&
            buyersBoard[idToken][buyerIndex].buyerAddress == buyerAddress
        ) {
            uint256 newBet = buyersBoard[idToken][buyerIndex].buyerBet.add(
                msg.value
            );
            buyersBoard[idToken][buyerIndex].buyerBet = newBet;
        } else {
            buyersBoard[idToken].push(
                BuyerData({
                    buyerAddress: buyerAddress,
                    buyerPublicKey: buyerPublicKey,
                    buyerBet: msg.value,
                    goalOfPurchase: goalPurchase
                })
            );
        }
        emit BuyerMadeBet(idToken, buyerAddress, msg.value);
    }

    function getSellerById(uint256 idToken)
        public
        view
        returns (SellerData[] memory)
    {
        SellerData[] storage sellers = sellersBoard[idToken];
        return sellers;
    }

    function getCountSellers(uint256 idToken) public view returns (uint256) {
        return sellersBoard[idToken].length;
    }

    function getCountBuyers(uint256 idToken) public view returns (uint256) {
        return buyersBoard[idToken].length;
    }

    function getBuyersById(uint256 idToken)
        public
        view
        returns (BuyerData[] memory)
    {
        BuyerData[] storage buyers = buyersBoard[idToken];
        return buyers;
    }

    function buyerWithdrawBet(uint256 idToken) public {
        uint256 buyerIndex = getBuyerIndex(idToken, msg.sender);
        (bool succeed, bytes memory data) = msg.sender.call{
            value: buyersBoard[idToken][buyerIndex].buyerBet
        }("");
        require(succeed, "Failed to withdraw Ether");
        emit BuyerWithdrewBet(
            idToken,
            msg.sender,
            buyersBoard[idToken][buyerIndex].buyerBet
        );
        buyersBoard[idToken][buyerIndex].buyerBet = 0;
    }

    function sellerWithdrawSum(uint256 idToken) public {
        uint256 sellerIndex = getSellerIndex(idToken, msg.sender);
        (bool succeed, bytes memory data) = msg.sender.call{
            value: sellersBoard[idToken][sellerIndex].sellerSum
        }("");
        require(succeed, "Failed to withdraw Ether");
        emit sellerWithdrewSum(
            idToken,
            msg.sender,
            sellersBoard[idToken][sellerIndex].sellerSum
        );
        sellersBoard[idToken][sellerIndex].sellerSum = 0;
    }

    function acceptRateAndTransferToken( 
        uint256 idToken,
        address buyerAddress,
        bytes memory data
    ) public { 
        uint256 buyerIndex = getBuyerIndex(idToken, buyerAddress);
        uint256 sellerIndex = getSellerIndex(idToken, msg.sender); 
       encNftContract.transferTokenWithEncryption(buyerAddress, idToken, data);  
        NFT storage nft = _idToNFT[idToken];
        nft.seller = payable(buyerAddress);
        nft.owner = payable(buyerAddress);
        nft.listed = true;
        nft.price = buyersBoard[idToken][buyerIndex].buyerBet;

        // _nftsSold.decrement();
        emit NFTListed(
            address(encNftContract),
            idToken,
            buyerAddress,
            buyerAddress,
            buyersBoard[idToken][buyerIndex].buyerBet
        );
       
        sellersBoard[idToken][sellerIndex].sellerSum = sellersBoard[idToken][
            sellerIndex
        ].sellerSum.add(buyersBoard[idToken][buyerIndex].buyerBet);
        buyersBoard[idToken][buyerIndex].buyerBet = 0;
        sellersBoard[idToken].push(
            SellerData({
                sellerAddress: buyerAddress,
                deadline: block.timestamp.add(10**6),
                sellerSum: 0
            })
        );
        emit NewOwner(idToken, buyerAddress);
    }

    function getBuyerIndex(uint256 idToken, address buyerAddress)
        public
        view
        returns (uint256 buyerIndex)
    {
        uint256 length = buyersBoard[idToken].length;

        for (uint256 index; index < length; index++) {
            if (buyersBoard[idToken][index].buyerAddress == buyerAddress) {
                buyerIndex = index;
            }
        }
        return buyerIndex;
    }

    function getSellerIndex(uint256 idToken, address sellerAddress)
        public
        view
        returns (uint256 sellerIndex)
    {
        uint256 length = sellersBoard[idToken].length;

        for (uint256 index; index < length; index++) {
            if (sellersBoard[idToken][index].sellerAddress == sellerAddress) {
                sellerIndex = index;
            }
        }
        return sellerIndex;
    }

    function moveTokenForSell(uint256 idToken, string memory message, uint256 _price, address _nftContract) public payable nonReentrant { 
        require(msg.value == LISTING_FEE, "Not enough ether for listing fee");
        address currentOwner = encNftContract.ownerOf(idToken);
        require(
            currentOwner == msg.sender,
            "The address has not own the token"
        );
        _nftCount.increment();

        _idToNFT[idToken] = NFT(
            _nftContract,
            idToken,
            payable(msg.sender),
            payable(msg.sender), // payable(address(this)),
            _price,
            true
        );

        emit NFTListed(
            _nftContract,
            idToken,
            msg.sender,
            msg.sender,
            _price
        );
        sellersBoard[idToken].push(
            SellerData({
                sellerAddress: msg.sender,
                deadline: block.timestamp.add(10**6),
                sellerSum: 0
            })
        );
        emit TokenForSell(idToken, msg.sender, message);
    }

    function removeTokenFromMarketPlace(uint256 idToken, string memory message)
        public
    {
        // to do for burn case
        emit TokenForSell(idToken, msg.sender, message);
    }

    function getOwnerInfo(uint256 _tokenId, address owner)
        public
        view
        returns (string memory balance)
    {
        SellerData[] storage allHistorySellersInfo = sellersBoard[_tokenId];
        uint256 historyLength = allHistorySellersInfo.length;
        for (uint256 ind; ind < historyLength; ind++) {
            if (allHistorySellersInfo[ind].sellerAddress == owner) {
                balance = string(
                    abi.encodePacked(
                        balance,
                        uint2str(allHistorySellersInfo[ind].sellerSum)
                    )
                );
            }
        }
        return balance;
    }

    function uint2str(uint _i)
        internal
        pure
        returns (string memory _uintAsString)
    {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
