#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AUDIO_DIR="$ROOT/audio"
TMP_DIR="${RUNNER_TEMP:-/tmp}/snack-attack-voices"
mkdir -p "$AUDIO_DIR" "$TMP_DIR"
rm -rf "$TMP_DIR"/*

fetch_pack() {
  local url="$1"
  local output="$2"
  if curl -fsSL --retry 3 --retry-delay 2 "$url" -o "$output"; then
    unzip -q -o "$output" -d "$TMP_DIR"
  else
    echo "Pack vocal indisponible, utilisation du secours pré-rendu."
  fi
}

fetch_pack "https://github.com/Loppansson/kenney-voiceover-fighter-for-godot/archive/08f93f0697459505e83f351f0e532115ca0550da.zip" "$TMP_DIR/fighter.zip"
fetch_pack "https://github.com/Loppansson/kenney-voiceover-for-godot/archive/362faddd616ff07dbbcd606fd960d43741bbd257.zip" "$TMP_DIR/general.zip"

copy_match() {
  local destination="$1"
  shift
  local match=""
  local pattern
  for pattern in "$@"; do
    match="$(find "$TMP_DIR" -type f \( -iname "$pattern.ogg" -o -iname "$pattern.wav" -o -iname "$pattern.mp3" \) | head -n 1 || true)"
    if [[ -n "$match" ]]; then
      break
    fi
  done
  if [[ -z "$match" ]]; then
    return 0
  fi
  ffmpeg -y -loglevel error -i "$match" -ar 22050 -ac 1 -c:a libvorbis -q:a 4 "$AUDIO_DIR/$destination.ogg"
  echo "Voix humaine intégrée: $destination <- $(basename "$match")"
}

copy_match combo '*combo' '*Combo'
copy_match super '*power*up*' '*Power*Up*'
copy_match mega '*multikill*' '*Multi*kill*'
copy_match legendary '*flawless*victory*' '*winner*' '*Winner*'
copy_match hurry '*hurry*up*' '*Hurry*Up*' '*time*'
