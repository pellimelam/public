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

    event.respondWith((async () => {

      try{

        const path = url.searchParams.get("start") || "/";
      
        const phoneMatch = path.match(/(\d{10})/);
        const phone = phoneMatch ? phoneMatch[1] : null;

        let data = null;

        if(phone){
          const res = await fetch(`https://raw.githubusercontent.com/Vidhwaan1/${phone}/main/data.json`);
          if(res.ok){
            data = await res.json();
          }
        }

        const appName = data?.app?.name || "Vidhwaan";
        const shortName = data?.app?.short_name || appName;

        const icon = data?.app?.icon || "/icons1/icon-192.png";

        const manifest = {
          name: appName,
          short_name: shortName,

          start_url: path + "?source=pwa",

          scope: path,   // 🔥 CRITICAL (multi-app support)

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

        return fetch("/manifest.json"); // fallback
      }

    })());

    return;
  }

  /* NORMAL REQUESTS */
  event.respondWith(fetch(event.request));
});
