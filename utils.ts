interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Compresses an image file client-side before uploading.
 * Returns a data URL of the compressed image.
 * Passes through GIFs and videos without compression to preserve them.
 * @param file The file to process.
 * @param options The compression options for images.
 * @returns A promise that resolves to a data URL.
 */
export const compressImage = (file: File, options: CompressImageOptions = {}): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Don't compress GIFs to preserve animation, and don't process videos with canvas.
    // Just convert them to a data URL.
    if (file.type.startsWith('video/') || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error("Failed to read file."));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
      return;
    }

    // Handle image compression
    const image = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        image.src = e.target.result;
      } else {
        reject(new Error("Failed to read image file."));
      }
    };

    reader.onerror = (error) => reject(error);

    image.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = image;
      const { maxWidth = 800, maxHeight = 800, quality = 0.75 } = options;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Could not get canvas context.'));
      }

      ctx.drawImage(image, 0, 0, width, height);
      
      const dataUrl = canvas.toDataURL(file.type, quality);
      resolve(dataUrl);
    };

    image.onerror = (error) => reject(error);

    reader.readAsDataURL(file);
  });
};
