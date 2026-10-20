// Proof file storage on Cloudflare R2 (S3 API). Files are private; the app hands out short-lived links.
// No "server-only" import, so scripts (nightly reset) can use it; it reads secrets, so never import it from client code.
import "../lib/net";
import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | undefined;
function s3() {
  const account = process.env.R2_ACCOUNT_ID?.trim();
  if (!account) throw new Error("R2 is not configured");
  return (client ??= new S3Client({
    region: "auto",
    endpoint: `https://${account}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(), secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim() },
  }));
}
const bucket = () => process.env.R2_BUCKET?.trim() || "cleared-proofs";

export async function putFile(key: string, body: Uint8Array, contentType: string) {
  await s3().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType }));
}

export async function readFile(key: string) {
  const res = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  return new Uint8Array(await res.Body!.transformToByteArray());
}

/** A link that works for five minutes, for viewing one private file. */
export function fileUrl(key: string, downloadName?: string) {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({ Bucket: bucket(), Key: key, ResponseContentDisposition: downloadName ? `inline; filename="${downloadName.replace(/"/g, "")}"` : undefined }),
    { expiresIn: 300 },
  );
}

export async function deleteFile(key: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

/** Deletes many files at once (R2 accepts up to 1,000 keys per request). Missing keys are ignored. */
export async function deleteFiles(keys: string[]) {
  if (!process.env.R2_ACCOUNT_ID?.trim()) return 0;
  for (let i = 0; i < keys.length; i += 1000) {
    await s3().send(new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true } }));
  }
  return keys.length;
}
