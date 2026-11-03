"""Build Digital Fidget launcher icons from the owner's 1280px squircle artwork.
Usage (from repo root): python3 -I scripts/make-app-icons.py release/google-play/icon-source-2026-11-03.jpg /tmp/icon-preview [apply]
"apply" overwrites android mipmaps + release/google-play/icon-512.png; without it only writes a preview folder.
"""
import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC, OUT = sys.argv[1], sys.argv[2]
APPLY = len(sys.argv) > 3
os.makedirs(OUT, exist_ok=True)

src = Image.open(SRC).convert('RGB')
S = 1280
SQ = 892  # measured width of the white squircle in the source (x 195..1087)

def canvas(size, sq_frac):
    """Square canvas where the squircle is sq_frac of the width; margins are edge-replicated source."""
    scale = (size * sq_frac) / SQ
    inner = round(S * scale)
    img = src.resize((inner, inner), Image.LANCZOS)
    if inner >= size:
        off = (inner - size) // 2
        return img.crop((off, off, off + size, off + size))
    pad = (size - inner) // 2
    arr = np.asarray(img)
    arr = np.pad(arr, ((pad, size - inner - pad), (pad, size - inner - pad), (0, 0)), mode='edge')
    return Image.fromarray(arr)

def circle(img):
    m = Image.new('L', (img.width * 4,) * 2, 0)
    ImageDraw.Draw(m).ellipse((0, 0, m.width - 1, m.height - 1), fill=255)
    m = m.resize(img.size, Image.LANCZOS)
    out = img.convert('RGBA'); out.putalpha(m)
    return out

# sizes already used in the project
dens = {'mdpi': (48, 108), 'hdpi': (72, 162), 'xhdpi': (96, 216), 'xxhdpi': (144, 324), 'xxxhdpi': (192, 432)}
# the project's xxxhdpi legacy files are 384 / foreground 864 -> keep existing pixel sizes
sizes = {}
for d in dens:
    sizes[d] = {}
import subprocess
res = 'android/app/src/main/res'
for d in dens:
    for name in ('ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground'):
        p = f'{res}/mipmap-{d}/{name}.png'
        im = Image.open(p)
        sizes[d][name] = im.width

FG = float(os.environ.get('FG', '0.54'))
BG = (214, 206, 202)  # solid colour the feathered artwork fades into

def feathered(size, sq_frac):
    """RGBA foreground: artwork on a transparent canvas, its outer edge fading out so the solid background layer shows through."""
    scale = (size * sq_frac) / SQ
    inner = round(S * scale)
    img = src.resize((inner, inner), Image.LANCZOS).convert('RGBA')
    ramp = max(2, int(inner * 0.16))
    yy, xx = np.mgrid[0:inner, 0:inner]
    d = np.minimum(np.minimum(xx, inner - 1 - xx), np.minimum(yy, inner - 1 - yy)).astype(float)
    t = np.clip(d / ramp, 0, 1)
    alpha = (t * t * (3 - 2 * t) * 255).astype(np.uint8)
    img.putalpha(Image.fromarray(alpha))
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    off = (size - inner) // 2
    out.paste(img, (off, off))
    return out

for d, s in sizes.items():
    fg = feathered(s['ic_launcher_foreground'], FG)
    legacy = canvas(s['ic_launcher'], 0.84)
    rnd = circle(canvas(s['ic_launcher_round'], 0.70))
    for name, im in (('ic_launcher_foreground', fg), ('ic_launcher', legacy), ('ic_launcher_round', rnd)):
        dest = f'{res}/mipmap-{d}/{name}.png' if APPLY else f'{OUT}/{d}-{name}.png'
        im.save(dest)

play = canvas(512, 0.80)
play.save('release/google-play/icon-512.png' if APPLY else f'{OUT}/icon-512.png')

# previews of the adaptive icon under common masks
fg = feathered(864, FG)
bgl = Image.new('RGBA', (864, 864), BG + (255,)); bgl.alpha_composite(fg); fg = bgl
prev = Image.new('RGB', (3 * 300 + 40, 340), (40, 40, 44))
win = fg.crop((864 * 18 // 108, 864 * 18 // 108, 864 * 90 // 108, 864 * 90 // 108)).resize((300, 300), Image.LANCZOS)  # 72dp visible window
for i, kind in enumerate(('circle', 'squircle', 'rounded')):
    m = Image.new('L', (1200, 1200), 0); dr = ImageDraw.Draw(m)
    if kind == 'circle': dr.ellipse((0, 0, 1199, 1199), fill=255)
    elif kind == 'squircle': dr.rounded_rectangle((0, 0, 1199, 1199), radius=480, fill=255)
    else: dr.rounded_rectangle((0, 0, 1199, 1199), radius=260, fill=255)
    m = m.resize((300, 300), Image.LANCZOS)
    prev.paste(win, (20 + i * 310, 20), m)
prev.save(f'{OUT}/preview-masks.png')
