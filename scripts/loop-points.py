#!/usr/bin/env python3
# Usage: python3 scripts/loop-points.py www scripts/loop-profiles.json /tmp/out.json
# Needs ffmpeg and numpy. Prints loopStart / loopEndTrim / loopCrossfade per profile
# for index.html, plus how unusual each seam is versus 300 interior points
# of the same file (percentiles of level step, spectral change and fade dip).
"""Pick loop points (S, E) and evaluate the seam.

Seam model (shared by the new native and web players): the outgoing copy plays
[E - xf, E] fading out (cos), the incoming copy plays [S, S + xf] fading in (sin),
then continues from S + xf.  Cost compares what the listener hears just before the
fade with just after it, and the two fade windows with each other, in level and
octave-band spectrum, and penalises transients inside the fade windows.
"""
import json, subprocess, sys
import numpy as np

SR = 32000
FR = int(0.05 * SR)                  # 50 ms analysis frames
EDGES = [31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)


def frame_features(x):
    m = x.mean(axis=1)
    n = len(m) // FR
    fr = m[: n * FR].reshape(n, FR)
    spec = np.abs(np.fft.rfft(fr * np.hanning(FR), axis=1)) ** 2
    f = np.fft.rfftfreq(FR, 1 / SR)
    b = np.stack([spec[:, (f >= lo) & (f < hi)].sum(axis=1) for lo, hi in zip(EDGES, EDGES[1:])], axis=1)
    energy = (fr ** 2).mean(axis=1)
    peak = np.abs(fr).max(axis=1)
    return energy, b, peak


def win_mean(c, i, k):
    """mean of frames [i, i+k) using cumulative sums c (len n+1)"""
    return (c[i + k] - c[i]) / k


def db(v):
    return 10 * np.log10(v + 1e-20)


def optimise(x, xf_s, ctx_s=1.5, end_zone_s=None, start_zone_s=None, min_start_s=0.1, end_guard_s=0.1):
    d = len(x) / SR
    energy, bands, peak = frame_features(x)
    n = len(energy)
    ce = np.r_[0, np.cumsum(energy)]
    cb = np.vstack([np.zeros((1, bands.shape[1])), np.cumsum(bands, axis=0)])
    kx, kc = int(round(xf_s / 0.05)), int(round(ctx_s / 0.05))
    crest_ref = np.median(peak / np.sqrt(energy + 1e-20))
    end_zone_s = end_zone_s or min(30.0, max(xf_s + ctx_s + 1.0, 0.12 * d))
    start_zone_s = start_zone_s or min(15.0, max(1.0, 0.08 * d))

    # E is a frame boundary index (E frames played); S likewise
    E = np.arange(max(kx + kc, int((d - end_zone_s) / 0.05)), int((d - end_guard_s) / 0.05) + 1)
    S = np.arange(int(np.ceil(min_start_s / 0.05)), int(start_zone_s / 0.05) + 1)
    E = E[E <= n]
    S = S[S + kx + kc <= n]

    def feats(i0, k):
        lv = db(win_mean(ce, i0, k))
        sp = db(win_mean(cb, i0, k))
        return lv, sp

    # before the fade: [E-kx-kc, E-kx); after: [S+kx, S+kx+kc)
    lb, sb = feats(E - kx - kc, kc)
    la, sa = feats(S + kx, kc)
    # fade windows: [E-kx, E) and [S, S+kx)
    lfo, sfo = feats(E - kx, kx)
    lfi, sfi = feats(S, kx)

    def crest(i0s, k):
        out = []
        for i0 in i0s:
            seg_p, seg_e = peak[i0:i0 + k], energy[i0:i0 + k]
            out.append((seg_p / np.sqrt(seg_e + 1e-20)).max() / crest_ref)
        return np.array(out)

    tE, tS = crest(E - kx, kx), crest(S, kx)
    cost = (np.abs(lb[:, None] - la[None, :]) * 1.0
            + np.abs(sb[:, None, :] - sa[None, :, :]).mean(axis=2) * 0.7
            + np.abs(lfo[:, None] - lfi[None, :]) * 0.7
            + np.abs(sfo[:, None, :] - sfi[None, :, :]).mean(axis=2) * 0.5
            + (np.maximum(0, tE - 1.6)[:, None] + np.maximum(0, tS - 1.6)[None, :]) * 2.0)
    # re-rank the best candidates by the dip the listener actually hears in the fade
    best = np.argsort(cost, axis=None)[:60]
    scored = []
    for flat in best:
        i, j = np.unravel_index(flat, cost.shape)
        seq, pl, nx = seam(x, S[j] * 0.05, E[i] * 0.05, xf_s)
        scored.append((cost[i, j] + 0.6 * max(0.0, -fade_dip(seq, pl, nx) - 1.0), i, j))
    c, i, j = min(scored)
    return S[j] * 0.05, E[i] * 0.05, float(c)


