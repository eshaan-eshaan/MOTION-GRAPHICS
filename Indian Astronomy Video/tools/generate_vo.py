"""Generate the Hinglish narration with Microsoft's hi-IN neural voice (via edge-tts).

Each line is synthesised separately so the film can place it precisely. Hindi words are
written in Devanagari and English words in Latin script, which is how the hi-IN voice
pronounces code-mixed Hinglish most naturally. Word boundaries are saved so on-screen
reveals can be keyed to spoken words.

Output: public/audio/vo/<id>.mp3 and public/audio/vo/vo-timing.json
Run:    python tools/generate_vo.py
"""
import asyncio, json, subprocess, sys
from pathlib import Path

import edge_tts

VOICE = "hi-IN-SwaraNeural"
RATE = "+3%"
OUT = Path(__file__).resolve().parent.parent / "public" / "audio" / "vo"

LINES = [
    ("s1a", "आज हम Moon तक पहुँच चुके हैं।"),
    ("s1b", "लेकिन एक सवाल है... आसमान को समझने का सफ़र शुरू कैसे हुआ?"),
    ("s2a", "सदियों तक, observers ने Sun, Moon और stars के patterns को track किया।"),
    ("s2b", "इन observations से calendars बने, seasons को समझने में मदद मिली, और celestial cycles को predict करने के तरीक़े develop हुए।"),
    ("s3a", "फिर mathematics ने observations को deeper explanations दी।"),
    ("s3b", "आर्यभट ने Earth के rotation पर लिखा, और eclipses को supernatural events नहीं, बल्कि shadows के through explain किया।"),
    ("s4a", "Centuries बाद, जंतर मंतर जैसे observatories ने celestial positions को measure करने के लिए enormous instruments use किए।"),
    ("s4b", "यहाँ architecture ख़ुद एक scientific tool बन जाता है।"),
    ("s5a", "और आज, वही curiosity एक नए scale पर है।"),
    ("s5b", "चंद्रयान-3 ने 23 August 2023 को Moon के south polar region के पास successful soft landing की।"),
    ("s5c", "विक्रम lander और प्रज्ञान rover ने lunar surface पर scientific exploration की।"),
    ("s5d", "अब हम सिर्फ़ sky को observe नहीं करते... हम उसे explore भी करते हैं।"),
    ("s6a", "Tools बदले, methods बदले, लेकिन सवाल वही रहा: universe काम कैसे करता है?"),
    ("s6b", "Indian astronomy की journey हमें याद दिलाती है... observe करो, calculate करो, और explore करते रहो।"),
]


async def synth(line_id, text):
    comm = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
    audio, words = bytearray(), []
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            words.append({"text": chunk["text"], "start": chunk["offset"] / 1e7,
                          "end": (chunk["offset"] + chunk["duration"]) / 1e7})
    path = OUT / f"{line_id}.mp3"
    path.write_bytes(audio)
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                "-of", "csv=p=0", str(path)], capture_output=True, text=True).stdout)
    return {"id": line_id, "text": text, "file": f"audio/vo/{line_id}.mp3", "duration": round(dur, 3), "words": words}


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    only = set(sys.argv[1:])
    timing_path = OUT / "vo-timing.json"
    existing = json.loads(timing_path.read_text(encoding="utf-8")) if timing_path.exists() else {}
    for line_id, text in LINES:
        if only and line_id not in only:
            continue
        rec = await synth(line_id, text)
        existing[line_id] = rec
        print(f"{line_id}: {rec['duration']:.2f}s, {len(rec['words'])} words")
    meta = {"voice": VOICE, "rate": RATE, "engine": "Microsoft Edge neural TTS via edge-tts"}
    existing = {k: existing[k] for k, _ in LINES if k in existing}
    timing_path.write_text(json.dumps({"_meta": meta, **existing}, ensure_ascii=False, indent=1), encoding="utf-8")


asyncio.run(main())
