import type { R2Bucket } from '@cloudflare/workers-types';

export const putFile = async (
  bucket: R2Bucket,
  key: string,
  content: string,
) => {
  await bucket.put(key, content);
};

export const getFile = async (
  bucket: R2Bucket,
  key: string
) => {
  const obj = await bucket.get(key);
  if (!obj) return null;
  return await obj.text();
};

export const deleteFile = async (
  bucket: R2Bucket,
  key: string
) => {
  await bucket.delete(key);
};

export const listFiles = async (
  bucket: R2Bucket,
  prefix: string
) => {
  const list = await bucket.list({ prefix });
  return list.objects.map((obj) => obj.key);
};

export const deleteByPrefix = async (
  bucket: R2Bucket,
  prefix: string
) => {
  const list = await bucket.list({ prefix });
  await Promise.all(
    list.objects.map((obj) => bucket.delete(obj.key))
  );
};