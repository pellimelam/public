self.addEventListener("install", e => self.skipWaiting());

self.addEventListener("activate", e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {

  const url = new URL(event.request.url);

  /* =========================
     DYNAMIC MANIFEST
  ========================= */
  if (url.pathname === "/manifest.json") {

    const phone = url.searchParams.get("phone");

    /* 🔥 CRITICAL FIX: get real install URL */
    const start = url.searchParams.get("start") || "/";

    event.respondWith((async () => {

      let data = null;

      try {
        const res = await fetch(`https://raw.githubusercontent.com/Vidhwaan1/${phone}/main/data.json`);
        data = await res.json();
      } catch (e) {}

      const app = data?.app || {};

      const slug = `${data?.firstName || ""}${data?.lastName || ""}${phone}`
        .toLowerCase()
        .replace(/\s+/g, "");

      const manifest = {

        /* ✅ MULTI APP ID */
        id: `/${slug}`,

        /* ✅ NAME */
        name: app.name || `VID ${data?.firstName || "Vidhwaan"}`,
        short_name: app.short_name || data?.firstName || "Vidhwaan",

        /* 🔥 FIX: USE REAL INSTALL PATH */
        start_url: start,

        /* ✅ ALLOW FULL SITE */
        scope: `/`,

        display: "standalone",
        display_override: ["standalone"],

        background_color: "#020617",
        theme_color: "#1e3a8a",

        /* ✅ ICON */
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

  /* =========================
     NORMAL REQUESTS
  ========================= */
  event.respondWith(fetch(event.request));
});
