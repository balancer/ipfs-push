import { query } from '../pools';
import { subgraphRequest } from '../../utils';

const subgraphUrl = 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-kovan';

export const key = 'balancer-exchange-kovan/pools';
// https://cloudflare-ipfs.com/ipns/balancer-team-bucket.storage.fleek.co/balancer-exchange-kovan/pools

export async function run() {
  const result = await subgraphRequest(subgraphUrl, query);
  return { pools: result._1.concat(result._2) };
}
