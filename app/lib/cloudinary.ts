import "server-only";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getCloudinaryPublicId = (imageUrl: string) => {
    const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
    return match?.[1] ?? null;
};

export const deleteCloudinaryImageByPublicId = async (publicId: string) => {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });

    return result;
};

export const deleteCloudinaryImageByUrl = async (imageUrl: string) => {
    const publicId = getCloudinaryPublicId(imageUrl);

    if (!publicId) {
        return null;
    }

    return deleteCloudinaryImageByPublicId(publicId);
};
