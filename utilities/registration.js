

export async function loadRegistration(){

const html = `

<section class="section" id="registration">

<div class="container" style="max-width:520px;margin:auto;">

<h2 style="
text-align:center;
font-size:26px;
margin-bottom:25px;
font-weight:600;
">
Register as Success Partner
</h2>


<div class="card">

<div class="form-group">

<div class="field"><select id="state"></select></div>
<div class="field"><select id="district"></select></div>
<div class="field"><select id="subdistrict"></select></div>
<div class="field"><select id="village"></select></div>

<div class="field"><input id="firstName" placeholder="First Name"></div>
<div class="field"><input id="lastName" placeholder="Last Name"></div>
<div class="field"><input id="phone" placeholder="Mobile Number"></div>

<div class="field">
<select id="profession">
<option value="">Select Profession</option>

<!-- General -->
<option>Vidhwaan</option>
<option>Student</option>
<option>Job Seeker</option>
<option>Self Employed</option>
<option>Freelancer</option>

<!-- Business -->
<option>Business Owner</option>
<option>Shop Owner</option>
<option>Startup Founder</option>

<!-- Agriculture -->
<option>Farmer</option>
<option>Dairy Farmer</option>

<!-- Skilled Workers -->
<option>Electrician</option>
<option>Plumber</option>
<option>Carpenter</option>
<option>Mechanic</option>
<option>Driver</option>

<!-- Professionals -->
<option>Teacher</option>
<option>Doctor</option>
<option>Engineer</option>
<option>Lawyer</option>
<option>Accountant</option>

<!-- Creative -->
<option>Artist</option>
<option>Musician</option>
<option>Photographer</option>
<option>Video Creator</option>

<!-- Tech -->
<option>Software Developer</option>
<option>Designer</option>
<option>Digital Marketer</option>

<!-- Others -->
<option>Housewife</option>
<option>Retired</option>
<option>Other</option>

</select>
</div>

<button class="btn btn-primary" style="margin-top:16px;width:100%;" onclick="registerUser()">
Register
</button>

<div id="result" style="margin-top:12px;text-align:center;"></div>

</div>

</div>

</section>

`;

document.getElementById("registration").innerHTML = html;

document.getElementById("state").innerHTML =
  `<option>Loading states...</option>`;

/* LOAD GEO */
await loadGeo();

/* INIT DROPDOWN */
initState();

}


/* =========================
   LOAD JSON DATA
========================= */

let GEO = null;
const STATE_CACHE = {};

async function loadGeo(){
  if(GEO) return;

  const res = await fetch("./geo/states.v1.json");
  GEO = await res.json();

  console.log("⚡ STATES LOADED");
}


/* =========================
   STATE
========================= */

function initState(){

const el = document.getElementById("state");

el.innerHTML = `<option value="" disabled selected>Select State</option>`;

Object.keys(GEO).forEach(key=>{
el.innerHTML += `<option value="${key}">${GEO[key].name}</option>`;
});

el.onchange = () => loadDistrict(el.value);

}


/* =========================
   DISTRICT
========================= */

async function loadDistrict(stateKey){

const el = document.getElementById("district");

if(!stateKey){
  el.innerHTML = `<option value="" disabled selected>Select District</option>`;
  document.getElementById("subdistrict").innerHTML = `<option value="">Select Subdistrict</option>`;
  document.getElementById("village").innerHTML = `<option value="">Select Village</option>`;
  return;
}

el.innerHTML = `<option>Loading...</option>`;
el.disabled = true;

/* RESET */
document.getElementById("subdistrict").innerHTML = `<option value="">Select Subdistrict</option>`;
document.getElementById("village").innerHTML = `<option value="">Select Village</option>`;

/* 1. GEO */
if(GEO[stateKey]?.districts){
  renderDistrict(GEO[stateKey]);
  el.disabled = false;
  return;
}

/* 2. CACHE */
if(STATE_CACHE[stateKey]){
  renderDistrict(STATE_CACHE[stateKey]);
  GEO[stateKey] = STATE_CACHE[stateKey];
  el.disabled = false;
  return;
}

/* 3. FETCH */
try {
  const res = await fetch(`./geo/${stateKey}.v1.json`);
  const data = await res.json();

  STATE_CACHE[stateKey] = data;
  GEO[stateKey] = data;

  renderDistrict(data);

} catch(e){
  el.innerHTML = `<option>Failed to load</option>`;
}

el.disabled = false;

/* 🔥 PREFETCH */
const idle = window.requestIdleCallback || function(fn){ setTimeout(fn, 1); };

if(!window.__PREFETCH_DONE){
  window.__PREFETCH_DONE = true;

  idle(() => {
    const keys = Object.keys(GEO || {}).slice(0,2);

    keys.forEach(s=>{
      if(!STATE_CACHE[s]){
        fetch(`./geo/${s}.v1.json`)
          .then(r=>r.json())
          .then(d=>{
            STATE_CACHE[s] = d;
          })
          .catch(()=>{});
      }
    });
  });
}
}



function renderDistrict(stateData){

const el = document.getElementById("district");

let html = `<option value="" disabled selected>Select District</option>`;

for(const key in stateData.districts){
  html += `<option value="${key}">
    ${stateData.districts[key].name}
  </option>`;
}

el.innerHTML = html;

el.onchange = () => loadSubdistrict(
  document.getElementById("state").value,
  el.value
);

}



/* =========================
   SUBDISTRICT
========================= */

function loadSubdistrict(stateKey, districtKey){

const el = document.getElementById("subdistrict");
el.innerHTML = `<option value="" disabled selected>Select Subdistrict</option>`;

if(!districtKey) return;

const subs = GEO[stateKey]?.districts?.[districtKey]?.subdistricts || {};

Object.keys(subs).forEach(key=>{
el.innerHTML += `<option value="${key}">${subs[key].name}</option>`;
});

el.onchange = () => loadVillage(stateKey, districtKey, el.value);

}


/* =========================
   VILLAGE
========================= */

function loadVillage(stateKey, districtKey, subKey){

const el = document.getElementById("village");

if(!subKey){
  el.innerHTML = `<option value="" disabled selected>Select Village</option>`;
  return;
}

const villages =
GEO[stateKey]?.districts?.[districtKey]?.subdistricts?.[subKey]?.villages || [];

el.innerHTML = `<option value="" disabled selected>Select Village</option>`;

const CHUNK = 300;
let i = 0;

function renderChunk(){

  let part = "";
  let end = Math.min(i + CHUNK, villages.length);

  for(; i < end; i++){
    const v = villages[i];
    part += `<option value="${v.slug}">
      ${v.name} (${v.pincode})
    </option>`;
  }

  el.insertAdjacentHTML("beforeend", part);

  if(i < villages.length){
    requestAnimationFrame(renderChunk);
  }
}

renderChunk();
}
