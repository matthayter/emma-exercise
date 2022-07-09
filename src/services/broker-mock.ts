export class MockBroker {

    // To fetch a list of assets available for trading
    async listTradableAssets(): Promise<Array<{ tickerSymbol: string }>> {
        return Promise.resolve([{tickerSymbol: "something"}]);
    }

    // To fetch the latest price for an asset
    async getLatestPrice(tickerSymbol: string): Promise<{ sharePrice: number }> {
        // TODO: stub
        return null!
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
        // TODO: stub
        return null!
    }

    // To view the shares that are available in the Firm's rewards account
    async getRewardsAccountPositions(): Promise<Array<{ tickerSymbol: string, quantity: number, sharePrice: number }>> {
        // TODO: stub
        return null!
    }

    // To move shares from our Firm's rewards account to a user's own account
    async moveSharesFromRewardsAccount(toAccount: string, tickerSymbol: string, quantity: number): Promise<{ success: boolean }> {
        return Promise.resolve({
            success: true,
        })
    }
}