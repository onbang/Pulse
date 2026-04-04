message(0x50554231) PlaceBet {
    roundId: String;
    marketId: String;
    marketLabel: String;
    token: Address;
    timeframeId: String;
    timeframeCode: Int as uint8;
    roundDurationSeconds: Int as uint32;
    roundStartTimestamp: Int as uint32;
    direction: Int as uint8;
}

message(0x50554331) CloseRound {
    roundId: String;
    token: Address;
    timeframeCode: Int as uint8;
    roundStartTimestamp: Int as uint32;
}

message(0x50555331) SettleRound {
    roundId: String;
    token: Address;
    timeframeCode: Int as uint8;
    roundStartTimestamp: Int as uint32;
    result: Int as uint8;
}

message(0x50555031) Claim {
    roundId: String;
    token: Address;
    timeframeCode: Int as uint8;
    roundStartTimestamp: Int as uint32;
}

struct Round {
    roundId: String;
    marketId: String;
    marketLabel: String;
    token: Address;
    timeframeId: String;
    timeframeCode: Int as uint8;
    roundDurationSeconds: Int as uint32;
    status: Int as uint8;
    openedAt: Int as uint32;
    closesAt: Int as uint32;
    settledAt: Int as uint32;
    totalUp: Int as coins;
    totalDown: Int as coins;
    result: Int as uint8;
}

struct Position {
    upStake: Int as coins;
    downStake: Int as coins;
    claimed: Bool;
}

