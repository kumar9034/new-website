import {asyncohandling } from '../utils/asyncohandling.js';

const registerUser = asyncohandling( async (req, res)=>{
    res.status(400).json({
        message: "ok"
    })
})

export { 
    registerUser 
}