// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title  KineticMining v2 — Simple Ad-to-Earn Mining
/// @notice One 24-hour session earns exactly 1 KNTC.
///         Miners watch an ad off-chain, then call mine() to record the session
///         on-chain. KNTC accumulates in pendingKNTC and is claimable after TGE.
///
/// @dev    KNTC Ecochain — Maculatus Testnet (Chain ID: 10778)
///
///         Rules:
///           - 1 call to mine() per 24 hours per wallet
///           - Each call credits exactly 1 KNTC (1e18 wei) to pendingKNTC
///           - Total mining pool: 10,000,000,000 KNTC (= 10 B sessions max)
///           - claimTokens() reverts until owner calls setTGEActive(true)
contract KineticMining is Ownable, ReentrancyGuard {

    // ─── Token ────────────────────────────────────────────────────────────────
    IERC20 public immutable kineticToken;

    // ─── Constants ────────────────────────────────────────────────────────────
    uint256 public constant SESSION_DURATION  = 24 hours;
    uint256 public constant KNTC_PER_SESSION  = 1 ether;          // 1 KNTC (18 decimals)
    uint256 public constant TOTAL_MINING_POOL = 10_000_000_000 ether; // 10 B KNTC

    // ─── TGE flag ─────────────────────────────────────────────────────────────
    bool public isTGEActive;

    // ─── Protocol totals ─────────────────────────────────────────────────────
    uint256 public totalSessions;        // global session count
    uint256 public uniqueMiners;         // wallets that have ever mined
    uint256 public totalPointsMinted;    // KNTC wei credited to all miners
    uint256 public totalTokensClaimed;   // KNTC wei paid out post-TGE

    // ─── Per-user state ───────────────────────────────────────────────────────
    struct UserData {
        uint256 lastMineAt;      // block.timestamp of most recent mine()
        uint256 sessionCount;    // total sessions this wallet has completed
        uint256 pendingKNTC;     // accumulated KNTC wei not yet claimed
        uint256 totalClaimed;    // lifetime KNTC wei claimed
        bool    hasEverMined;
    }
    mapping(address => UserData) public users;

    // ─── Events ───────────────────────────────────────────────────────────────
    event MiningSessionStarted(
        address indexed user,
        uint256 indexed sessionId,   // == totalSessions at time of call
        uint256 kntcEarned,          // always KNTC_PER_SESSION (1e18)
        uint256 timestamp
    );

    event TokensClaimed(
        address indexed user,
        uint256 kntcAmount,
        uint256 timestamp
    );

    event TGEStatusChanged(bool active, uint256 timestamp);

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(address _kineticToken) Ownable(msg.sender) {
        require(_kineticToken != address(0), "KineticMining: zero token address");
        kineticToken = IERC20(_kineticToken);
    }

    // ─── Core: mine ───────────────────────────────────────────────────────────

    /// @notice Record a completed ad-watch session on-chain.
    ///         Credits 1 KNTC to the caller's pending balance.
    ///         Can only be called once every 24 hours per wallet.
    function mine() external nonReentrant {
        UserData storage u = users[msg.sender];

        if (u.hasEverMined) {
            require(
                block.timestamp >= u.lastMineAt + SESSION_DURATION,
                "KineticMining: cooldown active — wait 24h between sessions"
            );
        }

        require(
            totalPointsMinted + KNTC_PER_SESSION <= TOTAL_MINING_POOL,
            "KineticMining: mining pool depleted"
        );

        // Credit 1 KNTC to user
        u.lastMineAt     = block.timestamp;
        u.sessionCount  += 1;
        u.pendingKNTC   += KNTC_PER_SESSION;
        totalSessions   += 1;
        totalPointsMinted += KNTC_PER_SESSION;

        if (!u.hasEverMined) {
            u.hasEverMined = true;
            uniqueMiners++;
        }

        emit MiningSessionStarted(msg.sender, totalSessions, KNTC_PER_SESSION, block.timestamp);
    }

    // ─── Claim (post-TGE) ─────────────────────────────────────────────────────

    /// @notice Transfer all pending KNTC to the caller.
    ///         Only callable after TGE is activated by the owner.
    function claimTokens() external nonReentrant {
        require(isTGEActive, "KineticMining: TGE not active — claim opens at launch");

        UserData storage u = users[msg.sender];
        uint256 amount = u.pendingKNTC;
        require(amount > 0, "KineticMining: no KNTC to claim");
        require(
            kineticToken.balanceOf(address(this)) >= amount,
            "KineticMining: insufficient pool balance"
        );

        u.pendingKNTC      = 0;
        u.totalClaimed    += amount;
        totalTokensClaimed += amount;

        kineticToken.transfer(msg.sender, amount);
        emit TokensClaimed(msg.sender, amount, block.timestamp);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setTGEActive(bool _status) external onlyOwner {
        isTGEActive = _status;
        emit TGEStatusChanged(_status, block.timestamp);
    }

    function rescueTokens(uint256 amount) external onlyOwner {
        kineticToken.transfer(owner(), amount);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /// @notice All data needed by the UI in a single RPC call.
    function getUserDashboard(address _user) external view returns (
        uint256 pendingKNTC,
        uint256 sessionCount,
        uint256 totalClaimed,
        uint256 lastMineAt,
        bool    sessionActive,
        uint256 sessionTimeLeft,
        bool    canMine_,
        bool    tgeActive_
    ) {
        UserData storage u = users[_user];

        pendingKNTC  = u.pendingKNTC;
        sessionCount = u.sessionCount;
        totalClaimed = u.totalClaimed;
        lastMineAt   = u.lastMineAt;
        tgeActive_   = isTGEActive;

        uint256 nextMine = u.lastMineAt + SESSION_DURATION;
        canMine_     = !u.hasEverMined || block.timestamp >= nextMine;

        // Session is "active" for 24h after the last mine() call
        sessionActive   = u.hasEverMined && block.timestamp < nextMine;
        sessionTimeLeft = sessionActive ? nextMine - block.timestamp : 0;
    }

    /// @notice Protocol-wide statistics.
    function getProtocolStats() external view returns (
        uint256 _totalSessions,
        uint256 _uniqueMiners,
        uint256 _totalPointsMinted,
        uint256 _totalTokensClaimed,
        uint256 _poolRemaining,
        bool    _tgeActive
    ) {
        _totalSessions      = totalSessions;
        _uniqueMiners       = uniqueMiners;
        _totalPointsMinted  = totalPointsMinted;
        _totalTokensClaimed = totalTokensClaimed;
        _poolRemaining      = TOTAL_MINING_POOL > totalPointsMinted
                              ? TOTAL_MINING_POOL - totalPointsMinted : 0;
        _tgeActive          = isTGEActive;
    }

    function canMine(address _user) external view returns (bool) {
        UserData storage u = users[_user];
        if (!u.hasEverMined) return true;
        return block.timestamp >= u.lastMineAt + SESSION_DURATION;
    }

    function cooldownRemaining(address _user) external view returns (uint256) {
        UserData storage u = users[_user];
        if (!u.hasEverMined) return 0;
        uint256 next = u.lastMineAt + SESSION_DURATION;
        return block.timestamp >= next ? 0 : next - block.timestamp;
    }
}
