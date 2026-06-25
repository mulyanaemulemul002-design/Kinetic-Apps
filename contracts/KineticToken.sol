// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title  KineticToken — ERC-20 KNTC token for KineticDAO protocol
/// @notice 10,000,000,000 KNTC minted to owner on deployment.
///         Owner transfers the full supply to KineticMining at deployment.
///         Miners earn 1 KNTC per 24-hour session by watching ads.
///         Tokens are locked until TGE — no claiming before launch.
/// @dev    KNTC Ecochain — Maculatus Testnet (Chain ID: 10778)
contract KineticToken is ERC20, Ownable {

    uint256 public constant TOTAL_SUPPLY = 10_000_000_000 ether; // 10 Billion KNTC

    constructor() ERC20("Kinetic Token", "KNTC") Ownable(msg.sender) {
        _mint(msg.sender, TOTAL_SUPPLY);
    }
}
