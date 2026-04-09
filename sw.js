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

      /* 🔥 FINAL NAME LOGIC */
      const finalName =
        app.name ||
        (data?.firstName ? `VID ${data.firstName}` : "VID Vidhwaan");

      const finalShort =
        app.short_name ||
        (data?.firstName ? data.firstName : "Vidhwaan");

      const manifest = {
        name: finalName,
        short_name: finalShort,

        /* 🔥 CRITICAL FOR MULTI APP */
        start_url: `/app/${phone}/`,
        scope: `/app/${phone}/`,

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

  /* NORMAL REQUESTS */
  event.respondWith(fetch(event.request));
});
