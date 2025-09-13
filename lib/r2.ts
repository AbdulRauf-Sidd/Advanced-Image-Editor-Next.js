import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!; // cb3306f10e6d53ab94123ee004599582
const bucketName = process.env.CLOUDFLARE_R2_BUCKET!; // agi-home-bucket
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
const public_url = process.env.CLOUDFLARE_PUBLIC_URL

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});



export async function uploadToR2(file: Buffer, key: string, contentType: string) {
  const bucket = process.env.CLOUDFLARE_R2_BUCKET!;
  await S3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  );

  return `${public_url}/${key}`;
}