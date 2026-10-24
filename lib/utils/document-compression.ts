/**
 * Utility for optimizing and validating documents before upload.
 * - Images (JPEG, PNG, WebP) are downscaled to standard high-res (max 1920px)
 *   and compressed to high-quality JPEG (0.82) to drastically reduce storage usage
 *   while preserving razor-sharp text and seal legibility.
 * - PDFs are preserved completely intact to protect Bar Council digital signatures,
 *   metadata, and vector authenticity.
 */

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
  reductionPercentage: number;
}

const MAX_IMAGE_DIMENSION = 1920; // 1080p-1440p standard, excellent for legal certificates
const IMAGE_QUALITY = 0.82; // Optimal balance: 70-85% size reduction with zero visible artifacting on text

export async function compressVerificationFile(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  // 1. If it's a PDF, DO NOT compress. Preserve digital signatures and Bar Council vector data.
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      wasCompressed: false,
      reductionPercentage: 0,
    };
  }

  // 2. If it's not a supported image, return as-is
  const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
  if (!isImage || typeof window === "undefined") {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      wasCompressed: false,
      reductionPercentage: 0,
    };
  }

  // 3. Compress Image via Canvas
  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    // Check if downscaling is needed
    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      if (width > height) {
        height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
        width = MAX_IMAGE_DIMENSION;
      } else {
        width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
        height = MAX_IMAGE_DIMENSION;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return { file, originalSize, compressedSize: originalSize, wasCompressed: false, reductionPercentage: 0 };
    }

    // High quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    // Export as JPEG (best compression for photos of bar certificates and IDs)
    const blob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", IMAGE_QUALITY);
    });

    if (!blob || blob.size >= originalSize) {
      // If compressed version is somehow larger, keep original
      return { file, originalSize, compressedSize: originalSize, wasCompressed: false, reductionPercentage: 0 };
    }

    const newFilename = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
    const compressedFile = new File([blob], newFilename, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });

    const reduction = Math.round(((originalSize - compressedFile.size) / originalSize) * 100);

    return {
      file: compressedFile,
      originalSize,
      compressedSize: compressedFile.size,
      wasCompressed: true,
      reductionPercentage: reduction,
    };
  } catch (err) {
    console.warn("Client-side image compression fallback to original:", err);
    return { file, originalSize, compressedSize: originalSize, wasCompressed: false, reductionPercentage: 0 };
  }
}
