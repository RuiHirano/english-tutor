"""macOS `say` wrapper.

Synchronous (blocks until speech finishes) so the agent can sequence
prompts deterministically. Optionally caches audio to data/audio/ so
repeated playback (e.g., shadowing) is fast.

Usage from a Kiro skill:
    python -m english_tutor.audio.tts "Hello, world." --rate 180
    python -m english_tutor.audio.tts --file path/to/script.txt
"""

from __future__ import annotations

import argparse
import hashlib
import subprocess
import sys
from pathlib import Path

from english_tutor.db.connection import PROJECT_ROOT

AUDIO_DIR = PROJECT_ROOT / "data" / "audio"
DEFAULT_VOICE = "Samantha"
DEFAULT_RATE = 180  # words per minute


def _cache_path(text: str, voice: str, rate: int) -> Path:
    digest = hashlib.sha1(f"{voice}|{rate}|{text}".encode("utf-8")).hexdigest()[:16]
    return AUDIO_DIR / f"{digest}.aiff"


def speak(text: str, voice: str = DEFAULT_VOICE, rate: int = DEFAULT_RATE, cache: bool = True) -> None:
    if not text.strip():
        return
    if cache:
        AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        path = _cache_path(text, voice, rate)
        if not path.exists():
            subprocess.run(
                ["say", "-v", voice, "-r", str(rate), "-o", str(path), text],
                check=True,
            )
        subprocess.run(["afplay", str(path)], check=True)
    else:
        subprocess.run(["say", "-v", voice, "-r", str(rate), text], check=True)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Speak text via macOS `say`.")
    src = parser.add_mutually_exclusive_group(required=True)
    src.add_argument("text", nargs="?", help="Text to speak")
    src.add_argument("--file", help="Read text from file")
    parser.add_argument("--voice", default=DEFAULT_VOICE)
    parser.add_argument("--rate", type=int, default=DEFAULT_RATE)
    parser.add_argument("--no-cache", action="store_true")
    args = parser.parse_args(argv)

    text = Path(args.file).read_text(encoding="utf-8") if args.file else args.text
    speak(text, voice=args.voice, rate=args.rate, cache=not args.no_cache)
    return 0


if __name__ == "__main__":
    sys.exit(main())
