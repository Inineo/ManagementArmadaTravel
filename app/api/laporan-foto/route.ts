/**
 * GET /api/laporan-foto?tripId=xxx
 * Kembalikan daftar foto untuk trip tertentu yang belum expired.
 *
 * GET /api/laporan-foto/file?name=xxx.jpg
 * Serve file gambar dari laporan-uploads/
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'laporan-uploads');
const METADATA_FILE = path.join(UPLOAD_DIR, 'metadata.json');

interface FotoMetadata {
  id: string;
  filename: string;
  tripId: string;
  driverName: string;
  uploadedAt: string;
  expiresAt: string;
  originalSizeKB: number;
  compressedSizeKB: number;
}

async function readMetadata(): Promise<FotoMetadata[]> {
  try {
    const raw = await readFile(METADATA_FILE, 'utf-8');
    return JSON.parse(raw) as FotoMetadata[];
  } catch {
    return [];
  }
}

// GET /api/laporan-foto?tripId=xxx — list foto untuk trip
// GET /api/laporan-foto/file?name=xxx.jpg — serve file foto
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, pathname } = request.nextUrl;

  // Serve file gambar: /api/laporan-foto/file?name=xxx.jpg
  if (pathname.endsWith('/file')) {
    const name = searchParams.get('name');
    if (!name) {
      return new NextResponse('Parameter name wajib diisi', { status: 400 });
    }

    // Sanitasi nama file — cegah path traversal
    const safeName = path.basename(name);
    const filePath = path.join(UPLOAD_DIR, safeName);

    if (!existsSync(filePath)) {
      return new NextResponse('Foto tidak ditemukan atau sudah expired', { status: 404 });
    }

    // Cek apakah foto masih valid (belum expired)
    const metadata = await readMetadata();
    const entry = metadata.find(m => m.filename === safeName);
    if (entry) {
      const expiresAt = new Date(entry.expiresAt);
      if (expiresAt <= new Date()) {
        return new NextResponse('Foto sudah expired dan dihapus', { status: 410 });
      }
    }

    const fileBuffer = await readFile(filePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, max-age=3600', // Cache 1 jam di browser
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  }

  // List foto per tripId: /api/laporan-foto?tripId=xxx
  const tripId = searchParams.get('tripId');
  if (!tripId) {
    return NextResponse.json(
      { error: 'Parameter tripId wajib diisi' },
      { status: 400 }
    );
  }

  const metadata = await readMetadata();
  const now = new Date();

  // Filter foto untuk tripId ini yang belum expired
  const photos = metadata
    .filter(m => m.tripId === tripId && new Date(m.expiresAt) > now)
    .map(m => ({
      id: m.id,
      filename: m.filename,
      url: `/api/laporan-foto/file?name=${m.filename}`,
      driverName: m.driverName,
      uploadedAt: m.uploadedAt,
      expiresAt: m.expiresAt,
      compressedSizeKB: m.compressedSizeKB,
    }));

  return NextResponse.json({ tripId, photos, total: photos.length });
}
