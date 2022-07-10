import './pre-start'; // Must be the first import
import config from 'src/config';
import { SharePurchaser } from "@services/share-purchaser";
import { MockBroker } from '@services/broker-mock';
import { FirmSharesJsonDb } from '@repos/firmShares';

const runJob = async () => {
    const purchaser = new SharePurchaser(config, new MockBroker(), new FirmSharesJsonDb());
    await purchaser.checkAndBuy();
}

runJob();