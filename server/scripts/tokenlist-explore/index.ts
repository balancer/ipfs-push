import tokenlist from './template.json';

export const key = 'balancer/tokenlists/explore';
// https://cloudflare-ipfs.com/ipns/balancer-team-bucket.storage.fleek.co/balancer/tokenlists/explore

export async function run() {
  return tokenlist;
}
