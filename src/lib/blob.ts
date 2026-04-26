import { put } from '@vercel/blob';

export async function uploadImage(file: Buffer | Blob, filename: string): Promise<string> {
  const blob = await put(filename, file, {
    addRandomSuffix: true,
    access: 'public',
  });
  return blob.url;
}