import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, type Fields, type Files } from 'formidable';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const uploadDir = path.join(process.cwd(), '.temp-uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const form = new IncomingForm({
    multiples: false,
    uploadDir,
    keepExtensions: true,
  });

  form.parse(req, async (err: unknown, fields: Fields, files: Files) => {
    if (err) {
      console.error('formidable parse error', err);
      return res.status(500).json({ error: 'Upload failed' });
    }

    const fileField = files['file'];
    if (!fileField) return res.status(400).json({ error: 'No file uploaded' });

    const fileObjRaw = Array.isArray(fileField) ? fileField[0] : fileField;
    type LocalFile = { filepath?: string; path?: string; originalFilename?: string; name?: string; mimetype?: string };
    const fileObj = fileObjRaw as unknown as LocalFile;
    const tempPath = (fileObj.filepath || fileObj.path) as string;
    const originalName = (fileObj.originalFilename || fileObj.name || `upload-${Date.now()}`) as string;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const destPath = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.\-_]/g, '-')}`;

    try {
      const fileBuffer = fs.readFileSync(tempPath);
      const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(destPath, fileBuffer, {
        contentType: (fileObj.mimetype as string) || 'application/octet-stream',
        upsert: false,
      });

      // remove temp file
      try { fs.unlinkSync(tempPath); } catch { /* ignore */ }

      if (error) {
        console.error('Supabase upload error', error);
        return res.status(500).json({ error: 'Supabase upload failed' });
      }

      const getUrlRes = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(destPath);
      const publicUrl = getUrlRes.data.publicUrl || '';
      return res.status(200).json({ path: destPath, publicUrl });
    } catch (err) {
      console.error('upload handler error', err);
      return res.status(500).json({ error: 'Upload error' });
    }
  });
}
