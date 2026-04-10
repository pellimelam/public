import { layout } from "./template/baseTemplate.js";

window.__PROFILE_CACHE = window.__PROFILE_CACHE || {};

function renderLayout(content){
document.getElementById("app").innerHTML = content;
}

export function initRouter(){

if(window.location.pathname.match(/\d{10}$/)){
document.body.innerHTML = "<div id='app'></div>";
}

let path = window.location.pathname.toLowerCase();

/* HANDLE 404 REDIRECT */
const params = new URLSearchParams(window.location.search);
const redirectedPath = params.get("path");

if(redirectedPath){

path = decodeURIComponent(redirectedPath).toLowerCase();

/* 🔥 CLEAN URL (REMOVE ?path=) */
window.history.replaceState({}, "", path);

}

/* IGNORE ROOT */
if(path === "/" || path === "/index.html") return;

/* SPLIT */
const parts = path.split("/").filter(Boolean);

/* FIND PHONE */
let phone = null;

for(const part of parts){
const match = part.match(/(\d{10})$/);
if(match){
phone = match[1];
break;
}
}

if(!phone) return;

// ✅ REMOVE MAIN SUPPORT BUTTON ON PROFILE PAGE
const supportBtn = document.getElementById("supportBtn");
if(supportBtn) supportBtn.remove();

// ✅ HIDE LANDING UI WHEN PROFILE LOADS
["nav","hero","registration","edit","footer","support"].forEach(id=>{
const el = document.getElementById(id);
if(el) el.style.display = "none";
});


/* PAGE TYPE */
let page = "home";

if(path.includes("/gallery")) page = "gallery";
else if(path.includes("/videos")) page = "videos";
else if(path.includes("/about")) page = "about";
else if(path.includes("/business")) page = "business";

/* LOAD */
loadProfilePage(phone, page);

}




