// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol"; 

contract ENCNFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct EncryptData {
        address currentOwner;
        string encryptKeyForOwner;
    }

    mapping(uint256 => EncryptData[]) public tokenHistoryEncryption;
    mapping(address => uint256[]) public tokenOwnersOfToken;

    event NFTMinted(uint256);
    address public marketplace;

    constructor(address _marketplace) ERC721("Encoded NFT", "ENFT") {
        marketplace = _marketplace;
    }

    function mint(string memory _tokenURI, string memory decryptKeyForOwner)
        external
    {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current(); 
        _safeMint(msg.sender, newTokenId); 
        _setTokenURI(newTokenId, _tokenURI); 
        setApprovalForAll(marketplace, true); 
        tokenHistoryEncryption[newTokenId].push(
            EncryptData(msg.sender, decryptKeyForOwner)
        );
        tokenOwnersOfToken[msg.sender].push(newTokenId);
        emit NFTMinted(newTokenId);
    }

    function transferTokenWithEncryption( 
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) external { 
        address currentOwner = ownerOf(_tokenId);
        // require(false, "msg.sender",msg.sender.toString(), " currentOwner: ", currentOwner.toString());
        safeTransferFrom(currentOwner, _to, _tokenId, _data);
        tokenHistoryEncryption[_tokenId].push(EncryptData(_to, string(_data)));
        tokenOwnersOfToken[_to].push(_tokenId);
    }

    function getTokenInfoLastOwner(uint256 _tokenId)
        external
        view
        returns (address owner, string memory encData)
    {
        EncryptData[] storage allHistoryTokenInfo = tokenHistoryEncryption[
            _tokenId
        ];
        EncryptData storage lastOwnerInfo = allHistoryTokenInfo[
            allHistoryTokenInfo.length - 1
        ];
        return (lastOwnerInfo.currentOwner, lastOwnerInfo.encryptKeyForOwner);
    }

    function getIdsByAddress(address owner)
        external
        view
        returns (uint256[] memory)
    {
        return tokenOwnersOfToken[owner];
    }
}
