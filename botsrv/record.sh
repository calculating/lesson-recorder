#!/bin/bash
echo running
C:/ffmpeg/ffmpeg-N-99346-g003b5c800f-win64-gpl-shared/bin/ffmpeg.exe -y -f dshow -i video="UScreenCapture":audio="Stereo Mix (Realtek(R) Audio)" output.mkv