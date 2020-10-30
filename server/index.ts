import { subgraphRequest, ipfsPin, sleep } from './utils';

let interval = process.env.INTERVAL || 60e4;
interval = parseInt(interval);

const subgraphUrl = 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-beta';
const subgraphUrlKovan = 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-kovan';

const key = 'balancer-exchange/pools'; // https://cloudflare-ipfs.com/ipns/balancer-team-bucket.storage.fleek.co/balancer-exchange/pools
const keyKovan = 'balancer-exchange-kovan/pools'; // https://cloudflare-ipfs.com/ipns/balancer-team-bucket.storage.fleek.co/balancer-exchange-kovan/pools

const query = {
  pools: {
    __args: {
      first: 1000,
      where: {
        publicSwap: true,
        active: true
      }
    },
    id: true,
    swapFee: true,
    totalWeight: true,
    tokens: {
      address: true,
      decimals: true,
      denormWeight: true
    },
    tokensList: true
  }
}

async function updatePoolsInterval() {
  // Publish for homestead
  console.log('Subgraph request');
  const pools = await subgraphRequest(subgraphUrl, query);
  console.log('Pin on IPFS', pools.pools.length);
  const hash = await ipfsPin(key, pools);
  console.log('Pinned at', hash);

  // Publish for kovan
  console.log('[Kovan] Subgraph request');
  const poolsKovan = await subgraphRequest(subgraphUrlKovan, query);
  console.log('[Kovan] Pin on IPFS', poolsKovan.pools.length);
  const hashKovan = await ipfsPin(keyKovan, poolsKovan);
  console.log('[Kovan] Pinned at', hashKovan);

  await sleep(interval);
  updatePoolsInterval();
}

updatePoolsInterval();
