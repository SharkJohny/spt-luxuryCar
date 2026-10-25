// Vstup samostatnej časti js/lcd-truck.js (functions/lcdCasti.js, zrýchlenie 25. 10. 2026): React konfigurátor kamiónov
// (React + konfigurator.gen.jsx + konfigurator.phone.gen.jsx, ~460 kB) mimo hlavného luxuryCar.js. Sťahuje ho len
// stránka kamiónov (mount.js). Nič sa tu nespúšťa — len sa zapíše API pre mount.js.
import { renderTruckConfigurator } from "./index.jsx";

(window.__lcdCasti = window.__lcdCasti || {}).truck = { renderTruckConfigurator };
