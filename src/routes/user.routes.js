import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshaccessToken  } from "../controllers/users.controllers.js";
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


export default router 