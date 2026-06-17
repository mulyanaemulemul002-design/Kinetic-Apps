// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title  KineticToken — ERC-20 token for the KineticDAO protocol
/// @notice 1,000,000,000 KNTC minted to owner on deployment.
///         Owner distributes to KineticMining (700M) and KineticAllocation (300M).
/// @dev    KNTC Ecochain — Maculatus Testnet (Chain ID: 10778)
contract KineticToken is ERC20, Ownable {

    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 ether; // 1 Billion KNTC

    constructor() ERC20("Kinetic Token", "KNTC") Ownable(msg.sender) {
        _mint(msg.sender, TOTAL_SUPPLY);
    }
}
