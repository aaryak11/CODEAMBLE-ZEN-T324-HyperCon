@echo off
REM HyperCon MediaMTX FFmpeg Stream Pusher for Windows
REM Usage: push-loop.bat [video-file] [mediamtx-path-name]
REM Example: push-loop.bat demo.mp4 store1

set VIDEO=%~1
if "%VIDEO%"=="" set VIDEO=demo.mp4

set STREAM_PATH=%~2
if "%STREAM_PATH%"=="" set STREAM_PATH=store1

echo Push loop video: %VIDEO% to rtsp://localhost:8554/%STREAM_PATH%

ffmpeg -re -stream_loop -1 -i "%VIDEO%" -c copy -f rtsp "rtsp://localhost:8554/%STREAM_PATH%"
