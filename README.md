Install
=======
TODO

Run
===
TODO

Assumptions
===========

- We can't guarantee there will be shares available in the Firm's brokerage account; we need to handle the case where someone tries to claim a share when the markets are closed and we have no shares available.
    - Option 1: come back later!
    - Option 2: Create a 'pending claim' attached to the user's account, which will get resolved when the markets open.
- Idempotency is not a big concern. If a user has two shares to claim, and there's a network partition event after clicking claim the first time resulting in another click and another claim, we're okay with that, as long as the User gets their shares properly. In the real world, we probably would want idempotency for the best user experience under adverse conditions (like spotty network reception).