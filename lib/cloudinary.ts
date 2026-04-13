export const uploadImageToCloudinary = async (uri: string) => {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  // Prefer an explicitly-named upload preset; fall back to legacy key var if present
  const uploadPreset =
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ??
    process.env.EXPO_PUBLIC_CLOUDINARY_KEY;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Missing Cloudinary config. Set EXPO_PUBLIC_CLOUDINARY_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env",
    );
  }

  const formData = new FormData();
  // In React Native, provide the file object with uri
  formData.append(
    "file" as any,
    {
      uri,
      type: "image/jpeg",
      name: "upload.jpg",
    } as any,
  );
  formData.append("upload_preset", uploadPreset as string);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData as any,
    },
  );
  const text = await res.text();
  if (!res.ok) {
    // Provide clearer guidance for the common 'upload preset not found' case
    if (res.status === 400 && text.includes("Upload preset not found")) {
      throw new Error(
        `Upload failed: ${res.status} ${text}. The upload preset (${uploadPreset}) was not found in Cloudinary. Create an unsigned upload preset in your Cloudinary console and set EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET to its name.`,
      );
    }
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }
  const json = JSON.parse(text);
  return json.secure_url as string;
};
