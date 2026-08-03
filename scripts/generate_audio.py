#!/usr/bin/env python3
from __future__ import annotations

import math
import random
import shutil
import struct
import subprocess
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "audio"
SAMPLE_RATE = 22_050


def clamp(value: float) -> float:
    return max(-1.0, min(1.0, value))


def envelope(index: int, total: int, attack: float = 0.01, release: float = 0.08) -> float:
    attack_n = max(1, int(SAMPLE_RATE * attack))
    release_n = max(1, int(SAMPLE_RATE * release))
    if index < attack_n:
        return index / attack_n
    if index >= total - release_n:
        return max(0.0, (total - index - 1) / release_n)
    return 1.0


def osc(freq: float, duration: float, kind: str = "sine", amp: float = 0.3) -> list[float]:
    total = max(1, int(SAMPLE_RATE * duration))
    result: list[float] = []
    for index in range(total):
        t = index / SAMPLE_RATE
        phase = (freq * t) % 1.0
        if kind == "square":
            value = 1.0 if phase < 0.5 else -1.0
        elif kind == "triangle":
            value = 4.0 * abs(phase - 0.5) - 1.0
        elif kind == "saw":
            value = 2.0 * phase - 1.0
        else:
            value = math.sin(2.0 * math.pi * freq * t)
        result.append(value * amp * envelope(index, total))
    return result


def mix(parts: list[tuple[float, list[float]]], duration: float) -> list[float]:
    result = [0.0] * max(1, int(SAMPLE_RATE * duration))
    for start, signal in parts:
        offset = int(start * SAMPLE_RATE)
        for index, value in enumerate(signal):
            target = offset + index
            if target >= len(result):
                break
            result[target] += value
    return [math.tanh(value * 1.25) for value in result]


def save_wav(path: Path, samples: list[float]) -> None:
    peak = max((abs(value) for value in samples), default=1.0) or 1.0
    scale = 0.92 / peak
    pcm = bytearray()
    for value in samples:
        pcm.extend(struct.pack("<h", int(clamp(value * scale) * 32767)))
    with wave.open(str(path), "wb") as target:
        target.setnchannels(1)
        target.setsampwidth(2)
        target.setframerate(SAMPLE_RATE)
        target.writeframes(bytes(pcm))


def frequency(root: float, semitones: int) -> float:
    return root * (2.0 ** (semitones / 12.0))


