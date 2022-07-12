import { IFirmShares } from "@repos/firmShares";
import { UserRepo } from "@repos/user-repo";
import { MockBroker } from "@services/broker-mock";

export class App {
    constructor(
        private firmShares: IFirmShares,
        private broker: MockBroker,
        private usersRepo: UserRepo,
    ) {}

    async claimFreeShare(userId: string): Promise<ClaimFreeShareResult> {
        // Normally, the user would come from an Auth middleware
        const user = await this.usersRepo.getById(userId);
        if (!user) {
            return {result: "user_not_found"}
        }
        const userBrokerageAccountId = user.brokerAccountId;
        const remainingClaims = user.claims;
        if (user.claims <= 0) {
            return {result: "no_claims_left"}
        }
    
        // Check that shares remain in brokerage, otherwise: come back later
        // move next share from brokerage account into user's account and decrement claims
        // START OF DANGER SECTION: The Broker API doesn't offer a way to move shares idempotently
        // or in a transaction, so we're going to have a moment where e.g. if the host explodes,
        // there will be inconsistencies in the states of the data.
        const shareTicker = await this.firmShares.takeRandomShare()
        if (!shareTicker) {
            // Come back later!
            const marketState = await this.broker.isMarketOpen();
            let retryAfter: string
            if (marketState.open) {
                // Shouldn't often happen - just wait a few mins.
                retryAfter = (5*60).toString();
            } else {
                // nextOpeningTime is UTCString format, which is appropriate for this header.
                retryAfter = marketState.nextOpeningTime;
            }
            // We would want to monitor the number of 503s in a dashboard somewhere.
            return {result: "no_shares_available", retryAfter: retryAfter};
        }
    
        const moveResult = await this.broker.moveSharesFromRewardsAccount(userBrokerageAccountId, shareTicker, 1);
        if (!moveResult.success) {
            // Real-world error handling goes here - skipping as per instructions.
            return {result: "unhandled_error"}
        }
        await this.usersRepo.decrementShareClaims(userId);
        // END OF DANGER SECTION

        return {result: "ok"}
    }
}

export type ClaimFreeShareResult =
    {result: "ok"} 
    | {result: "user_not_found"}
    | {result: "no_claims_left"}
    | {result: "unhandled_error"}
    | {result: "no_shares_available", retryAfter: string}