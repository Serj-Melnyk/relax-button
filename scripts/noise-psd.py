#!/usr/bin/env python3
# Usage: python3 -I scripts/noise-psd.py [--svg OUTDIR] [file ...]
# Needs ffmpeg and numpy. With no files, analyses every continuous sound declared
# in index.html, only over the part the app actually plays (loopStart .. end - loopEndTrim).
"""Check that a noise sound really has the spectrum its name claims.

Method
- Decode with ffmpeg at the file's own sample rate, keep both channels.
- Welch PSD per channel (Hann, 16384 samples, 50 % overlap) of the pre-whitened
  (first-difference) signal, corrected back; channel PSDs are averaged as power,
  so anti-phase content cannot cancel out.
- PSD is averaged into 1/3-octave bands before fitting, so every octave weighs the
  same (a fit over raw FFT bins is dominated by the highest octave).
- Fit range: 40 Hz up to the real upper limit of the file (codec low-pass or
  Nyquist, detected from the band levels), at most 16 kHz.
- Power law P(f) ~ 1/f^alpha: alpha = -slope of 10*log10(P) vs 10*log10(f).
- Fit quality: RMS deviation of the bands from the line in dB (R^2 is also printed,
  but it means nothing for a flat white spectrum). Worst bands, alpha per 10 s block.

Colour bands for alpha (owner's definitions):
  white |a| <= 0.3, peach 0.3-0.7, pink 0.7-1.3, orange 1.3-1.7,
  brown 1.7-2.3, infrared > 2.3.
"""
import json, re, subprocess, sys
from pathlib import Path
import numpy as np

NPERSEG = 16384
F_MIN, F_MAX = 40.0, 16000.0
BLOCK_S = 10.0
RMS_CLEAN_DB = 1.5   # above this the spectrum is not a clean power law
COLOURS = [("white", -0.3, 0.3), ("peach", 0.3, 0.7), ("pink", 0.7, 1.3),
           ("orange", 1.3, 1.7), ("brown", 1.7, 2.3), ("infrared", 2.3, 99)]
ROOT = Path(__file__).resolve().parent.parent


def colour_of(alpha):
    for name, lo, hi in COLOURS:
        if lo <= alpha <= hi:
            return name
    return "blue/violet" if alpha < -0.3 else "custom"


def margin_to_edge(alpha, colour):
    for name, lo, hi in COLOURS:
        if name == colour:
            return min(alpha - lo, hi - alpha)
    return 0.0


def decode(path):
    sr = int(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
                             "stream=sample_rate", "-of", "csv=p=0", str(path)],
                            capture_output=True, text=True, check=True).stdout.strip())
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "2", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64), sr