def generate_music() -> list[float]:
    duration = 16.0
    beat_seconds = 0.5
    root = 261.63
    melody = [0, 4, 7, 9, 7, 4, 2, 4]
    bass = [-12, -12, -17, -17, -15, -15, -17, -17]
    parts: list[tuple[float, list[float]]] = []
    beat_count = int(duration / beat_seconds)
    for beat in range(beat_count):
        start = beat * beat_seconds
        octave = 12 if (beat // 8) % 2 else 0
        parts.append((start, osc(frequency(root, melody[beat % len(melody)] + octave), 0.18, "triangle", 0.17)))
        if beat % 2 == 0:
            parts.append((start, osc(frequency(root, bass[(beat // 2) % len(bass)]), 0.36, "sine", 0.22)))

        kick_total = int(SAMPLE_RATE * 0.12)
        kick: list[float] = []
        for index in range(kick_total):
            t = index / SAMPLE_RATE
            freq = 95.0 - 55.0 * (t / 0.12)
            kick.append(math.sin(2.0 * math.pi * freq * t) * math.exp(-28.0 * t) * 0.45)
        parts.append((start, kick))

        rng = random.Random(beat + 44)
        hat_total = int(SAMPLE_RATE * 0.06)
        hat = [(rng.uniform(-1.0, 1.0) * math.exp(-55.0 * (i / SAMPLE_RATE)) * 0.11) for i in range(hat_total)]
        parts.append((start + beat_seconds * 0.5, hat))
    result = mix(parts, duration)
    fade = min(500, len(result) // 4)
    for index in range(fade):
        result[index] *= index / fade
        result[-index - 1] *= index / fade
    return result


def generate_effects() -> dict[str, list[float]]:
    effects: dict[str, list[float]] = {}
    effects["pop"] = mix([
        (0.0, osc(520, 0.09, "triangle", 0.50)),
        (0.045, osc(760, 0.12, "sine", 0.45)),
        (0.09, osc(1040, 0.12, "triangle", 0.35)),
    ], 0.28)
    effects["bad"] = mix([
        (0.0, osc(190, 0.18, "saw", 0.45)),
        (0.04, osc(145, 0.20, "square", 0.25)),
    ], 0.30)

    total = int(SAMPLE_RATE * 0.55)
    rng = random.Random(2)
    bomb: list[float] = []
    for index in range(total):
        t = index / SAMPLE_RATE
        freq = 100.0 - 65.0 * (t / 0.55)
        boom = math.sin(2.0 * math.pi * freq * t) * math.exp(-7.0 * t) * 0.65
        noise = rng.uniform(-1.0, 1.0) * math.exp(-9.0 * t) * 0.22
        bomb.append(boom + noise)
    effects["bomb"] = bomb

    effects["laser"] = mix([
        (0.0, osc(1200, 0.18, "saw", 0.38)),
        (0.05, osc(800, 0.20, "square", 0.25)),
        (0.11, osc(420, 0.25, "triangle", 0.35)),
    ], 0.45)
    effects["rainbow"] = mix([
        (index * 0.055, osc(300 * (2.0 ** (index / 7.0)), 0.17, "triangle", 0.30))
        for index in range(9)
    ], 0.75)
    effects["victory"] = mix([
        (index * 0.12, osc(freq, 0.34, "triangle", 0.34))
        for index, freq in enumerate([523, 659, 784, 1047, 1319])
    ], 1.0)
    effects["failure"] = mix([
        (index * 0.15, osc(freq, 0.35, "saw", 0.22))
        for index, freq in enumerate([330, 277, 220, 165])
    ], 0.95)
    effects["unlock"] = osc(880, 0.04, "sine", 0.06)
    return effects


def run(command: list[str]) -> None:
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def convert_to_ogg(wav_path: Path, ogg_path: Path) -> None:
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_path), "-c:a", "libvorbis", "-q:a", "4", str(ogg_path)])


def generate_fallback_voice(name: str, text: str) -> None:
    ogg_path = AUDIO_DIR / f"{name}.ogg"
    if ogg_path.exists() and ogg_path.stat().st_size > 1000:
        return
    raw_path = AUDIO_DIR / f"{name}-raw.wav"
    processed_path = AUDIO_DIR / f"{name}-processed.wav"
    run(["espeak", "-v", "fr", "-s", "165", "-p", "42", "-a", "190", "-w", str(raw_path), text])
    run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(raw_path),
        "-af", "highpass=f=120,lowpass=f=6500,acompressor=threshold=-18dB:ratio=4:attack=5:release=80,aecho=0.8:0.45:70|140:0.22|0.12,volume=1.35",
        "-ar", str(SAMPLE_RATE), "-ac", "1", str(processed_path),
    ])
    convert_to_ogg(processed_path, ogg_path)
    raw_path.unlink(missing_ok=True)
    processed_path.unlink(missing_ok=True)


def main() -> int:
    missing_tools = [tool for tool in ("ffmpeg", "espeak") if shutil.which(tool) is None]
    if missing_tools:
        print(f"Outils audio manquants: {', '.join(missing_tools)}", file=sys.stderr)
        return 2

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    generated: dict[str, list[float]] = {"music-loop": generate_music(), **generate_effects()}
    for name, samples in generated.items():
        wav_path = AUDIO_DIR / f"{name}.wav"
        ogg_path = AUDIO_DIR / f"{name}.ogg"
        save_wav(wav_path, samples)
        convert_to_ogg(wav_path, ogg_path)
        wav_path.unlink(missing_ok=True)

    fallback_lines = {
        "combo": "Combo !",
        "super": "Super snack !",
        "mega": "Méga attaque !",
        "legendary": "Snack légendaire !",
        "hurry": "Vite !",
    }
    for name, text in fallback_lines.items():
        generate_fallback_voice(name, text)

    credit = AUDIO_DIR / "CREDITS.txt"
    credit.write_text(
        "Snack Attack original music and effects generated during the build.\n"
        "When available, human announcer clips are taken from Kenney Voiceover packs (CC0).\n"
        "Fallback announcer clips are pre-rendered during the build and do not use the phone TTS engine.\n",
        encoding="utf-8",
    )
    print("Audio Snack Attack généré:", ", ".join(sorted(path.name for path in AUDIO_DIR.glob("*.ogg"))))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
