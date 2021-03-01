import { ipfsPin, sleep } from './utils';
import * as scriptPools from './scripts/pools';
import * as scriptPoolsKovan from './scripts/pools-kovan';
import * as scriptBalancerKovanV2 from './scripts/balancer-kovan-v2';

const scripts = [scriptPoolsKovan, scriptPools, scriptBalancerKovanV2];

let interval = process.env.INTERVAL || 60e4;
interval = parseInt(interval);

async function pushInterval() {
  for (const script of scripts) {
    try {
      console.log('Run script', script.key);
      const result = await script.run();
      console.log('Pin on IPFS', JSON.stringify(result).slice(0, 240));
      const hash = await ipfsPin(script.key, result);
      console.log('Pinned', hash);
    } catch (e) {
      console.error(script.key, 'Update failed', e);
    }
  }
  await sleep(interval);
  return pushInterval();
}

pushInterval();
