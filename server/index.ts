import { subgraphRequest, ipfsPin, sleep } from './utils';

const subgraphUrl = process.env.SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-beta';
const key = 'balancer-exchange/pools';
// https://cloudflare-ipfs.com/ipns/balancer-team-bucket.storage.fleek.co/balancer-exchange/pools
let interval = process.env.INTERVAL || 60e4;
interval = parseInt(interval);

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
  console.log('Subgraph request');
  const pools = await subgraphRequest(subgraphUrl, query);
  console.log('Pin on IPFS');
  const hash = await ipfsPin(key, pools);
  console.log('Pinned at', hash);

  await sleep(interval);
  updatePoolsInterval();
}

updatePoolsInterval();
