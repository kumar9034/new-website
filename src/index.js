import dotenv from "dotenv"
import connectDB from "./db/index.js"
import { app } from "./app.js"

dotenv.config({
    path: "./.env" // Ensure the correct path to the .env file
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server started on PORT : ${process.env.PORT }`);
        
    })
})
.catch((err)=>{
    console.log(`err in connecting DB failed ${err}`);
    
})