message(0x50554231) PlaceBet {
    marketId: String;
    marketLabel: String;
    direction: Int as uint8;
}

message(0x50554331) CloseRound {
    marketId: String;
}

message(0x50555331) SettleRound {
    marketId: String;
    result: Int as uint8;
}

message(0x50555031) Claim {
    marketId: String;
}

struct Position {
    upStake: Int as coins;
    downStake: Int as coins;
    claimed: Bool;
}

contract PulsePredictionMarket {
    admin: Address;
    roundDurationSeconds: Int;
    protocolFeeBps: Int;
    deploymentNonce: Int;
    marketId: String;
    marketLabel: String;
    status: Int;
    openedAt: Int;
    closesAt: Int;
    settledAt: Int;
    totalUp: Int as coins;
    totalDown: Int as coins;
    result: Int;
    positions: map<Address, Position>;

    init(admin: Address, roundDurationSeconds: Int, protocolFeeBps: Int, deploymentNonce: Int) {
        self.admin = admin;
        self.roundDurationSeconds = roundDurationSeconds;
        self.protocolFeeBps = protocolFeeBps;
        self.deploymentNonce = deploymentNonce;
        self.marketId = "";
        self.marketLabel = "";
        self.status = 3;
        self.openedAt = 0;
        self.closesAt = 0;
        self.settledAt = 0;
        self.totalUp = 0;
        self.totalDown = 0;
        self.result = 2;
        self.positions = emptyMap();
    }

    receive(msg: PlaceBet) {
        let nowTs = now();

        if (self.status == 3 || self.status == 2) {
            self.startRound(msg.marketId, msg.marketLabel, nowTs);
        }

        require(self.marketId == msg.marketId, "another_round_active");
        require(self.status == 0, "round_closed");
        require(nowTs <= self.closesAt, "round_expired");
        require(context().value > 0, "stake_required");

        if (msg.direction == 1) {
            self.totalUp = self.totalUp + context().value;
        } else {
            self.totalDown = self.totalDown + context().value;
        }

        let existingPosition = self.positions.get(sender());
        let position = existingPosition == null
            ? Position { upStake: 0, downStake: 0, claimed: false }
            : existingPosition!!;

        if (msg.direction == 1) {
            position.upStake = position.upStake + context().value;
        } else {
            position.downStake = position.downStake + context().value;
        }

        self.positions.set(sender(), position);
    }

    receive(msg: CloseRound) {
        self.requireAdmin(sender());
        require(self.marketId == msg.marketId, "round_not_found");
        require(self.status == 0, "round_not_open");

        self.status = 1;
    }

    receive(msg: SettleRound) {
        self.requireAdmin(sender());
        require(self.marketId == msg.marketId, "round_not_found");
        require(self.status == 1, "round_not_closed");

        self.status = 2;
        self.result = msg.result;
        self.settledAt = now();
    }

    receive(msg: Claim) {
        require(self.marketId == msg.marketId, "round_not_found");
        require(self.status == 2, "round_not_settled");

        let position = self.positions.get(sender());
        require(position != null, "position_not_found");
        require(!position!!.claimed, "already_claimed");

        let winningStake = self.result == 1 ? position!!.upStake : position!!.downStake;
        require(winningStake > 0, "no_winning_position");

        let totalPool = self.totalUp + self.totalDown;
        let winnerPool = self.result == 1 ? self.totalUp : self.totalDown;
        require(winnerPool > 0, "invalid_winner_pool");

        let payout = (winningStake * totalPool) / winnerPool;
        let fee = (payout * self.protocolFeeBps) / 10000;
        let netPayout = payout - fee;

        let updatedPosition = position!!;
        updatedPosition.claimed = true;
        self.positions.set(sender(), updatedPosition);

        send(SendParameters {
            to: sender(),
            value: netPayout,
            mode: SendIgnoreErrors
        });
    }

    fun startRound(nextMarketId: String, nextMarketLabel: String, nowTs: Int) {
        self.marketId = nextMarketId;
        self.marketLabel = nextMarketLabel;
        self.status = 0;
        self.openedAt = nowTs;
        self.closesAt = nowTs + self.roundDurationSeconds;
        self.settledAt = 0;
        self.totalUp = 0;
        self.totalDown = 0;
        self.result = 2;
        self.positions = emptyMap();
    }

    fun requireAdmin(candidate: Address) {
        require(candidate == self.admin, "admin_only");
    }
}
