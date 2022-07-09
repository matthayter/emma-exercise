import { IFirmShares, MockFirmShares } from "@repos/firmShares";
import UserRepo from "@repos/user-repo";
import { MockBroker } from "@services/broker-mock";
import { App, ClaimFreeShareResult } from "src/app";

describe('claimFreeShare', () => {
    const firmShares = new MockFirmShares([]);
    const broker = new MockBroker();
    const userRepo = new UserRepo();
    const app = new App(firmShares, broker, userRepo);
    const simpleUser = {
        id: 123,
        brokerAccountId: "some-broker-account",
        email: "someemail@email.com",
        name: "Some Name",
    }
    const sampleShareName = "someShareSymbol";

    // it should remove a share from the list
    // it should add a share to the user.
    // it should error for user not found
    // it should give a time if no shares
    it("should error on non-user", async () => {
        spyOn(userRepo, "getOne").and.resolveTo(null);
        const r = await app.claimFreeShare("invalid-user");
        expect(r.result).toBe("user_not_found");
    });
    it("should provide a retry time when no shares are available", async () => {
        spyOn(userRepo, "getOne").and.resolveTo(simpleUser)
        spyOn(firmShares, "takeRandomShare").and.resolveTo(null);
        spyOn(broker, "isMarketOpen").and.
            resolveTo({open: true, nextClosingTime: "", nextOpeningTime: ""});
        const actual = await app.claimFreeShare("some-user");
        const expected: ClaimFreeShareResult = {result: "no_shares_available", retryAfter: "300"}
        expect(actual).toEqual(expected)
    });
    it("should move a share to the user's broker account", async () => {
        spyOn(userRepo, "getOne").and.resolveTo(simpleUser)
        const takeShareSpy = spyOn(firmShares, "takeRandomShare").and.resolveTo(sampleShareName);
        const moveSpy = spyOn(broker, "moveSharesFromRewardsAccount").and.resolveTo({success: true});

        const actual = await app.claimFreeShare("some-user");

        expect(takeShareSpy).toHaveBeenCalledTimes(1);
        expect(moveSpy).toHaveBeenCalledOnceWith(simpleUser.brokerAccountId, sampleShareName, 1);
    });
});
