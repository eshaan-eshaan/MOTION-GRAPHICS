"""Procedurally compose the score and sound effects for "Indian Astronomy".

Everything is synthesised deterministically from src/data/cues.json, so the music is
locked to the picture: sections change on scene cuts and the largest payoff lands on the
"Chandrayaan-3" line. Key: D, Yaman / Lydian colour (D E F# G# A B C#), 120 BPM.

Instruments: tanpura drone (additive with a jawari-style moving formant), santoor-like
hammered ostinato, string-ensemble pads (detuned band-limited saws), soft bass pulse,
restrained frame-drum / kick / shaker, high string line, and a short bansuri phrase
for the resolution.

Output: public/audio/music/score.wav and public/audio/sfx/*.wav (48 kHz, 16-bit)
Run:    python -I tools/compose_score.py
"""
import json
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parent.parent
CUES = json.loads((ROOT / "src" / "data" / "cues.json").read_text(encoding="utf-8"))
SR = 48000
LENGTH = CUES["durationInFrames"] / CUES["fps"]  # 105 s
BEAT = 60.0 / CUES["music"]["bpm"]
M = CUES["music"]
rng = np.random.default_rng(1947)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def buf(seconds=LENGTH + 6):
    return np.zeros((2, int(seconds * SR)), dtype=np.float32)


def add(dst, sig, t0, pan=0.0, gain=1.0):
    """Mix a mono or stereo signal into dst at time t0 with equal-power panning."""
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)])
    i0 = int(round(t0 * SR))
    if i0 < 0:
        sig, i0 = sig[:, -i0:], 0
    n = min(sig.shape[1], dst.shape[1] - i0)
    if n > 0:
        dst[:, i0:i0 + n] += gain * sig[:, :n]


def env_adsr(n, a, d, s, r, total):
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel_start = total - r
    e = np.where(t > rel_start, e * np.clip(1 - (t - rel_start) / max(r, 1e-4), 0, 1), e)
    return e.astype(np.float32)


def lowpass(x, fc, order=2):
    return sosfilt(butter(order, fc, "low", fs=SR, output="sos"), x, axis=-1).astype(np.float32)


def highpass(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x, axis=-1).astype(np.float32)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x, axis=-1).astype(np.float32)


# ---------------------------------------------------------------- oscillators
def saw_table(f0, size=4096, ceiling=7000.0, tilt=1.15):
    k = max(1, int(ceiling / f0))
    ph = np.arange(size) / size
    tab = np.zeros(size)
    for h in range(1, k + 1):
        tab += np.sin(2 * np.pi * h * ph) / h ** tilt
    return (tab / np.max(np.abs(tab))).astype(np.float32)


def wavetable(table, freq, n):
    freq = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    phase = (np.cumsum(freq) / SR + rng.random()) % 1.0
    idx = phase * len(table)
    i0 = idx.astype(np.int64)
    frac = (idx - i0).astype(np.float32)
    return table[i0 % len(table)] * (1 - frac) + table[(i0 + 1) % len(table)] * frac


def lfo(n, rate, depth, phase=0.0):
    t = np.arange(n) / SR
    return depth * np.sin(2 * np.pi * rate * t + phase)


# ---------------------------------------------------------------- instruments
def pad_note(m, dur, attack=1.6, release=2.2, cutoff=2600.0, voices=3, detune_cents=7.0):
    n = int((dur + release) * SR)
    f0 = mtof(m)
    tab = saw_table(f0)
    out = np.zeros((2, n), dtype=np.float32)
    for v in range(voices):
        cents = (v - (voices - 1) / 2) * detune_cents + rng.normal(0, 1.5)
        vib = 1 + lfo(n, 0.17 + 0.05 * v, 0.0016, rng.random() * 6.28)
        sig = wavetable(tab, f0 * 2 ** (cents / 1200) * vib, n)
        pan = (v - (voices - 1) / 2) * 0.55
        a = (pan + 1) * np.pi / 4
        out[0] += sig * np.cos(a)
        out[1] += sig * np.sin(a)
    out = lowpass(out, min(cutoff, SR / 2 - 100), order=2)
    e = env_adsr(n, attack, 3.0, 0.82, release, dur + release)
    return out * e / voices


