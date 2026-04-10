self.addEventListener("install", (event)=>{
  self.skipWaiting();
});

self.addEventListener("activate", (event)=>{
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event)=>{

  const url = new URL(event.request.url);

  /* =========================================
     🔥 DYNAMIC MANIFEST (FINAL FIXED)
  ========================================= */

  if(url.pathname === "/manifest.json"){

    event.respondWith((async ()=>{

      try{

        const start = url.searchParams.get("start") || "/";

        /* 🔍 EXTRACT PHONE */
        const match = start.match(/(\d{10})/);
        const phone = match ? match[1] : null;

        let data = null;

        if(phone){
          try{
            const res = await fetch(
              `https://raw.githubusercontent.com/Vidhwaan1/${phone}/main/data.json`
            );
            if(res.ok){
              data = await res.json();
            }
          }catch(e){}
        }

        /* ✅ SAFE FALLBACK */
        const appName = data?.app?.name || data?.firstName || "Vidhwaan";
        const shortName = data?.app?.short_name || data?.firstName || appName;
        const icon = data?.app?.icon || "/icons1/icon-192.png";

        /* 🔥 CRITICAL FIX */
        const cleanStart = start.replace(/\/+$/, ""); // remove trailing /

        const manifest = {
          id: cleanStart,
          name: appName,
          short_name: shortName,

          start_url: cleanStart,
          scope: cleanStart,   // ✅ EXACT MATCH

          display: "standalone",
          display_override: ["standalone", "minimal-ui"],

          background_color: "#020617",
          theme_color: "#1e3a8a",

          icons: [
            {
              src: icon,
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: icon,
              sizes: "512x512",
              type: "image/png"
            }
          ]
        };

        return new Response(JSON.stringify(manifest), {
          headers: { "Content-Type": "application/json" }
        });

      }catch(e){
        return fetch("/manifest.json");
      }

    })());

    return;
  }

  /* =========================================
     NORMAL REQUESTS
  ========================================= */

  event.respondWith(fetch(event.request));

});
