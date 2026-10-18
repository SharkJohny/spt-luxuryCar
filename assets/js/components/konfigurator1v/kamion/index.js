// Konfigurátor kamiónov a dodávok 1V (SK 640) — KOSTRA (K1). Telo pribudne v K2–K7 (docs/kamiony-1v-plan.md).
// Kým UI nie je, init vyhodí chybu -> index.js zlozit() -> zlozit() tohto modulu namontuje React (zákazník nikdy
// nevidí prázdnu stránku).
import { mountTruckConfigurator } from "../../../truck-konfigurator/mount.js";

export const MENO = "kamion";

export function init() {
  throw new Error("kamion: konfigurátor ešte nie je postavený");
}

/** Návrat na React (poistka 1.4). */
export function zlozit() {
  mountTruckConfigurator();
}
