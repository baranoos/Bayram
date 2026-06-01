import type { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET = process.env.R2_BUCKET;
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;

if (!BUCKET || !ACCOUNT_ID || !ACCESS_KEY || !SECRET_KEY) {
  // We don't throw during import because local dev might not have envs.
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { filename, contentType } = req.body || {};

  if (!filename || !contentType) {
    return res.status(400).json({ error: 'Missing filename or contentType' });
  }

  try {
    const endpoint = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;

    const client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: ACCESS_KEY || '',
        secretAccessKey: SECRET_KEY || '',
      },
      forcePathStyle: false,
    });

    const key = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, '-')}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      ACL: 'private',
    });

    const signedUrl = await getSignedUrl(client, command, { expiresIn: 60 * 5 });

    // Public URL may depend on your setup; return both as convenience
    const publicUrl = `https://${BUCKET}.${ACCOUNT_ID}.r2.cloudflarestorage.com/${encodeURIComponent(key)}`;

    return res.status(200).json({ url: signedUrl, key, publicUrl });
  } catch (err) {
    console.error('presign error', err);
    return res.status(500).json({ error: 'Could not create presigned URL' });
  }
}
