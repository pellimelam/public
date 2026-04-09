self.addEventListener("install", (event)=>{
  self.skipWaiting();
});

self.addEventListener("activate", (event)=>{
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event)=>{

  const url = new URL(event.request.url);

  /* 🔥 DYNAMIC MANIFEST */
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

      /* ✅ SAME USER URL */
      const slug = `${data?.firstName || ""}${data?.lastName || ""}${phone}`.toLowerCase();

      const manifest = {
        name: finalName,
        short_name: finalShort,

        start_url: `/${slug}`,
        scope: `/${slug}`,   // 🔥 KEY FOR MULTI INSTALL

        display: "standalone",
        background_color: "#020617",
        theme_color: "#1e3a8a",

        icons: [
          {
            src: app.icon || "/icons1/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: app.icon || "/icons1/icon-512.png",
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

  event.respondWith(fetch(event.request));
});
