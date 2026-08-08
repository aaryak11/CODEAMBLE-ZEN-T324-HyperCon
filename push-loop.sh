#!/usr/bin/env bash
# Usage: ./push-loop.sh <path/to/video.mp4> <mediamtx-path-name>
# Example: ./push-loop.sh demo.mp4 store1
# Requires ffmpeg installed locally (not in this scaffold - install separately).

VIDEO="$1"
STREAM_PATH="${2:-store1}"

if [ -z "$VIDEO" ]; then
  echo "Usage: $0 <video-file> <mediamtx-path-name>"
  exit 1
fi

ffmpeg -re -stream_loop -1 -i "$VIDEO" -c copy -f rtsp "rtsp://localhost:8554/${STREAM_PATH}"
