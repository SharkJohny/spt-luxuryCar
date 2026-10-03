"""Vlozi assets/css/_lcdBlog.scss (ciste CSS) do assets/css/luxuryCar.css medzi znacky LCD-BLOG START/END.
Ked blok neexistuje, prida ho na koniec suboru. Spustit po kazdej zmene _lcdBlog.scss:
    python tools/vloz-lcd-blog-css.py
"""
import io
import os
import re

KOREN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZDROJ = os.path.join(KOREN, "assets", "css", "_lcdBlog.scss")
CIEL = os.path.join(KOREN, "assets", "css", "luxuryCar.css")
START = "/* ===== LCD-BLOG START - generovane tools/vloz-lcd-blog-css.py z _lcdBlog.scss, needituj rucne ===== */"
END = "/* ===== LCD-BLOG END ===== */"

css = io.open(ZDROJ, encoding="utf-8").read().strip()
t = io.open(CIEL, encoding="utf-8").read()
blok = START + "\n" + css + "\n" + END
vzor = re.compile(re.escape("/* ===== LCD-BLOG START") + r".*?" + re.escape(END), re.S)
if vzor.search(t):
    t = vzor.sub(lambda _: blok, t, count=1)
else:
    t = t.rstrip("\n") + "\n\n" + blok + "\n"
io.open(CIEL, "w", encoding="utf-8", newline="").write(t)
print("LCD-BLOG blok vlozeny (%d znakov)" % len(css))