def chord(dst, t0, dur, notes, gain=0.1, **kw):
    for m in notes:
        # lower notes a touch louder, very high notes softer
        g = gain * (1.15 if m < 48 else 1.0 if m < 72 else 0.6)
        add(dst, pad_note(m, dur, **kw), t0, gain=g)


_PLUCK = {}


def pluck(m, dur=1.6, bright=1.0, inharm=0.0007, decay=2.2):
    """Hammered-dulcimer (santoor-like) tone: inharmonic partials, fast HF decay, felt noise."""
    key = (m, dur, round(bright * 2) / 2, decay)  # a few cached brightness variants per note
    if key in _PLUCK:
        return _PLUCK[key]
    bright = key[2]
    n = int(dur * SR)
    t = np.arange(n) / SR
    f0 = mtof(m)
    sig = np.zeros(n, dtype=np.float32)
    for h in range(1, 12):
        f = f0 * h * np.sqrt(1 + inharm * h * h)
        if f > 15000:
            break
        amp = (1.0 / h ** 1.05) * (bright if h > 3 else 1.0)
        rate = decay * (1 + 0.55 * (h - 1))
        sig += (amp * np.sin(2 * np.pi * f * t + rng.random() * 6.28) * np.exp(-rate * t)).astype(np.float32)
    # course of two strings per note -> slight beating
    sig += 0.5 * np.sin(2 * np.pi * f0 * 1.0016 * t).astype(np.float32) * np.exp(-decay * t).astype(np.float32)
    hammer = bandpass(rng.normal(0, 1, n).astype(np.float32), 1800, 6500) * np.exp(-t / 0.006).astype(np.float32)
    sig = sig + 0.25 * hammer
    att = np.clip(t / 0.002, 0, 1).astype(np.float32)
    _PLUCK[key] = sig * att * 0.35
    return _PLUCK[key]


_TANPURA = {}


def tanpura_note(m, dur=3.6):
    """Additive tanpura string with a jawari-like formant that sweeps up the harmonics."""
    if m in _TANPURA:
        return _TANPURA[m]
    n = int(dur * SR)
    t = np.arange(n) / SR
    f0 = mtof(m)
    sig = np.zeros(n, dtype=np.float32)
    centre = 3 + 14 * (1 - np.exp(-t / 0.9))  # formant moves from 3rd toward ~17th harmonic
    for h in range(1, 34):
        f = f0 * h
        if f > 9000:
            break
        formant = np.exp(-((h - centre) ** 2) / (2 * 3.2 ** 2))
        amp = (0.55 / h + 0.9 * formant / h ** 0.55)
        sig += (amp * np.sin(2 * np.pi * f * t + rng.random() * 6.28)).astype(np.float32)
    e = (np.exp(-t / 1.9) * np.clip(t / 0.004, 0, 1)).astype(np.float32)
    _TANPURA[m] = lowpass(sig * e, 5200) * 0.05
    return _TANPURA[m]


def bansuri(notes, t0, dst, gain=0.18, pan=0.12):
    """notes: list of (midi, start_rel, dur). Continuous breath with meend (glide) between notes."""
    end = max(s + d for _, s, d in notes) + 0.6
    n = int(end * SR)
    t = np.arange(n) / SR
    pitch = np.full(n, float(notes[0][0]))
    for i, (m, s, d) in enumerate(notes):
        i0 = int(s * SR)
        pitch[i0:] = m
        if i > 0:  # glide over 120 ms into the new note
            g = int(0.12 * SR)
            prev = notes[i - 1][0]
            pitch[i0:i0 + g] = prev + (m - prev) * (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, g)))
    amp = np.zeros(n, dtype=np.float32)
    for m, s, d in notes:
        i0, i1 = int(s * SR), int((s + d) * SR)
        seg = np.ones(i1 - i0, dtype=np.float32)
        a = min(int(0.09 * SR), len(seg))
        seg[:a] = np.linspace(0.3, 1, a)
        amp[i0:i1] = np.maximum(amp[i0:i1], seg)
    amp = lowpass(amp, 12)  # smooth phrasing
    vib_on = np.clip((t - 0.35) / 0.5, 0, 1)
    freq = mtof(0) * 2 ** ((pitch + 0.16 * vib_on * np.sin(2 * np.pi * 5.1 * t)) / 12)
    phase = np.cumsum(freq) / SR
    tone = (np.sin(2 * np.pi * phase) + 0.22 * np.sin(4 * np.pi * phase) + 0.06 * np.sin(6 * np.pi * phase))
    breath = bandpass(rng.normal(0, 1, n).astype(np.float32), 900, 4200) * 0.10
    sig = (tone.astype(np.float32) + breath) * amp
    add(dst, lowpass(sig, 6500), t0, pan=pan, gain=gain)


