/**
 * POST /api/laporan-foto/upload
 * Menerima upload foto dari driver, kompres dengan Sharp,
 * simpan ke laporan-uploads/, dan jalankan cleanup foto expired.
 *
 * Form fields:
 *   - foto: File (image/jpeg, image/png, image/webp) — bisa multiple
 *   - tripId: string
 *   - driverName: string
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';

// Konfigurasi
const UPLOAD_DIR = path.join(process.cwd(), 'laporan-uploads');
const METADATA_FILE = path.join(UPLOAD_DIR, 'metadata.json');
const EXPIRES_DAYS = 14; // Auto-delete setelah 14 hari
const MAX_DIMENSION = 1280; // Resize max 1280px lebar/tinggi
const JPEG_QUALITY = 80; // Kualitas seimbang ~300-400KB

// Tipe metadata foto
interface FotoMetadata {
  id: string;
  filename: string;
  tripId: string;
  driverName: string;
  uploadedAt: string;
  expiresAt: string; // ISO string
  originalSizeKB: number;
  compressedSizeKB: number;
}

// Baca metadata file
async function readMetadata(): Promise<FotoMetadata[]> {
  try {
    const raw = await readFile(METADATA_FILE, 'utf-8');
    return JSON.parse(raw) as FotoMetadata[];
  } catch {
    return [];
  }
}

// Simpan metadata file
async function writeMetadata(data: FotoMetadata[]): Promise<void> {
  await writeFile(METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Hapus foto yang sudah expired (lazy cleanup — dijalankan saat ada upload baru)
async function cleanupExpiredPhotos(): Promise<void> {
  const metadata = await readMetadata();
  const now = new Date();
  const stillValid: FotoMetadata[] = [];

  for (const entry of metadata) {
    const expiresAt = new Date(entry.expiresAt);
    if (expiresAt <= now) {
      // Hapus file foto
      const filePath = path.join(UPLOAD_DIR, entry.filename);
      try {
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch {
        // Abaikan error jika file sudah tidak ada
      }
    } else {
      stillValid.push(entry);
    }
  }

  await writeMetadata(stillValid);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Pastikan folder upload ada
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Jalankan cleanup foto expired dulu (lazy)
    await cleanupExpiredPhotos();

    // Parse multipart form data
    const formData = await request.formData();
    const tripId = formData.get('tripId') as string;
    const driverName = formData.get('driverName') as string;

    if (!tripId || !driverName) {
      return NextResponse.json(
        { error: 'tripId dan driverName wajib diisi' },
        { status: 400 }
      );
    }

    // Ambil semua file dengan key 'foto' (bisa multiple)
    const fotoFiles = formData.getAll('foto') as File[];

    if (!fotoFiles || fotoFiles.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada foto yang diupload' },
        { status: 400 }
      );
    }

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    for (const file of fotoFiles) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Tipe file tidak didukung: ${file.type}. Gunakan JPEG, PNG, atau WebP.` },
          { status: 400 }
        );
      }
    }

    const uploadedPhotos: FotoMetadata[] = [];
    const metadata = await readMetadata();

    for (const file of fotoFiles) {
      // Generate filename unik
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const safeDriverName = driverName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const filename = `${safeDriverName}_${tripId}_${timestamp}_${randomSuffix}.jpg`;
      const outputPath = path.join(UPLOAD_DIR, filename);

      // Baca buffer file
      const buffer = Buffer.from(await file.arrayBuffer());
      const originalSizeKB = Math.round(buffer.length / 1024);

      // Kompres dengan Sharp
      const compressedBuffer = await sharp(buffer)
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: 'inside',          // Pertahankan aspect ratio, tidak crop
          withoutEnlargement: true // Jangan perbesar gambar yang sudah kecil
        })
        .jpeg({ quality: JPEG_QUALITY, progressive: true })
        .toBuffer();

      const compressedSizeKB = Math.round(compressedBuffer.length / 1024);

      // Simpan file ke disk
      await writeFile(outputPath, compressedBuffer);

      // Buat entry metadata
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + EXPIRES_DAYS);

      const entry: FotoMetadata = {
        id: `foto_${timestamp}_${randomSuffix}`,
        filename,
        tripId,
        driverName,
        uploadedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        originalSizeKB,
        compressedSizeKB,
      };

      metadata.push(entry);
      uploadedPhotos.push(entry);
    }

    // Simpan metadata yang diupdate
    await writeMetadata(metadata);

    return NextResponse.json({
      success: true,
      uploaded: uploadedPhotos.length,
      photos: uploadedPhotos.map(p => ({
        id: p.id,
        filename: p.filename,
        url: `/api/laporan-foto/file?name=${p.filename}`,
        uploadedAt: p.uploadedAt,
        expiresAt: p.expiresAt,
        originalSizeKB: p.originalSizeKB,
        compressedSizeKB: p.compressedSizeKB,
        compressionRatio: `${Math.round((1 - p.compressedSizeKB / p.originalSizeKB) * 100)}%`,
      })),
    });

  } catch (error) {
    console.error('[upload] Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses foto' },
      { status: 500 }
    );
  }
}
