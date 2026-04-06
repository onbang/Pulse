message(0x54465931) BetYes {
    stakeAmount: Int as coins;
}

message(0x54464E31) BetNo {
    stakeAmount: Int as coins;
}

message(0x54464C31) LockMarket {}

message(0x54465231) ResolveMarket {
    finalPriceE9: Int as uint64;
    resolvedAt: Int as uint32;
}

message(0x54464331) ClaimReward {}

message(0x54464631) ClaimRewardFor {
    wallet: Address;
}

struct Position {
    yesStake: Int as coins;
    noStake: Int as coins;
    claimed: Bool;
}

struct MarketState {
    owner: Address;
    resolver: Address;
    treasury: Address;
    token: Address;
    timeframeSeconds: Int as uint32;
    thresholdBps: Int as uint16;
    referencePriceE9: Int as uint64;
    protocolFeeBps: Int as uint16;
    createdAt: Int as uint32;
    closeTime: Int as uint32;
    status: Int as uint8;
    resolvedAt: Int as uint32;
    finalPriceE9: Int as uint64;
    totalYes: Int as coins;
    totalNo: Int as coins;
}

contract TonForecastMarket {
    owner: Address;
    resolver: Address;
    treasury: Address;
    token: Address;
    timeframeSeconds: Int as uint32;
    thresholdBps: Int as uint16;
    referencePriceE9: Int as uint64;
    protocolFeeBps: Int as uint16;
    createdAt: Int as uint32;
    closeTime: Int as uint32;

    status: Int as uint8;
    resolvedAt: Int as uint32;
    finalPriceE9: Int as uint64;
    totalYes: Int as coins;
    totalNo: Int as coins;
    positions: map<Int as uint256, Position>;

    init(
        owner: Address,
        resolver: Address,
        treasury: Address,
        token: Address,
        timeframeSeconds: Int,
        thresholdBps: Int,
        referencePriceE9: Int,
        protocolFeeBps: Int,
        createdAt: Int,
        closeTime: Int
    ) {
        require(timeframeSeconds > 0, "invalid_timeframe");
        require(thresholdBps >= 0, "invalid_threshold");
        require(referencePriceE9 > 0, "invalid_reference_price");
        require(closeTime > createdAt, "invalid_close_time");

        self.owner = owner;
        self.resolver = resolver;
        self.treasury = treasury;
        self.token = token;
        self.timeframeSeconds = timeframeSeconds;
        self.thresholdBps = thresholdBps;
        self.referencePriceE9 = referencePriceE9;
        self.protocolFeeBps = protocolFeeBps;
        self.createdAt = createdAt;
        self.closeTime = closeTime;

        self.status = 0;
        self.resolvedAt = 0;
        self.finalPriceE9 = 0;
        self.totalYes = 0;
        self.totalNo = 0;
        self.positions = emptyMap();
    }

    receive() {}

    receive(msg: BetYes) {
        self.acceptBet(sender(), true, msg.stakeAmount);
    }

    receive(msg: BetNo) {
        self.acceptBet(sender(), false, msg.stakeAmount);
    }

    receive(msg: LockMarket) {
        self.lockMarket();
    }

    receive(msg: ResolveMarket) {
        self.resolveMarket(msg.finalPriceE9, msg.resolvedAt);
    }

    receive(msg: ClaimReward) {
        self.claimFor(sender());
    }

    receive(msg: ClaimRewardFor) {
        self.claimFor(msg.wallet);
    }

    fun statusOpen(): Int {
        return 0;
    }

    fun statusLocked(): Int {
        return 1;
    }

    fun statusResolvedYes(): Int {
        return 2;
    }

    fun statusResolvedNo(): Int {
        return 3;
    }

    fun statusResolvedDraw(): Int {
        return 4;
    }

    fun isOpen(): Bool {
        return self.status == self.statusOpen();
    }

    fun isLocked(): Bool {
        return self.status == self.statusLocked();
    }

    fun isResolved(): Bool {
        return self.status == self.statusResolvedYes()
            || self.status == self.statusResolvedNo()
            || self.status == self.statusResolvedDraw();
    }

    fun requireResolver() {
        require(sender() == self.resolver, "resolver_only");
    }

    fun requireMarketOpenForBet() {
        require(self.isOpen(), "market_not_open");
        require(now() < self.closeTime, "market_locked");
    }

    fun requireResolved() {
        require(self.isResolved(), "market_not_resolved");
    }

    fun lockMarket() {
        require(now() >= self.closeTime, "market_still_open");
        require(self.isOpen(), "market_not_open");
        self.status = self.statusLocked();
    }

    fun resolveMarket(finalPriceE9: Int, resolvedAt: Int) {
        self.requireResolver();
        require(now() >= self.closeTime, "market_still_open");
        require(self.isOpen() || self.isLocked(), "market_not_resolvable");

        let resolvedStatus = self.resolveStatusForPrice(finalPriceE9);
        resolvedStatus = self.normalizeResolvedStatus(resolvedStatus);

        self.status = resolvedStatus;
        self.finalPriceE9 = finalPriceE9;
        self.resolvedAt = resolvedAt > 0 ? resolvedAt : now();
    }

    fun acceptBet(participant: Address, isYes: Bool, stakeAmount: Int) {
        self.requireMarketOpenForBet();
        self.requireStakeAmount(stakeAmount);

        let position = self.loadPositionOrEmpty(participant);

        if (isYes) {
            self.totalYes = self.totalYes + stakeAmount;
            position.yesStake = position.yesStake + stakeAmount;
        } else {
            self.totalNo = self.totalNo + stakeAmount;
            position.noStake = position.noStake + stakeAmount;
        }

        self.savePosition(participant, position);
    }

    fun requireStakeAmount(stakeAmount: Int) {
        require(stakeAmount > 0, "stake_required");
        require(context().value >= stakeAmount, "insufficient_message_value");
    }

    fun loadPositionOrEmpty(wallet: Address): Position {
        let position = self.positions.get(self.derivePositionKey(wallet));

        return position == null
            ? Position { yesStake: 0, noStake: 0, claimed: false }
            : position!!;
    }

    fun loadClaimablePosition(wallet: Address): Position {
        let position = self.positions.get(self.derivePositionKey(wallet));
        require(position != null, "position_not_found");
        require(!position!!.claimed, "already_claimed");
        return position!!;
    }

    fun savePosition(wallet: Address, position: Position) {
        self.positions.set(self.derivePositionKey(wallet), position);
    }

    fun claimFor(recipient: Address) {
        self.requireResolved();

        let position = self.loadClaimablePosition(recipient);
        let payout = self.calculatePayout(position);
        require(payout > 0, "nothing_to_claim");

        let updatedPosition = position;
        updatedPosition.claimed = true;
        self.savePosition(recipient, updatedPosition);

        self.distributeClaim(recipient, payout, position);
    }

    fun distributeClaim(recipient: Address, payout: Int, position: Position) {
        if (self.status == self.statusResolvedDraw()) {
            self.sendCoins(recipient, payout);
            return;
        }

        let grossProfit = self.calculateGrossProfit(position);
        let protocolFee = self.calculateProtocolFee(grossProfit);

        if (protocolFee > 0) {
            self.sendCoins(self.treasury, protocolFee);
        }

        self.sendCoins(recipient, payout);
    }

    fun sendCoins(recipient: Address, amount: Int) {
        send(SendParameters {
            to: recipient,
            value: amount,
            mode: SendIgnoreErrors
        });
    }

    fun resolveStatusForPrice(finalPriceE9: Int): Int {
        let upperTarget = (self.referencePriceE9 * (10000 + self.thresholdBps)) / 10000;
        let lowerTarget = (self.referencePriceE9 * (10000 - self.thresholdBps)) / 10000;

        if (finalPriceE9 >= upperTarget) {
            return self.statusResolvedYes();
        }

        if (finalPriceE9 <= lowerTarget) {
            return self.statusResolvedNo();
        }

        return self.statusResolvedDraw();
    }

    fun normalizeResolvedStatus(status: Int): Int {
        if (status == self.statusResolvedYes() && self.totalYes == 0) {
            return self.statusResolvedDraw();
        }

        if (status == self.statusResolvedNo() && self.totalNo == 0) {
            return self.statusResolvedDraw();
        }

        return status;
    }

    fun winnerPool(): Int {
        return self.status == self.statusResolvedYes()
            ? self.totalYes
            : self.totalNo;
    }

    fun loserPool(): Int {
        return self.status == self.statusResolvedYes()
            ? self.totalNo
            : self.totalYes;
    }

    fun winningStake(position: Position): Int {
        return self.status == self.statusResolvedYes()
            ? position.yesStake
            : position.noStake;
    }

    fun calculateGrossProfit(position: Position): Int {
        let winningStake = self.winningStake(position);
        let winnerPool = self.winnerPool();
        let loserPool = self.loserPool();

        return (winningStake * loserPool) / winnerPool;
    }

    fun calculateProtocolFee(grossProfit: Int): Int {
        return (grossProfit * self.protocolFeeBps) / 10000;
    }

    fun calculatePayout(position: Position): Int {
        if (self.status == self.statusResolvedDraw()) {
            return position.yesStake + position.noStake;
        }

        let winningStake = self.winningStake(position);
        require(winningStake > 0, "no_winning_position");

        let winnerPool = self.winnerPool();
        require(winnerPool > 0, "invalid_winner_pool");

        let grossProfit = self.calculateGrossProfit(position);
        let protocolFee = self.calculateProtocolFee(grossProfit);

        return winningStake + grossProfit - protocolFee;
    }

    fun derivePositionKey(wallet: Address): Int {
        return beginCell()
            .storeAddress(wallet)
            .endCell()
            .hash();
    }

    get fun getMarketState(): MarketState {
        return MarketState {
            owner: self.owner,
            resolver: self.resolver,
            treasury: self.treasury,
            token: self.token,
            timeframeSeconds: self.timeframeSeconds,
            thresholdBps: self.thresholdBps,
            referencePriceE9: self.referencePriceE9,
            protocolFeeBps: self.protocolFeeBps,
            createdAt: self.createdAt,
            closeTime: self.closeTime,
            status: self.status,
            resolvedAt: self.resolvedAt,
            finalPriceE9: self.finalPriceE9,
            totalYes: self.totalYes,
            totalNo: self.totalNo
        };
    }

    get fun getPosition(wallet: Address): Position {
        let positionKey = self.derivePositionKey(wallet);
        let position = self.positions.get(positionKey);

        return position == null
            ? Position { yesStake: 0, noStake: 0, claimed: false }
            : position!!;
    }
}