def kick(gain=1.0):
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    f = 44 + 90 * np.exp(-t / 0.045)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
    click = highpass(rng.normal(0, 1, n), 1500) * np.exp(-t / 0.003) * 0.15
    return ((body + click) * gain * 0.55).astype(np.float32)


def frame_drum(pitch=110.0, gain=1.0, decay=0.28):
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    f = pitch * (1 + 0.35 * np.exp(-t / 0.02))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / decay)
    skin = bandpass(rng.normal(0, 1, n), 300, 2400) * np.exp(-t / 0.035) * 0.45
    return ((body + skin) * gain * 0.4).astype(np.float32)


def shaker(gain=1.0):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    e = np.clip(t / 0.012, 0, 1) * np.exp(-t / 0.025)
    return (highpass(rng.normal(0, 1, n), 6500) * e * gain * 0.11).astype(np.float32)


def tick(gain=1.0, freq=2600.0):
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.006) + bandpass(rng.normal(0, 1, n), 2500, 7000) * np.exp(-t / 0.002) * 0.6
    return (s * gain * 0.3).astype(np.float32)


def bass_pulse(m, dur=0.22, gain=1.0):
    n = int((dur + 0.15) * SR)
    f0 = mtof(m)
    sig = wavetable(saw_table(f0, ceiling=1600), f0, n) * 0.5 + np.sin(2 * np.pi * f0 * np.arange(n) / SR) * 0.8
    e = env_adsr(n, 0.006, 0.12, 0.4, 0.12, dur + 0.15)
    return lowpass(sig * e, 700) * gain * 0.35


def make_ir(seconds=3.4, predelay=0.022, damp=5200.0, seed=7):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    decay = np.exp(-6.91 * t / seconds)
    ir = r.normal(0, 1, (2, n)) * decay
    ir = lowpass(ir, damp)
    # darker late tail
    ir = ir * (0.55 + 0.45 * np.exp(-t / 0.6)) + lowpass(ir, 1800) * (0.45 * (1 - np.exp(-t / 0.6)))
    pd = int(predelay * SR)
    ir = np.concatenate([np.zeros((2, pd)), ir], axis=1)
    for d, g in [(0.011, 0.5), (0.019, 0.35), (0.031, 0.25)]:  # early reflections
        ir[0, int(d * SR)] += g
        ir[1, int((d + 0.004) * SR)] += g
    return (ir / np.sqrt(np.sum(ir ** 2) / 2)).astype(np.float32)


IR_HALL = make_ir()


def reverb(x, wet=0.3, ir=IR_HALL):
    w = np.stack([fftconvolve(x[0], ir[0])[: x.shape[1]], fftconvolve(x[1], ir[1])[: x.shape[1]]]).astype(np.float32)
    return x * (1 - wet * 0.35) + w * wet


def chord_tones(notes, lo=62, hi=86):
    pcs = sorted({m % 12 for m in notes})
    out = [m for m in range(lo, hi) if m % 12 in pcs]
    return out


