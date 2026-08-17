const CLOUD_NAME = import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env?.VITE_CLOUDINARY_UPLOAD_PRESET;

export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 1024 * 1024;

export const isProductImageWithinSizeLimit = (file) =>
  file?.size <= MAX_PRODUCT_IMAGE_SIZE_BYTES;

export const uploadImageToCloudinary = async (file) => {
  if (!file) return null;
  if (!isProductImageWithinSizeLimit(file)) {
    console.error(`La imagen "${file.name}" supera el límite máximo de 1 MB.`);
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Cloudinary respondió con error:", data);
      return null;
    }

    return data.secure_url;
  } catch (error) {
    console.error("Error al subir imagen a Cloudinary:", error);
    return null;
  }
};

export const uploadFileToCloudinary = async (file) => {
  if (!file) return null;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    // Cloudinary may classify PDFs sent to `auto` as image assets.  Those
    // deliveries can be blocked by the account's PDF preview security policy.
    // Keeping invoices as raw files preserves their original MIME type and
    // gives the invoice viewer a stable URL to render or download.
    const resourceType = file.type === "application/pdf" ? "raw" : "auto";
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      { method: "POST", body: formData }
    );
    const data = await response.json();
    if (!response.ok) return null;
    return data.secure_url || null;
  } catch (error) {
    console.error("Error al subir el archivo a Cloudinary:", error);
    return null;
  }
};
