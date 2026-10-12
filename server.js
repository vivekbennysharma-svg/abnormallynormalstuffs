import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { postsHandler, contactHandler } from "./server/handlers.js";

dotenv.config();

const root=path.dirname(fileURLToPath(import.meta.url));
const app=express(), port=Number(process.env.PORT || 3000);

app.disable("x-powered-by");
app.use(express.json({limit:"1mb"}));
app.use("/api/posts",(req,res)=>postsHandler(req,res));
app.use("/api/contact",(req,res)=>contactHandler(req,res));
app.use(express.static(path.join(root,"public")));
app.get("*path",(_req,res)=>res.sendFile(path.join(root,"public","index.html")));

app.listen(port,()=>{
    console.log(`abnormallynormalstuffs running at HTTP://localhost:${port}`)
});