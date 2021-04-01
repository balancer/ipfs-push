import { subgraphRequest } from '../../utils';

// const subgraphUrl = 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-kovan-v2'; // TO DO - Currently using destiners SG
const subgraphUrl = 'https://api.thegraph.com/subgraphs/name/destiner/balancer-kovan-v2';

export const key = 'balancer-kovan-v2/exchange';
// https://cloudflare-ipfs.com/ipns/balancer-team-bucket.storage.fleek.co/balancer-kovan-v2/pools

export const query = Object.fromEntries(['_1', '_2'].map(q => {
  return [q, {
    __aliasFor: 'pools',
    __args: {
      first: 1000,
      skip: q === '_2' ? 1000 : 0,
      // where: {
      //   // publicSwap: true, -- double check
      //   // active: true,
      //   // tokensCount_gt: 1
      // }
    },
    id: true,
    swapFee: true,
    totalWeight: true,
    amp: true,
    tokens: {
      address: true,
      balance: true,
      decimals: true,
      weight: true
    },
    tokensList: true,
    poolType: true,
    address: true,
    totalShares: true
  }]
}));

export async function run() {
  const ts = Math.round(new Date().getTime() / 1000);
  const result = await subgraphRequest(subgraphUrl, query);
  return { last_update: ts, pools: result._1.concat(result._2) };
}
