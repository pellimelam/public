self.addEventListener("install", (event)=>{
  self.skipWaiting();
});

self.addEventListener("activate", (event)=>{
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event)=>{

  const url = new URL(event.request.url);

  /* =========================================
     🔥 DYNAMIC MANIFEST (PER USER)
  ========================================= */

  if(url.pathname === "/manifest.json"){

    event.respondWith((async () => {

      try{

        const path = url.searchParams.get("start") || "/";

        /* ✅ EXTRACT PHONE */
        const phoneMatch = path.match(/(\d{10})/);
        const phone = phoneMatch ? phoneMatch[1] : null;

        let data = null;

        if(phone){
          const res = await fetch(`https://raw.githubusercontent.com/Vidhwaan1/${phone}/main/data.json`);
          if(res.ok){
            data = await res.json();
          }
        }

        /* ✅ APP CONFIG */
        const appName = data?.app?.name || "Vidhwaan";
        const shortName = data?.app?.short_name || appName;

        const icon = data?.app?.icon || "/icons1/icon-192.png";

        /* ✅ FINAL MANIFEST */
        const manifest = {
          name: appName,
          short_name: shortName,

          start_url: path,              // 🔥 FIXED (no redirect bug)
          scope: path,                 // 🔥 PER USER APP

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

        /* ✅ SAFE FALLBACK (OLD USERS SAFE) */
        return fetch("/manifest.json");

      }

    })());

    return;
  }

  /* =========================================
     🔥 ISOLATION LOGIC (CRITICAL FIX)
  ========================================= */

  const scopePath = self.registration.scope.replace(self.location.origin, "");

  // 🚫 BLOCK requests outside app scope
  if(scopePath !== "/" && !url.pathname.startsWith(scopePath)){
    return; // let browser handle normally
  }

  // 🚫 NEVER hijack root (main site)
  if(url.pathname === "/"){
    return;
  }

  /* =========================================
     NORMAL REQUESTS
  ========================================= */

  event.respondWith(fetch(event.request));

});
