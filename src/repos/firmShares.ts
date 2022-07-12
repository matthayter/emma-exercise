import { shuffle } from '@shared/functions';
import { Database, Statement } from 'sqlite3';
import { promisify } from 'util';
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

    async devOnlyClearShares(): Promise<void> {
        const db = await orm.openDb();
        db.sharesAvailable = [];
        await orm.saveDb(db);
    }

}

export class FirmSharesSqlite implements IFirmShares {
    constructor(private db: Database) {}
    takeRandomShare(): Promise<string | null> {
        return new Promise((resolve, reject) => {
            this.db.get("DELETE FROM share WHERE rowid IN (SELECT rowid FROM share ORDER BY rowid ASC LIMIT 1) RETURNING *", (err, row) => {
                if (err) {reject(err); return;}
                if (!row) {resolve(null); return;}
                resolve(row.symbol);
            })
        });
    }
    async addRecordOfPurchases(purchases: {symbol: string, price: number, quantity: number}[]): Promise<void> {
        const newShares: string[] = [];
        for (const purchase of purchases) {
            for (let i = 0; i < purchase.quantity; i++) {
                newShares.push(purchase.symbol);
            }
        }
        shuffle(newShares);
        const stmt = this.db.prepare("INSERT INTO share VALUES (?)");
        // Convert callback function to promise function to make it easier to run in parallel.
        const wrappedRun = promisify(stmt.run.bind(stmt) as (arg1: string, callback: (err: any, result: void) => void) => void);
        await Promise.all(newShares.map((sym) => wrappedRun(sym)));
        stmt.finalize();
    }

}

export class MockFirmShares implements IFirmShares {
    async takeRandomShare(): Promise<string | null> {
        return null;
    }
    async addRecordOfPurchases(_purchases: {symbol: string, price: number, quantity: number}[]): Promise<void> {
    }
}