import { getSql } from "./db.js";

function send(res, status, body) {
    return res.status(status).json(body);
}

function normalizePost(row) {
    return {
        id: Number(row.id),
        title: row.title,
        tag: row.tag,
        emoji: row.emoji,
        date: row.display_date,
        excerpt: row.excerpt,
        content: row.content,
        quote: row.quote ?? "",
        likes: Number(row.likes ?? 0),
        isArchived: Boolean(row.is_archived)
    };
}

export async function postsHandler(req, res) {
    try{
        const sql = getSql();
        if(req.method === "GET") {
            const rows = await sql`SELECT id,title,tag,emoji,display_date,excerpt,content,quote,likes,is_archived FROM posts ORDER BY created_at DESC,id DESC`;
            return send(res, 200, rows.map(normalizePost));
        }
        if(req.method === "POST") {
            if(process.env.NODE_ENV === "production") return send(res, 403, {error: "Post mutations are disabled until server-side admin authentication is configured."});
            if(!Array.isArray(req.body)) return send(res, 400, {error:"Expected an array of posts."});
            for(const p of req.body){
                if(!p || !Number.isFinite(Number(p.id)) || !String(p.title ?? "").trim()) continue;
                await sql`INSERT INTO posts (id,title,tag,emoji,display_date,excerpt,content,quote,likes,is_archived)
                VALUES (${Number(p.id)},${String(p.title).slice(0,200)},${String(p.tag ?? "Thoughts").slice(0,80)},${String(p.emoji ?? "☕").slice(0,16)},
                ${String(p.date ?? "").slice(0,80)},${String(p.excerpt ?? "").slice(0,500)},${String(p.content ?? "")},${String(p.quote ?? "").slice(0,500)},
                ${Math.max(0,Number(p.likes ?? 0))},${Boolean(p.isArchived)})
                ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, tag=EXCLUDED.tag, emoji=EXCLUDED.emoji, display_date=EXCLUDED.display_date,
                excerpt=EXCLUDED.excerpt, content=EXCLUDED.content, quote=EXCLUDED.quote, likes=EXCLUDED.likes, is_archived=EXCLUDED.is_archived`;
            }
            return send(res, 200, {ok:true});
        }
        res.setHeader("Allow", "GET", "POST");
        return send(res,405,{error:"Method not allowed."});
    } catch(error) {
        console.error("Posts API error:",error);
        return send(res,500,{error:"Unable to access posts right now."});
    }
}

export async function contactHandler(req, res) {
    if(req.method !=="POST") {
        res.setHeader("Allow","POST");
        return send(res,405,{error:"Method not allowed."});
    }
    try {
        const name=String(req.body?.name ?? "").trim(), email=String(req.body?.email ?? "").trim(), message=String(req.body?.message ?? "").trim();
        if(!name|| !email || !message){
            return send(res, 400,{error:"Name, email, and message are required."});
        }
        if(name.length>120 || email.length>254 || message.length>10000){
            return send(res,413,{error:"One of more fields are too long."});
        }
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
            return send(res,400,{error:"Enter a valid email address."});
        }
        await getSql()`
            INSERT INTO contact_messages (name,email,message) VALUES (${name},${email},${message})
        `;
        return send(res,201,{ok:true});
    } catch(error){
        console.error("Contact API error:",error);
        return send(res,500,{error:"Unable to save your message right now."});
    }
}