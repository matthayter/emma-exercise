export class MockBroker {
    private static shares: {[keys: string]: number} = {
        "msft": 5.6,
        "appl": 19.1,
        "bliaq": 104.5,
        "tsla": 42.0,
    }

    heldShares: Array<{ tickerSymbol: string, quantity: number, sharePrice: number }> = [];

    // To fetch a list of assets available for trading
    async listTradableAssets(): Promise<Array<{ tickerSymbol: string }>> {
        const symbols = Object.keys(MockBroker.shares)
        return symbols.map(x => {return {tickerSymbol: x};});
    }

    // To fetch the latest price for an asset
    async getLatestPrice(tickerSymbol: string): Promise<{ sharePrice: number }> {
        return {sharePrice: MockBroker.shares[tickerSymbol] || 0.0}
    }

    // To check if the stock market is currently open or closed
    async isMarketOpen(): Promise<{ open: boolean, nextOpeningTime: string, nextClosingTime: string }> {
        // Open now, closes in 6 hours, re-opens in 18 hours.
        return Promise.resolve({
            open: true,
            nextOpeningTime: new Date(Date.now() + 18*3.6e6).toISOString(),
            nextClosingTime: new Date(Date.now() + 6*3.6e6).toISOString()
        })
    }

    // To purchase a share in our Firm's rewards account.
    // NOTE: this works only while the stock market is open otherwise throws an error.
    // NOTE 2: quantity is an integer, no fractional shares allowed.
    async buySharesInRewardsAccount(tickerSymbol: string, quantity: number): Promise<{ success: boolean, sharePricePaid: number }> {
        if (!MockBroker.shares[tickerSymbol]) {
            return {success: false, sharePricePaid: 0};
        }
        console.log("Purchasing ", quantity, " of ", tickerSymbol);
        this.heldShares.push({tickerSymbol, quantity, sharePrice: MockBroker.shares[tickerSymbol]});
        return {success: true, sharePricePaid: MockBroker.shares[tickerSymbol]}
    }

    // To view the shares that are available in the Firm's rewards account
    async getRewardsAccountPositions(): Promise<Array<{ tickerSymbol: string, quantity: number, sharePrice: number }>> {
        return this.heldShares;
    }

    // To move shares from our Firm's rewards account to a user's own account
    async moveSharesFromRewardsAccount(toAccount: string, tickerSymbol: string, quantity: number): Promise<{ success: boolean }> {
        const shareSlotIndex = this.heldShares.findIndex(x => x.tickerSymbol === tickerSymbol);
        if (shareSlotIndex < 0) return {success: false}
        const shareSlot = this.heldShares[shareSlotIndex];
        console.log(`Broker: Moving ${quantity} share(s) of ${tickerSymbol} to user ${toAccount}`)
        if (shareSlot.quantity < quantity) {
            return {success: false}
        } else if (shareSlot.quantity === quantity) {
            this.heldShares.splice(shareSlotIndex, 1);
        } else {
            shareSlot.quantity -= quantity;
        }
        return {success: true}
    }
}