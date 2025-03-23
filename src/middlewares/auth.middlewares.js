import { asyncohandling } from "../utils/asyncohandling.js";
import { APIError } from "../utils/APIError.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";

export const verifyjwt = asyncohandling(async(req, res, next)=>{
     
    try {
        const token = req.cookies?.accesstoken || req.header("Authorization")?.replace("Bearer ","")
        if(!token){
            throw new APIError(401, "unauthorized request ")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshtoken")

        if(!user){
            throw new APIError(401, "Invalid Access token")
        } 

        req.user = user;
        next()
    } catch (error) {
        throw new APIError(401,error?.message || "Invalid Access token ")
    }
})