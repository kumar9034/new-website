import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshaccessToken, changePassword, getCurrentUser, updatedetails, coverImageChange, AvatarImageChange, getchannel, getwatchHistory  } from "../controllers/users.controllers.js";
import { upload } from "../middlewares/multer.js";
import { verifyjwt } from "../middlewares/auth.middlewares.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser) 

router.route("/logout").post(verifyjwt, logoutUser)
router.route("/refresh-token").post(refreshaccessToken)
router.route("/change-password").post(verifyjwt, changePassword)
router.route("/current-user").get(verifyjwt, getCurrentUser )
router.route("/user-update").patch(verifyjwt, updatedetails)
router.route("/user-coverimage").patch(verifyjwt, upload.single("avatar"), coverImageChange)
router.route("/user-avatarimage").patch(verifyjwt, upload.single("coverImage"), AvatarImageChange )
router.route("/c/:username").get(verifyjwt, getchannel)
router.route("/history").get(verifyjwt, getwatchHistory)


export default router 