def welch(x, sr):
    """One-sided PSD (power/Hz), x: (n, channels). Channels averaged as power."""
    n = NPERSEG if len(x) >= NPERSEG else 1 << int(np.log2(len(x)))
    win = np.hanning(n)
    scale = 2.0 / (sr * (win ** 2).sum())
    step = n // 2
    # Analyse the first difference (pre-whitening, response 4*sin^2(pi f/sr)) and divide it
    # back out: this keeps window leakage from filling in steep (alpha >= 2.5) spectra.
    d = np.diff(x, axis=0)
    acc, count = np.zeros(n // 2 + 1), 0
    for start in range(0, len(d) - n + 1, step):
        spec = np.fft.rfft(d[start:start + n] * win[:, None], axis=0)
        acc += (np.abs(spec) ** 2).mean(axis=1)
        count += 1
    freqs = np.fft.rfftfreq(n, 1 / sr)
    resp = 4 * np.sin(np.pi * freqs / sr) ** 2
    resp[0] = np.inf
    psd = acc * scale / max(count, 1) / resp
    psd[-1] /= 2
    return freqs, psd


def third_octaves(freqs, psd, f_hi):
    centres = 1000.0 * 2.0 ** (np.arange(-15, 15) / 3.0)
    out = []
    for fc in centres:
        lo, hi = fc / 2 ** (1 / 6), fc * 2 ** (1 / 6)
        if lo < 20 or hi > f_hi:
            continue
        sel = (freqs >= lo) & (freqs < hi)
        if sel.sum() >= 1:
            out.append((fc, psd[sel].mean()))
    return np.array(out)


def upper_limit(bands, sr):
    """Highest usable frequency: stop where the level falls off a cliff (codec low-pass)."""
    nyq_limit = min(F_MAX, sr / 2 * 0.9)
    db = 10 * np.log10(bands[:, 1] + 1e-30)
    limit = nyq_limit
    for i in range(1, len(bands)):
        if bands[i, 0] > 8000 and db[i - 1] - db[i] > 12:
            limit = bands[i - 1, 0] * 2 ** (1 / 6)
            break
    return min(limit, nyq_limit)


def fit(bands, f_lo, f_hi):
    sel = (bands[:, 0] >= f_lo) & (bands[:, 0] <= f_hi)
    x = 10 * np.log10(bands[sel, 0])
    y = 10 * np.log10(bands[sel, 1] + 1e-30)
    slope, icpt = np.polyfit(x, y, 1)
    pred = slope * x + icpt
    ss_res, ss_tot = ((y - pred) ** 2).sum(), ((y - y.mean()) ** 2).sum()
    r2 = 1 - ss_res / ss_tot if ss_tot > 0 else 0.0
    dev = y - pred
    return -slope, r2, slope, icpt, bands[sel, 0], dev, float(np.sqrt((dev ** 2).mean()))


def analyse(path, start=0.0, end_trim=0.0):
    x, sr = decode(path)
    a, b = int(start * sr), len(x) - int(end_trim * sr)
    x = x[a:b]
    freqs, psd = welch(x, sr)
    bands = third_octaves(freqs, psd, sr / 2)
    f_hi = upper_limit(bands, sr)
    alpha, r2, slope, icpt, fit_f, dev, rms = fit(bands, F_MIN, f_hi)

    block_alphas = []
    blk = int(BLOCK_S * sr)
    for s in range(0, len(x) - blk + 1, blk):
        bf, bp = welch(x[s:s + blk], sr)
        bb = third_octaves(bf, bp, sr / 2)
        block_alphas.append(fit(bb, F_MIN, f_hi)[0])

    worst = np.argsort(-np.abs(dev))[:3]
    peak = np.abs(x).max()
    return {
        "file": str(path), "sampleRate": sr, "seconds": round(len(x) / sr, 1),
        "fitRangeHz": [F_MIN, round(f_hi)], "alpha": round(float(alpha), 3),
        "dbPerOctave": round(float(slope * 10 * np.log10(2)), 2),
        "r2": round(float(r2), 4), "fitRmsDb": round(rms, 2), "colour": colour_of(alpha),
        "alphaBlocks": {"min": round(min(block_alphas), 2), "max": round(max(block_alphas), 2),
                        "std": round(float(np.std(block_alphas)), 3)} if block_alphas else None,
        "worstBandsDb": [[int(round(fit_f[i])), round(float(dev[i]), 1)] for i in worst],
        "peakDbfs": round(20 * np.log10(peak + 1e-12), 2),
        "_plot": (bands, slope, icpt, f_hi),
    }


def claimed_colour(sound_id):
    for name in ("white", "pink", "brown", "orange", "infrared"):
        if sound_id.startswith(name):
            return name
    return None


def verdict(res, claimed):
    if claimed is None:
        return "no colour claimed"
    got, a = res["colour"], res["alpha"]
    if got != claimed:
        return f"MISMATCH: measured {got}"
    if res["fitRmsDb"] > RMS_CLEAN_DB:
        return f"{claimed} by slope, but not a clean noise (±{res['fitRmsDb']} dB from the line)"
    if margin_to_edge(a, got) < 0.1:
        return f"{claimed}, near the edge of the band"
    return "OK"


def sounds_from_index():
    src = (ROOT / "index.html").read_text(encoding="utf-8")
    out = []
    for m in re.finditer(r"\{ id: '([^']+)', name: '([^']+)'.*?mode: 'continuous', variations: \['([^']+)'\][^}]*\}", src, re.S):
        block = m.group(0)
        ls = re.search(r"loopStart: ([\d.]+)", block)
        le = re.search(r"loopEndTrim: ([\d.]+)", block)
        out.append({"id": m.group(1), "name": m.group(2), "path": ROOT / m.group(3),
                    "start": float(ls.group(1)) if ls else 0.0, "endTrim": float(le.group(1)) if le else 0.0})
    return out


def svg(res, title, out_path):
    bands, slope, icpt, f_hi = res["_plot"]
    W, H, L, R, T, B = 720, 420, 60, 20, 40, 50
    fx = lambda f: L + (np.log10(f) - np.log10(20)) / (np.log10(20000) - np.log10(20)) * (W - L - R)
    db = 10 * np.log10(bands[:, 1] + 1e-30)
    top = np.ceil(db.max() / 10) * 10 + 5
    bot = top - 90
    fy = lambda d: T + (top - d) / (top - bot) * (H - T - B)
    p = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" font-family="sans-serif" font-size="11">',
         f'<rect width="{W}" height="{H}" fill="#fff"/>',
         f'<text x="{L}" y="22" font-size="14" font-weight="bold">{title}</text>',
         f'<text x="{W - R}" y="22" text-anchor="end">alpha {res["alpha"]}  ±{res["fitRmsDb"]} dB  → {res["colour"]}</text>']
    for f in [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]:
        p.append(f'<line x1="{fx(f):.1f}" x2="{fx(f):.1f}" y1="{T}" y2="{H - B}" stroke="#eee"/>'
                 f'<text x="{fx(f):.1f}" y="{H - B + 15}" text-anchor="middle">{f if f < 1000 else str(f // 1000) + "k"}</text>')
    for d in range(int(bot), int(top) + 1, 10):
        p.append(f'<line x1="{L}" x2="{W - R}" y1="{fy(d):.1f}" y2="{fy(d):.1f}" stroke="#eee"/>'
                 f'<text x="{L - 6}" y="{fy(d) + 4:.1f}" text-anchor="end">{d}</text>')
    p.append(f'<rect x="{fx(F_MIN):.1f}" y="{T}" width="{fx(f_hi) - fx(F_MIN):.1f}" height="{H - T - B}" fill="#4a7" opacity="0.06"/>')
    ref_f = 1000.0
    ref_db = slope * 10 * np.log10(ref_f) + icpt
    for a, col, name in [(0, "#999", "white"), (1, "#e78ac3", "pink"), (2, "#a6611a", "brown"), (3, "#8b0000", "α=3")]:
        y1 = ref_db - 10 * a * (np.log10(20) - np.log10(ref_f))
        y2 = ref_db - 10 * a * (np.log10(20000) - np.log10(ref_f))
        p.append(f'<line x1="{fx(20):.1f}" y1="{fy(y1):.1f}" x2="{fx(20000):.1f}" y2="{fy(y2):.1f}" stroke="{col}" stroke-dasharray="4 4"/>'
                 f'<text x="{fx(20000) - 4:.1f}" y="{fy(y2) - 4:.1f}" text-anchor="end" fill="{col}">{name}</text>')
    pts = " ".join(f"{fx(f):.1f},{fy(d):.1f}" for f, d in zip(bands[:, 0], db))
    p.append(f'<polyline points="{pts}" fill="none" stroke="#2557d6" stroke-width="2.5"/>')
    p.append(f'<text x="{L}" y="{H - 10}">1/3-octave PSD (dB), green = fit range {int(F_MIN)}–{int(f_hi)} Hz, dashed = reference slopes through the fit at 1 kHz</text>')
    p.append("</svg>")
    out_path.write_text("\n".join(p), encoding="utf-8")