# ---------------------------------------------------------------- the score
CHORDS = [
    # (start, end, notes)
    (0.6, 6.2, [50, 57, 64]),
    (6.2, 10.0, [50, 57, 62, 66, 76]),
    (10.0, 14.0, [50, 59, 64, 68]),
    (14.0, 18.0, [47, 54, 62, 64]),
    (18.0, 22.0, [43, 55, 59, 66, 73]),
    (22.0, 26.0, [45, 57, 62, 64]),
    (26.0, 30.0, [42, 50, 57, 64, 66]),
    (30.0, 34.0, [47, 54, 59, 62, 66]),
    (34.0, 38.0, [43, 50, 59, 62, 69]),
    (38.0, 42.0, [45, 52, 61, 64, 69]),
    (42.0, 46.0, [38, 50, 57, 62, 66, 69]),
    (46.0, 50.0, [38, 50, 59, 64, 68, 71]),
    (50.0, 54.0, [35, 47, 54, 62, 66, 71]),
    (54.0, 56.5, [43, 55, 59, 61, 66]),
    (56.5, 62.0, [45, 57, 62, 64, 69, 76]),
    (62.0, 66.0, [38, 50, 57, 62, 64, 66, 69, 76]),
    (66.0, 70.0, [38, 50, 59, 64, 68, 71, 76]),
    (70.0, 74.0, [35, 47, 54, 61, 62, 66, 73]),
    (74.0, 76.0, [43, 55, 59, 62, 66, 71]),
    (76.0, 78.0, [43, 55, 59, 61, 66, 73, 78]),
    (78.0, 80.0, [42, 54, 57, 62, 69, 74]),
    (80.0, 82.0, [43, 55, 62, 66, 71]),
    (82.0, 83.5, [45, 57, 62, 64, 69]),
    (83.5, 88.0, [43, 55, 59, 61, 66, 73]),
    (88.0, 92.0, [38, 50, 59, 64, 68]),
    (92.0, 96.0, [47, 54, 57, 62, 66]),
    (96.0, 97.5, [43, 55, 62, 66, 71]),
    (97.5, 99.0, [45, 57, 61, 64, 69]),
    (99.0, 103.5, [38, 50, 57, 62, 64, 66, 74]),
]


def section_level(t):
    """Overall pad level / brightness by section."""
    if t < M["observe"]:
        return 0.07, 1400
    if t < M["calculate"]:
        return 0.075, 2200
    if t < M["measure"]:
        return 0.08, 2800
    if t < M["anticipation"]:
        return 0.085, 3300
    if t < M["impact"]:
        return 0.07, 2600
    if t < M["reflect"]:
        return 0.1, 4800
    return 0.075, 2400


def chord_at(t):
    for s, e, n in CHORDS:
        if s <= t < e:
            return n
    return CHORDS[-1][2]


