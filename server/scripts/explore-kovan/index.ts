import { subgraphRequest } from "../../utils";

const subgraphUrl = 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-kovan';

export const key = 'balancer-pool-management-kovan/registry';
// https://cloudflare-ipfs.com/ipns/balancer-team-bucket.storage.fleek.co/balancer-pool-management-kovan/registry

const stablecoin = [
  '0xd0a1e359811322d97991e03f863a0c30c2cf029c', // WETH
  '0x1528f3fcc26d13f7079325fb78d9442607781c8c', // DAI
  '0x2f375e94fc336cdec2dc0ccb5277fe59cbf1cae5', // USDC
  '0x7490dfa8e605fa004e4515328492f82896445e2b' // mUSD
].map(address => address.toLowerCase());

const defi = [
  '0xd0a1e359811322d97991e03f863a0c30c2cf029c', // WETH
  '0x1f1f156e0317167c11aa412e3d1435ea29dc3cce', // BAT
  '0x37f03a12241e9fd3658ad6777d289c3fb8512bc9', // ANT
  '0x86436bce20258a6dcfe48c9512d4d49a30c4d8c4', // SNX
  '0xef13c0c8abcaf5767160018d268f9697ae4f5375', // MKR
  '0x8c9e6c40d3402480ace624730524facc5482798c' // REP
].map(address => address.toLowerCase());

function getTags(pool) {
  const tags: string[] = [];

  let isDefi = true;
  pool.tokens.forEach(token => {
    if (!defi.includes(token.address)) isDefi = false;
  });
  if (isDefi) tags.push('defi');

  let isStablecoin = true;
  pool.tokens.forEach(token => {
    if (!stablecoin.includes(token.address)) isStablecoin = false;
  });
  if (isStablecoin) tags.push('stablecoin');

  if (!pool.finalized && !pool.crp) tags.push('private');

  if (pool.crp) tags.push('smart-pool');

  return tags;
}

export const query = Object.fromEntries(['_1'].map(q => {
  return [q, {
    __aliasFor: 'pools',
    __args: {
      first: 1000,
      skip: q === '_2' ? 1000 : 0,
      orderBy: 'liquidity',
      orderDirection: 'desc',
      where: {
        publicSwap: true,
        active: true,
        tokensCount_gt: 1
      },
    },
    id: true,
    finalized: true,
    crp: true,
    tokens: {
      address: true,
      symbol: true,
      name: true
    },
    tokensList: true,
    totalSwapVolume: true,
    swaps: {
      __args: {
        first: 1,
        orderBy: 'timestamp',
        orderDirection: 'desc'
      },
      poolTotalSwapVolume: true
    }
  }]
}));

export async function run() {
  const ts = Math.round(new Date().getTime() / 1000);
  const tsYesterday = ts - 24 * 3600;
  query._1.swaps.__args['where'] = { timestamp_lt: tsYesterday };
  const result = await subgraphRequest(subgraphUrl, query);
  let pools = result._1;
  return {
    pools: pools
      .map(pool => {
        pool.volume = 0;
        const poolTotalSwapVolume =
          pool.swaps && pool.swaps[0] && pool.swaps[0].poolTotalSwapVolume
            ? parseFloat(pool.swaps[0].poolTotalSwapVolume)
            : 0;
        pool.volume = parseFloat(pool.totalSwapVolume) - poolTotalSwapVolume;
        pool.tags = getTags(pool);
        return pool;
      })
      // .filter(pool => pool.volume > 0)
      .map(pool => ({
        address: pool.id,
        tokens: pool.tokensList,
        volume: pool.volume,
        tags: pool.tags.length > 0 ? pool.tags : undefined
      }))
  };
}
