// Lokálny build pre test one page checkoutu (tools/test-opc.mjs) — rovnaké prepínače ako .github/workflows/production.yml
// a ako tools/test-konfigurator-1v.mjs (priprav): esbuild assets/js/main.js + samostatné časti lcd-*.js a CSS z
// tools/vloz-lcd-css.py --vystup. Všetko do dočasného priečinka behu, repo ostane nezmenené.
// esbuild: node_modules/@esbuild/<platforma> (na Windows junction / inštalácia win32-x64), ESBUILD_BINARY_PATH, inak npx.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function esbuild() {
  if (process.env.ESBUILD_BINARY_PATH && existsSync(process.env.ESBUILD_BINARY_PATH)) return { cmd: process.env.ESBUILD_BINARY_PATH, pred: [], shell: false };
  const plat = process.platform + "-" + process.arch;
  const bin = join(KOREN, "node_modules", "@esbuild", plat, process.platform === "win32" ? "esbuild.exe" : "bin/esbuild");
  if (existsSync(bin)) return { cmd: bin, pred: [], shell: false };
  const ver = JSON.parse(readFileSync(join(KOREN, "node_modules/esbuild/package.json"), "utf8")).version;
  return { cmd: process.platform === "win32" ? "npx.cmd" : "npx", pred: ["--yes", "esbuild@" + ver], shell: process.platform === "win32", mimoRepa: true };
}

function python() {
  for (const k of [process.env.LCD_PYTHON && [process.env.LCD_PYTHON], ["python"], ["python3"], ["py", "-3"]].filter(Boolean)) {
    const r = spawnSync(k[0], [...k.slice(1), "--version"], { encoding: "utf8" });
    if (r.status === 0) return k;
  }
  throw new Error("python nenájdený (nastav LCD_PYTHON)");
}

function spusti(cmd, args, { shell = false, popis, cwd = KOREN } = {}) {
  const moznosti = { cwd, env: process.env, encoding: "utf8", shell, maxBuffer: 64 * 1024 * 1024 };
  const r = shell
    ? spawnSync([cmd, ...args].map((x) => (/[\s"&|<>^]/.test(x) ? '"' + x.replace(/"/g, '\\"') + '"' : x)).join(" "), moznosti)
    : spawnSync(cmd, args, moznosti);
  if (r.status !== 0) throw new Error((popis || cmd) + " zlyhal (" + r.status + "):\n" + (r.stderr || "") + (r.stdout || "") + (r.error ? String(r.error) : ""));
  return r;
}

/** -> { popis, js, css, casti: { "lcd-truck.js": Buffer, … }, tmp } */
export function pripravBuild({ bezDrop = false } = {}) {
  const tmp = mkdtempSync(join(tmpdir(), "lcd-opc-build-"));
  const t0 = Date.now();
  // kroky CI pred esbuildom: generované *.gen.jsx kamiónov (v .gitignore) — len keď chýbajú alebo sú staršie
  const tk = join(KOREN, "assets/js/truck-konfigurator");
  const mtime = (f) => { try { return statSync(f).mtimeMs; } catch { return 0; } };
  if (["konfigurator", "konfigurator.phone"].some((f) => mtime(join(tk, f + ".gen.jsx")) < mtime(join(tk, f + ".jsx")))) {
    spusti(process.execPath, ["truck/build-truck-images.mjs"], { popis: "truck/build-truck-images.mjs" });
  }
  const e = esbuild();
  const prep = ["--bundle", "--format=iife", "--loader:.jsx=jsx", "--minify", "--legal-comments=none", "--log-level=warning"];
  if (!bezDrop) prep.push("--drop:console");
  const casti = {};
  for (const [vstup, f] of [["assets/js/main.js", "luxuryCar.js"], ["assets/js/truck-konfigurator/cast.jsx", "lcd-truck.js"], ["assets/js/casti/gsap.js", "lcd-gsap.js"],
    ["assets/js/casti/reels.js", "lcd-reels.js"], ["assets/js/casti/hp.js", "lcd-hp.js"]]) {
    spusti(e.cmd, [...e.pred, join(KOREN, vstup), ...prep, "--outfile=" + join(tmp, f)], { shell: e.shell, popis: "esbuild " + f, cwd: e.mimoRepa ? tmp : KOREN });
    casti[f] = readFileSync(join(tmp, f));
  }
  const js = casti["luxuryCar.js"];
  delete casti["luxuryCar.js"];
  const py = python();
  spusti(py[0], [...py.slice(1), "tools/vloz-lcd-css.py", "--vystup", join(tmp, "luxuryCar.css")], { popis: "vloz-lcd-css.py --vystup" });
  const css = readFileSync(join(tmp, "luxuryCar.css"));
  return { popis: `lokálny build (${(js.length / 1024).toFixed(0)} kB JS, ${(css.length / 1024).toFixed(0)} kB CSS, ${((Date.now() - t0) / 1000).toFixed(1)} s)`, js, css, casti, tmp };
}
