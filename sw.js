self.addEventListener("install", e => self.skipWaiting());

self.addEventListener("activate", e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {

  const url = new URL(event.request.url);

  if (url.pathname === "/manifest.json") {

    const phone = url.searchParams.get("phone");

    event.respondWith((async () => {

      let data = null;

      try {
        const res = await fetch(`https://raw.githubusercontent.com/Vidhwaan1/${phone}/main/data.json`);
        data = await res.json();
      } catch (e) {}

      const app = data?.app || {};

      const slug = `${data?.firstName || ""}${data?.lastName || ""}${phone}`.toLowerCase();

      const manifest = {
        id: `/${slug}`,   // ✅ UNIQUE APP ID

        name: app.name || `VID ${data?.firstName || "Vidhwaan"}`,
        short_name: app.short_name || data?.firstName || "Vidhwaan",

        start_url: `/${slug}`,   // ✅ EXACT ENTRY
        scope: `/${slug}`,       // ✅ STRICT ISOLATION

        display: "standalone",
        display_override: ["standalone"],

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
