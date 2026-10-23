"""QA: transcribe each narration clip with Whisper (faster-whisper, small model, CPU) and print it
next to the intended text, as an automated stand-in for listening to every line.
Run: python -I tools/transcribe_vo.py
"""
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path
import soundfile as sf
from scipy.signal import resample_poly
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent.parent
VO = ROOT / "public" / "audio" / "vo"
timing = json.loads((VO / "vo-timing.json").read_text(encoding="utf-8"))
model = WhisperModel("small", device="cpu", compute_type="int8")
out = []
for key, rec in timing.items():
    if key == "_meta":
        continue
    audio, sr = sf.read(VO / f"{key}.wav", dtype="float32")
    audio = resample_poly(audio, 16000, sr).astype("float32")  # decode ourselves (PyAV API mismatch)
    segs, info = model.transcribe(audio, language="hi", beam_size=5)
    text = " ".join(s.text.strip() for s in segs)
    out.append({"id": key, "intended": rec["text"], "heard": text})
    print(f"{key}\n  intended: {rec['text']}\n  heard:    {text}\n")
(ROOT / "qa" / "vo-transcripts.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
