message(0x54465931) BetYes {}

message(0x54464E31) BetNo {}

message(0x54464C31) LockMarket {}

message(0x54465231) ResolveMarket {
    finalPriceE9: Int as uint64;
    resolvedAt: Int as uint32;
}

message(0x54464331) ClaimReward {}

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
    tokenSymbol: String;
    marketId: String;
    marketTitle: String;
    timeframeId: String;
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
    tokenSymbol: String;
    marketId: String;
    marketTitle: String;
    timeframeId: String;
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
        tokenSymbol: String,
        marketId: String,
        marketTitle: String,
        timeframeId: String,
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
        self.tokenSymbol = tokenSymbol;
        self.marketId = marketId;
        self.marketTitle = marketTitle;
        self.timeframeId = timeframeId;
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
        self.ensureMarketOpen();
        self.placeStake(true);
    }

    receive(msg: BetNo) {
        self.ensureMarketOpen();
        self.placeStake(false);
    }

    receive(msg: LockMarket) {
        require(now() >= self.closeTime, "market_still_open");
        require(self.status == 0, "market_not_open");
        self.status = 1;
    }

    receive(msg: ResolveMarket) {
        require(sender() == self.resolver, "resolver_only");
        require(now() >= self.closeTime, "market_still_open");
        require(self.status == 0 || self.status == 1, "market_not_resolvable");

        let outcome = self.computeOutcome(msg.finalPriceE9);

        if ((outcome == 2 && self.totalYes == 0) || (outcome == 3 && self.totalNo == 0)) {
            outcome = 4;
        }

        self.status = outcome;
        self.finalPriceE9 = msg.finalPriceE9;
        self.resolvedAt = msg.resolvedAt > 0 ? msg.resolvedAt : now();
    }

    receive(msg: ClaimReward) {
        require(self.isResolved(), "market_not_resolved");

        let positionKey = self.derivePositionKey(sender());
        let position = self.positions.get(positionKey);
        require(position != null, "position_not_found");
        require(!position!!.claimed, "already_claimed");

        let payout = self.calculatePayout(position!!);
        require(payout > 0, "nothing_to_claim");

        let updatedPosition = position!!;
        updatedPosition.claimed = true;
        self.positions.set(positionKey, updatedPosition);

        if (self.status == 4) {
            send(SendParameters {
                to: sender(),
                value: payout,
                mode: SendIgnoreErrors
            });
            return;
        }

        let winningStake = self.status == 2 ? position!!.yesStake : position!!.noStake;
        let winnerPool = self.status == 2 ? self.totalYes : self.totalNo;
        let loserPool = self.status == 2 ? self.totalNo : self.totalYes;
        let grossProfit = (winningStake * loserPool) / winnerPool;
        let protocolFee = (grossProfit * self.protocolFeeBps) / 10000;

        if (protocolFee > 0) {
            send(SendParameters {
                to: self.treasury,
                value: protocolFee,
                mode: SendIgnoreErrors
            });
        }

        send(SendParameters {
            to: sender(),
            value: payout,
            mode: SendIgnoreErrors
        });
    }

    fun ensureMarketOpen() {
        require(context().value > 0, "stake_required");
        require(self.status == 0, "market_not_open");
        require(now() < self.closeTime, "market_locked");
    }

    fun placeStake(isYes: Bool) {
        let positionKey = self.derivePositionKey(sender());
        let existingPosition = self.positions.get(positionKey);
        let position = existingPosition == null
            ? Position { yesStake: 0, noStake: 0, claimed: false }
            : existingPosition!!;

        if (isYes) {
            self.totalYes = self.totalYes + context().value;
            position.yesStake = position.yesStake + context().value;
        } else {
            self.totalNo = self.totalNo + context().value;
            position.noStake = position.noStake + context().value;
        }

        self.positions.set(positionKey, position);
    }

    fun computeOutcome(finalPriceE9: Int): Int {
        let upperTarget = (self.referencePriceE9 * (10000 + self.thresholdBps)) / 10000;
        let lowerTarget = (self.referencePriceE9 * (10000 - self.thresholdBps)) / 10000;

        if (finalPriceE9 >= upperTarget) {
            return 2;
        }

        if (finalPriceE9 <= lowerTarget) {
            return 3;
        }

        return 4;
    }

    fun calculatePayout(position: Position): Int {
        if (self.status == 4) {
            return position.yesStake + position.noStake;
        }

        let winningStake = self.status == 2 ? position.yesStake : position.noStake;
        require(winningStake > 0, "no_winning_position");

        let winnerPool = self.status == 2 ? self.totalYes : self.totalNo;
        let loserPool = self.status == 2 ? self.totalNo : self.totalYes;
        require(winnerPool > 0, "invalid_winner_pool");

        let grossProfit = (winningStake * loserPool) / winnerPool;
        let protocolFee = (grossProfit * self.protocolFeeBps) / 10000;

        return winningStake + grossProfit - protocolFee;
    }

    fun derivePositionKey(wallet: Address): Int {
        return beginCell()
            .storeAddress(wallet)
            .endCell()
            .hash();
    }

    fun isResolved(): Bool {
        return self.status == 2 || self.status == 3 || self.status == 4;
    }

    get fun getMarketState(): MarketState {
        return MarketState {
            owner: self.owner,
            resolver: self.resolver,
            treasury: self.treasury,
            token: self.token,
            tokenSymbol: self.tokenSymbol,
            marketId: self.marketId,
            marketTitle: self.marketTitle,
            timeframeId: self.timeframeId,
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
