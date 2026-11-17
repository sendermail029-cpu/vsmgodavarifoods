# usage: python3 scripts/text-to-path.py <font.woff> <text> <size> <tracking>  -> JSON {d, width}
import sys, json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
font = TTFont(sys.argv[1]); text = sys.argv[2]; size = float(sys.argv[3]); tracking = float(sys.argv[4])
gs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font["head"].unitsPerEm; s = size / upm
x = 0.0; parts = []
for i, ch in enumerate(text):
    name = cmap.get(ord(ch))
    if name is None: continue
    pen = SVGPathPen(gs, ntos=lambda v: ("%.2f" % v).rstrip("0").rstrip("."))
    gs[name].draw(TransformPen(pen, (s, 0, 0, -s, x, 0)))
    parts.append(pen.getCommands())
    x += gs[name].width * s + (tracking if i < len(text) - 1 else 0)
print(json.dumps({"d": " ".join(parts), "width": x}))
