import { contactHandler } from "../server/handlers.js";

export default function handler(req,res){
    return contactHandler(req,res);
}