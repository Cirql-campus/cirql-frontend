const MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.78;

export interface CompressionResult {
  file: File;
  compressed: boolean;
}

const loadImage = (file: File) => new Promise<HTMLImageElement>((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(url);
    resolve(image);
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('Could not read image'));
  };
  image.src = url;
});

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number) => new Promise<Blob>((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (!blob) return reject(new Error('Could not compress image'));
    resolve(blob);
  }, 'image/jpeg', quality);
});

export const compressImageFile = async (file: File, maxBytes: number): Promise<CompressionResult> => {
  if (!file.type.startsWith('image/')) return { file, compressed: false };

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  if (file.size <= maxBytes && scale === 1) {
    return { file, compressed: false };
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { file, compressed: false };

  ctx.drawImage(image, 0, 0, width, height);

  let quality = DEFAULT_QUALITY;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > maxBytes && quality > 0.48) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, quality);
  }

  const compressedFile = new File(
    [blob],
    file.name.replace(/\.[^.]+$/, '.jpg'),
    { type: 'image/jpeg', lastModified: Date.now() }
  );

  if (compressedFile.size >= file.size && file.size <= maxBytes) {
    return { file, compressed: false };
  }

  return { file: compressedFile, compressed: true };
};

export const compressImageFiles = async (files: File[], maxBytes: number) => {
  const results = await Promise.all(files.map(file => compressImageFile(file, maxBytes)));
  return {
    files: results.map(result => result.file),
    compressedCount: results.filter(result => result.compressed).length,
  };
};
