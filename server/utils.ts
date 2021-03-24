import fetch from 'node-fetch';
import fleek from '@fleekhq/fleek-storage-js';
import { jsonToGraphQLQuery } from "json-to-graphql-query";

const config: any = {
  apiKey: process.env.FLEEK_API_KEY,
  apiSecret: process.env.FLEEK_API_SECRET,
  bucket: 'balancer-bucket'
};

export const ipfsNode = process.env.IPFS_NODE || 'cloudflare-ipfs.com';

export async function ipfsPin(key: string, body) {
  let ipfsHash: string;
  const input = config;
  input.key = key;
  input.data = JSON.stringify(body);
  const result = await fleek.upload(input);
  ipfsHash = result.hashV0;
  return ipfsHash;
}

export async function subgraphRequest(url, query) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: jsonToGraphQLQuery({ query }) })
  });
  const { data } = await res.json();
  return data || {};
}

export function ipfsGet(gateway, ipfsHash, protocolType = 'ipfs') {
  const url = `https://${ipfsNode}/${protocolType}/${ipfsHash}`;
  return fetch(url).then(res => res.json());
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
