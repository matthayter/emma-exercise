import { IFirmShares } from "@repos/firmShares";
import UserRepo from "@repos/user-repo";
import { MockBroker } from "@services/broker-mock";

export class App {
    constructor(
        private firmShares: IFirmShares,
        private broker: MockBroker,
        private usersRepo: UserRepo,
    ) {}

    async claimFreeShare(userId: string): Promise<ClaimFreeShareResult> {
        // Normally, the user would come from an Auth middleware
        const user = await this.usersRepo.getOne(userId);
        if (!user) {
            return {result: "user_not_found"}
        }
        const userBrokerageAccountId = user.brokerAccountId;
    
        // Check that shares remain in brokerage, otherwise: come back later
        // move next share from brokerage account into user's account and decrement claims
        // START OF DANGER SECTION
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
            // Real-world error handling here - skipping as per instructions.
            return {result: "unhandled_error"}
        }
        // END OF DANGER SECTION

        return {result: "ok"}
    }
}

export type ClaimFreeShareResult =
    {result: "ok"} 
    | {result: "user_not_found"}
    | {result: "unhandled_error"}
    | {result: "no_shares_available", retryAfter: string}