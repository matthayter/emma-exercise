Install
=======
```
npm install
```

Run
===
TODO

Strategy
========
A core part of this problem was choosing a strategy to ensure a controllable cost of the distributed shares (and therefore a controlled cost-per-acquisition). Three methods came to mind:
1. Probabalistic: generate a random number for each share-claim, and choose the value-bucket from that. Shares are purchased to ensure each bucket has available shares in the Firm's account.
2. Fixed purchase, random choice: Buy shares in a fixed distribution (e.g. 95 low-value, 3 medium-value, 2 high-value), then choose a random share from the Firm's broker account on each share-claim event.
3. Fixed purchase, shuffled distribution: Puchase shares as (2.), but shuffle the new purchases and then maintain the shuffled list (which becomes a queue). Allocate shares from the front of the queue as needed.

Approach 3. was chosen, due to the following benefits:
- Data-oriented: more of the complexity of the implementation is pushed into the data-structures (the additional shuffled list) which are easily inspectable. It feels more difficult to reason about the alogoithms in (1.) and (2.) than it is to inspect the data-structures in (3.), and the algorithms are comparitively simpler (shuffling & queue-pop).
- Easier race-condition handling: Maintaining the shuffled list in a ACID-compliant SQL database (not implemented here) allows trivial resolution of race-conditions when multiple hosts are allocating shares from the Firm's account, in the case where the Broker's API doesn't provide idempotency and locking (as is the case in this mock example).
- Stronger guarentees of cost-control. Strategy (1.) has the issue of possible under- or over-costing due to its probabilistic nature.

And drawbacks:
- (3.) has the extra complexity of keeping the shuffled list (which is effectively an index on the Firm's Broker account) in-sync with the broker account. If shares are removed from the Broker account via another method, unexpected errors will occur during allocation that may be hard to resolve. This could be mitigated with a better Broker API that e.g. provides unique ids for each share.

Assumptions
===========

- We can't guarantee there will be shares available in the Firm's brokerage account; we need to handle the case where someone tries to claim a share when the markets are closed and we have no shares available.
    - Option 1: come back later!
    - Option 2: Create a 'pending claim' attached to the user's account, which will get resolved when the markets open.
- Idempotency is not a big concern. If a user has two shares to claim, and there's a network partition event after clicking claim the first time resulting in another click and another claim, we're okay with that, as long as the User gets their shares properly. In the real world, we probably would want idempotency for the best user experience under adverse conditions (like spotty network reception).
- Share prices: I assumed we can neglect share price chages between querying the broker and buying the shares. This may result in a user being allocated a share above or below the intended value. It's not obvious to this programmer how much of a descrepancy is possible over sub-second timespans. 
- Share selection: I assumed a trivial "find the cheapest" method of selecting a share within a certain value range.
- I've mocked a database-row locking system for purchasing shares, but various other strategies would work too: e.g. running a cron-job on a single host.