def compose():
    pads, plucks, perc, drone, lead = buf(), buf(), buf(), buf(), buf()

    # Pads -------------------------------------------------------------------
    for s, e, notes in CHORDS:
        g, fc = section_level(s)
        dur = e - s + 0.35
        att = 2.2 if s < 1 else 0.9 if s in (M["impact"], 6.2) else 1.3
        if s == M["impact"]:
            att = 0.05
        rel = 4.5 if s >= 99 else 1.8
        chord(pads, s, dur, notes, gain=g, attack=att, release=rel, cutoff=fc)
    # riser in anticipation: same chord through a filter that opens
    for i, fc in enumerate([1800, 3200, 5600]):
        seg0 = M["anticipation"] + i * 1.8
        chord(pads, seg0, 2.2, [69, 76, 81], gain=0.03 + 0.012 * i, attack=1.4, release=0.8, cutoff=fc)

    # Tanpura drone: Pa Sa Sa Sa(low) -------------------------------------------
    pattern = [45, 50, 50, 38]
    t = 0.3
    k = 0
    while t < LENGTH - 2:
        level = 1.0
        if M["calculate"] <= t < M["anticipation"]:
            level = 0.45
        elif M["impact"] <= t < M["reflect"]:
            level = 0.35
        if t < 3:
            level *= t / 3
        add(drone, tanpura_note(pattern[k % 4]), t, pan=[-0.35, 0.1, 0.25, -0.1][k % 4], gain=level)
        t += 0.75
        k += 1

    # Santoor ostinato -----------------------------------------------------------
    figure8 = [0, 2, 1, 3, 2, 4, 3, 1]
    figure16 = [0, 2, 4, 2, 1, 3, 5, 3, 0, 2, 4, 6, 5, 3, 2, 1]

    def ostinato(t0, t1, step, figure, gain, lo=62, hi=86, accent=1.35):
        i = 0
        t = t0
        while t < t1 - 1e-6:
            tones = chord_tones(chord_at(t + 0.01), lo, hi)
            m = tones[figure[i % len(figure)] % len(tones)]
            beat_pos = (t / BEAT) % 4
            acc = accent if abs(beat_pos - round(beat_pos)) < 1e-3 and round(beat_pos) % 2 == 0 else 1.0
            vel = gain * acc * (0.85 + 0.15 * rng.random())
            add(plucks, pluck(m, dur=1.4 if step < 0.2 else 2.0, bright=0.8 + 0.4 * rng.random()), t + rng.normal(0, 0.003),
                pan=np.clip((m - 74) / 16, -0.6, 0.6), gain=vel)
            t += step
            i += 1

    ostinato(10.0, 25.0, BEAT / 2, figure8, 0.16)
    ostinato(25.0, 42.0, BEAT / 4, figure16, 0.12)
    ostinato(42.0, 56.0, BEAT / 4, figure16, 0.14)
    ostinato(62.0, 83.0, BEAT / 4, figure16, 0.15, lo=64, hi=90)
    ostinato(84.0, 92.0, BEAT, figure8, 0.11)
    ostinato(92.0, 99.0, BEAT / 2, figure8, 0.10)
    # a single bell-like pluck on the opening star trace and title
    add(plucks, pluck(86, dur=3.0, decay=0.9), 1.0, pan=0.3, gain=0.18)
    add(plucks, pluck(81, dur=3.0, decay=0.9), 6.2, pan=-0.2, gain=0.16)

    # Bass pulse -------------------------------------------------------------------
    def bass(t0, t1, step, gain):
        t = t0
        while t < t1 - 1e-6:
            root = min(chord_at(t + 0.01))
            while root > 45:
                root -= 12
            while root < 33:
                root += 12
            add(perc, bass_pulse(root, gain=gain), t, gain=1.0)
            t += step

    bass(26.0, 42.0, BEAT / 2, 0.5)
    bass(42.0, 56.0, BEAT / 2, 0.65)
    bass(62.0, 83.0, BEAT / 2, 0.8)

    # Percussion ----------------------------------------------------------------------
    def beats(t0, t1):
        n0, n1 = int(round(t0 / BEAT)), int(round(t1 / BEAT))
        return [b * BEAT for b in range(n0, n1)]

    for b in beats(26.0, 42.0):
        pos = round(b / BEAT) % 4
        if pos in (0, 2):
            add(perc, frame_drum(105, 0.55), b, pan=-0.1)
        for s in range(4):
            add(perc, shaker(0.35 + (0.2 if s == 2 else 0)), b + s * BEAT / 4, pan=0.35)
    for b in beats(42.0, 56.0):
        pos = round(b / BEAT) % 4
        if pos == 0:
            add(perc, kick(0.7), b)
        if pos in (0, 2):
            add(perc, frame_drum(92, 0.8), b, pan=-0.15)
        if pos == 1:
            add(perc, frame_drum(140, 0.4, decay=0.15), b + BEAT * 0.5, pan=0.2)
        if pos == 3:
            add(perc, frame_drum(118, 0.55, decay=0.2), b + BEAT * 0.5, pan=0.1)
        for s in range(4):
            add(perc, shaker(0.45 + (0.25 if s == 2 else 0)), b + s * BEAT / 4, pan=0.35)
    # gather into the drop: a crescendo of frame-drum strokes before the impact
    t = 59.0
    while t < M["impact"] - 0.05:
        p = (t - 59.0) / 3.0
        add(perc, frame_drum(100 + 30 * p, 0.12 + 0.6 * p * p, decay=0.12), t, pan=rng.uniform(-0.3, 0.3))
        t += BEAT / (2 + 2 * int(p * 3))
    for b in beats(62.0, 83.0):
        pos = round(b / BEAT) % 4
        if pos in (0, 2):
            add(perc, kick(1.0 if pos == 0 else 0.8), b)
        if pos in (1, 3):
            add(perc, frame_drum(150, 0.55, decay=0.14), b, pan=0.12)
        if pos == 3:
            add(perc, frame_drum(96, 0.65), b + BEAT * 0.5, pan=-0.15)
        for s in range(4):
            add(perc, shaker(0.5 + (0.3 if s == 2 else 0)), b + s * BEAT / 4, pan=0.4)
    for b in beats(92.0, 99.0):
        if round(b / BEAT) % 4 == 0:
            add(perc, kick(0.4), b)

    # High string line (payoff) ---------------------------------------------------------
    line = [(62.0, 66.0, 81), (66.0, 70.0, 80), (70.0, 74.0, 78), (74.0, 78.0, 83), (78.0, 82.0, 81), (82.0, 83.8, 76)]
    for s, e, m in line:
        add(lead, pad_note(m, e - s, attack=0.7, release=1.2, cutoff=6000, voices=4, detune_cents=9), s, gain=0.05)

    # Bansuri: a phrase in the gap before Reflect, and the final resolution to Sa ----------
    bansuri([(69, 0.0, 0.55), (71, 0.5, 0.45), (73, 0.9, 0.9), (74, 1.75, 1.1)], 81.85, lead, gain=0.16)
    bansuri([(78, 0.0, 0.7), (76, 0.65, 0.6), (74, 1.2, 0.35), (73, 1.5, 0.3), (74, 1.8, 2.6)], 99.2, lead, gain=0.17)

    # Mix -------------------------------------------------------------------------------
    mix = (reverb(pads, 0.42) * 1.0 + reverb(drone, 0.35) * 1.0 + reverb(plucks, 0.3) * 1.0
           + reverb(perc, 0.16) * 1.0 + reverb(lead, 0.45) * 1.0)
    mix = highpass(mix, 28)
    n = int(LENGTH * SR)
    mix = mix[:, :n]
    # gentle fade at the very end
    fade = int(2.0 * SR)
    mix[:, -fade:] *= np.linspace(1, 0, fade) ** 1.5
    return mix


