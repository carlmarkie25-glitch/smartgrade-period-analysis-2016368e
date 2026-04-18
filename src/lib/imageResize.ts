/**
 * Resize an image File to a WebP Blob, max dimension preserving aspect ratio.
 * Falls back to the original file if conversion fails or yields a larger result.
 */
export async function resizeToWebP(
  file: File,
  maxDim = 512,
  quality = 0.82
): Promise<{ blob: Blob; contentType: string }> {
  try {
    if (!file.type.startsWith("image/")) {
      return { blob: file, contentType: file.type };
    }

    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { blob: file, contentType: file.type };
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close?.();

    const webpBlob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", quality)
    );

    if (!webpBlob || webpBlob.size >= file.size) {
      return { blob: file, contentType: file.type };
    }
    return { blob: webpBlob, contentType: "image/webp" };
  } catch (err) {
    console.warn("resizeToWebP failed, using original", err);
    return { blob: file, contentType: file.type };
  }
}

/** Convert a Blob to base64 (no data: prefix). */
export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)) as unknown as number[]
    );
  }
  return btoa(binary);
}
