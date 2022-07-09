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