import { postsHandler } from "../server/handlers.js";
export default function handler(req,res){
    return postsHandler(req,res);
}