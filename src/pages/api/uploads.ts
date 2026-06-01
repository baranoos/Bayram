import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, type Fields, type Files } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = new IncomingForm({
    multiples: false,
    uploadDir,
    keepExtensions: true,
  });

  form.parse(req, (err: unknown, fields: Fields, files: Files) => {
    if (err) {
      console.error('formidable parse error', err);
      return res.status(500).json({ error: 'Upload failed' });
    }

    // `file` is the field name from the client FormData
    const fileField = files['file'];
    if (!fileField) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // handle single-file or array
    type LocalFile = { filepath?: string; path?: string; originalFilename?: string; name?: string };
    const fileObj = (Array.isArray(fileField) ? fileField[0] : fileField) as unknown as LocalFile;

    const oldPath = (fileObj.filepath || fileObj.path) as string;
    const originalName = (fileObj.originalFilename || fileObj.name || 'upload') as string;
    const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    const fileName = `${Date.now()}-${safeName}`;
    const newPath = path.join(uploadDir, fileName);

    try {
      fs.renameSync(oldPath, newPath);
    } catch (e) {
      console.error('rename error', e);
      return res.status(500).json({ error: 'Could not save file' });
    }

    const publicPath = `/uploads/${fileName}`;
    return res.status(200).json({ path: publicPath });
  });
}
