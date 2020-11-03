import { subgraphRequest, ipfsPin, sleep } from './utils';

let interval = process.env.INTERVAL || 60e4;
interval = parseInt(interval);

const subgraphUrl = 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-beta';
const subgraphUrlKovan = 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-kovan';
const key = 'balancer-exchange/pools'; // https://cloudflare-ipfs.com/ipns/balancer-team-bucket.storage.fleek.co/balancer-exchange/pools
const keyKovan = 'balancer-exchange-kovan/pools'; // https://cloudflare-ipfs.com/ipns/balancer-team-bucket.storage.fleek.co/balancer-exchange-kovan/pools

const query = {
  poolsFirst: {
      __aliasFor: 'pools',
      __args: {
        first: 1000,
        where: {
          publicSwap: true,
          active: true,
          tokensCount_gt: 1
        }
      },
      id: true,
      swapFee: true,
      totalWeight: true,
      tokens: {
        address: true,
        balance: true,
        decimals: true,
        denormWeight: true
      },
      tokensList: true
  },
  poolsSecond: {
      __aliasFor: 'pools',
      __args: {
        first: 1000,
        skip: 1000,
        where: {
          publicSwap: true,
          active: true,
          tokensCount_gt: 1
        }
      },
      id: true,
      swapFee: true,
      totalWeight: true,
      tokens: {
        address: true,
        balance: true,
        decimals: true,
        denormWeight: true
      },
      tokensList: true
  }
}

async function updatePoolsInterval() {
  // Publish for homestead
  try {
    console.log('homestead: Subgraph request');
    const pools = await subgraphRequest(subgraphUrl, query);
    console.log('homestead: Pin on IPFS', pools.pools.length);
    const hash = await ipfsPin(key, pools);
    console.log('homestead: Pinned at', hash);
  } catch (e) {
    console.error('homestead: Update failed', e);
  }

  // Publish for kovan
  try {
    console.log('kovan: Subgraph request');
    const poolsKovan = await subgraphRequest(subgraphUrlKovan, query);
    console.log('kovan: Pin on IPFS', poolsKovan.pools.length);
    const hashKovan = await ipfsPin(keyKovan, poolsKovan);
    console.log('kovan: Pinned at', hashKovan);
  } catch (e) {
    console.error('kovan: Update failed', e);
  }

  await sleep(interval);
  updatePoolsInterval();
}

updatePoolsInterval();
