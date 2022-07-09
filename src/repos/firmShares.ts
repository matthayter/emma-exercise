
export interface IFirmShares {
    takeRandomShare(): Promise<string | null>;

    getPurchaseLock(): Promise<boolean>;
    releasePurchaseLock(): Promise<void>;
}

export class DbFirmShares implements IFirmShares {
    async takeRandomShare(): Promise<string | null> {
        // TODO
        return Promise.resolve(null);
    }
    async getPurchaseLock(): Promise<boolean> {
        // TODO
        return false;
    }
    async releasePurchaseLock(): Promise<void> {
        // TODO
    }
}

export class MockFirmShares implements IFirmShares {
    constructor(public shares: Array<string>) { }
    // 'Claim' one of the shares, removing it from our list of the Firm's shares.
    async takeRandomShare(): Promise<string | null> {
        return Promise.resolve(this.shares.shift() || null);
    }
    async getPurchaseLock(): Promise<boolean> {
        // TODO
        return false;
    }
    async releasePurchaseLock(): Promise<void> {
        // TODO
    }
}