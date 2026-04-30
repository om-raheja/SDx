import { NextResponse } from 'next/server';
import { del, put } from '@vercel/blob';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN is not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 413 });
    }

    const extension = file.name.includes('.') ? `.${file.name.split('.').pop()}` : '';
    const pathname = `hints/${Date.now()}-${randomUUID()}${extension}`;

    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.type || 'application/octet-stream',
      token,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error('Upload error:', err);
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Upload failed', details }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN is not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL required' }, { status: 400 });
    }

    await del(url, { token });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Blob delete error:', err);
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Delete failed', details }, { status: 500 });
  }
}
