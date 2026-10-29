import { getStore } from "@netlify/blobs";

const keyOf = r => `${r.date}_${r.name}`.replace(/[^\w.-]+/g, "_");

export default async (req) => {
  const store = getStore({ name: "eod-files", consistency: "strong" });
  if (req.method === "GET") {
    const { blobs } = await store.list();
    const out = [];
    for (const b of blobs) {
      const d = await store.get(b.key, { type: "json" });
      if (d) out.push(d);
    }
    return Response.json(out);
  }
  if (req.method === "POST") {
    const body = await req.json();
    const items = (Array.isArray(body) ? body : [body]).flat();
    let saved = 0;
    for (const r of items) {
      if (!r || !r.date || !r.name || !Array.isArray(r.reqs)) continue;
      // one record per recruiter per day; re-uploading the same day overwrites it
      const key = keyOf(r);
      await store.setJSON(key, r);
      saved++;
    }
    return Response.json({ saved });
  }
  if (req.method === "DELETE") {
    const { date, name, password } = await req.json();
    const secret = process.env.DELETE_PASSWORD;
    if (!secret) return new Response("Delete password not set up", { status: 503 });
    if (password !== secret) return new Response("Wrong password", { status: 401 });
    if (!date || !name) return new Response("Bad request", { status: 400 });
    await store.delete(keyOf({ date, name }));
    return Response.json({ deleted: true });
  }
  return new Response("Method not allowed", { status: 405 });
};

export const config = { path: "/api/eod" };
