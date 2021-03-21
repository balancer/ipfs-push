import { subgraphRequest } from '../../utils';

const subgraphUrl = 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-kovan-v2';

export const key = 'balancer-kovan-v2/pools';
// https://cloudflare-ipfs.com/ipns/balancer-team-bucket.storage.fleek.co/balancer-kovan-v2/pools

const query = {
  pools: {
    __args: {
      first: 1000
    },
    id: true,
    liquidity: true,
    tokensList: true,
    totalSwapVolume: true,
    swaps: {
      __args: {
        first: 1,
        orderBy: 'timestamp',
        orderDirection: 'desc'
      }
    }
  }
};

export async function run() {
  const ts = Math.round(new Date().getTime() / 1000);
  const tsYesterday = ts - 24 * 3600;
  query.pools.swaps.__args['where'] = { timestamp_lt: tsYesterday };
  const result = await subgraphRequest(subgraphUrl, query);

  const pools = Object.fromEntries(
    result.pools.map(pool => {
      const liquidity = parseFloat(pool.liquidity);
      const poolTotalSwapVolume =
        pool.swaps && pool.swaps[0] && pool.swaps[0].poolTotalSwapVolume
          ? parseFloat(pool.swaps[0].poolTotalSwapVolume)
          : 0;
      const volume = parseFloat(pool.totalSwapVolume) - poolTotalSwapVolume;
      return [
        pool.id,
        {
          tokens: pool.tokensList,
          liquidity,
          volume
        }
      ];
    })
  );

  return { last_update: ts, pools };
}