contract PulsePredictionMarket {
    admin: Address;
    protocolFeeBps: Int as uint16;
    deploymentNonce: Int;
    rounds: map<Int as uint256, Round>;
    positions: map<Int as uint256, Position>;

    init(admin: Address, protocolFeeBps: Int, deploymentNonce: Int) {
        self.admin = admin;
        self.protocolFeeBps = protocolFeeBps;
        self.deploymentNonce = deploymentNonce;
        self.rounds = emptyMap();
        self.positions = emptyMap();
    }

    receive(msg: PlaceBet) {
        let nowTs = now();
        let expectedCloseAt = msg.roundStartTimestamp + msg.roundDurationSeconds;
        let roundKey = self.deriveRoundKey(msg.token, msg.timeframeCode, msg.roundStartTimestamp);
        let positionKey = self.derivePositionKey(sender(), msg.token, msg.timeframeCode, msg.roundStartTimestamp);

        require(context().value > 0, "stake_required");
        require(msg.roundStartTimestamp > 0, "round_start_required");
        require(self.isSupportedTimeframe(msg.timeframeId, msg.timeframeCode, msg.roundDurationSeconds), "invalid_timeframe");
        require(nowTs >= msg.roundStartTimestamp, "round_not_started");
        require(nowTs <= expectedCloseAt, "round_expired");

        let round = self.rounds.get(roundKey);

        if (round == null) {
            round = Round {
                roundId: msg.roundId,
                marketId: msg.marketId,
                marketLabel: msg.marketLabel,
                token: msg.token,
                timeframeId: msg.timeframeId,
                timeframeCode: msg.timeframeCode,
                roundDurationSeconds: msg.roundDurationSeconds,
                status: 0,
                openedAt: msg.roundStartTimestamp,
                closesAt: expectedCloseAt,
                settledAt: 0,
                totalUp: 0,
                totalDown: 0,
                result: 2
            };
        }

        require(round!!.marketId == msg.marketId, "market_mismatch");
        require(round!!.timeframeId == msg.timeframeId, "timeframe_mismatch");
        require(round!!.timeframeCode == msg.timeframeCode, "timeframe_code_mismatch");
        require(round!!.token == msg.token, "token_mismatch");
        require(round!!.openedAt == msg.roundStartTimestamp, "round_mismatch");
        require(round!!.closesAt == expectedCloseAt, "round_duration_mismatch");
        require(round!!.status == 0, "round_closed");

        let updatedRound = round!!;

        if (msg.direction == 1) {
            updatedRound.totalUp = updatedRound.totalUp + context().value;
        } else {
            updatedRound.totalDown = updatedRound.totalDown + context().value;
        }

        let existingPosition = self.positions.get(positionKey);
        let position = existingPosition == null
            ? Position { upStake: 0, downStake: 0, claimed: false }
            : existingPosition!!;

        if (msg.direction == 1) {
            position.upStake = position.upStake + context().value;
        } else {
            position.downStake = position.downStake + context().value;
        }

        self.positions.set(positionKey, position);
        self.rounds.set(roundKey, updatedRound);
    }

    receive(msg: CloseRound) {
        self.requireAdmin(sender());
        let roundKey = self.deriveRoundKey(msg.token, msg.timeframeCode, msg.roundStartTimestamp);

        let round = self.rounds.get(roundKey);
        require(round != null, "round_not_found");
        require(round!!.roundId == msg.roundId, "round_id_mismatch");
        require(round!!.token == msg.token, "token_mismatch");
        require(round!!.timeframeCode == msg.timeframeCode, "timeframe_code_mismatch");
        require(round!!.openedAt == msg.roundStartTimestamp, "round_start_mismatch");
        require(round!!.status == 0, "round_not_open");

        let updated = round!!;
        updated.status = 1;
        self.rounds.set(roundKey, updated);
    }

    receive(msg: SettleRound) {
        self.requireAdmin(sender());
        let roundKey = self.deriveRoundKey(msg.token, msg.timeframeCode, msg.roundStartTimestamp);

        let round = self.rounds.get(roundKey);
        require(round != null, "round_not_found");
        require(round!!.roundId == msg.roundId, "round_id_mismatch");
        require(round!!.token == msg.token, "token_mismatch");
        require(round!!.timeframeCode == msg.timeframeCode, "timeframe_code_mismatch");
        require(round!!.openedAt == msg.roundStartTimestamp, "round_start_mismatch");
        require(round!!.status == 1, "round_not_closed");

        let updated = round!!;
        updated.status = 2;
        updated.result = msg.result;
        updated.settledAt = now();
        self.rounds.set(roundKey, updated);
    }

    receive(msg: Claim) {
        let roundKey = self.deriveRoundKey(msg.token, msg.timeframeCode, msg.roundStartTimestamp);
        let positionKey = self.derivePositionKey(sender(), msg.token, msg.timeframeCode, msg.roundStartTimestamp);
        let round = self.rounds.get(roundKey);
        require(round != null, "round_not_found");
        require(round!!.roundId == msg.roundId, "round_id_mismatch");
        require(round!!.token == msg.token, "token_mismatch");
        require(round!!.timeframeCode == msg.timeframeCode, "timeframe_code_mismatch");
        require(round!!.openedAt == msg.roundStartTimestamp, "round_start_mismatch");
        require(round!!.status == 2, "round_not_settled");

        let position = self.positions.get(positionKey);
        require(position != null, "position_not_found");
        require(!position!!.claimed, "already_claimed");

        let winningStake = round!!.result == 1 ? position!!.upStake : position!!.downStake;
        require(winningStake > 0, "no_winning_position");

        let totalPool = round!!.totalUp + round!!.totalDown;
        let winnerPool = round!!.result == 1 ? round!!.totalUp : round!!.totalDown;
        require(winnerPool > 0, "invalid_winner_pool");

        let payout = (winningStake * totalPool) / winnerPool;
        let fee = (payout * self.protocolFeeBps) / 10000;
        let netPayout = payout - fee;

        let updatedPosition = position!!;
        updatedPosition.claimed = true;
        self.positions.set(positionKey, updatedPosition);

        send(SendParameters {
            to: sender(),
            value: netPayout,
            mode: SendIgnoreErrors
        });
    }

    fun isSupportedTimeframe(timeframeId: String, timeframeCode: Int, durationSeconds: Int): Bool {
        if (timeframeId == "5M") {
            return timeframeCode == 1 && durationSeconds == 300;
        }

        if (timeframeId == "15M") {
            return timeframeCode == 2 && durationSeconds == 900;
        }

        if (timeframeId == "1H") {
            return timeframeCode == 3 && durationSeconds == 3600;
        }

        if (timeframeId == "4H") {
            return timeframeCode == 4 && durationSeconds == 14400;
        }

        if (timeframeId == "1D") {
            return timeframeCode == 5 && durationSeconds == 86400;
        }

        return false;
    }

    fun deriveRoundKey(token: Address, timeframeCode: Int, roundStartTimestamp: Int): Int {
        return beginCell()
            .storeAddress(token)
            .storeUint(timeframeCode, 8)
            .storeUint(roundStartTimestamp, 32)
            .endCell()
            .hash();
    }

    fun derivePositionKey(wallet: Address, token: Address, timeframeCode: Int, roundStartTimestamp: Int): Int {
        return beginCell()
            .storeAddress(wallet)
            .storeAddress(token)
            .storeUint(timeframeCode, 8)
            .storeUint(roundStartTimestamp, 32)
            .endCell()
            .hash();
    }

    fun requireAdmin(candidate: Address) {
        require(candidate == self.admin, "admin_only");
    }
}
