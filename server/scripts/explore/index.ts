import { subgraphRequest } from "../../utils";

const subgraphUrl = 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-beta';

export const key = 'balancer-pool-management/registry';
// https://cloudflare-ipfs.com/ipns/balancer-team-bucket.storage.fleek.co/balancer-pool-management/registry

const stablecoin = [
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0x57ab1ec28d129707052df4df418d58a2d46d5f51', // sUSD
  '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd', // GUSD
  '0x5bc25f649fc4e26069ddf4cf4010f9f706c23831', // DUSD
  '0xe2f2a5c287993345a840db3b0845fbc70f5935a5', // mUSD
  '0x39aa39c021dfbae8fac545936693ac917d5e7563', // cUSDC
  '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643', // cDAI
  '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9' // cUSDT
].map(address => address.toLowerCase());

const defi = [
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  '0xba100000625a3754423978a60c9317c58a424e3d', // BAL
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
  '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e', // YFI
  '0xd533a949740bb3306d119cc777fa900ba034cd52', // CRV
  '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', // SNX
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', // AAVE
  '0xc00e94cb662c3520282e6f5717214004a7f26888', // COMP
  '0x04fa0d235c4abf4bcf4787af4cf447de572ef828', // UMA
  '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', // MKR
  '0xa3bed4e1c75d00fa6f4e5e6922db7261b5e9acd2', // MTA
  '0xad32A8e6220741182940c5aBF610bDE99E737b2D' // DOUGH
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

export const query = Object.fromEntries(['_1', '_2'].map(q => {
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
  query._2.swaps.__args['where'] = { timestamp_lt: tsYesterday };
  const result = await subgraphRequest(subgraphUrl, query);
  let pools = result._1.concat(result._2);
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
