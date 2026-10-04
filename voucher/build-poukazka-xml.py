"""Produkt "Darčeková poukážka" (SK) / "Dárkový poukaz" (CZ) pre import do Shoptetu.

Jeden produkt, 15 variantov podľa parametra "Hodnota" (Michal 4. 10. 2026):
  SK 100 – 800 € po 50 €, kódy POUKAZKA-100 … POUKAZKA-800
  CZ 2 500 – 20 000 Kč po 1 250 Kč, kódy POUKAZ-2500 … POUKAZ-20000
Bez DPH (LCD nie je platca DPH), bez zliav a kupónov, doprava a platba zdarma.
Kód poukážky a PDF posiela automat Jána Kučeru — páruje podľa kódu variantu.

Spustenie:  python voucher/build-poukazka-xml.py [--viditelnost detailOnly|visible]
Výstup:     voucher/dist/poukazka-sk.xml, voucher/dist/poukazka-cz.xml (overené schémou docs/*.rng)
Import:     admin → Produkty → Import, voľba „Nemeniť produkty a varianty, ktoré nie sú v súbore“.
"""
import argparse
import io
import os
import sys
from xml.sax.saxutils import escape

KOREN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/"

TRHY = {
    "sk": dict(
        nazov="Darčeková poukážka",
        kategoria="Naše produkty",
        mena="EUR",
        hodnoty=list(range(100, 801, 50)),
        kod="POUKAZKA-%d",
        popis_hodnoty=lambda v: "%d €" % v,
        kratky="Darčeková poukážka na luxusné autokoberce, rohože do kufra a boxy. Hodnota od 100 do 800 €, "
               "platnosť 12 mesiacov, kód príde e-mailom.",
        popis="<p>Darček, ktorý si obdarovaný vyberie sám. Poukážka platí na celý sortiment Luxury Car Design — "
              "luxusné autokoberce na mieru, rohože do kufra, boxy aj sety.</p>"
              "<p>Hodnotu volíte od 100 do 800 € po 50 €. Po spracovaní objednávky Vám príde e-mailom kód poukážky "
              "spolu s poukážkou vo formáte A4 na vytlačenie. Poukážka platí 12 mesiacov.</p>",
        seo="Darčeková poukážka na luxusné autokoberce | Luxury Car Design",
        meta="Darčeková poukážka na luxusné autokoberce, rohože do kufra a boxy. Hodnota 100 – 800 €, platnosť 12 mesiacov, kód e-mailom.",
        obrazok="pk-vysku-prazdna.jpg",
        obrazok_popis="Darčeková poukážka Luxury Car Design",
    ),
    "cz": dict(
        nazov="Dárkový poukaz",
        kategoria="Naše produkty",
        mena="CZK",
        hodnoty=list(range(2500, 20001, 1250)),
        kod="POUKAZ-%d",
        popis_hodnoty=lambda v: "{:,} Kč".format(v).replace(",", " "),
        kratky="Dárkový poukaz na luxusní autokoberce, rohože do kufru a boxy. Hodnota od 2 500 do 20 000 Kč, "
               "platnost 12 měsíců, kód přijde e-mailem.",
        popis="<p>Dárek, který si obdarovaný vybere sám. Poukaz platí na celý sortiment Luxury Car Design — "
              "luxusní autokoberce na míru, rohože do kufru, boxy i sety.</p>"
              "<p>Hodnotu volíte od 2 500 do 20 000 Kč po 1 250 Kč. Po zpracování objednávky Vám e-mailem přijde kód poukazu "
              "spolu s poukazem ve formátu A4 k vytištění. Poukaz platí 12 měsíců.</p>",
        seo="Dárkový poukaz na luxusní autokoberce | Luxury Car Design",
        meta="Dárkový poukaz na luxusní autokoberce, rohože do kufru a boxy. Hodnota 2 500 – 20 000 Kč, platnost 12 měsíců, kód e-mailem.",
        obrazok="pk-cz-vysku-prazdna.jpg",
        obrazok_popis="Dárkový poukaz Luxury Car Design",
    ),
}


def e(s):
    return escape(str(s))


