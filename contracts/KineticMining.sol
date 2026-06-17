// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title  KineticMining — Blueprint Phase 1 (Accumulation Era)
/// @notice Mining Rate-Per-Hour model with on-chain rank-based halving,
///         inactivity burn (Rank 3), and linear real-time point accumulation.
///         Points (integer units, no 18-decimals) accrue every second from
///         lastMiningTime. Real KNTC ERC-20 distributed after TGE.
///
/// @dev    KNTC Ecochain — Maculatus Testnet (Chain ID: 10778)
///
///         Gacha selects Mining Rate/h (base, before halving):
///           APES  (20%) — 10,000 pts/h
///           BASIC (70%) — 50,000 pts/h
///           HOKI  (10%) — 200,000 pts/h
///
///         Rank halving schedule (applied to base rate):
///           Rank 1  [  0 –  500B pts] — full rate (×1)
///           Rank 2  [500B –  750B pts] — halving 1 (×0.50)
///           Rank 3  [750B –  875B pts] — halving 2 (×0.25)
///
///         TGE conversion: 1,250 points = 1 KNTC (1e18 wei)
contract KineticMining is Ownable, ReentrancyGuard {

    // ─── Token ────────────────────────────────────────────────────────────────
    IERC20 public immutable kineticToken;

    // ─── Time constants ───────────────────────────────────────────────────────
    uint256 public constant MINING_CYCLE   = 24 hours; // cooldown between sessions
    uint256 public constant SESSION_MAX    = 24 hours; // points accrue max 24h/session
    uint256 public constant INACTIVITY_TTL = 72 hours; // Rank-3 burn threshold

    // ─── Rank quota limits (integer points) ──────────────────────────────────
    uint256 public constant RANK_1_LIMIT = 500_000_000_000; // 500 B
    uint256 public constant RANK_2_LIMIT = 750_000_000_000; // 750 B
    uint256 public constant RANK_3_LIMIT = 875_000_000_000; // 875 B

    // ─── Base mining rates per hour (integer points) ──────────────────────────
    uint256 private constant RATE_APES  =  10_000;
    uint256 private constant RATE_BASIC =  50_000;
    uint256 private constant RATE_HOKI  = 200_000;

    // ─── Gacha tier boundaries (rand % 1000) ─────────────────────────────────
    uint256 private constant TIER_APES_END   = 200; // 20 %
    uint256 private constant TIER_HOKI_START = 900; // 10 %

    // ─── TGE conversion ──────────────────────────────────────────────────────
    // 1,250 pts = 1 KNTC (1e18 wei)
    // Total pool: 700 M KNTC × 1,250 = 875 B pts == RANK_3_LIMIT
    uint256 public constant POINTS_PER_KNTC = 1_250;

    // ─── TGE flag ─────────────────────────────────────────────────────────────
    bool public isTGEActive = false;

    // ─── Protocol totals ─────────────────────────────────────────────────────
    uint256 public totalPointsMinted;   // cumulative locked pts (not counting live sessions)
    uint256 public totalMiningCycles;
    uint256 public uniqueMiners;
    uint256 public totalTokensClaimed;  // KNTC wei paid out post-TGE

    // ─── Per-user state ───────────────────────────────────────────────────────
    struct UserData {
        uint256 lastMiningTime;      // timestamp when current session started
        uint256 cycleCount;
        uint256 accumulatedPoints;   // locked points from completed sessions
        uint256 totalPointsEarned;   // lifetime total (never decreases)
        uint256 currentRatePerHour;  // 0 = no active session
        uint256 totalClaimed;        // lifetime KNTC wei claimed
        bool    hasEverMined;
    }
    mapping(address => UserData) public users;

    // ─── Events ───────────────────────────────────────────────────────────────
    event MiningSessionStarted(
        address indexed user,
        uint256 indexed cycleId,
        uint256 ratePerHour,
        uint8   tier,
        uint256 timestamp,
        uint256 totalPointsMinted
    );

    // Kept for backward-compat with off-chain listeners; reward = ratePerHour
    event MiningCycleCompleted(
        address indexed user,
        uint256 indexed cycleId,
        uint256 reward,
        uint8   tier,
        uint256 timestamp,
        uint256 poolRemaining
    );

    event TokensClaimed(
        address indexed user,
        uint256 kntcAmount,
        uint256 pointsConverted,
        uint256 timestamp
    );

    event TGEStatusChanged(bool active, uint256 timestamp);

    event InactivityBurn(
        address indexed user,
        uint256 burnedPoints,
        uint256 timestamp
    );

    // ─── Constructor ─────────────────────────────────────────────────────────
    constructor(address _kineticToken) Ownable(msg.sender) {
        require(_kineticToken != address(0), "KineticMining: zero token address");
        kineticToken = IERC20(_kineticToken);
    }

    // ─── Core: mine ──────────────────────────────────────────────────────────

    /// @notice Start a new 24-hour mining session (after watching an ad).
    ///         Gacha determines the pts/h rate for this session.
    /// @return ratePerHour  Points accumulated per hour during this session
    /// @return tier         0=APES, 1=BASIC, 2=HOKI
    function mine() external nonReentrant returns (uint256 ratePerHour, uint8 tier) {
        UserData storage u = users[msg.sender];

        // ── Cooldown check ────────────────────────────────────────────────────
        if (u.hasEverMined) {
            require(
                block.timestamp >= u.lastMiningTime + MINING_CYCLE,
                "KineticMining: cooldown active"
            );
        }

        require(totalPointsMinted < RANK_3_LIMIT, "KineticMining: point pool depleted");

        // ── Step 1: Finalize & lock previous session points ───────────────────
        if (u.currentRatePerHour > 0 && u.lastMiningTime > 0) {
            uint256 sessionPts = _computeSessionPoints(u.lastMiningTime, u.currentRatePerHour);
            u.accumulatedPoints  += sessionPts;
            u.totalPointsEarned  += sessionPts;
            totalPointsMinted    += sessionPts;
        }

        // ── Step 2: Rank 3 inactivity burn ───────────────────────────────────
        if (u.hasEverMined && _currentRankInternal() == 3) {
            if (block.timestamp > u.lastMiningTime + INACTIVITY_TTL) {
                uint256 burnAmt = u.accumulatedPoints / 10; // 10 %
                if (burnAmt > 0) {
                    u.accumulatedPoints -= burnAmt;
                    emit InactivityBurn(msg.sender, burnAmt, block.timestamp);
                }
            }
        }

        // ── Step 3: Gacha — determine mining rate ─────────────────────────────
        (ratePerHour, tier) = _calculateRate(msg.sender);

        // ── Step 4: Start new session ─────────────────────────────────────────
        u.lastMiningTime     = block.timestamp;
        u.currentRatePerHour = ratePerHour;
        u.cycleCount        += 1;
        totalMiningCycles   += 1;

        if (!u.hasEverMined) {
            u.hasEverMined = true;
            uniqueMiners++;
        }

        uint256 ptsRemaining = RANK_3_LIMIT > totalPointsMinted
            ? RANK_3_LIMIT - totalPointsMinted : 0;

        emit MiningSessionStarted(msg.sender, totalMiningCycles, ratePerHour, tier, block.timestamp, totalPointsMinted);
        emit MiningCycleCompleted(msg.sender, totalMiningCycles, ratePerHour, tier, block.timestamp, ptsRemaining);
    }

    // ─── Claim (post-TGE) ────────────────────────────────────────────────────

    /// @notice Convert all accumulated points to real KNTC tokens.
    ///         Callable only after TGE is active.
    function claimTokens() external nonReentrant {
        require(isTGEActive, "KineticMining: TGE not active. Claim opens at launch.");

        UserData storage u = users[msg.sender];

        // Finalize current live session
        uint256 livePts = _liveSessionPoints(msg.sender);
        uint256 totalPts = u.accumulatedPoints + livePts;
        require(totalPts > 0, "KineticMining: no points to claim");

        uint256 kntcAmount = totalPts * 1 ether / POINTS_PER_KNTC;
        require(
            kineticToken.balanceOf(address(this)) >= kntcAmount,
            "KineticMining: insufficient contract token balance"
        );

        // Count live pts in global total
        totalPointsMinted  += livePts;

        // Clear user state
        u.totalPointsEarned  += livePts;
        u.accumulatedPoints   = 0;
        u.currentRatePerHour  = 0;
        u.totalClaimed       += kntcAmount;
        totalTokensClaimed   += kntcAmount;

        kineticToken.transfer(msg.sender, kntcAmount);
        emit TokensClaimed(msg.sender, kntcAmount, totalPts, block.timestamp);
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    function setTGEActive(bool _status) external onlyOwner {
        isTGEActive = _status;
        emit TGEStatusChanged(_status, block.timestamp);
    }

    function rescueTokens(uint256 amount) external onlyOwner {
        kineticToken.transfer(owner(), amount);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /// @notice Current protocol rank and quota fill percentage (0–100).
    /// @return rank         1, 2, or 3
    /// @return quotaFillPct Percentage of current rank's quota consumed (0–100)
    function getCurrentRank() external view returns (uint8 rank, uint256 quotaFillPct) {
        return _currentRankView();
    }

    /// @notice All data needed by the UI in a single call.
    function getUserDashboard(address _user) external view returns (
        uint256 pendingClaim,
        uint256 totalMined,
        uint256 totalClaimed,
        uint256 cycleCount,
        uint256 lastMineAt,
        uint256 cooldown,
        bool    canMine,
        bool    tgeActive,
        uint256 ratePerHour,
        uint256 sessionTimeLeft,
        uint256 estimatedKNTC
    ) {
        UserData storage u = users[_user];
        uint256 live = _liveSessionPoints(_user);

        pendingClaim = u.accumulatedPoints + live;
        totalMined   = u.totalPointsEarned + live;
        totalClaimed = u.totalClaimed;
        cycleCount   = u.cycleCount;
        lastMineAt   = u.lastMiningTime;
        ratePerHour  = u.currentRatePerHour;

        uint256 nextMine = u.lastMiningTime + MINING_CYCLE;
        cooldown = block.timestamp >= nextMine ? 0 : nextMine - block.timestamp;
        canMine  = !u.hasEverMined || block.timestamp >= nextMine;
        tgeActive = isTGEActive;

        uint256 sessionEnd = u.lastMiningTime + SESSION_MAX;
        sessionTimeLeft = (u.currentRatePerHour > 0 && block.timestamp < sessionEnd)
            ? sessionEnd - block.timestamp
            : 0;

        estimatedKNTC = pendingClaim > 0 ? pendingClaim * 1 ether / POINTS_PER_KNTC : 0;
    }

    /// @notice Protocol-wide statistics.
    function getProtocolStats() external view returns (
        uint256 _totalCycles,
        uint256 _uniqueMiners,
        uint256 _totalPointsMinted,
        uint256 _totalTokensClaimed,
        uint256 _pointsRemaining,
        bool    _tgeActive
    ) {
        _totalCycles        = totalMiningCycles;
        _uniqueMiners       = uniqueMiners;
        _totalPointsMinted  = totalPointsMinted;
        _totalTokensClaimed = totalTokensClaimed;
        _pointsRemaining    = RANK_3_LIMIT > totalPointsMinted
                              ? RANK_3_LIMIT - totalPointsMinted : 0;
        _tgeActive          = isTGEActive;
    }

    function cooldownRemaining(address _user) external view returns (uint256) {
        uint256 next = users[_user].lastMiningTime + MINING_CYCLE;
        return block.timestamp >= next ? 0 : next - block.timestamp;
    }

    function canMine(address _user) external view returns (bool) {
        UserData storage u = users[_user];
        if (!u.hasEverMined) return true;
        return block.timestamp >= u.lastMiningTime + MINING_CYCLE;
    }

    /// @notice Live-calculated pending points for _user (accumulated + session).
    function pendingPoints(address _user) external view returns (uint256) {
        return users[_user].accumulatedPoints + _liveSessionPoints(_user);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _liveSessionPoints(address _user) internal view returns (uint256) {
        UserData storage u = users[_user];
        if (u.currentRatePerHour == 0 || u.lastMiningTime == 0) return 0;
        return _computeSessionPoints(u.lastMiningTime, u.currentRatePerHour);
    }

    function _computeSessionPoints(uint256 startTime, uint256 rate) internal view returns (uint256) {
        uint256 elapsed = block.timestamp - startTime;
        if (elapsed > SESSION_MAX) elapsed = SESSION_MAX;
        return (elapsed * rate) / 3600;
    }

    function _currentRankInternal() internal view returns (uint8) {
        if (totalPointsMinted < RANK_1_LIMIT) return 1;
        if (totalPointsMinted < RANK_2_LIMIT) return 2;
        return 3;
    }

    function _currentRankView() internal view returns (uint8 rank, uint256 pct) {
        if (totalPointsMinted < RANK_1_LIMIT) {
            rank = 1;
            pct  = RANK_1_LIMIT > 0 ? totalPointsMinted * 100 / RANK_1_LIMIT : 0;
        } else if (totalPointsMinted < RANK_2_LIMIT) {
            rank = 2;
            pct  = (totalPointsMinted - RANK_1_LIMIT) * 100 / (RANK_2_LIMIT - RANK_1_LIMIT);
        } else {
            rank = 3;
            pct  = totalPointsMinted < RANK_3_LIMIT
                   ? (totalPointsMinted - RANK_2_LIMIT) * 100 / (RANK_3_LIMIT - RANK_2_LIMIT)
                   : 100;
        }
    }

    /// @dev Gacha picks a base rate then applies rank halving.
    function _calculateRate(address _user) internal view returns (uint256 rate, uint8 tier) {
        bytes32 h = keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            _user,
            totalMiningCycles
        ));
        uint256 rand = uint256(h) % 1000;
        uint8 rank   = _currentRankInternal();

        uint256 baseRate;
        if (rand < TIER_APES_END) {
            tier     = 0;
            baseRate = RATE_APES;
        } else if (rand >= TIER_HOKI_START) {
            tier     = 2;
            baseRate = RATE_HOKI;
        } else {
            tier     = 1;
            baseRate = RATE_BASIC;
        }

        // Rank halving
        if      (rank == 2) rate = baseRate / 2;  // 50 % of base
        else if (rank == 3) rate = baseRate / 4;  // 25 % of base
        else                rate = baseRate;
    }
}
