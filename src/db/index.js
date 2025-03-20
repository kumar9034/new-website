import mongoose from "mongoose";
import { mongodb_name } from "../constants.js";

const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${mongodb_name}`)
        console.log(`\n MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`);
         
        
    } catch (error) {
        console.log("MONGOBD connection FAILED ", error);
        process.exit(1)
        
    }
}

export default connectDB