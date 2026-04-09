self.addEventListener("install", (event)=>{
  self.skipWaiting();
});

self.addEventListener("activate", (event)=>{
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event)=>{

  const url = new URL(event.request.url);

  /* ===============================
     🔥 DYNAMIC MANIFEST (PER USER)
  =============================== */

  if(url.pathname === "/manifest.json"){

    event.respondWith((async ()=>{

      try{

        const start = url.searchParams.get("start") || "/";

        /* 🔍 EXTRACT PHONE FROM PATH */
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

        /* ✅ SAFE FALLBACKS (OLD USERS SAFE) */
        const appName = data?.app?.name || "Vidhwaan";
        const shortName = data?.app?.short_name || appName;
        const icon = data?.app?.icon || "/icons1/icon-192.png";

        /* ✅ FINAL MANIFEST */
        const manifest = {
          name: appName,
          short_name: shortName,

          start_url: start,   // 🔥 opens correct user
          scope: start,       // 🔥 per-user app (multi install)

          display: "standalone",

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

        /* 🔁 fallback to static manifest (no break) */
        return fetch("/manifest.json");
      }

    })());

    return;
  }

  /* ===============================
     🌐 NORMAL REQUESTS (NO HIJACK)
  =============================== */

  event.respondWith(fetch(event.request));

});