def master(x, target_peak=0.89):
    # soft saturation + simple look-ahead limiter
    x = np.tanh(x * 1.2) / 1.2
    peak = np.max(np.abs(x), axis=0)
    win = int(0.005 * SR)
    # sliding max over a 10 ms window, smoothed gain
    from scipy.ndimage import maximum_filter1d, uniform_filter1d
    env = maximum_filter1d(peak, size=2 * win + 1)
    gain = np.minimum(1.0, target_peak / np.maximum(env, 1e-9))
    gain = uniform_filter1d(gain, size=2 * win + 1)
    return (x * gain).astype(np.float32)


def loudness_normalise(x, target_lufs):
    try:
        import pyloudnorm as pyln
        meter = pyln.Meter(SR)
        lufs = meter.integrated_loudness(x.T)
        g = 10 ** ((target_lufs - lufs) / 20)
        print(f"  loudness {lufs:.1f} LUFS -> {target_lufs} LUFS")
    except ImportError:
        rms = np.sqrt(np.mean(x ** 2))
        g = 10 ** ((target_lufs + 3) / 20) / max(rms, 1e-9)
    return x * g


# ---------------------------------------------------------------- sound effects
def sfx():
    out = {}
    # opening atmospheric swell (4.5 s)
    n = int(5.5 * SR)
    t = np.arange(n) / SR
    noise = lowpass(rng.normal(0, 1, (2, n)), 900)
    body = np.sin(2 * np.pi * 55 * t) * 0.5 + np.sin(2 * np.pi * 82.4 * t) * 0.25
    e = np.clip(t / 3.2, 0, 1) ** 2 * np.exp(-np.clip(t - 3.2, 0, None) / 0.9)
    out["swell"] = reverb((noise * 0.6 + body) * e, 0.5) * 0.5

    # star-trace accent: glassy bell + rising shimmer (3 s)
    n = int(3.5 * SR)
    t = np.arange(n) / SR
    bell = sum(a * np.sin(2 * np.pi * mtof(86) * r * t) * np.exp(-t * d)
               for r, a, d in [(1, 1, 1.4), (2.76, 0.45, 2.6), (5.4, 0.25, 4.5), (8.93, 0.12, 7)])
    shimmer = bandpass(rng.normal(0, 1, n), 5000, 11000) * np.clip(t / 1.2, 0, 1) * np.exp(-t / 1.1) * 0.25
    s = (bell * 0.5 + shimmer) * np.clip(t / 0.004, 0, 1)
    out["trace"] = reverb(np.stack([s, np.roll(s, 240)]), 0.55) * 0.35

    # observation tick bed: quiet ticks on the beat for 14.5 s, accent every bar
    n = int(15.0 * SR)
    bed = np.zeros((2, n), dtype=np.float32)
    for b in range(int(14.5 / BEAT)):
        g = 0.8 if b % 4 == 0 else 0.45
        add(bed, tick(g, 3100 if b % 4 == 0 else 2500), b * BEAT, pan=0.25 if b % 2 else -0.25)
    out["observe-ticks"] = reverb(bed, 0.25) * 0.5

    # precise click for mathematical reveals
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    c = np.sin(2 * np.pi * 3700 * t) * np.exp(-t / 0.012) * 0.6 + highpass(rng.normal(0, 1, n), 3000) * np.exp(-t / 0.0015)
    out["click"] = reverb(np.stack([c, c]), 0.2) * 0.32

    # soft transition sweep (1.4 s), panning left to right
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    nz = rng.normal(0, 1, n)
    lo = bandpass(nz, 400, 1500)
    hi = bandpass(nz, 2000, 6000)
    mixw = np.clip(t / 1.4, 0, 1)
    s = (lo * (1 - mixw) + hi * mixw) * np.sin(np.pi * np.clip(t / 1.4, 0, 1)) ** 2
    pan = -0.7 + 1.4 * mixw
    a = (pan + 1) * np.pi / 4
    out["sweep"] = reverb(np.stack([s * np.cos(a), s * np.sin(a)]), 0.35) * 0.22

    # controlled lunar impact: sub drop + low drum + air, long tail (6 s)
    n = int(6.5 * SR)
    t = np.arange(n) / SR
    f = 36 + 60 * np.exp(-t / 0.09)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.1)
    drum = frame_drum(72, 1.0, decay=0.5)
    air = lowpass(rng.normal(0, 1, n), 2500) * np.exp(-t / 0.35) * 0.25
    s = sub * 0.9 + air
    s[: len(drum)] += drum * 1.4
    out["impact"] = reverb(np.stack([s, s]), 0.4) * 0.55

    # spacious swell that blooms after the impact (7 s)
    n = int(7.0 * SR)
    s = np.zeros((2, n), dtype=np.float32)
    for m in (62, 69, 74, 78, 81):
        s += pad_note(m, 5.0, attack=2.2, release=2.0, cutoff=5200, voices=3)[:, :n] * 0.2
    out["space-swell"] = reverb(s, 0.6) * 0.7

    # light chime for the closing words
    n = int(2.5 * SR)
    t = np.arange(n) / SR
    for name, m in (("chime-a", 81), ("chime-b", 83), ("chime-c", 86)):
        b = sum(a * np.sin(2 * np.pi * mtof(m) * r * t) * np.exp(-t * d)
                for r, a, d in [(1, 1, 2.0), (2.0, 0.3, 3.5), (3.01, 0.12, 5)])
        b = b * np.clip(t / 0.003, 0, 1)
        out[name] = reverb(np.stack([b, b]), 0.45) * 0.16
    return out


def write(path, x):
    path.parent.mkdir(parents=True, exist_ok=True)
    peak = np.max(np.abs(x))
    if peak > 0.98:
        x = x * (0.98 / peak)
    sf.write(path, x.T.astype(np.float32), SR, subtype="PCM_16")
    print(f"wrote {path.relative_to(ROOT)} ({x.shape[1] / SR:.2f}s, peak {np.max(np.abs(x)):.2f})")


if __name__ == "__main__":
    score = compose()
    score = loudness_normalise(score, -17.0)
    score = master(score)
    write(ROOT / "public" / "audio" / "music" / "score.wav", score)
    for name, x in sfx().items():
        write(ROOT / "public" / "audio" / "sfx" / f"{name}.wav", x.astype(np.float32))
