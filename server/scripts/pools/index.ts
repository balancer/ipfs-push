import { subgraphRequest } from '../../utils';

const subgraphUrl = 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-beta';

export const key = 'balancer-exchange/pools';
// https://cloudflare-ipfs.com/ipns/balancer-team-bucket.storage.fleek.co/balancer-exchange/pools

export const query = Object.fromEntries(['poolsFirst', 'poolsSecond'].map(q => {
  return [q, {
    __aliasFor: 'pools',
    __args: {
      first: 1000,
      skip: q === 'poolsSecond' ? 1000 : 0,
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
  }]
}));

console.log(query);

export async function run() {
  return await subgraphRequest(subgraphUrl, query);
}
