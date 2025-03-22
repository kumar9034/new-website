import { v2 as Cloudinary } from 'cloudinary';
import fs from 'fs';

// import dotenv from 'dotenv';
// dotenv.config("./.env");

Cloudinary.config({
    cloud_name: 'dzwmj8heh',
    api_key: '663738412153212',
    api_secret: 'U5PRd72GlAH_RTLymPoCaRBxIPE',
});

const uploadonCloudinary = async (localfilePath) => {
    try {
        if (!localfilePath || !fs.existsSync(localfilePath)) {
            console.error("File does not exist at path:", localfilePath);
            return null;
        }

        console.log("Uploading file to Cloudinary from path:", localfilePath);
        const response = await Cloudinary.uploader.upload(localfilePath, {
            resource_type: "auto",
        });
        
        fs.unlinkSync(localfilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localfilePath)
        throw new Error("Failed to upload file to Cloudinary");
    }
};

export { uploadonCloudinary };