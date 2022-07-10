import { AppConfig } from "@models/app-config";
import { IFirmShares } from "@repos/firmShares";
import { MockBroker } from "./broker-mock";

export class SharePurchaser {
    constructor(
        private config: AppConfig,
        private broker: MockBroker,
        private firmShares: IFirmShares,
    ) {}

    // This method should only be run by a single host, e.g. via a cron job on my-prod-host1
    async checkAndBuy(): Promise<void> {
        const positions = await this.broker.getRewardsAccountPositions();
        let numberOfSharesHeld = positions
            .map(p => p.quantity)
            .reduce((a, b) => a + b);

        const sharesPerPurchaseBatch = this.config.shareDistribution
            .map(p => p.quantity)
            .reduce((a, b) => a + b);
        while (numberOfSharesHeld < this.config.minShares) {
            await this.buyDistributionSetOfShares();
            numberOfSharesHeld += sharesPerPurchaseBatch;
        }
    }

    async buyDistributionSetOfShares() {
        // Not shown: proper error handling.
        const tradableSymbols = (await this.broker.listTradableAssets()).map(x => x.tickerSymbol);
        const priceReqs = tradableSymbols.map(s => this.broker.getLatestPrice(s));
        const prices = await Promise.all(priceReqs);
        const shares = tradableSymbols.map((s, i) => {return {symbol: s, price: prices[i].sharePrice}});

        // Sort by price. Consider checking whether the number of shares would make this too long-running.
        shares.sort((a, b) => a.price - b.price);
        const purchaseOrders: Array<Promise<{ success: boolean, sharePricePaid: number }>> = []
        const purchases = [];
        for (const bucket of this.config.shareDistribution) {
            // Cheapest stock that matches the bucket
            const matchingShare = shares.find(s =>
                s.price >= bucket.minPrice &&
                s.price <= bucket.maxPrice
            )
            purchases.push({symbol: matchingShare!.symbol, price: matchingShare!.price, quantity: bucket.quantity});
            purchaseOrders.push(
                this.broker.buySharesInRewardsAccount(
                    matchingShare!.symbol, // Note the '!' - this is the assumption that a suitable share exists.
                    bucket.quantity
                )
            )
        }

        // Not shown: proper error handling.
        await Promise.all(purchaseOrders);

    }
}