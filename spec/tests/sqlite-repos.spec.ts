import { FirmSharesSqlite } from "@repos/firmShares";
import { createMockDb } from "@repos/mock-db-data";
import { UserRepo } from "@repos/user-repo";

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
    it("decrements a user's claims to zero", async () => {
        const db = await createMockDb();
        await cbToPromise<void>((cb) => db.run("DELETE FROM user", cb));
        await cbToPromise<void>((cb) => db.run(
            "INSERT INTO user VALUES (?, ?, ?), (?, ?, ?)",
            "someUser", "broker1", 5,
            "someOtherUser", "broker2", 1,
            cb));
        const userRepo = new UserRepo(db);

        userRepo.decrementShareClaims("someUser");
        userRepo.decrementShareClaims("someUser");
        userRepo.decrementShareClaims("someOtherUser");
        userRepo.decrementShareClaims("someOtherUser");

        const user = await cbToPromise<any>((cb) => db.get("SELECT * FROM user WHERE id = ?", "someUser", cb));
        const user2 = await cbToPromise<any>((cb) => db.get("SELECT * FROM user WHERE id = ?", "someOtherUser", cb));
        expect(user.claims).toEqual(4);
        expect(user2.claims).toEqual(0);
    });
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