// const asynchandle = (fn) => async (req, res, next) =>{
//     try {
//         await fn(req, res, next)
        
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success :false,
//             message : err.message
//         })
        
//     }
// }
export const asyncohandling = (requestHandler) =>{
   return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch(next);
    };
} 