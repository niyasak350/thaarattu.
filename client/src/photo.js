// Shrinks a chosen picture and returns it as text (a "data URL"), so it can be saved in the
// database without a separate upload folder.
//   size:   longest side in pixels after shrinking
//   square: true = crop to the middle square (profile pictures)
export function readPhoto(file, { size = 400, square = true } = {}) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      if (square) {
        const side = Math.min(image.width, image.height);
        canvas.width = canvas.height = size;
        canvas.getContext('2d').drawImage(image,
          (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, size, size);
      } else {
        const scale = Math.min(1, size / Math.max(image.width, image.height));
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.82));
      URL.revokeObjectURL(image.src);
    };
    image.onerror = () => reject(new Error('That file is not a picture'));
    image.src = URL.createObjectURL(file);
  });
}
