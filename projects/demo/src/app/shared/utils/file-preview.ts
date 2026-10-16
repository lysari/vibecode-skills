/** One megabyte, as a file picker quotes it. */
export const MB = 1024 * 1024;

/**
 * Whether a file matches an `accept` list — the same syntax the `<input>`
 * attribute takes: exact types (`application/pdf`), wildcards (`image/*`) and
 * extensions (`.pdf`).
 *
 * The attribute only filters the picker. A drop, or "All files" chosen in the
 * picker, lands anything at all, so the check has to be made again here.
 */
export function acceptsType(file: Pick<File, 'name' | 'type'>, accept: string): boolean {
  const tokens = accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.length) return true;

  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

/** `240 kB`, `3.4 MB` — one decimal below ten, where it still says something. */
export function formatBytes(bytes: number): string {
  const [value, unit] =
    bytes >= MB
      ? [bytes / MB, 'megabyte']
      : bytes >= 1024
        ? [bytes / 1024, 'kilobyte']
        : [bytes, 'byte'];
  return new Intl.NumberFormat(undefined, {
    style: 'unit',
    unit,
    unitDisplay: 'short',
    maximumFractionDigits: unit !== 'byte' && value < 10 ? 1 : 0,
  }).format(value);
}

export interface ImagePreview {
  /** The original's own size, before the preview was scaled down. */
  width: number;
  height: number;
  /** A JPEG data URL no longer than `maxEdge` on its longest side. */
  url: string;
}

/**
 * Decodes an image and draws a small copy of it.
 *
 * A data URL rather than `URL.createObjectURL`: a blob URL dies with the page,
 * so a draft saved with one came back as a broken image. Scaled down, because
 * the preview is kept alongside the draft and a phone photo is several megabytes.
 *
 * `createImageBitmap` applies the photo's EXIF orientation, so a portrait taken
 * on a phone stays upright. Transparent pixels are laid on white first — JPEG has
 * no alpha, and they would otherwise come out black.
 *
 * Rejects when the browser cannot decode the file, which is how a HEIC photo
 * renamed `.jpg`, or a truncated upload, announces itself.
 */
export async function readImagePreview(file: Blob, maxEdge = 480): Promise<ImagePreview> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext('2d');
    if (!context) throw new Error('No 2D context to draw the preview on.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    return {
      width: bitmap.width,
      height: bitmap.height,
      url: canvas.toDataURL('image/jpeg', 0.85),
    };
  } finally {
    bitmap.close();
  }
}
