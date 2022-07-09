export interface AppConfig {
    minShares: number;
    // During a re-buy, shares will be bought accourding to this:
    shareDistribution: [
        {
            minPrice: number,
            maxPrice: number,
            quantity: number,
        }
    ]
}