def main(argv):
    svg_dir = None
    if "--svg" in argv:
        i = argv.index("--svg")
        svg_dir = Path(argv[i + 1]); svg_dir.mkdir(parents=True, exist_ok=True)
        argv = argv[:i] + argv[i + 2:]
    items = ([{"id": Path(a).stem.lower(), "name": Path(a).name, "path": Path(a), "start": 0, "endTrim": 0} for a in argv]
             if argv else sounds_from_index())
    rows = []
    for it in items:
        res = analyse(it["path"], it["start"], it["endTrim"])
        claimed = claimed_colour(it["id"])
        res["id"], res["name"], res["claimed"], res["verdict"] = it["id"], it["name"], claimed, verdict(res, claimed)
        if svg_dir:
            svg(res, f'{it["name"]} ({it["id"]})', svg_dir / f'{it["id"]}.svg')
        res.pop("_plot")
        rows.append(res)
        blk = res["alphaBlocks"] or {}
        print(f'{it["id"]:<26} α={res["alpha"]:>6}  dev±{res["fitRmsDb"]:<5}dB  R2={res["r2"]:<6}  {res["colour"]:<9} '
              f'blocks {blk.get("min")}..{blk.get("max")}  fit≤{res["fitRangeHz"][1]}Hz  {res["verdict"]}')
    if svg_dir:
        (svg_dir / "results.json").write_text(json.dumps(rows, indent=1, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1:])