async function loadProfilePage(phone, page){

try{

/* =========================
   STEP 1: ALWAYS CHECK GITHUB (TRUTH)
========================= */

const CACHE_KEY = `profile_${phone}`;

const mem = window.__PROFILE_CACHE[phone];
let cached = localStorage.getItem(CACHE_KEY);
cached = cached ? JSON.parse(cached) : null;

if(mem && cached && mem.version === cached.version){

  renderPage(mem, page);

  // 🔥 SAFE BACKGROUND VERIFY
  fetch(`https://raw.githubusercontent.com/Vidhwaan1/${phone}/main/data.json`)
    .then(r => {
      if(!r.ok) throw new Error("fetch failed");
      return r.json();
    })
    .then(newData => {
      if(newData.version !== mem.version){

        localStorage.setItem(CACHE_KEY, JSON.stringify({
          version: newData.version,
          data: newData
        }));

        window.__PROFILE_CACHE[phone] = newData;

        // ✅ prevent flicker in background tab
        if(document.visibilityState === "visible"){
          renderPage(newData, page);
        }
      }
    })
    .catch(()=>{});

  return;
}


/* =========================
   STEP 2: FETCH LATEST
========================= */

const rawRes = await fetch(
  `https://raw.githubusercontent.com/Vidhwaan1/${phone}/main/data.json`
);

if(!rawRes.ok){

  if(cached){
    renderPage(cached.data, page);
    return;
  }

  document.body.innerHTML = "Profile not found";
  return;
}

const latestData = await rawRes.json();

/* =========================
   STEP 3: VERSION CHECK
========================= */

let finalData;

if(cached && cached.version === latestData.version){
  finalData = cached.data;
}else{
  finalData = latestData;

  localStorage.setItem(CACHE_KEY, JSON.stringify({
    version: latestData.version,
    data: latestData
  }));
}

window.__PROFILE_CACHE[phone] = finalData;

if(!window.__BG_REFRESH) window.__BG_REFRESH = {};

if(!window.__BG_REFRESH[phone]){
  window.__BG_REFRESH[phone] = true;

  setTimeout(()=>{
    fetch(`https://raw.githubusercontent.com/Vidhwaan1/${phone}/main/data.json`)
      .then(r => {
        if(!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then(newData => {
        if(newData.version !== finalData.version){

          localStorage.setItem(CACHE_KEY, JSON.stringify({
            version: newData.version,
            data: newData
          }));

          window.__PROFILE_CACHE[phone] = newData;

          // ✅ optional UI refresh (safe)
          if(document.visibilityState === "visible"){
            renderPage(newData, page);
          }
        }
      })
      .catch(()=>{});
  }, 2000);
}
   
renderPage(finalData, page);



}catch(e){
document.body.innerHTML = "Error loading profile";
}

}


/* =========================
   ROUTE HANDLER
========================= */

function renderPage(data, page){

if(page === "gallery") return renderGallery(data);
if(page === "videos") return renderVideos(data);
if(page === "about") return renderAbout(data);
if(page === "business") return renderBusiness(data);

renderHome(data);

}


/* =========================
   COMMON NAV
========================= */

function slugify(str){
return str.toLowerCase().replace(/\s+/g,"-");
}

function nav(data){

const slug = `${data.firstName}${data.lastName}${data.phone}`.toLowerCase();

/* GEO PATH */
const geoPath = `
${slugify(data.location.state)}/
${slugify(data.location.district)}/
${slugify(data.location.subdistrict)}/
${slugify(data.location.village)}/
${slugify(data.profession)}/
${slug}
`.replace(/\n/g,"");

return `
<div style="margin-bottom:30px;display:flex;gap:16px;flex-wrap:wrap;">
<a href="/${geoPath}">Home</a>
<a href="/${geoPath}/gallery">Gallery</a>
<a href="/${geoPath}/videos">Videos</a>
<a href="/${geoPath}/business">Business</a>
<a href="/${geoPath}/about">About</a>
</div>
`;

}


/* =========================
   SEO HELPER
========================= */

function applySEO(title, description, data){

document.querySelectorAll("meta[name='description']").forEach(e=>e.remove());
document.querySelectorAll("meta[name='keywords']").forEach(e=>e.remove());
document.querySelectorAll("script[type='application/ld+json']").forEach(e=>e.remove());
document.querySelectorAll("link[rel='canonical']").forEach(e=>e.remove());
document.querySelectorAll("meta[property^='og:']").forEach(e=>e.remove());

const geo = `${data.location.village}, ${data.location.subdistrict}, ${data.location.district}, ${data.location.state}`;

const slug = `${data.firstName}${data.lastName}${data.phone}`.toLowerCase();
const canonicalUrl = `https://app.vidhwaan.com/${slug}`;

/* TITLE */
document.title = `Vidhwaan | ${data.firstName} ${data.lastName} | ${data.profession}`;

/* DESCRIPTION */
const meta = document.createElement("meta");
meta.name = "description";
meta.content = `${data.firstName} ${data.lastName} is a ${data.profession} based in ${geo}. Connect via Vidhwaan.`;
document.head.appendChild(meta);

/* KEYWORDS */
const keywords = document.createElement("meta");
keywords.name = "keywords";
keywords.content = `${data.profession}, ${data.firstName}, ${geo}, vidhwaan`;
document.head.appendChild(keywords);

/* ✅ CANONICAL (VERY IMPORTANT) */
const link = document.createElement("link");
link.rel = "canonical";
link.href = canonicalUrl;
document.head.appendChild(link);

/* ✅ OPEN GRAPH (SOCIAL + GOOGLE BOOST) */
const ogTitle = document.createElement("meta");
ogTitle.setAttribute("property","og:title");
ogTitle.content = `${data.firstName} ${data.lastName} | ${data.profession}`;
document.head.appendChild(ogTitle);

const ogDesc = document.createElement("meta");
ogDesc.setAttribute("property","og:description");
ogDesc.content = meta.content;
document.head.appendChild(ogDesc);

const ogUrl = document.createElement("meta");
ogUrl.setAttribute("property","og:url");
ogUrl.content = canonicalUrl;
document.head.appendChild(ogUrl);

const ogType = document.createElement("meta");
ogType.setAttribute("property","og:type");
ogType.content = "profile";
document.head.appendChild(ogType);

/* ✅ STRUCTURED DATA (ENHANCED) */
const script = document.createElement("script");
script.type = "application/ld+json";

script.innerHTML = JSON.stringify({
"@context":"https://schema.org",
"@type":"Person",
"name":`${data.firstName} ${data.lastName}`,
"url": canonicalUrl,
"jobTitle": data.profession,
"address":{
"@type":"PostalAddress",
"addressLocality": data.location.village,
"addressRegion": data.location.district,
"addressCountry": "IN"
}
});

document.head.appendChild(script);

}





function formatName(str){
return str.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase());
}


function extractPincode(village){
const match = village.match(/\d{6}$/);
return match ? match[0] : "";
}


function getVillageName(str){
return str.split("-")[0].replace(/\b\w/g,c=>c.toUpperCase());
}



function initSlider(slider){

  if(!slider || slider.__INIT) return;

  slider.__INIT = true;

  const slidesEl = slider.querySelector(".slides");
  const dotsEl = slider.querySelector(".dots");
  const total = slidesEl.children.length;

  let index = 0;
  let startX = 0;
  let isTouching = false;
  let interval = null;

  /* DOTS */
  dotsEl.innerHTML = "";

  for(let i = 0; i < total; i++){
    const d = document.createElement("div");
    if(i === 0) d.classList.add("active");

    d.onclick = ()=>{
      index = i;
      update();
    };

    dotsEl.appendChild(d);
  }

  const dots = dotsEl.children;

  function update(){
    slidesEl.style.transform = `translateX(-${index * 100}%)`;

    for(let i=0;i<dots.length;i++){
      dots[i].classList.toggle("active", i===index);
    }
  }

  function startAuto(){
    stopAuto();

    if(total <= 1) return;

    interval = setInterval(()=>{
      if(!isTouching){
        index = (index + 1) % total;
        update();
      }
    }, 6000);
  }

  function stopAuto(){
    if(interval){
      clearInterval(interval);
      interval = null;
    }
  }

  startAuto();

  /* TOUCH */
  slider.addEventListener("touchstart", e=>{
    isTouching = true;
    startX = e.touches[0].clientX;
    stopAuto();
  });

  slider.addEventListener("touchend", e=>{
    const diff = e.changedTouches[0].clientX - startX;

    if(diff > 50) index = Math.max(0, index - 1);
    else if(diff < -50) index = Math.min(total - 1, index + 1);

    update();
    isTouching = false;
    startAuto();
  });

  /* CLEANUP */
  const observer = new MutationObserver(()=>{
    if(!document.body.contains(slider)){
      stopAuto();
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList:true, subtree:true });
}

/* =========================
   HOME
========================= */

function renderHome(data){



const slug = `${data.firstName}${data.lastName}${data.phone}`
.toLowerCase()
.replace(/\s+/g,"");

applySEO(
`${data.firstName} ${data.lastName}`,
`${data.profession}`,
data
);


/* =========================
   HERO SLIDER (FINAL FIXED)
========================= */

const slides = data.slides || [];

const finalSlides = slides.length
  ? slides
  : Array(5).fill({ img: "", link: "" });

const sliderHTML = `
<div class="card" style="padding:0;overflow:hidden;">

  <div class="slider" id="slider">

    <div class="slides">

      ${finalSlides.map(s => `

        <div class="slide">

          ${
            s.img
            ? (
              s.link
                ? `<a href="${s.link}" target="_blank" rel="noopener noreferrer">
                     <img src="${s.img}" loading="lazy">
                   </a>`
                : `<img src="${s.img}" loading="lazy">`
            )
              : `<div class="empty-slide">
                   Contact support to add images
                 </div>`
          }

        </div>

      `).join("")}

    </div>

    <div class="dots"></div>

  </div>

</div>
`;

const profileUrl = window.location.href;

const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${profileUrl}`;

const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

let isInstalled = localStorage.getItem("PWA_INSTALLED") === "1";

/* 🔥 ONLY RESET IF USER REALLY UNINSTALLED */
if(!isStandalone && isInstalled){

  // wait small delay to confirm it's not install phase
  setTimeout(()=>{
    const stillStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if(!stillStandalone){
      localStorage.removeItem("PWA_INSTALLED");
    }
  }, 2000);
}
   
const content = `



<div class="hero">

<div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">

<!-- PROFILE IMAGE -->
<img src="${
  data.profileImage
    ? data.profileImage
    : `https://ui-avatars.com/api/?name=${data.firstName}+${data.lastName}&background=1e3a8a&color=fff&size=200`
}"
style="
border-radius:50%;
width:120px;
height:120px;
border:3px solid rgba(255,255,255,0.3);
box-shadow:0 0 40px rgba(59,130,246,0.6);
object-fit:cover;
">

<div>

<h1>${data.firstName} ${data.lastName}</h1>

<div class="badge">${data.profession}</div>

<!-- ❌ REMOVED SLUG ADDRESS -->

</div>

</div>

</div>


${sliderHTML}




<!-- ✅ ADDRESS BOX (NEW) -->
<div class="card">

<h3>Location</h3>

<p style="line-height:1.8;color:#cbd5f5;">

${getVillageName(data.location.village)} Village<br>
${formatName(data.location.subdistrict)} Mandal<br>
${formatName(data.location.district)} District<br>
${formatName(data.location.state)}<br>
India - ${extractPincode(data.location.village)}

</p>

</div>


<!-- CONTACT -->
<div class="card">

<h3>Contact</h3>

<p><b>Phone:</b> ${data.phone}</p>

</div>


<!-- QR SECTION (UPGRADED DOWNLOAD) -->
<div class="card" style="text-align:center;">

<h3 style="margin-bottom:5px;">Scan & Share</h3>

<p style="color:#94a3b8;font-size:13px;">
Instant profile access
</p>

<div style="
background:white;
padding:15px;
border-radius:16px;
display:inline-block;
margin-top:10px;
">

<img src="${qr}" style="width:180px;" id="qrImage">

</div>

<br><br>

<button id="downloadQRBtn"
data-name="${data.firstName} ${data.lastName}"
data-profession="${data.profession}"
data-url="${profileUrl}"
style="
background:#1e40af;
padding:10px 16px;
border-radius:8px;
color:white;
border:none;
cursor:pointer;
">
My QR Card
</button>

</div>




<!-- VIDHWAAN ECOSYSTEM -->
<div class="card">

<h3>My Ecosystem</h3>

<div style="display:flex;gap:10px;flex-wrap:wrap;">


<a href="/${slug}/gallery"
style="background:#1e40af;padding:10px 14px;border-radius:8px;color:white;text-decoration:none;">
Gallery
</a>

<a href="/${slug}/videos"
style="background:#f59e0b;padding:10px 14px;border-radius:8px;color:white;text-decoration:none;">
Videos
</a>

<a href="/${slug}/about"
style="background:#0ea5e9;padding:10px 14px;border-radius:8px;color:white;text-decoration:none;">
About
</a>

<a href="/${slug}/business"
style="background:#22c55e;padding:10px 14px;border-radius:8px;color:white;text-decoration:none;">
My Business
</a>

<a href="https://apps.vidhwaan.com" target="_blank"
style="background:#9333ea;padding:10px 14px;border-radius:8px;color:white;text-decoration:none;">
My Apps
</a>


</div>

</div>




${(!isStandalone && !isInstalled) ? `

<div class="card">

<h3>My App</h3>

<div style="display:flex;gap:10px;flex-wrap:wrap;">

<button id="installAppBtn"
style="background:#2563eb;padding:10px 14px;border-radius:8px;color:white;border:none;cursor:pointer;">
Download
</button>

</div>

</div>

` : ""}



<!-- QUICK ACTIONS -->
<div class="card">

<h3>Vidhwaan Support</h3>



<div style="display:flex;gap:10px;flex-wrap:wrap;">


<a href="https://wa.me/919440246101"
style="background:#22c55e;padding:10px 14px;border-radius:8px;color:white;text-decoration:none;">
WhatsApp
</a>

<a href="https://vidhwaan.com" target="_blank"
style="background:#9333ea;padding:10px 14px;border-radius:8px;color:white;text-decoration:none;">
Vidhwaan Group
</a>

</div>

</div>








`;

renderLayout(layout(data, content));



requestAnimationFrame(()=>{

initUI(data);

const slider = document.getElementById("slider");
initSlider(slider);



/* =========================
   PWA INIT (RUN ONCE)
========================= */

if(!window.__PWA_INIT){
  window.__PWA_INIT = true;

  window.addEventListener("beforeinstallprompt", (e)=>{
    e.preventDefault();
    window.__DEFERRED_PROMPT = e;
  });
}

/* 🔥 ADD EXACTLY HERE (STEP 2) */

if(!window.__PWA_INSTALLED_LISTENER){
  window.__PWA_INSTALLED_LISTENER = true;

  window.addEventListener("appinstalled", ()=>{
    localStorage.setItem("PWA_INSTALLED", "1");
  });
}



/* BUTTON */
const btnInstall = document.getElementById("installAppBtn");

if(btnInstall){
  btnInstall.onclick = async ()=>{
    const promptEvent = window.__DEFERRED_PROMPT;

    if(promptEvent){
      promptEvent.prompt(); // ✅ ONLY THIS
    }
  };
}



let link = document.querySelector("link[rel='manifest']");
if(!link){
  link = document.createElement("link");
  link.rel = "manifest";
  document.head.appendChild(link);
}

if("serviceWorker" in navigator && !window.__SW_REGISTERED){
  window.__SW_REGISTERED = true;
  navigator.serviceWorker.register("/sw.js");
}

   
/* 🔥 DYNAMIC PER USER */
link.href = `/manifest.json?name=${encodeURIComponent(data.firstName)}&start=${encodeURIComponent(window.location.pathname)}`;








   
   

const btn = document.getElementById("downloadQRBtn");

if(btn){
btn.onclick = function(){
downloadQR(
this.dataset.name,
this.dataset.profession,
this.dataset.url,
data.phone
);
};
}

});



}



function downloadQR(name, profession, url, phone){

const scale = 2;

const W = 600;
const H = 820;
const P = 30;

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

canvas.width = W * scale;
canvas.height = H * scale;

ctx.scale(scale, scale);

// ================= BACKGROUND =================
ctx.fillStyle = "#ffffff";
ctx.fillRect(0,0,W,H);

// ================= HEADER =================
ctx.textAlign = "center";
ctx.textBaseline = "middle";

ctx.fillStyle = "#0f172a";
ctx.font = "bold 30px Inter";
ctx.fillText("VIDHWAAN IDENTITY", W/2, 60);

// GOLD LINE
ctx.fillStyle = "#d4af37";
ctx.fillRect(P, 95, W - (P*2), 2);

// ================= NAME =================
ctx.fillStyle = "#111827";
ctx.font = "bold 34px Inter";
ctx.fillText(name, W/2, 155);

// ================= ROLE =================
ctx.fillStyle = "#2563eb";
ctx.font = "20px Inter";
ctx.fillText(profession, W/2, 195);

// ================= LAYOUT =================
const topEnd = 220;
const footerHeight = 180;
const availableHeight = H - topEnd - footerHeight;

const maxQR = W - (P * 2);
const qrSize = Math.min(maxQR * 0.78, availableHeight);

const qrX = (W - qrSize) / 2;
const qrY = topEnd;

// ================= QR BOX =================
ctx.beginPath();
ctx.roundRect(qrX, qrY, qrSize, qrSize, 22);
ctx.fillStyle = "#ffffff";
ctx.fill();

ctx.lineWidth = 2;
ctx.strokeStyle = "#d1d5db";
ctx.stroke();

// ================= FETCH QR =================
fetch(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${url}`)
  .then(res => {
    if(!res.ok) throw new Error("QR fetch failed");
    return res.blob();
  })
  .then(blob => {

const img = new Image();
img.src = URL.createObjectURL(blob);

img.onload = function(){

const innerPadding = 20;

ctx.drawImage(
img,
qrX + innerPadding,
qrY + innerPadding,
qrSize - (innerPadding*2),
qrSize - (innerPadding*2)
);

// ================= FOOTER =================
const footerY = qrY + qrSize + 25;

// ID NUMBER (authority tone)
ctx.fillStyle = "#374151";
ctx.font = "bold 16px Inter";
ctx.fillText(`VID-${phone}`, W/2, footerY);

// COMMUNITY (primary footer identity)
ctx.fillStyle = "#111827";
ctx.font = "bold 22px Inter";
ctx.fillText("Vidhwaan Group", W/2, footerY + 40);

// TAGLINE
ctx.fillStyle = "#4b5563";
ctx.font = "15px Inter";
ctx.fillText("Culture • Technology • Impact", W/2, footerY + 70);

// DIVIDER (refined)
ctx.fillStyle = "#1f2937";
ctx.fillRect(P + 60, footerY + 95, W - (P*2) - 120, 1);

// WEBSITE (strong visibility)
ctx.fillStyle = "#1d4ed8";
ctx.font = "bold 18px Inter";
ctx.fillText("www.vidhwaan.com", W/2, footerY + 125);

// ================= DOWNLOAD =================
const link = document.createElement("a");
link.download = `${name}-vidhwaan-id.png`;
link.href = canvas.toDataURL("image/png", 1.0);
link.click();

};

});

}






/* =========================
   BACK BUTTON (REUSABLE)
========================= */

function backButton(data){

  const slug = `${data.firstName}${data.lastName}${data.phone}`
    .toLowerCase()
    .replace(/\s+/g,"");

  return `
  <div style="margin-bottom:15px;">
    <a href="/${slug}"
    style="
      display:inline-flex;
      align-items:center;
      gap:6px;
      color:#60a5fa;
      text-decoration:none;
      font-weight:500;
      font-size:14px;
    ">
      ← Back
    </a>
  </div>
  `;
}




/* =========================
   GALLERY
========================= */

function renderGallery(data){

const images = data.gallery || [];

const content = `

${backButton(data)}

<h2>Gallery</h2>

<p style="color:#94a3b8;font-size:14px;margin-bottom:10px;">
Photos and event moments
</p>

<div class="grid">

${images.length ? images.map(img => `
<div class="card" style="padding:10px;">
  <div style="width:100%;aspect-ratio:1/1;overflow:hidden;border-radius:10px;">
    <img src="${img}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
  </div>
</div>
`).join("") : Array(5).fill("").map(() => `
<div class="card" style="padding:10px;">
  <div style="
    width:100%;
    aspect-ratio:1/1;
    display:flex;
    align-items:center;
    justify-content:center;
    background:rgba(255,255,255,0.03);
    border-radius:10px;
    color:#64748b;
    font-size:13px;">
    No Image
  </div>
</div>
`).join("")}

</div>

${!images.length ? `
<div class="card" style="text-align:center;color:#94a3b8;">
To add photos, please contact Vidhwaan support (details on home page).
</div>
` : ""}

`;

renderLayout(layout(data, content));

requestAnimationFrame(()=>{
initUI(data);
});

}


function getEmbedUrl(url){
if(!url) return "";

if(url.includes("youtu.be/")){
return "https://www.youtube.com/embed/" + url.split("youtu.be/")[1].split("?")[0];
}

if(url.includes("watch?v=")){
return "https://www.youtube.com/embed/" + url.split("watch?v=")[1].split("&")[0];
}

return url;
}


/* =========================
   VIDEOS
========================= */

function renderVideos(data){

const videos = data.videos || [];

const content = `

${backButton(data)}

<h2>Videos</h2>

<p style="color:#94a3b8;font-size:14px;margin-bottom:10px;">
Performance highlights and recordings
</p>

<div class="grid">

${videos.length ? videos.map(v => `
<div class="card" style="padding:10px;">
  <div style="position:relative;width:100%;padding-top:56.25%;">
    <iframe src="${getEmbedUrl(v)}" loading="lazy"
    style="position:absolute;top:0;left:0;width:100%;height:100%;"
    allowfullscreen></iframe>
  </div>
</div>
`).join("") : Array(5).fill("").map(() => `
<div class="card" style="padding:10px;">
  <div style="
    width:100%;
    aspect-ratio:16/9;
    display:flex;
    align-items:center;
    justify-content:center;
    background:rgba(255,255,255,0.03);
    border-radius:10px;
    color:#64748b;
    font-size:13px;">
    No Video
  </div>
</div>
`).join("")}

</div>

${!videos.length ? `
<div class="card" style="text-align:center;color:#94a3b8;">
To add videos, please contact Vidhwaan support (details on home page).
</div>
` : ""}

`;

renderLayout(layout(data, content));

requestAnimationFrame(()=>{
initUI(data);
});

}

/* =========================
   ABOUT
========================= */

function renderAbout(data){

const content = `

${backButton(data)}

<h2>About</h2>

<div class="card">

<p style="line-height:1.7;color:#cbd5f5;">

Hello, I am <b>${data.firstName} ${data.lastName}</b>.

I am currently living in 
<b>
${getVillageName(data.location.village)},
${formatName(data.location.subdistrict)},
${formatName(data.location.district)},
${formatName(data.location.state)}
</b>.

</p>

<p style="line-height:1.7;color:#cbd5f5;">

I am working as a <b>${data.profession}</b>.

I am passionate about my work and continuously striving to grow, improve, and create a better future through my profession.

</p>

<p style="line-height:1.7;color:#cbd5f5;">

Through Vidhwaan, I aim to connect, share, and build meaningful opportunities in my field and community.

</p>

</div>


<div class="card">

<h3>Professional Highlights</h3>

<ul style="color:#cbd5f5;line-height:1.8;padding-left:18px;">
${
  data.about
    ? data.about.split("\n").map(line => `<li>${line}</li>`).join("")
    : `
      <li>Professional Work & Experience</li>
      <li>Community Engagement</li>
      <li>Skill Development</li>
      <li>Open to Opportunities</li>
    `
}
</ul>

</div>


<div class="card">

<h3>Location</h3>

<p style="color:#cbd5f5;">
${getVillageName(data.location.village)} Village<br>
${formatName(data.location.subdistrict)} Mandal<br>
${formatName(data.location.district)} District<br>
${formatName(data.location.state)}<br>
India - ${extractPincode(data.location.village)}
</p>

</div>


<div class="card">

<h3>Social Media</h3>

<div style="display:flex;gap:10px;flex-wrap:wrap;">

${
  (data.social && data.social.length)
    ? data.social.map(s => {
        let color = "#1e40af";

        if(s.name.toLowerCase().includes("youtube")) color = "#ef4444";
        else if(s.name.toLowerCase().includes("instagram")) color = "#e1306c";
        else if(s.name.toLowerCase().includes("facebook")) color = "#1877f2";
        else if(s.name.toLowerCase().includes("twitter")) color = "#1da1f2";
        else if(s.name.toLowerCase().includes("whatsapp")) color = "#22c55e";
        else if(s.name.toLowerCase().includes("linkedin")) color = "#0a66c2";

        return `
        <a href="${s.url}" target="_blank"
        style="
          background:${color};
          padding:10px 14px;
          border-radius:8px;
          color:white;
          text-decoration:none;
        ">
          ${s.name}
        </a>
        `;
      }).join("")
    : `<span style="color:#94a3b8;">No social links added-contact support to add</span>`
}

</div>

</div>

`;

renderLayout(layout(data, content));
   
requestAnimationFrame(()=>{
initUI(data);
});

}


function initUI(data){

const btn = document.getElementById("menuBtn");
const menu = document.getElementById("mobileMenu");

/* ===== MOBILE MENU ===== */
if(btn && menu){

btn.onclick = (e)=>{
e.stopPropagation();

const isOpen = menu.classList.toggle("active");

/* sync hamburger animation */
if(isOpen){
btn.classList.add("active");
}else{
btn.classList.remove("active");
}
};

}


/* ===== CLOSE ON OUTSIDE CLICK ===== */
if(!window.__NAV_INIT){
window.__NAV_INIT = true;

document.addEventListener("click",(e)=>{
if(menu && btn && !menu.contains(e.target) && !btn.contains(e.target)){
menu.classList.remove("active");
btn.classList.remove("active");
}
});

}

/* ===== NAVIGATION ===== */

const slug = `${data.firstName}${data.lastName}${data.phone}`
.toLowerCase()
.replace(/\s+/g,"");

const base = `/${slug}`;

const routes = {
navHome: base,
navGallery: `${base}/gallery`,
navVideos: `${base}/videos`,
navBusiness: `${base}/business`,
navAbout: `${base}/about`,
mNavHome: base,
mNavGallery: `${base}/gallery`,
mNavVideos: `${base}/videos`,
mNavBusiness: `${base}/business`,
mNavAbout: `${base}/about`
};

Object.entries(routes).forEach(([id, url])=>{
const el = document.getElementById(id);
if(!el) return;

el.onclick = (e)=>{
e.preventDefault();

/* CLOSE MENU */
menu.classList.remove("active");
btn.classList.remove("active");

/* ROUTE */
history.pushState({}, "", url);
initRouter();
};
});

}




function renderBusiness(data){



/* =========================
   SLIDER (REUSE)
========================= */

const slides = data.business?.slides || [];

const finalSlides = slides.length
  ? slides
  : Array(5).fill({ img: "", link: "" });

const sliderHTML = `
<div class="card" style="padding:0;overflow:hidden;margin-bottom:15px;">

  <div class="slider" id="slider">

    <div class="slides">

      ${finalSlides.map(s => `

        <div class="slide">

          ${
            s.img
            ? (
              s.link
                ? `<a href="${s.link}" target="_blank" rel="noopener noreferrer">
                     <img src="${s.img}" loading="lazy">
                   </a>`
                : `<img src="${s.img}" loading="lazy">`
            )
            : `<div class="empty-slide">
                 Contact support to add images
               </div>`
          }

        </div>

      `).join("")}

    </div>

    <div class="dots"></div>

  </div>

</div>
`;


const searchHTML = `
<div class="card" style="padding:12px;margin-bottom:15px;">

  <input
    id="businessSearch"
    placeholder="Search items..."
    style="
      width:100%;
      height:44px;
      border-radius:12px;
      border:1px solid rgba(148,163,184,0.2);
      background:rgba(255,255,255,0.05);
      color:white;
      padding:0 14px;
      outline:none;
      font-size:14px;
      box-sizing:border-box;
    "
  />

</div>
`;


/* =========================
   CATEGORIES
========================= */

const categories = data.business?.categories || [];

const finalCategories = categories.length
  ? categories
  : Array(5).fill(0).map((_,i)=>({
      name: `Category ${i+1}`,
      img: ""
    }));

const categoryHTML = `
<div class="card" style="padding:10px;margin-bottom:15px;">

  <div style="
    display:flex;
    gap:12px;
    overflow-x:auto;
    padding-bottom:5px;
  " id="categoryScroll">

    ${finalCategories.map((c,i)=>`

      <div class="category-item"
        data-index="${i}"
        style="
          min-width:90px;
          text-align:center;
          cursor:pointer;
        "
      >

        <div style="
          width:70px;
          height:70px;
          border-radius:50%;
          overflow:hidden;
          margin:auto;
          background:rgba(255,255,255,0.05);
        ">

          ${
            c.img
            ? `<img src="${c.img}" style="width:100%;height:100%;object-fit:cover;">`
            : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-size:11px;">No Image</div>`
          }

        </div>

        <div style="
          margin-top:6px;
          font-size:12px;
          color:#cbd5f5;
        ">
          ${c.name}
        </div>

      </div>

    `).join("")}

  </div>

</div>
`;


/* =========================
   ITEMS GRID
========================= */

const itemHTML = `
<div id="itemsContainer"></div>
`;




const cartHTML = `
<div id="cartBar" style="
  position:fixed;
  bottom:0;
  left:0;
  width:100%;
  background:#020617;
  border-top:1px solid rgba(148,163,184,0.2);
  padding:12px;
  display:none;
  z-index:999;
  backdrop-filter: blur(10px);
">

  <div style="
    max-width:1200px;
    margin:auto;
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:10px;
    flex-wrap:wrap;
  ">

    <div>
      <div id="cartTotal" style="font-weight:600;">₹0</div>
      <div id="cartCount" style="font-size:12px;color:#94a3b8;">0 items</div>
    </div>

    <button id="cartProceed"
    style="
      background:#facc15;
      color:black;
      padding:12px 18px;
      border-radius:999px;
      border:none;
      font-weight:600;
      cursor:pointer;
      width:100%;
      max-width:180px;
    ">
      Proceed
    </button>

  </div>

</div>

`;

const content = `

${backButton(data)}

<h2>My Business</h2>

${sliderHTML}

${searchHTML}

${categoryHTML}
${itemHTML}
${cartHTML}

`;


   

renderLayout(layout(data, content));

requestAnimationFrame(()=>{
initUI(data);

const slider = document.getElementById("slider");
initSlider(slider);






   
/* =========================
   CATEGORY SELECT
========================= */

const cats = document.querySelectorAll(".category-item");

cats.forEach((el,i)=>{
  el.onclick = ()=>{

    /* REMOVE OLD ACTIVE */
    cats.forEach(c=>{
      c.style.opacity = "0.6";
      c.classList.remove("active");   // ✅ ADD THIS
    });

    /* SET NEW ACTIVE */
    el.style.opacity = "1";
    el.classList.add("active");       // ✅ ADD THIS

    window.__SELECTED_CATEGORY = i;

    renderItems(i);
  };
});

/* =========================
   DEFAULT CATEGORY LOAD (ULTRA STABLE)
========================= */

if(cats.length){

  window.__SELECTED_CATEGORY = 0;

  const container = document.getElementById("itemsContainer");

  /* 🔥 SKELETON FIRST */
  if(container){
    container.innerHTML = `
    <div class="grid">
      ${Array(6).fill(0).map(()=>`
        <div class="card" style="padding:10px;">
          <div class="skeleton" style="aspect-ratio:1/1;border-radius:10px;"></div>
          <div class="skeleton" style="height:14px;margin-top:8px;"></div>
          <div class="skeleton" style="height:12px;margin-top:6px;width:60%;"></div>
        </div>
      `).join("")}
    </div>
    `;
  }

  /* 🔥 DOUBLE FRAME RENDER (NO FLASH) */
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{

      renderItems(0);

      cats.forEach(c=>{
        c.style.opacity = "0.6";
        c.classList.remove("active");
      });

      cats[0].style.opacity = "1";
      cats[0].classList.add("active");

    });
  });
}


/* =========================
   ITEMS ENGINE
========================= */

const allCategories = data.business?.categories || [];

function getFinalCategories(){
  if(allCategories.length) return allCategories;

  // placeholders
  return Array(5).fill(0).map((_,ci)=>({
    name:`Category ${ci+1}`,
    img:"",
    items: Array(5).fill(0).map((_,ii)=>({
      name:`Item ${ii+1}`,
      img:"",
      price:1,
      weight:"1 pc"
    }))
  }));
}

const finalCats = getFinalCategories();

/* GLOBAL CART */
window.__CART = window.__CART || {};

function renderItems(catIndex){

  const container = document.getElementById("itemsContainer");
  if(!container) return;

  const cat = finalCats[catIndex] || finalCats[0];
  const items = cat.items || [];

  requestAnimationFrame(()=>{

    container.innerHTML = `
    <div class="grid">

    ${items.map((item,i)=>{

      const key = `${catIndex}_${i}`;
      const qty = window.__CART[key]?.qty || 0;

      return `

      <div class="card item-card" style="padding:10px;">

        <div style="
          aspect-ratio:1/1;
          border-radius:10px;
          overflow:hidden;
          background:#0f172a;
        ">

          ${
            item.img
            ? `<img src="${item.img}" loading="lazy"
                 onload="this.style.opacity=1"
                 style="width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .4s ease;">`
            : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;">No Image</div>`
          }

        </div>

        <div style="margin-top:8px;font-weight:600;font-size:14px;">
          ${item.name}
        </div>

        <div style="font-size:12px;color:#94a3b8;">
          ${item.weight || ""}
        </div>

        <div style="margin-top:5px;font-weight:600;">
          ₹${item.price}
        </div>

        <div style="
          margin-top:8px;
          display:flex;
          justify-content:center;
          align-items:center;
          gap:8px;
        ">

          <button class="dec" data-key="${key}">−</button>
          <div>${qty}</div>
          <button class="inc" data-key="${key}">+</button>

        </div>

      </div>

      `;
    }).join("")}

    </div>
    `;

    /* 🔥 FADE-IN */
    requestAnimationFrame(()=>{
      document.querySelectorAll(".item-card").forEach((el,i)=>{
        setTimeout(()=>{
          el.classList.add("show");
        }, i * 40);
      });
    });

    bindCartEvents();
    updateCartBar();

  });
}

/* =========================
   CART BUTTON EVENTS
========================= */

function bindCartEvents(){

  document.querySelectorAll(".inc").forEach(btn=>{
    btn.onclick = ()=>{
      const key = btn.dataset.key;

      if(!window.__CART[key]){
        window.__CART[key] = { qty:0 };
      }

      window.__CART[key].qty++;
      renderItems(window.__SELECTED_CATEGORY || 0);
      updateCartBar();
    };
  });

  document.querySelectorAll(".dec").forEach(btn=>{
    btn.onclick = ()=>{
      const key = btn.dataset.key;

      if(window.__CART[key]){
        window.__CART[key].qty--;
        if(window.__CART[key].qty <= 0){
          delete window.__CART[key];
        }
      }

      renderItems(window.__SELECTED_CATEGORY || 0);
      updateCartBar();
    };
  });

}




/* =========================
   CART UPDATE
========================= */

function updateCartBar(){

  const bar = document.getElementById("cartBar");
  const totalEl = document.getElementById("cartTotal");
  const countEl = document.getElementById("cartCount");

  let total = 0;
  let count = 0;

  Object.entries(window.__CART).forEach(([key,val])=>{
    const [catIndex,itemIndex] = key.split("_").map(Number);

    const item = finalCats[catIndex]?.items?.[itemIndex];
    if(!item) return;

    total += item.price * val.qty;
    count += val.qty;
  });

  if(count === 0){
    bar.style.display = "none";
    return;
  }

  bar.style.display = "block";

  totalEl.innerText = `₹${total}`;
  countEl.innerText = `${count} items`;
}


/* =========================
   WHATSAPP ORDER
========================= */

const proceedBtn = document.getElementById("cartProceed");

if(proceedBtn){

  proceedBtn.onclick = ()=>{

    let message = `🛒 *New Order Request*\n`;
    message += `━━━━━━━━━━━━━━━\n\n`;

    let total = 0;
    let count = 0;

    Object.entries(window.__CART).forEach(([key,val],index)=>{

      const [catIndex,itemIndex] = key.split("_").map(Number);
      const item = finalCats[catIndex]?.items?.[itemIndex];

      if(!item) return;

      const price = item.price * val.qty;
      total += price;
      count += val.qty;

      message += `${index+1}. *${item.name}*\n`;
      message += `   Qty: ${val.qty}\n`;
      message += `   Price: ₹${item.price}\n`;
      message += `   Total: ₹${price}\n\n`;
    });

    message += `━━━━━━━━━━━━━━━\n`;
    message += `🧾 Items: ${count}\n`;
    message += `💰 Total: ₹${total}\n`;
    message += `━━━━━━━━━━━━━━━\n\n`;


    const url = `https://wa.me/91${data.phone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");

  };

}



function renderFilteredItems(filteredCats){

  const container = document.getElementById("itemsContainer");
  if(!container) return;

  let html = "";

  filteredCats.forEach((cat,catIndex)=>{

    if(!cat.items || !cat.items.length) return;

    html += `
    <div style="margin-bottom:15px;">
      <h3 style="margin:10px 0;">${cat.name}</h3>
      <div class="grid">
    `;

    cat.items.forEach((item,i)=>{

      const key = `${catIndex}_${i}`;
      const qty = window.__CART[key]?.qty || 0;

      html += `
      <div class="card" style="padding:10px;">

        <!-- IMAGE -->
        <div style="
          aspect-ratio:1/1;
          border-radius:10px;
          overflow:hidden;
          background:rgba(255,255,255,0.05);
        ">
          ${
            item.img
            ? `<img src="${item.img}" style="width:100%;height:100%;object-fit:cover;">`
            : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;">No Image</div>`
          }
        </div>

        <!-- NAME -->
        <div style="margin-top:8px;font-weight:600;font-size:14px;">
          ${item.name}
        </div>

        <!-- WEIGHT -->
        <div style="font-size:12px;color:#94a3b8;">
          ${item.weight || ""}
        </div>

        <!-- PRICE -->
        <div style="margin-top:5px;font-weight:600;">
          ₹${item.price}
        </div>

        <!-- QUANTITY -->
        <div style="
          margin-top:8px;
          display:flex;
          justify-content:center;
          align-items:center;
          gap:8px;
        ">

          <button class="dec" data-key="${key}">−</button>

          <div>${qty}</div>

          <button class="inc" data-key="${key}">+</button>

        </div>

      </div>
      `;
    });

    html += `
      </div>
    </div>
    `;

  });

  container.innerHTML = html;

  /* 🔥 VERY IMPORTANT */
  bindCartEvents();
  updateCartBar();
}




const searchInput = document.getElementById("businessSearch");

if(searchInput){

  searchInput.oninput = ()=>{

    const q = searchInput.value.toLowerCase().trim();

    if(!q){
      renderItems(window.__SELECTED_CATEGORY || 0);
      return;
    }

    const filtered = finalCats.map(cat=>{

      const matchedItems = (cat.items || []).filter(item=>
        item.name.toLowerCase().includes(q) ||
        (item.weight || "").toLowerCase().includes(q) ||
        cat.name.toLowerCase().includes(q)
      );

      return {
        ...cat,
        items: matchedItems
      };

    });

    renderFilteredItems(filtered);

  };

}
});  
} 

   
/* =========================
   GLOBAL SPA ROUTER (WORLD CLASS)
========================= */

if(!window.__SPA_ROUTER){

  window.__SPA_ROUTER = true;

  document.addEventListener("click", (e)=>{

    const link = e.target.closest("a");

    if(!link) return;

    const href = link.getAttribute("href");

    // ignore external links
    if(!href || href.startsWith("http") || link.target === "_blank") return;

    // ignore anchors
    if(href.startsWith("#")) return;

    e.preventDefault();

    history.pushState({}, "", href);
    initRouter();

  });

}

                  
