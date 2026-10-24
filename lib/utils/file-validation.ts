/**
 * Server and client file validation utility.
 * Validates file headers (magic bytes) to ensure authenticity and prevent spoofed uploads.
 */

export interface FileValidationResult {
  valid: boolean;
  detectedMime?: string;
  error?: string;
}

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB maximum

export function validateFileSize(sizeBytes: number, maxBytes: number = MAX_FILE_SIZE_BYTES): boolean {
  return sizeBytes > 0 && sizeBytes <= maxBytes;
}

/**
 * Inspects binary magic numbers of an ArrayBuffer or Uint8Array.
 */
export function detectMimeTypeFromBytes(bytes: Uint8Array): string | null {
  if (bytes.length < 4) return null;

  // PDF: %PDF (25 50 44 46)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "application/pdf";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return "image/png";
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // WebP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Validates a file's size and binary contents against allowed verification document criteria.
 */
export async function validateVerificationFile(file: File | Blob): Promise<FileValidationResult> {
  if (!validateFileSize(file.size)) {
    return {
      valid: false,
      error: `File exceeds maximum allowed size of ${(MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)}MB.`,
    };
  }

  try {
    // Read first 16 bytes for magic number detection
    const slice = file.slice(0, 16);
    const arrayBuffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const detectedMime = detectMimeTypeFromBytes(bytes);

    if (!detectedMime) {
      return {
        valid: false,
        error: "Unrecognized file format or corrupted file header. Please upload a valid PDF, JPEG, or PNG.",
      };
    }

    if (!ALLOWED_MIME_TYPES.includes(detectedMime)) {
      return {
        valid: false,
        detectedMime,
        error: `File type ${detectedMime} is not permitted for verification documents.`,
      };
    }

    return {
      valid: true,
      detectedMime,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Failed to inspect file contents: ${err.message}`,
    };
  }
}
