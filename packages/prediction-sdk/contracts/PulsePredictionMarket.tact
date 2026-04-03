// Draft Tact contract source for STON Pulse prediction betting.
// This source is intentionally stored with the SDK so the UI and onchain
// message model evolve together. It is not deployed by default.

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

struct Round {
    marketId: String;
    marketLabel: String;
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
    roundDurationSeconds: Int as uint32;
    protocolFeeBps: Int as uint16;
    rounds: map<String, Round>;
    positions: map<String, map<Address, Position>>;

    init(admin: Address, roundDurationSeconds: Int, protocolFeeBps: Int) {
        self.admin = admin;
        self.roundDurationSeconds = roundDurationSeconds as uint32;
        self.protocolFeeBps = protocolFeeBps as uint16;
        self.rounds = emptyMap();
        self.positions = emptyMap();
    }

    receive(msg: PlaceBet) {
        let nowTs = now();
        let round = self.rounds.get(msg.marketId);

        if (round == null || round!!.status != 0) {
            round = Round {
                marketId: msg.marketId,
                marketLabel: msg.marketLabel,
                status: 0,
                openedAt: nowTs,
                closesAt: nowTs + self.roundDurationSeconds,
                settledAt: 0,
                totalUp: 0,
                totalDown: 0,
                result: 2
            };
        }

        require(round!!.status == 0, "round_closed");
        require(nowTs <= round!!.closesAt, "round_expired");
        require(context().value > 0, "stake_required");

        let updatedRound = round!!;
        if (msg.direction == 1) {
            updatedRound.totalUp = updatedRound.totalUp + context().value;
        } else {
            updatedRound.totalDown = updatedRound.totalDown + context().value;
        }

        let marketPositions = self.positions.get(msg.marketId);
        let position = marketPositions == null
            ? Position { upStake: 0, downStake: 0, claimed: false }
            : marketPositions!!.get(sender()) ?? Position { upStake: 0, downStake: 0, claimed: false };

        if (msg.direction == 1) {
            position.upStake = position.upStake + context().value;
        } else {
            position.downStake = position.downStake + context().value;
        }

        let nextMarketPositions = marketPositions == null ? emptyMap() : marketPositions!!;
        nextMarketPositions.set(sender(), position);

        self.positions.set(msg.marketId, nextMarketPositions);
        self.rounds.set(msg.marketId, updatedRound);
    }

    receive(msg: CloseRound) {
        self.requireAdmin(sender());

        let round = self.rounds.get(msg.marketId);
        require(round != null, "round_not_found");
        require(round!!.status == 0, "round_not_open");

        let updated = round!!;
        updated.status = 1;
        self.rounds.set(msg.marketId, updated);
    }

    receive(msg: SettleRound) {
        self.requireAdmin(sender());

        let round = self.rounds.get(msg.marketId);
        require(round != null, "round_not_found");
        require(round!!.status == 1, "round_not_closed");

        let updated = round!!;
        updated.status = 2;
        updated.result = msg.result;
        updated.settledAt = now();
        self.rounds.set(msg.marketId, updated);
    }

    receive(msg: Claim) {
        let round = self.rounds.get(msg.marketId);
        require(round != null, "round_not_found");
        require(round!!.status == 2, "round_not_settled");

        let marketPositions = self.positions.get(msg.marketId);
        require(marketPositions != null, "position_not_found");

        let position = marketPositions!!.get(sender());
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
        marketPositions!!.set(sender(), updatedPosition);
        self.positions.set(msg.marketId, marketPositions!!);

        send(SendParameters {
            to: sender(),
            value: netPayout,
            mode: SendIgnoreErrors
        });
    }

    fun requireAdmin(candidate: Address) {
        require(candidate == self.admin, "admin_only");
    }
}
