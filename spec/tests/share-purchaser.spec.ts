import { AppConfig } from "@models/app-config";
import { SharePurchaser } from "@services/share-purchaser";
import { MockFirmShares } from "@repos/firmShares";
import { MockBroker } from "@services/broker-mock";

describe("sharePurchaser", () => {
    const firmShares = new MockFirmShares(); // Stateless - can be reused between tests.
    let broker: MockBroker;
    let purchaser: SharePurchaser;
    let config: AppConfig;
    beforeEach(() => {
        broker = new MockBroker();
        config = {
            minShares: 20,
            shareDistribution: [
                {
                    minPrice: 3.0,
                    maxPrice: 10.0,
                    quantity: 95
                },
                {
                    minPrice: 10.0,
                    maxPrice: 25.0,
                    quantity: 3
                },
                {
                    minPrice: 25.0,
                    maxPrice: 200.0,
                    quantity: 2
                },
            ]
        }

        purchaser = new SharePurchaser(config, broker, firmShares);
    })

    it("purchases shares in the happy path", async () => {
        const buySharesSpy = spyOn(broker, "buySharesInRewardsAccount").and.callThrough();
        const addSharesSpy = spyOn(firmShares, "addRecordOfPurchases");
        // spyOnAllFunctions(broker);
        await purchaser.checkAndBuy();

        // Not great - relies on mock code outside of this test - poor cohesion.
        expect(buySharesSpy).toHaveBeenCalledWith("msft", 95);
        expect(buySharesSpy).toHaveBeenCalledWith("appl", 3);
        expect(buySharesSpy).toHaveBeenCalledWith("tsla", 2);
        expect(buySharesSpy).toHaveBeenCalledTimes(3);
        expect(addSharesSpy).toHaveBeenCalled();
        buySharesSpy.calls.reset();

        await purchaser.checkAndBuy();
        expect(buySharesSpy).toHaveBeenCalledTimes(0);
    })
    it ("purchases multiple rounds of shares when required", async () => {
        config.minShares = 150;
        const buySharesSpy = spyOn(broker, "buySharesInRewardsAccount").and.callThrough();
        await purchaser.checkAndBuy();

        expect(buySharesSpy).toHaveBeenCalledTimes(6);
        buySharesSpy.calls.reset();

        await purchaser.checkAndBuy();
        expect(buySharesSpy).toHaveBeenCalledTimes(0);
    })
    it ("doesn't try to buy shares when the market is closed", async () => {
        const buySharesSpy = spyOn(broker, "buySharesInRewardsAccount").and.callThrough();
        spyOn(broker, "isMarketOpen").and.resolveTo({open: false, nextClosingTime: "", nextOpeningTime: ""});

        await purchaser.checkAndBuy();

        expect(buySharesSpy).toHaveBeenCalledTimes(0);
    });
    // Not included: tests of all the various error conditions.
});