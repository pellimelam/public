self.addEventListener("install", (event)=>{
  self.skipWaiting();
});

self.addEventListener("activate", (event)=>{
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event)=>{

  const url = new URL(event.request.url);

  /* =========================
     DYNAMIC MANIFEST (PER USER)
  ========================= */
  if(url.pathname === "/manifest.json"){

    const phone = url.searchParams.get("phone");

    event.respondWith((async ()=>{

      let data = null;

      try{
        const res = await fetch(`https://raw.githubusercontent.com/Vidhwaan1/${phone}/main/data.json`);
        data = await res.json();
      }catch(e){}

      const app = data?.app || {};

      /* ✅ NAME */
      const finalName =
        app.name ||
        (data?.firstName ? `VID ${data.firstName}` : "VID Vidhwaan");

      const finalShort =
        app.short_name ||
        (data?.firstName ? data.firstName : "Vidhwaan");

      /* ✅ UNIQUE SLUG */
      const slug = `${data?.firstName || ""}${data?.lastName || ""}${phone}`.toLowerCase();

      /* ✅ UNIQUE START URL */
      const startUrl = `/${slug}`;

      /* ✅ DEFAULT ICONS */
      const icon192 = app.icon || "/icons1/icon-192.png";
      const icon512 = app.icon || "/icons1/icon-512.png";

      const manifest = {
        id: startUrl,   // 🔥 VERY IMPORTANT (modern PWA identity)

        name: finalName,
        short_name: finalShort,

        start_url: startUrl,
        scope: startUrl,   // 🔥 per-user isolation

        display: "standalone",
        display_override: ["standalone", "minimal-ui"],

        background_color: "#020617",
        theme_color: "#1e3a8a",

        icons: [
          {
            src: icon192,
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: icon512,
            sizes: "512x512",
            type: "image/png"
          }
        ]
      };

      return new Response(JSON.stringify(manifest), {
        headers: { "Content-Type": "application/json" }
      });

    })());

    return;
  }

  /* =========================
     NORMAL REQUESTS (NO HACKS)
  ========================= */
  event.respondWith(fetch(event.request));
});
