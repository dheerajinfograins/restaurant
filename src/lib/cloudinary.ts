import { v2 as cloudinary } from "cloudinary";

// Initialize Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dt44mo4zr",
  api_key: process.env.CLOUDINARY_API_KEY || "992617814114298",
  api_secret: process.env.CLOUDINARY_API_SECRET || "_mfZwl4rolxZ672XyJD8lK5rzN8",
  secure: true,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

/**
 * Extracts the public_id from a Cloudinary URL
 * Example: https://res.cloudinary.com/dt44mo4zr/image/upload/v1723900000/restaurant_management/categories/appetizers.jpg
 * Returns: restaurant_management/categories/appetizers
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("res.cloudinary.com")) return null;

  try {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return null;

    // Get the substring after /upload/
    let path = url.substring(uploadIndex + 8);

    // Strip version number like v1723900000/
    path = path.replace(/^v\d+\//, "");

    // Strip file extension (.jpg, .png, etc.)
    const lastDotIndex = path.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      path = path.substring(0, lastDotIndex);
    }

    return path || null;
  } catch (error) {
    console.error("Error extracting Cloudinary public ID:", error);
    return null;
  }
}

/**
 * Uploads a file (base64 data URI, remote URL, or buffer) to Cloudinary
 * @param fileData Base64 string, URL, or Buffer
 * @param folder Subfolder name (e.g., 'categories', 'products', 'restaurant/logos', 'restaurant/covers')
 */
export async function uploadImageToCloudinary(
  fileData: string | Buffer,
  folder = "general"
): Promise<CloudinaryUploadResult> {
  const dynamicFolder = folder.startsWith("restaurant_management/")
    ? folder
    : `restaurant_management/${folder}`;

  return new Promise((resolve, reject) => {
    if (typeof fileData === "string") {
      cloudinary.uploader.upload(
        fileData,
        {
          folder: dynamicFolder,
          resource_type: "image",
          fetch_format: "auto",
          quality: "auto",
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              new Error(error?.message || "Failed to upload image to Cloudinary")
            );
          }
          resolve({
            url: result.secure_url || result.url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        }
      );
    } else {
      // Handle Buffer
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: dynamicFolder,
          resource_type: "image",
          fetch_format: "auto",
          quality: "auto",
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              new Error(
                error?.message || "Failed to upload image buffer to Cloudinary"
              )
            );
          }
          resolve({
            url: result.secure_url || result.url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        }
      );
      uploadStream.end(fileData);
    }
  });
}

/**
 * Deletes an image from Cloudinary given its URL or public ID
 * @param urlOrPublicId Cloudinary URL or public_id
 */
export async function deleteImageFromCloudinary(
  urlOrPublicId: string
): Promise<boolean> {
  if (!urlOrPublicId || typeof urlOrPublicId !== "string") return false;

  let publicId: string | null = urlOrPublicId;

  // If it's a URL, extract the publicId
  if (urlOrPublicId.startsWith("http://") || urlOrPublicId.startsWith("https://")) {
    if (!urlOrPublicId.includes("res.cloudinary.com")) {
      // Not a Cloudinary hosted image (e.g. Unsplash), so skip safely
      return false;
    }
    publicId = extractCloudinaryPublicId(urlOrPublicId);
  }

  if (!publicId) return false;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result?.result === "ok";
  } catch (error) {
    console.error(`Error deleting image from Cloudinary (${publicId}):`, error);
    return false;
  }
}

export default cloudinary;
