
export interface IFirmShares {
    takeRandomShare(): Promise<string | null>;
}

export class DbFirmShares implements IFirmShares {
    async takeRandomShare(): Promise<string | null> {
        // TODO
        return Promise.resolve(null);
    }
}

export class MockFirmShares implements IFirmShares {
    constructor(public shares: [string]) { }
    // 'Claim' one of the shares, removing it from our list of the Firm's shares.
    async takeRandomShare(): Promise<string | null> {
        return Promise.resolve(this.shares.shift() || null);
    }
}