def variant(t, v):
    return (
        "      <VARIANT>\n"
        "        <CODE>%s</CODE>\n"
        "        <CURRENCY>%s</CURRENCY>\n"
        "        <PRICE>%d</PRICE>\n"
        "        <VISIBLE>1</VISIBLE>\n"
        "        <FREE_SHIPPING>1</FREE_SHIPPING>\n"
        "        <FREE_BILLING>1</FREE_BILLING>\n"
        "        <UNIT>ks</UNIT>\n"
        "        <NEGATIVE_AMOUNT>1</NEGATIVE_AMOUNT>\n"
        "        <APPLY_LOYALTY_DISCOUNT>0</APPLY_LOYALTY_DISCOUNT>\n"
        "        <APPLY_VOLUME_DISCOUNT>0</APPLY_VOLUME_DISCOUNT>\n"
        "        <APPLY_QUANTITY_DISCOUNT>0</APPLY_QUANTITY_DISCOUNT>\n"
        "        <APPLY_DISCOUNT_COUPON>0</APPLY_DISCOUNT_COUPON>\n"
        "        <PARAMETERS>\n"
        "          <PARAMETER>\n"
        "            <NAME>Hodnota</NAME>\n"
        "            <VALUE>%s</VALUE>\n"
        "          </PARAMETER>\n"
        "        </PARAMETERS>\n"
        "      </VARIANT>\n"
    ) % (e(t["kod"] % v), t["mena"], v, e(t["popis_hodnoty"](v)))


def xml(t, viditelnost):
    return (
        '<?xml version="1.0" encoding="utf-8"?>\n<SHOP>\n  <SHOPITEM>\n'
        "    <NAME>%s</NAME>\n"
        "    <SHORT_DESCRIPTION>%s</SHORT_DESCRIPTION>\n"
        "    <DESCRIPTION>%s</DESCRIPTION>\n"
        "    <ITEM_TYPE>product</ITEM_TYPE>\n"
        "    <CATEGORIES>\n      <CATEGORY>%s</CATEGORY>\n    </CATEGORIES>\n"
        '    <IMAGES>\n      <IMAGE description="%s">%s%s</IMAGE>\n    </IMAGES>\n'
        "    <VISIBILITY>%s</VISIBILITY>\n"
        "    <SEO_TITLE>%s</SEO_TITLE>\n"
        "    <META_DESCRIPTION>%s</META_DESCRIPTION>\n"
        "    <VARIANTS>\n%s    </VARIANTS>\n"
        "  </SHOPITEM>\n</SHOP>\n"
    ) % (e(t["nazov"]), e(t["kratky"]), e(t["popis"]), e(t["kategoria"]), e(t["obrazok_popis"]), IMG, t["obrazok"],
         viditelnost, e(t["seo"]), e(t["meta"]), "".join(variant(t, v) for v in t["hodnoty"]))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--viditelnost", default="detailOnly", choices=["detailOnly", "visible", "hidden"])
    a = ap.parse_args()
    import tempfile
    from lxml import etree
    # docs/products-*.rng sú symlinky (na Windows len text s cieľom) — schémy skopíruj s opravenými include
    tmp = tempfile.mkdtemp(prefix="rng-")
    for meno in ("shoptet-products-complete-v10.rng", "shoptet-products-supplier-v10.rng", "shoptet-products-datatype-v10.rng"):
        s = io.open(os.path.join(KOREN, "docs", meno), encoding="utf-8").read()
        s = s.replace('href="products-supplier-v10.rng"', 'href="shoptet-products-supplier-v10.rng"')
        s = s.replace('href="products-datatype-v10.rng"', 'href="shoptet-products-datatype-v10.rng"')
        io.open(os.path.join(tmp, meno), "w", encoding="utf-8").write(s)
    schema = etree.RelaxNG(etree.parse(os.path.join(tmp, "shoptet-products-complete-v10.rng")))
    os.makedirs(os.path.join(KOREN, "voucher", "dist"), exist_ok=True)
    ok = True
    for trh, t in TRHY.items():
        assert len(t["hodnoty"]) == 15, (trh, len(t["hodnoty"]))
        obsah = xml(t, a.viditelnost)
        p = os.path.join(KOREN, "voucher", "dist", "poukazka-%s.xml" % trh)
        io.open(p, "w", encoding="utf-8", newline="\n").write(obsah)
        doc = etree.parse(p)
        if schema.validate(doc):
            print("OK  %s  %d variantov  %s" % (trh, len(t["hodnoty"]), p))
        else:
            ok = False
            print("CHYBA %s:" % trh)
            for err in schema.error_log:
                print("   r.%d: %s" % (err.line, err.message))
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
