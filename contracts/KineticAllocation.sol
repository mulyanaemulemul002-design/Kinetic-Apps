// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title KineticAllocation — Non-Mining Token Allocation Contract
/// @notice Manages distribution of Investor, Team, and Ecosystem pools.
///         Funded separately from KineticDAO (mining contract).
/// @dev    KNTC Ecochain (Maculatus Testnet, Chain ID: 10778)
///
/// Pool breakdown (out of 1B total supply):
///   Investor Pool  — 100,000,000 KNTC (10%)
///   Team Pool      —  25,000,000 KNTC ( 2.5%)
///   Ecosystem Pool — 175,000,000 KNTC (17.5%)
///   ─────────────────────────────────────────
///   Total managed  — 300,000,000 KNTC (30%)
contract KineticAllocation is Ownable, ReentrancyGuard {

    // ─── Pool Caps (18 decimals, mirrors KineticDAO constants) ───────────────
    uint256 public constant INVESTOR_POOL  = 100_000_000 ether;
    uint256 public constant TEAM_POOL      =  25_000_000 ether;
    uint256 public constant ECOSYSTEM_POOL = 175_000_000 ether;

    // ─── Distributed Counters ─────────────────────────────────────────────────
    uint256 public investorDistributed;
    uint256 public teamDistributed;
    uint256 public ecosystemDistributed;

    // ─── Events ───────────────────────────────────────────────────────────────
    event InvestorDistributed(
        address indexed to,
        uint256 amount,
        uint256 totalDistributed,
        uint256 remainingPool
    );
    event TeamDistributed(
        address indexed to,
        uint256 amount,
        uint256 totalDistributed,
        uint256 remainingPool
    );
    event EcosystemDistributed(
        address indexed to,
        uint256 amount,
        uint256 totalDistributed,
        uint256 remainingPool
    );
    event Funded(address indexed from, uint256 amount);

    constructor() Ownable(msg.sender) {}

    // ─── Distribution Functions ───────────────────────────────────────────────

    /// @notice Send KNTC from the Investor pool to a given address.
    /// @param  to     Recipient address (investor wallet).
    /// @param  amount Amount in wei (18 decimals).
    function distributeInvestor(address to, uint256 amount)
        external
        onlyOwner
        nonReentrant
    {
        require(to != address(0),                                    "KineticAllocation: zero address");
        require(amount > 0,                                          "KineticAllocation: zero amount");
        require(investorDistributed + amount <= INVESTOR_POOL,       "KineticAllocation: exceeds investor pool cap");
        require(address(this).balance >= amount,                     "KineticAllocation: insufficient contract balance");

        investorDistributed += amount;
        (bool sent,) = to.call{value: amount}("");
        require(sent, "KineticAllocation: transfer failed");

        emit InvestorDistributed(to, amount, investorDistributed, INVESTOR_POOL - investorDistributed);
    }

    /// @notice Send KNTC from the Team pool to a given address.
    /// @param  to     Recipient address (team wallet).
    /// @param  amount Amount in wei (18 decimals).
    function distributeTeam(address to, uint256 amount)
        external
        onlyOwner
        nonReentrant
    {
        require(to != address(0),                                    "KineticAllocation: zero address");
        require(amount > 0,                                          "KineticAllocation: zero amount");
        require(teamDistributed + amount <= TEAM_POOL,               "KineticAllocation: exceeds team pool cap");
        require(address(this).balance >= amount,                     "KineticAllocation: insufficient contract balance");

        teamDistributed += amount;
        (bool sent,) = to.call{value: amount}("");
        require(sent, "KineticAllocation: transfer failed");

        emit TeamDistributed(to, amount, teamDistributed, TEAM_POOL - teamDistributed);
    }

    /// @notice Send KNTC from the Ecosystem pool to a given address.
    /// @param  to     Recipient address (ecosystem program, grant, etc.).
    /// @param  amount Amount in wei (18 decimals).
    function distributeEcosystem(address to, uint256 amount)
        external
        onlyOwner
        nonReentrant
    {
        require(to != address(0),                                    "KineticAllocation: zero address");
        require(amount > 0,                                          "KineticAllocation: zero amount");
        require(ecosystemDistributed + amount <= ECOSYSTEM_POOL,     "KineticAllocation: exceeds ecosystem pool cap");
        require(address(this).balance >= amount,                     "KineticAllocation: insufficient contract balance");

        ecosystemDistributed += amount;
        (bool sent,) = to.call{value: amount}("");
        require(sent, "KineticAllocation: transfer failed");

        emit EcosystemDistributed(to, amount, ecosystemDistributed, ECOSYSTEM_POOL - ecosystemDistributed);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /// @notice Returns remaining (undistributed) balance for each pool.
    function poolsRemaining() external view returns (
        uint256 investor,
        uint256 team,
        uint256 ecosystem
    ) {
        investor  = INVESTOR_POOL  - investorDistributed;
        team      = TEAM_POOL      - teamDistributed;
        ecosystem = ECOSYSTEM_POOL - ecosystemDistributed;
    }

    /// @notice Returns full allocation summary in one call.
    function allocationSummary() external view returns (
        uint256 investorCap,    uint256 investorUsed,    uint256 investorLeft,
        uint256 teamCap,        uint256 teamUsed,        uint256 teamLeft,
        uint256 ecosystemCap,   uint256 ecosystemUsed,   uint256 ecosystemLeft,
        uint256 contractBalance
    ) {
        investorCap    = INVESTOR_POOL;
        investorUsed   = investorDistributed;
        investorLeft   = INVESTOR_POOL  - investorDistributed;
        teamCap        = TEAM_POOL;
        teamUsed       = teamDistributed;
        teamLeft       = TEAM_POOL      - teamDistributed;
        ecosystemCap   = ECOSYSTEM_POOL;
        ecosystemUsed  = ecosystemDistributed;
        ecosystemLeft  = ECOSYSTEM_POOL - ecosystemDistributed;
        contractBalance = address(this).balance;
    }

    // ─── Funding ──────────────────────────────────────────────────────────────

    /// @dev Accept incoming KNTC to fund the pools.
    receive() external payable {
        emit Funded(msg.sender, msg.value);
    }
}
