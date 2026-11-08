// Modul Skenovanie v popise triedy V (Michal 7. 11. 2026: „použi aj STL z PC ako nejaký modul v popisoch“): skutočný sken V Class XL ako
// 3D model, ktorý si zákazník otáča prstom alebo myšou. Zdroj: oba STL v Desktop/LCD/skeny aut spojené a zmenšené na ~86 000 plôšok,
// súbor assets/img/1v/mercedes-v-class-sken-2.bin (hlavička nv, nt, min xyz, mierka; potom Uint16 polohy a indexy). Stiahne sa až pri
// priblížení k sekcii. Bez WebGL alebo pri chybe ostáva v stránke obrázok z HTML, preto o tom zákazník nevie.
import { t } from "./trh.js";

const SUBOR = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/1v/mercedes-v-class-sken-2.bin";
const VS = `attribute vec3 p;attribute vec3 n;uniform mat4 M;uniform mat4 V;varying vec3 vn;varying vec3 vp;varying vec3 vw;
void main(){vec4 w=M*vec4(p,1.);vw=w.xyz;vp=p;vn=mat3(M[0].xyz,M[1].xyz,M[2].xyz)*n;gl_Position=V*w;}`;
const FS = `precision highp float;varying vec3 vn;varying vec3 vp;varying vec3 vw;uniform float rez;uniform vec3 oko;
void main(){if(vp.x>rez)discard;vec3 n=normalize(vn);vec3 e=normalize(oko-vw);if(dot(n,e)<0.)n=-n;
vec3 l=normalize(vec3(.75,.42,.3));float d=max(dot(n,l),0.);float d2=max(dot(n,normalize(vec3(-.55,.5,-.6))),0.);float t=max(n.y,0.);
vec3 h=normalize(l+e);float s=pow(max(dot(n,h),0.),28.);float r=pow(1.-max(dot(n,e),0.),2.5);
vec3 c=vec3(.62,.49,.2)*(.12+.28*t+1.25*d*d+.35*d2)+vec3(1.,.86,.55)*s*.55+vec3(.9,.72,.35)*r*.4;
vec2 m=fract(vp.xz*9.);float k=max(step(.975,m.x),step(.975,m.y));c+=vec3(.5,.4,.16)*k*.22;
float g=smoothstep(.04,0.,rez-vp.x);c=mix(c,vec3(1.,.94,.72),g*.9);gl_FragColor=vec4(c,1.);}`;

function nasob(a, b) {
  const o = new Float32Array(16);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) o[j * 4 + i] = a[i] * b[j * 4] + a[i + 4] * b[j * 4 + 1] + a[i + 8] * b[j * 4 + 2] + a[i + 12] * b[j * 4 + 3];
  return o;
}
const perspektiva = (f, a, n, d) => { const t = 1 / Math.tan(f / 2); return new Float32Array([t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (d + n) / (n - d), -1, 0, 0, (2 * d * n) / (n - d), 0]); };
const rotY = (u) => { const c = Math.cos(u), s = Math.sin(u); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); };
const rotX = (u) => { const c = Math.cos(u), s = Math.sin(u); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); };
const posun = (z) => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, z, 1]);

