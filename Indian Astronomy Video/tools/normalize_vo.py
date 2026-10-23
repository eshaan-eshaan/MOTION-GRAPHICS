"""Loudness-normalise the narration clips to -16 LUFS (48 kHz WAV) for a consistent voice level.

Reads public/audio/vo/<id>.mp3 (from generate_vo.py), writes public/audio/vo/<id>.wav and
points vo-timing.json at the WAV files.
Run: python -I tools/normalize_vo.py
"""
import json, subprocess, io
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
VO = ROOT / "public" / "audio" / "vo"
TARGET = -16.0
SR = 48000

timing = json.loads((VO / "vo-timing.json").read_text(encoding="utf-8"))
meter = pyln.Meter(SR)
for key, rec in timing.items():
    if key == "_meta":
        continue
    mp3 = VO / f"{key}.mp3"
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp3), "-ac", "1", "-ar", str(SR), "-f", "wav", "-"],
                         capture_output=True, check=True).stdout
    x, _ = sf.read(io.BytesIO(raw), dtype="float32")
    lufs = meter.integrated_loudness(x)
    y = x * 10 ** ((TARGET - lufs) / 20)
    peak = np.max(np.abs(y))
    if peak > 0.95:
        y *= 0.95 / peak
    sf.write(VO / f"{key}.wav", y, SR, subtype="PCM_16")
    rec["file"] = f"audio/vo/{key}.wav"
    rec["duration"] = round(len(y) / SR, 3)
    print(f"{key}: {lufs:.1f} -> {TARGET} LUFS, peak {np.max(np.abs(y)):.2f}")
timing["_meta"]["loudness"] = f"{TARGET} LUFS integrated per clip"
(VO / "vo-timing.json").write_text(json.dumps(timing, ensure_ascii=False, indent=1), encoding="utf-8")