def fade_dip(seq, pl, nx):
    w = int(0.1 * SR)
    e = 10 * np.log10((seq[pl - SR: pl + nx + SR] ** 2).mean(axis=1)[: ((nx + 2 * SR) // w) * w].reshape(-1, w).mean(axis=1) + 1e-20)
    return e[10:-10].min() - np.median(np.r_[e[:10], e[-10:]])


def seam(x, s, e, xf_s, steps_ms=20):
    n = int(xf_s * SR)
    a, b = int((e - xf_s) * SR), int(s * SR)
    k = np.arange(n)
    step = np.floor(k / (steps_ms * SR / 1000)) * (steps_ms * SR / 1000) / n   # stepped volume, like setVolume ticks
    mix = x[a: a + n] * np.cos(step * np.pi / 2)[:, None] + x[b: b + n] * np.sin(step * np.pi / 2)[:, None]
    pre, post = x[max(0, a - 3 * SR): a], x[b + n: b + n + 3 * SR]
    return np.vstack([pre, mix, post]), len(pre), n


def rms_db(v):
    return db(np.mean(v ** 2))


def band_vec(v):
    m = v.mean(axis=1)
    spec = np.abs(np.fft.rfft(m * np.hanning(len(m)))) ** 2
    f = np.fft.rfftfreq(len(m), 1 / SR)
    return np.array([db(spec[(f >= lo) & (f < hi)].sum()) for lo, hi in zip(EDGES, EDGES[1:])])


def judge(x, seq, pl, nx, rng):
    """percentile of the seam's level step / spectral change / dip versus 300 interior points"""
    def stats(sig, a_end, b_start):
        pre, post = sig[a_end - SR: a_end], sig[b_start: b_start + SR]
        pw = (sig[a_end - SR: b_start + SR, :] ** 2).mean(axis=1)
        pw = pw[: (len(pw) // 3200) * 3200]
        e = 10 * np.log10(pw.reshape(-1, 3200).mean(axis=1) + 1e-20)
        inner = e[10:-10] if len(e) > 20 else e
        return (abs(rms_db(post) - rms_db(pre)), np.abs(band_vec(pre) - band_vec(post)).mean(),
                inner.min() - np.median(np.r_[e[:10], e[-10:]]))
    s = stats(seq, pl, pl + nx)
    refs = np.array([stats(x, c, c + nx) for c in rng.integers(3 * SR, len(x) - 3 * SR, 300)])
    return s, (round(100 * np.mean(refs[:, 0] <= s[0])), round(100 * np.mean(refs[:, 1] <= s[1])),
               round(100 * np.mean(refs[:, 2] >= s[2])))


if __name__ == "__main__":
    root, profiles = sys.argv[1], json.load(open(sys.argv[2]))
    rng = np.random.default_rng(7)
    results = []
    for p in profiles:
        x = decode(f"{root}/{p['file']}")
        d = len(x) / SR
        xf = p["xf"]
        s, e, c = optimise(x, xf)
        seq, pl, nx = seam(x, s, e, xf)
        st, pct = judge(x, seq, pl, nx, rng)
        r = dict(id=p["id"], dur=round(d, 3), xf=xf, start=round(s, 2), trim=round(d - e, 2), cost=round(c, 2),
                 step_db=round(st[0], 1), spec=round(st[1], 1), dip=round(st[2], 1), pct=pct)
        results.append(r)
        print(json.dumps(r), flush=True)
    json.dump(results, open(sys.argv[3], "w"), indent=1)
