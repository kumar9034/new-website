import {asyncohandling } from '../utils/asyncohandling.js';
import { APIError } from '../utils/APIError.js';
import { User} from "../models/user.models.js"
import { uploadonCloudinary } from '../utils/cloudinary.js';  
import { APIrespones } from '../utils/APIresponse.js';
import fs from 'fs';

const registerUser = asyncohandling(async (req, res) => {
    const { fullname, email, username, password } = req.body;

    console.log("email", email);

    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new APIError(400, "All fields are required ");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new APIError(409, "User with email or username already exists");
    }

    const avatarLocalpath = req.files?.avatar && req.files.avatar[0]?.path;
    const coverImageLocalpath = req.files?.coverImage && req.files.coverImage[0]?.path;

    if (!avatarLocalpath || !fs.existsSync(avatarLocalpath)) {
        console.error("Avatar file not found at path:", avatarLocalpath);
        throw new APIError(400, "Avatar file is required and must exist");
    }

    let avatar, coverImage;
    try {
        console.log("Uploading avatar from path:", avatarLocalpath);
        avatar = await uploadonCloudinary(avatarLocalpath);
        if (!avatar) {
            throw new APIError(500, "Failed to upload avatar file to Cloudinary");
        }

        if (coverImageLocalpath && fs.existsSync(coverImageLocalpath)) {
            console.log("Uploading cover image from path:", coverImageLocalpath);
            coverImage = await uploadonCloudinary(coverImageLocalpath);
            if (!coverImage) {
                throw new APIError(500, "Failed to upload cover image file to Cloudinary");
            }
        }
    } catch (error) {
        console.error("Error uploading files to Cloudinary:", error);
        throw new APIError(500, "Failed to upload files to Cloudinary");
    }

    try {
        const newUser = await User.create({
            fullname,
            email,
            password,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            username: username.toLowerCase(),
        });

        const createdUser = await User.findById(newUser._id).select("-password -refreshToken");

        if (!createdUser) {
            throw new APIError(500, "Something went wrong while registering the user");
        }

        return res.status(201).json(
            new APIrespones(200, createdUser, "User registered Successfully")
        );
    } catch (error) {
        console.error("Error creating user in database:", error);
        throw new APIError(500, "Failed to create user in database");
    }
});

export { 
    registerUser 
}