/** Polohy aj normály z balíka: x dĺžka auta, y výška, z šírka, stred v nule, dĺžka auta -1 až 1. Sken má os výšky opačne, preto otočenie o 180° okolo dĺžky auta. */
export function nacitajModel(buf) {
  const dv = new DataView(buf);
  const nv = dv.getUint32(0, true), nt = dv.getUint32(4, true);
  const q = new Uint16Array(buf, 24, nv * 3);
  const idx = new Uint16Array(buf, 24 + nv * 6, nt * 3);
  const mi = [65535, 65535, 65535], ma = [0, 0, 0];
  for (let i = 0; i < nv * 3; i++) { const k = i % 3; if (q[i] < mi[k]) mi[k] = q[i]; if (q[i] > ma[k]) ma[k] = q[i]; }
  const sk = 2 / (ma[0] - mi[0]);
  const data = new Float32Array(nv * 6);
  for (let i = 0; i < nv; i++) {
    data[i * 6] = (q[i * 3] - (mi[0] + ma[0]) / 2) * sk;
    data[i * 6 + 1] = -(q[i * 3 + 2] - (mi[2] + ma[2]) / 2) * sk;
    data[i * 6 + 2] = -(q[i * 3 + 1] - (mi[1] + ma[1]) / 2) * sk;
  }
  for (let t = 0; t < nt; t++) {
    const a = idx[t * 3] * 6, b = idx[t * 3 + 1] * 6, c = idx[t * 3 + 2] * 6;
    const ux = data[b] - data[a], uy = data[b + 1] - data[a + 1], uz = data[b + 2] - data[a + 2];
    const vx = data[c] - data[a], vy = data[c + 1] - data[a + 1], vz = data[c + 2] - data[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    [a, b, c].forEach((o) => { data[o + 3] += nx; data[o + 4] += ny; data[o + 5] += nz; });
  }
  return { data, idx, nt };
}

/** Pohľad do miesta `.vk-3d`. Vráti funkciu na zrušenie, alebo null, keď prehliadač WebGL nemá. */
export function pohlad(miesto, model) {
  const c = document.createElement("canvas");
  c.className = "vk-gl";
  c.setAttribute("role", "img");
  c.setAttribute("aria-label", t("3D sken podlahy Mercedes V Class XL, potiahnutím ho otočíte"));
  const gl = c.getContext("webgl", { antialias: true, alpha: true });
  if (!gl) return null;
  const shader = (t, z) => { const s = gl.createShader(t); gl.shaderSource(s, z); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, shader(gl.VERTEX_SHADER, VS));
  gl.attachShader(pr, shader(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, model.data, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.idx, gl.STATIC_DRAW);
  [["p", 0], ["n", 12]].forEach(([m, o]) => { const a = gl.getAttribLocation(pr, m); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 3, gl.FLOAT, false, 24, o); });
  const u = {};
  ["M", "V", "rez", "oko"].forEach((m) => { u[m] = gl.getUniformLocation(pr, m); });
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  const pokoj = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  let yaw = -0.5, pitch = 0.8, rez = pokoj ? 2 : -1.15, tocit = !pokoj, plan = 0, vidno = false, tah = null, t0 = 0, zrusene = false;
  const DL = 3.1;
  function velkost() {
    const r = c.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; gl.viewport(0, 0, w, h); }
  }
  function kresli() {
    velkost();
    const a = c.width / c.height, d = 2.9 + 1.25 * Math.abs(Math.sin(yaw)) + (a < 1.2 ? 1 : 0); // auto je dlhé: spredu ho treba oddialiť
    const V = nasob(nasob(perspektiva(0.55, a, 0.1, 20), posun(-d)), rotX(pitch));
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(u.M, false, rotY(yaw));
    gl.uniformMatrix4fv(u.V, false, V);
    gl.uniform1f(u.rez, rez);
    gl.uniform3f(u.oko, 0, Math.sin(pitch) * d, Math.cos(pitch) * d);
    gl.drawElements(gl.TRIANGLES, model.nt * 3, gl.UNSIGNED_SHORT, 0);
  }
  function krok(t) {
    plan = 0;
    if (zrusene || !vidno) return;
    const dt = t0 ? Math.min(0.05, (t - t0) / 1000) : 0;
    t0 = t;
    if (rez < 2) rez += (2.3 * dt) / (DL / 1.6);
    if (tocit && !tah) yaw += dt * 0.14;
    kresli();
    if ((tocit && !tah) || rez < 2) plan = requestAnimationFrame(krok);
  }
  const bez = () => { if (!plan && vidno) { t0 = 0; plan = requestAnimationFrame(krok); } };
  const stiskni = (e) => { tah = { x: e.clientX, y: e.clientY }; tocit = false; c.setPointerCapture && c.setPointerCapture(e.pointerId); c.classList.add("vk-tah"); };
  const pohni = (e) => {
    if (!tah) return;
    yaw += (e.clientX - tah.x) * 0.008;
    pitch = Math.min(1.4, Math.max(0.15, pitch + (e.clientY - tah.y) * 0.005));
    tah = { x: e.clientX, y: e.clientY };
    kresli();
  };
  const pusti = () => { tah = null; c.classList.remove("vk-tah"); };
  c.addEventListener("pointerdown", stiskni);
  c.addEventListener("pointermove", pohni);
  c.addEventListener("pointerup", pusti);
  c.addEventListener("pointercancel", pusti);
  const hint = document.createElement("span");
  hint.className = "vk-hint";
  hint.textContent = t("Potiahnutím sken otočíte");
  miesto.appendChild(c);
  miesto.appendChild(hint);
  miesto.classList.add("vk-zive");
  const io = new IntersectionObserver((z) => { vidno = z[0].isIntersecting; if (vidno) bez(); });
  io.observe(miesto);
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => { if (vidno && !plan) kresli(); }) : null;
  if (ro) ro.observe(miesto);
  return () => {
    zrusene = true;
    cancelAnimationFrame(plan);
    io.disconnect();
    if (ro) ro.disconnect();
    [c, hint].forEach((x) => { if (x.parentNode) x.parentNode.removeChild(x); });
    miesto.classList.remove("vk-zive");
  };
}

/** Oživí sekciu: model sa stiahne až pri priblížení, ostatní návštevníci ho neplatia. */
export function sken(sek, spat) {
  const miesto = sek.querySelector(".vk-3d");
  if (!miesto || typeof IntersectionObserver !== "function") return;
  let zrus = null, koniec = false;
  const io = new IntersectionObserver((z) => {
    if (!z[0].isIntersecting) return;
    io.disconnect();
    fetch(SUBOR).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer(); })
      .then((b) => { if (!koniec) zrus = pohlad(miesto, nacitajModel(b)); })
      .catch((e) => console.warn("[lcd-1v] vclass sken", e)); // ostáva obrázok
  }, { rootMargin: "400px" });
  io.observe(miesto);
  spat.push(() => { koniec = true; io.disconnect(); if (zrus) zrus(); });
}
