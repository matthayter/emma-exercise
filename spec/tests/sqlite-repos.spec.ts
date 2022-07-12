import { IUser } from "@models/user-model";
import { FirmSharesSqlite } from "@repos/firmShares";
import { createMockDb } from "@repos/mock-db-data";
import { UserRepo } from "@repos/user-repo";
import { Database } from "sqlite3";

describe("FirmSharesSqliteDb", () => {
    it("adds new shares to tracking", async () => {
        const db = await createMockDb();
        await cbToPromise<void>((cb) => db.run("DELETE FROM share", cb));
        const firmShares = new FirmSharesSqlite(db);
        await firmShares.addRecordOfPurchases([
            {
                symbol: "msft",
                price: 1.0,
                quantity: 5,
            },
            {
                symbol: "tsla",
                price: 1.0,
                quantity: 2,
            },
        ])
        const msftRows = await cbToPromise<any[]>((cb) => db.all("SELECT * FROM share WHERE symbol = ?", "msft", cb));
        const tslaRows = await cbToPromise<any[]>((cb) => db.all("SELECT * FROM share WHERE symbol = ?", "tsla", cb));
        const allRows = await cbToPromise<any[]>((cb) => db.all("SELECT * FROM share", cb));
        expect(msftRows.length).toEqual(5);
        expect(tslaRows.length).toEqual(2);
        expect(allRows.length).toEqual(7);
    });
    it("gives the next available share", async () => {
        const db = await createMockDb();
        await cbToPromise<void>((cb) => db.run("DELETE FROM share", cb));
        await cbToPromise<void>((cb) => db.run(
            "INSERT INTO share VALUES (?), (?), (?)",
            "abc",
            "def",
            "ghi",
            cb));
        const firmShares = new FirmSharesSqlite(db);
        expect(await firmShares.takeRandomShare()).toEqual("abc");
        expect(await firmShares.takeRandomShare()).toEqual("def");
        expect(await firmShares.takeRandomShare()).toEqual("ghi");
        expect(await firmShares.takeRandomShare()).toBeNull();
    });
});
describe("UserRepoSqlite", () => {
    describe("with a mock user table", () => {
        let db: Database;
        let userRepo: UserRepo;
        beforeEach(async () => {
            db = await createMockDb();
            await cbToPromise<void>((cb) => db.run("DELETE FROM user", cb));
            await cbToPromise<void>((cb) => db.run(
                "INSERT INTO user VALUES (?, ?, ?), (?, ?, ?)",
                "someUser", "broker1", 5,
                "someOtherUser", "broker2", 1,
                cb));
            userRepo = new UserRepo(db);
        })
        it("gets a user", async () => {
            const user = (await userRepo.getById("someUser")) as IUser;
            expect(user).toEqual({id: "someUser", brokerAccountId: "broker1", claims: 5});
        });
        it("decrements a user's claims to zero", async () => {
            await userRepo.decrementShareClaims("someUser");
            await userRepo.decrementShareClaims("someUser");
            await userRepo.decrementShareClaims("someOtherUser");
            await userRepo.decrementShareClaims("someOtherUser");

            const user = await cbToPromise<any>((cb) => db.get("SELECT * FROM user WHERE id = ?", "someUser", cb));
            const user2 = await cbToPromise<any>((cb) => db.get("SELECT * FROM user WHERE id = ?", "someOtherUser", cb));
            expect(user.claims).toEqual(3);
            expect(user2.claims).toEqual(0);
        });
    })
});

// Quick helpers for Callbacks -> promise.
type CB<T> = (err: Error | null, result: T) => void
function cbToPromise <T>(fn: (done: CB<T>) => any): Promise<T> {
    return new Promise((resolve, reject) => {
        fn((err, result) => {
            if (err) reject(err); else resolve(result);
        });
    })
}