import { shuffle } from '@shared/functions';
import orm from './mock-orm';

export interface IFirmShares {
    takeRandomShare(): Promise<string | null>;
    addRecordOfPurchases(purchases: {symbol: string, price: number, quantity: number}[]): Promise<void>;
}

export class FirmSharesJsonDb implements IFirmShares {
    async takeRandomShare(): Promise<string | null> {
        const db = await orm.openDb();
        const nextShare = (db.sharesAvailable as string[]).shift() || null;
        await orm.saveDb(db);
        return nextShare;
    }
    // Strategy: Make a list of the symbols of each individual share purchased, then shuffle the list.
    // When allocating a share, just pop off the front of the 'queue'.
    async addRecordOfPurchases(purchases: {symbol: string, price: number, quantity: number}[]): Promise<void> {
        const db = await orm.openDb();
        const sharesAvailable = (db.sharesAvailable as string[]);
        const newShares: string[] = [];
        for (const purchase of purchases) {
            for (let i = 0; i < purchase.quantity; i++) {
                newShares.push(purchase.symbol);
            }
        }
        shuffle(newShares);
        db.sharesAvailable = sharesAvailable.concat(newShares);
        await orm.saveDb(db);
    }

}

export class MockFirmShares implements IFirmShares {
    constructor(public shares: Array<string>) { }
    // 'Claim' one of the shares, removing it from our list of the Firm's shares.
    async takeRandomShare(): Promise<string | null> {
        return Promise.resolve(this.shares.shift() || null);
    }
    async addRecordOfPurchases(purchases: {symbol: string, price: number, quantity: number}[]): Promise<void> {
    }
}