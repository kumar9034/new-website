 import express from 'express'
 import cors from "cors"
 import cookieParser from 'cookie-parser'

 const app = express()

 app.use(cors({
    origin: process.env.CORE_ORIGIN,
    credentials: true  
 }))

 app.use(express.json({limit:"50kb"}))
 app.use(express.urlencoded({extended: true, limit:"50kb"}))
 app.use(express.static("public"))
 app.use(cookieParser())

 // routes import 
 import userRouter from './routes/user.routes.js'

 // router declaration 
   app.use("/api/v1/users", userRouter)

   // http://localhost:8000/app/v1/users/register
 export { app }