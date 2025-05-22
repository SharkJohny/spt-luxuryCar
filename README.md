# luxuryCar

Projekt **luxuryCar** slouží pro správu, úpravu a vývoj webu (pravděpodobně e-shopu) s využitím Shoptet, nástrojů pro build a automatizaci (např. esbuild, Bender) a moderního workflow s podporou BrowserSync a MCP (Message Control Protocol).

## Stručný popis repozitáře

Repozitář obsahuje:

- Zdrojové soubory pro web (`assets/`)
- Výstupní (buildované) soubory (`dist/`)
- Finální HTML šablony (`finalHTML/`)
- Konfigurace pro MCP server (`mcp.json`)
- Export produktů (`Complete Products.xml`)
- Základní informace o projektu a závislostech (`package.json`)
- Další HTML, SVG a datové soubory

## Požadavky

- Node.js (doporučeno v aktuální verzi)
- Yarn nebo npm
- Chrome + rozšíření [BrowserToolsMCP](https://github.com/AgentDeskAI/browser-tools-mcp)

## Instalace

```bash
yarn install
# nebo
npm install
```

## Vývoj a workflow

1. **Spusťte Node server:**
   ```bash
   npx @agentdeskai/browser-tools-server@latest
   ```
2. **Spusťte MCP server:**
   ```bash
   npx @agentdeskai/browser-tools-mcp@latest --stdio
   ```
3. **Otevřete Chrome a nainstalujte rozšíření [BrowserToolsMCP](https://github.com/AgentDeskAI/browser-tools-mcp).**
   - Otevřete DevTools (F12) a najděte panel BrowserToolsMCP.
   - Otevřete stránku, kterou chcete ladit (např. https://localhost:3010/).
4. **Pro vývoj s live reloadem spusťte Bender (pokud používáte):**
   ```bash
   yarn start luxuryCar
   ```
   nebo podle vaší konfigurace.

## Poznámky

- Pokud narazíte na problém s porty, zkontrolujte, zda nejsou obsazeny jinými procesy.
- Pro správnou funkčnost MCP je nutné mít otevřený Chrome s nainstalovaným rozšířením a otevřeným DevTools panelem.

## Licence

_(Doplňte informaci o licenci, pokud je potřeba)_

---

Pokud chcete README rozšířit o konkrétní příklady, build skripty, nebo detailnější popis, dejte vědět!
