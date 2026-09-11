import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type ObjectStorageConfig = {
  mode: "object";
  bucket: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  forcePathStyle: boolean;
};
type LocalStorageConfig = { mode: "local"; root: string };
export type VoiceMediaStorageConfig = ObjectStorageConfig | LocalStorageConfig;

/** Resolve configuration per call so tests and long-running workers see env changes. */
export function voiceMediaStorageConfig(env: NodeJS.ProcessEnv = process.env): VoiceMediaStorageConfig {
  const bucket = env.S3_BUCKET || env.R2_BUCKET;
  const endpoint = env.S3_ENDPOINT || env.R2_ENDPOINT;
  const accessKeyId = env.S3_ACCESS_KEY_ID || env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.S3_SECRET_ACCESS_KEY || env.R2_SECRET_ACCESS_KEY;
  const objectValues = [bucket, endpoint, accessKeyId, secretAccessKey];

  if (objectValues.some(Boolean)) {
    if (!objectValues.every(Boolean)) {
      throw new Error("Voice media object storage is partially configured; bucket, endpoint, access key, and secret key are all required");
    }
    return {
      mode: "object",
      bucket: bucket!, endpoint: endpoint!, accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey!,
      region: env.S3_REGION || "auto",
      forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
    };
  }

  const dataRoot = env.PORTAL_DATA_DIR || path.join(process.cwd(), ".portal-data");
  if (env.NODE_ENV === "production" && (!env.PORTAL_DATA_DIR || !path.isAbsolute(env.PORTAL_DATA_DIR))) {
    throw new Error("PORTAL_DATA_DIR must be an absolute durable path when object storage is not configured");
  }
  return { mode: "local", root: path.join(dataRoot, "voice-media") };
}

function objectClient(config: ObjectStorageConfig) {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
}

function safeKey(key: string) {
  if (!key || key.startsWith("/") || key.includes("..") || !/^[a-zA-Z0-9._/-]+$/.test(key)) throw new Error("Invalid voice media key");
  return key;
}

export async function putVoiceMedia(key: string, bytes: Uint8Array, contentType: string) {
  key = safeKey(key);
  const config = voiceMediaStorageConfig();
  if (config.mode === "object") {
    await objectClient(config).send(new PutObjectCommand({ Bucket: config.bucket, Key: key, Body: bytes, ContentType: contentType }));
    return;
  }
  const target = path.join(/* turbopackIgnore: true */ config.root, key);
  await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
  await writeFile(target, bytes, { mode: 0o600 });
  await chmod(target, 0o600);
}

export async function getVoiceMedia(key: string): Promise<Uint8Array> {
  key = safeKey(key);
  const config = voiceMediaStorageConfig();
  if (config.mode === "object") {
    const response = await objectClient(config).send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
    if (!response.Body) throw new Error("Stored audio has no body");
    return response.Body.transformToByteArray();
  }
  return readFile(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ config.root, key));
}
