import {v2 as Cloudinary} from 'cloudinary';
import fs from 'fs';



Cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
})

const uploadonCloudinary = (localfile)=>{
    try {
        if(!localfile) return null;
        const response = Cloudinary.uploader.upload(localfile,{
            resource_type :"auto"
        })
        console.log("file is uploaded on cloudinary",
            responses.url);
            return response
        
    } catch (error) {
        fs.unlinkSync(localfile)
        return null
    }
}
export { uploadonCloudinary}