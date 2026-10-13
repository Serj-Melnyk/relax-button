#!/usr/bin/env python3
# Usage: python3 -I scripts/noise-reshape.py IN OUT --target green|alpha=<a> [--start S] [--end-trim E]
# Needs ffmpeg and numpy. Reshapes the spectrum of IN to the target colour with a
# linear-phase FIR filter and writes OUT as AAC with the same sample rate and bitrate.
"""Give a recording a real noise colour without changing its length or timing.

- The current spectrum is measured over [start, end - end_trim] (the part the app
  plays) with the same method as scripts/noise-psd.py (1/3-octave bands).
- Target: power law 1/f^alpha, or green (log-Gaussian hump centred at 500 Hz,
  -1.2 dB per octave^2 away from the centre).
- Gain = target - current, smoothed over neighbouring bands, limited to +-30 dB,
  turned into an 8192-tap linear-phase FIR; the filter delay is removed, so every
  sample stays where it was and loopStart / loopEndTrim remain valid.
- Output loudness (EBU R128 integrated) is matched to the input, peak kept <= -1 dBFS.
Always re-check the result with scripts/noise-psd.py and listen on a phone.
"""
import argparse, json, re, subprocess, sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
psd_mod = __import__("noise-psd")

TAPS = 8192
GREEN_CENTRE, GREEN_K = 500.0, 1.2


def target_db(f, target):
    if target == "green":
        return -GREEN_K * np.log2(f / GREEN_CENTRE) ** 2
    alpha = float(target.split("=", 1)[1])
    return -10 * alpha * np.log10(f / 1000.0)


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
                          "stream=sample_rate,bit_rate", "-of", "json", str(path)],
                         capture_output=True, text=True, check=True).stdout
    st = json.loads(out)["streams"][0]
    return int(st["sample_rate"]), int(st.get("bit_rate") or 96000)


def loudness(x, sr):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-f", "f32le", "-ar", str(sr), "-ac", "2",
                        "-i", "-", "-af", "ebur128", "-f", "null", "-"],
                       input=x.astype("<f4").tobytes(), capture_output=True)
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", p.stderr.decode())[-1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("dst")
    ap.add_argument("--target", required=True)
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--end-trim", type=float, default=0.0)
    a = ap.parse_args()

    x, sr = psd_mod.decode(a.src)
    _, bitrate = probe(a.src)
    seg = x[int(a.start * sr): len(x) - int(a.end_trim * sr)]
    freqs, psd = psd_mod.welch(seg, sr)
    bands = psd_mod.third_octaves(freqs, psd, sr / 2)
    f_hi = psd_mod.upper_limit(bands, sr)
    keep = (bands[:, 0] >= 25) & (bands[:, 0] <= f_hi)
    fc, cur = bands[keep, 0], 10 * np.log10(bands[keep, 1] + 1e-30)

    want = target_db(fc, a.target)
    gain = want - cur
    gain -= np.median(gain)
    gain = np.convolve(np.pad(gain, 1, mode="edge"), [0.25, 0.5, 0.25], mode="valid")
    gain = np.clip(gain, -30, 30)

    grid = np.fft.rfftfreq(TAPS, 1 / sr)
    g = np.interp(np.log10(np.maximum(grid, 1.0)), np.log10(fc), gain)
    h = np.fft.irfft(10 ** (g / 20), TAPS)
    h = np.roll(h, TAPS // 2) * np.hanning(TAPS)

    n = len(x) + TAPS
    nfft = 1 << int(np.ceil(np.log2(n)))
    H = np.fft.rfft(h, nfft)
    y = np.stack([np.fft.irfft(np.fft.rfft(x[:, c], nfft) * H, nfft)[TAPS // 2: TAPS // 2 + len(x)]
                  for c in range(2)], axis=1)

    y *= 10 ** ((loudness(x, sr) - loudness(y, sr)) / 20)
    peak = np.abs(y).max()
    if peak > 10 ** (-1 / 20):
        y *= 10 ** (-1 / 20) / peak

    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(sr), "-ac", "2", "-i", "-",
                    "-c:a", "aac", "-b:a", str(bitrate), "-movflags", "+faststart", a.dst],
                   input=y.astype("<f4").tobytes(), check=True)
    print(f"wrote {a.dst}: {len(y) / sr:.2f} s, {sr} Hz, {bitrate // 1000} kbps, gain range "
          f"{gain.min():.1f}..{gain.max():.1f} dB over {fc[0]:.0f}-{fc[-1]:.0f} Hz")


if __name__ == "__main__":
    main()
