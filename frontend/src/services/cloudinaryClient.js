const CLOUD_NAME = "loregiron"; 
const UPLOAD_PRESET = "AURA_PRODUCTOS"; 

export const uploadImageToCloudinary = async (file) => {
  if (!file) return null;

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
    
    return data.secure_url; 
    
  } catch (error) {
    console.error("Error al subir imagen a Cloudinary:", error);
    return null;
  }
};