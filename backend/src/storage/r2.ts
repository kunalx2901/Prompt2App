import type { R2Bucket } from "@cloudflare/workers-types";

const serializeContent = (
  content: unknown
): string => {
  // Already valid string
  if (typeof content === "string") {
    return content;
  }

  // Handle null/undefined safely
  if (
    content === null ||
    content === undefined
  ) {
    return "";
  }

  // Buffer / Uint8Array support
  if (
    content instanceof Uint8Array ||
    ArrayBuffer.isView(content)
  ) {
    return new TextDecoder().decode(content);
  }

  // ArrayBuffer support
  if (content instanceof ArrayBuffer) {
    return new TextDecoder().decode(
      new Uint8Array(content)
    );
  }

  // Fallback object serialization
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return String(content);
  }
};

export const putFile = async (
  bucket: R2Bucket,
  key: string,
  content: unknown
) => {
  try {
    const serializedContent =
      serializeContent(content);

    console.log(
      "[R2 PUT]",
      key,
      typeof content
    );

    await bucket.put(key, serializedContent);
  } catch (err) {
    console.error(
      `[R2 PUT ERROR] ${key}`,
      err
    );

    throw err;
  }
};

export const getFile = async (
  bucket: R2Bucket,
  key: string
): Promise<string | null> => {
  try {
    const obj = await bucket.get(key);

    if (!obj) {
      return null;
    }

    return await obj.text();
  } catch (err) {
    console.error(
      `[R2 GET ERROR] ${key}`,
      err
    );

    return null;
  }
};

export const deleteFile = async (
  bucket: R2Bucket,
  key: string
) => {
  try {
    await bucket.delete(key);

    console.log("[R2 DELETE]", key);
  } catch (err) {
    console.error(
      `[R2 DELETE ERROR] ${key}`,
      err
    );

    throw err;
  }
};

export const listFiles = async (
  bucket: R2Bucket,
  prefix: string
): Promise<string[]> => {
  try {
    const list = await bucket.list({
      prefix
    });

    return list.objects.map(
      (obj) => obj.key
    );
  } catch (err) {
    console.error(
      `[R2 LIST ERROR] ${prefix}`,
      err
    );

    return [];
  }
};

export const deleteByPrefix = async (
  bucket: R2Bucket,
  prefix: string
) => {
  try {
    const list = await bucket.list({
      prefix
    });

    await Promise.all(
      list.objects.map((obj) =>
        bucket.delete(obj.key)
      )
    );

    console.log(
      `[R2 DELETE PREFIX] ${prefix}`
    );
  } catch (err) {
    console.error(
      `[R2 DELETE PREFIX ERROR] ${prefix}`,
      err
    );

    throw err;
  }
};