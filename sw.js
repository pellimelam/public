self.addEventListener("install", (event)=>{
  self.skipWaiting();
});

self.addEventListener("activate", (event)=>{
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event)=>{

  const url = new URL(event.request.url);

  /* 🔥 HANDLE MANIFEST DYNAMICALLY */
  if(url.pathname === "/manifest.json"){

    const phone = url.searchParams.get("phone");

    event.respondWith((async ()=>{

      let data = null;

      try{
        const res = await fetch(`https://raw.githubusercontent.com/Vidhwaan1/${phone}/main/data.json`);
        data = await res.json();
      }catch(e){}

      const app = data?.app || {};

      /* ✅ FINAL NAME LOGIC */
      const finalName =
        app.name ||
        (data?.firstName ? `VID ${data.firstName}` : "VID Vidhwaan");

      const finalShort =
        app.short_name ||
        (data?.firstName ? data.firstName : "Vidhwaan");

      /* ✅ SLUG (YOUR URL SYSTEM) */
      const slug = `${data?.firstName || ""}${data?.lastName || ""}${phone}`.toLowerCase();

      /* ✅ DEFAULT ICONS (SAME AS YOUR MAIN MANIFEST) */
      const defaultIcon192 = "/icons/icon-192.png";
      const defaultIcon512 = "/icons/icon-512.png";

      const manifest = {
        name: finalName,
        short_name: finalShort,

        /* ✅ SAME URL AS WEBSITE (NO /app/) */
        start_url: `/${slug}`,
        scope: `/`,

        display: "standalone",
        background_color: "#020617",
        theme_color: "#1e3a8a",

        icons: [
          {
            src: app.icon || defaultIcon192,
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: app.icon || defaultIcon512,
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

  /* NORMAL REQUESTS */
  event.respondWith(fetch(event.request));
});
