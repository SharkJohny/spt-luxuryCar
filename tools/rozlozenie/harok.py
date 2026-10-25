import sys, os
from PIL import Image, ImageDraw
# harok.py <priecinok> <vystup.jpg> [stlpce] [sirka_bunky]
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4
cw = int(sys.argv[4]) if len(sys.argv) > 4 else 360
files = sorted(f for f in os.listdir(d) if f.endswith(".jpg") and (f.endswith("-auto.jpg") or f.startswith("17-hotovy-0")))
ims = []
for f in files:
    im = Image.open(os.path.join(d, f)).convert("RGB")
    h = int(im.height * cw / im.width)
    ims.append((f, im.resize((cw, h))))
rows = (len(ims) + cols - 1) // cols
rh = max(i.height for _, i in ims) + 22
sheet = Image.new("RGB", (cols * (cw + 8), rows * rh), "white")
dr = ImageDraw.Draw(sheet)
for n, (f, im) in enumerate(ims):
    x, y = (n % cols) * (cw + 8), (n // cols) * rh
    sheet.paste(im, (x, y + 20)); dr.text((x + 2, y + 4), f.replace("-auto.jpg", ""), fill="black")
sheet.save(out, quality=70)
print(out, sheet.size)
