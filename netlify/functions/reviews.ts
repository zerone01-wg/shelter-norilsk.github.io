import type { Config } from "@netlify/functions";
import { desc, gt } from "drizzle-orm";
import { db } from "../../db/index.js";
import { reviews } from "../../db/schema.js";

export default async (req: Request) => {
  if (req.method === "GET") {
    const after = Number(new URL(req.url).searchParams.get("after") || 0);
    const query = db.select().from(reviews);
    const rows = await (after > 0 ? query.where(gt(reviews.id, after)) : query)
      .orderBy(desc(reviews.id))
      .limit(100);
    return Response.json(rows, { headers: { "Cache-Control": "no-store" } });
  }

  if (req.method === "POST") {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Неверный формат" }, { status: 400 });
    }
    const name = String(body?.name ?? "").trim().slice(0, 60);
    const text = String(body?.text ?? "").trim().slice(0, 1000);
    const rating = Math.round(Number(body?.rating));
    if (!name || !text || !(rating >= 1 && rating <= 5)) {
      return Response.json({ error: "Заполните имя, оценку и текст" }, { status: 400 });
    }
    const [row] = await db.insert(reviews).values({ name, text, rating }).returning();
    return Response.json(row, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = { path: "/api/reviews" };
