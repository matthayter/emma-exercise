import { IUser } from "@models/user-model";
import { MockFirmShares } from "@repos/firmShares";
import { UserRepo } from "@repos/user-repo";
import { MockBroker } from "@services/broker-mock";
import { App, ClaimFreeShareResult } from "src/app";

describe('claimFreeShare', () => {
    const firmShares = new MockFirmShares();
    const broker = new MockBroker();
    const userRepo = new UserRepo(null!);
    const app = new App(firmShares, broker, userRepo);
    const simpleUser: IUser = {
        id: "123",
        brokerAccountId: "some-broker-account",
        claims: 5,
    }
    const sampleShareName = "someShareSymbol";

    it("should error on non-user", async () => {
        spyOn(userRepo, "getById").and.resolveTo(null);
        const r = await app.claimFreeShare("invalid-user");
        expect(r.result).toBe("user_not_found");
    });
    it("should error if user has no claims available", async () => {
        spyOn(userRepo, "getById").and.resolveTo({...simpleUser, claims: 0});
        const r = await app.claimFreeShare("some-user");
        expect(r.result).toBe("no_claims_left");
    });
    it("should provide a retry time when no shares are available", async () => {
        spyOn(userRepo, "getById").and.resolveTo(simpleUser)
        spyOn(firmShares, "takeRandomShare").and.resolveTo(null);
        spyOn(broker, "isMarketOpen").and.
            resolveTo({open: true, nextClosingTime: "", nextOpeningTime: ""});
        const actual = await app.claimFreeShare("some-user");
        const expected: ClaimFreeShareResult = {result: "no_shares_available", retryAfter: "300"}
        expect(actual).toEqual(expected)
    });
    it("should move a share to the user's broker account", async () => {
        spyOn(userRepo, "getById").and.resolveTo(simpleUser)
        const decrementSpy = spyOn(userRepo, "decrementShareClaims");
        const takeShareSpy = spyOn(firmShares, "takeRandomShare").and.resolveTo(sampleShareName);
        const moveSpy = spyOn(broker, "moveSharesFromRewardsAccount").and.resolveTo({success: true});

        const actual = await app.claimFreeShare("some-user");

        expect(actual).toEqual({result: "ok"});
        expect(takeShareSpy).toHaveBeenCalledTimes(1);
        expect(moveSpy).toHaveBeenCalledOnceWith(simpleUser.brokerAccountId, sampleShareName, 1);
        expect(decrementSpy).toHaveBeenCalledTimes(1);
    });
});
