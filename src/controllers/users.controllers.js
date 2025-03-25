import mongoose from 'mongoose';
import { asyncohandling } from '../utils/asyncohandling.js';
import { APIError } from '../utils/APIError.js';
import { User } from "../models/user.models.js";
import { uploadonCloudinary } from '../utils/cloudinary.js';  
import { APIrespones } from '../utils/APIresponse.js';
import jwt from "jsonwebtoken";
import fs from 'fs';
import { log } from 'console';

const handleAccesstokenAndRefereshToken = async (userId)=>{
    try {
      const user =  await User.findById(userId)
      const accesstoken = await user.generateAccessToken()
      const refreshToken = await user.generateRefeshToken()

      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave: false })

      return {accesstoken, refreshToken}

    } catch (error) {
        throw new APIError(500, "Something went wrong while generating accesstoken and Refereshtoken ")
    }
}

const registerUser = asyncohandling(async (req, res) => {
    // get user detail from frontend
    // validation - not empty
    // check if user already exists: username , email
    // check for  image, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db 
    // remove password and refresh token field from response
    // check for user creation 
    // return res

    const { fullname, email, username, password } = req.body;

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

const loginUser = asyncohandling(async (req, res) =>{
    // req.body -> data 
    // username or email
    // find the user
    // password check
    // access token and referesh token
    // send cookies

    const { username, email, password}= req.body

    if(!username && !email){
        throw new APIError(400, "username or email is required ")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new APIError(409, "user does not exist")
    }

   const Password  =  await user.isPasswordCorrect(password)

   if(!Password){
    throw new APIError(401, "Invaild user password ")
   }

  const {accesstoken, refreshToken} = await handleAccesstokenAndRefereshToken(user._id)
   
  const loggedInuser = await User.findById(user._id).select("-password -refreshToken")

  const option = {
    httpOnly: true,
    secure : true
  }
  return res.status(200).cookie("accesstoken" , accesstoken, option).cookie("refreshToken", refreshToken, option).json(
    new APIrespones(
        200,{
            user: loggedInuser, accesstoken, refreshToken
        },
        "User logged in successfully"
    )
  )

})

const logoutUser = asyncohandling(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );

    const option = {
        httpOnly: true,
        secure: true
    };

    return res.status(200)
        .clearCookie("accesstoken", option) // Fixed typo
        .clearCookie("refreshToken", option) // Fixed typo
        .json(
            new APIrespones(200, {}, "User logged out successfully") // Fixed message
        );
});
const refreshaccessToken = asyncohandling(async (req, res) =>{
    const incomingRefresh = req.cookies.refreshToken || req.refreshToken
    if(!incomingRefresh){
        throw new APIError(401, "unauthorized request ")

    }
    const decodedToken = jwt.verify(incomingRefresh, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)
    if(!user){
        throw new APIError(401, "Invalid refresh token")
    }

    if(incomingRefresh !== user?.refreshToken){
        throw new APIError(401, "Refresh token is  expired or used")

    }
    const option ={
        httpOnly: true,
        secure: true
    }
    const {accesstoken, newRefreshToken} = await handleAccesstokenAndRefereshToken(user._id)

    return res.status(200)
    .cookie("accesstoken", accesstoken, option)
    .cookie("refreshToken", newRefreshToken, option)
    .json(
        new APIrespones(
            200, {
                accesstoken, refreshToken: newRefreshToken
            },
            "Access token refreshed successfully"
        )
    )

})
const changePassword = asyncohandling(async(req, res)=>{
    const {oldPassword, newPassword, confPassword}= req.body

    if(!(newPassword === confPassword)){
        throw new APIError(400, "newpassword and confpassword not some")
    }

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new APIError(401, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.statue(200).json(
        new APIrespones(200, {}, "Password changed successfully")
    )
})

const getCurrentUser = asyncohandling(async(req, res)=>{

    return res.status(200).json(
        new APIrespones(200, req.user, "user profile fetched successfully")
    )
})

const updatedetails = asyncohandling(async(req, res)=>{
    const {fullname, username, email} = req.body

    if (!(fullname && username && email)) {
        throw new APIError(400, "All fields are required");
    }
     
    User.findByIdAndUpdate(req.user?._id,{
        $set: {
            fullname,
            username,
            email
        }   
    },
    {new : true}
).select("-password")
return res.status(200).json(
    new APIrespones(200, {}, "User details updated successfully")
)
})

const coverImageChange = asyncohandling(async(req, res)=>{
    const coverImageLocalpath = req.file?.path

    if(!coverImageLocalpath){
        throw new APIError(400, "cover image file is required")
    }

   const coverImage = await uploadonCloudinary(coverImageLocalpath)

   if(!coverImage.url){
         throw new APIError(500, "Failed to upload coverImage file to Cloudinary")
   }

   const user = await User.findByIdAndUpdate(req.user?._id,
    {
        $set: {
            coverImage: coverImage.url
        }
    },
    {new:true}
   ).select("-password")
   return res.status(200).json(
         new APIrespones(200, user,"cover image updated successfully")
   )

})
const AvatarImageChange = asyncohandling(async(req, res)=>{
    const avatarLocalpath = req.file?.path

    if(!avatarLocalpath){
        throw new APIError(400, "Avatar file is required")
    }

   const avatar = await uploadonCloudinary(avatarLocalpath)

   if(!avatar.url){
         throw new APIError(500, "Failed to upload avatar file to Cloudinary")
   }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
        $set: {
            avatar: avatar.url
        }
    },
    {new:true}
   ).select("-password")
   return res.status(200).json(
         new APIrespones(200, user,"Avatar image updated successfully")
   )

})
const getchannel = asyncohandling(async (req, res) => {
    const { username } = req.params;

    if (!username || !username.trim()) {
        throw new APIError(400, "Username is missing or invalid");
    }

    // Remove the colon if it exists
    const cleanUsername = username.replace(/^:/, "").trim();
    console.log("Fetching channel for username:", cleanUsername);

    const channel = await User.aggregate([
        {
            $match: {
                username: { $regex: `^${cleanUsername}$`, $options: 'i' },
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscriberCount: { $size: "$subscribers" },
                channelsubscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    $in: [req.user?._id, "$subscribers.subscriber"],
                },
            },
        },
        {
            $project: {
                username: 1,
                fullname: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                channelsubscribedToCount: 1,
                isSubscribed: 1,
                email: 1,
            },
        },
    ]);

    console.log("Channel result:", channel);

    if (!channel || channel.length === 0) {
        console.error("Channel not found for username:", cleanUsername);
        throw new APIError(404, `Channel with username '${cleanUsername}' does not exist`);
    }

    return res.status(200).json(
        new APIrespones(200, channel[0], "User channel fetched successfully")
    );
});

 
const getwatchHistory = asyncohandling(async(req, res)=>{
   const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField: "_id",
                as:"watchHistory",
                pipeline:[{
                       $lookup:{
                           from: "users",
                           localField:"owner",
                           foreignField: "_id",
                           as:"owner",
                           pipeline:[{
                              $project:{
                                fullname:1,
                                username:1,
                                avatar:1
                              }
                           }]

                       }   
                },
                {
                    $addFields:{
                        owner:{
                            $first: "$owner"
                        }
                    }
                }
            ]

            }
        }
    ])


    return res.status(200).json(
        new APIrespones(200, user[0].watchHistory , "watch history fetched successfully")
    )
})


export { 
    registerUser,
    loginUser,
    logoutUser, 
    refreshaccessToken,
    changePassword,
    getCurrentUser,
    updatedetails,
    coverImageChange,
    AvatarImageChange,
    getchannel,
    getwatchHistory
}