import { NextRequest, NextResponse } from 'next/server';
import { decryptCombinedFileUrl } from '@/lib/encryption';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ encryptedUrl: string }> }
) {
  try {
    const { encryptedUrl } = await params;
    
    if (!encryptedUrl) {
      return NextResponse.json({ error: 'Missing encrypted URL' }, { status: 400 });
    }

    // Decrypt the URL (format: iv:encryptedData)
    const decryptedUrl = decryptCombinedFileUrl(decodeURIComponent(encryptedUrl));
    
    // Fetch the file from the decrypted URL
    const response = await fetch(decryptedUrl);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
        'Content-Disposition': 'inline',
      },
    });
  } catch (error) {
    console.error('Error serving encrypted file:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}