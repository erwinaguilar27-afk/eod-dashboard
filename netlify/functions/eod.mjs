import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("eod-files");
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
      const key = `${r.date}_${r.name}`.replace(/[^\w.-]+/g, "_");
      await store.setJSON(key, r);
      saved++;
    }
    return Response.json({ saved });
  }
  return new Response("Method not allowed", { status: 405 });
};

export const config = { path: "/api/eod" };
