#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/audio/music-loop.ogg"
TARGET="$ROOT/audio/music-loop.mp3"

if [[ ! -s "$SOURCE" ]]; then
  echo "Musique OGG introuvable: $SOURCE" >&2
  exit 1
fi

ffmpeg -y -loglevel error -i "$SOURCE" -codec:a libmp3lame -b:a 160k -ar 44100 -ac 2 "$TARGET"

test -s "$TARGET"
echo "Musique MP3 Android prête: $(stat -c%s "$TARGET") octets"
