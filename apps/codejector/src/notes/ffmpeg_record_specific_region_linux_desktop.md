Playwright cannot capture arbitrary areas of your desktop.
To record a specific region of the **Linux desktop** you can use **FFmpeg with the `x11grab` input device**.
Below is a professional, step-by-step guide that you can integrate into a NestJS service if desired.

---

## 1. Prerequisites

Make sure FFmpeg is installed:

```bash
sudo apt update
sudo apt install ffmpeg
```

---

## 2. Identify Your Display and Region

### Find Your X11 Display

Usually:

```
echo $DISPLAY
```

Outputs something like:

```
:0.0
```

Use `:0.0` in the command below.

### Determine Region Coordinates

Decide the **x,y** offset and **width x height** of the rectangle you want to capture.
For example:

* Top-left corner of region: **x=100, y=200**
* Width = **1280**
* Height = **720**

This region is expressed as:

```
1280x720+100,200
```

---

## 3. FFmpeg Command

Record the region and save it as a `.mkv` or `.mp4`:

```bash
ffmpeg -video_size 1280x720 \
       -framerate 30 \
       -f x11grab \
       -i :0.0+100,200 \
       -codec:v libx264 -preset ultrafast -pix_fmt yuv420p \
       output.mkv
```

### Options Explained

| Option                 | Description                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| `-video_size 1280x720` | Width × height of capture region                                    |
| `-framerate 30`        | Frames per second                                                   |
| `-f x11grab`           | Use the X11 screen-grab input                                       |
| `-i :0.0+100,200`      | Display + offset (`:0.0` is your display, `+100,200` is x,y offset) |
| `-codec:v libx264`     | Encode video with H.264                                             |
| `-preset ultrafast`    | Faster encoding (larger files)                                      |
| `-pix_fmt yuv420p`     | Ensure broad player compatibility                                   |
| `output.mkv`           | Destination file                                                    |

Press **Ctrl+C** to stop recording.

---

## 4. Automating in a NestJS Service (Optional)

You can spawn FFmpeg from your NestJS application:

```ts
import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';

@Injectable()
export class ScreenRecorderService {
  startRecording() {
    const args = [
      '-video_size', '1280x720',
      '-framerate', '30',
      '-f', 'x11grab',
      '-i', ':0.0+100,200',
      '-codec:v', 'libx264', '-preset', 'ultrafast',
      '-pix_fmt', 'yuv420p',
      'output.mkv'
    ];
    const ffmpeg = spawn('ffmpeg', args);

    ffmpeg.stderr.on('data', data => {
      console.log(`FFmpeg: ${data}`);
    });

    return ffmpeg; // keep a reference to stop later
  }

  stopRecording(ffmpegProcess: any) {
    ffmpegProcess.kill('SIGINT'); // stops recording gracefully
  }
}
```

> **Tip:** Always validate user input for coordinates and file names to avoid security issues.

---

## 5. Additional Considerations

* **Audio Capture:** Add `-f pulse -i default` (for PulseAudio) to capture system audio.
* **Output Format:** Use `.mp4` if you need broad compatibility (`output.mp4` works with the same options).
* **Performance:** For long recordings, ensure enough disk space and consider adjusting the `-preset` for the desired quality/size trade-off.

---

### ✅ Key Takeaway

To record an **arbitrary region of the desktop**, bypass Playwright and use **FFmpeg with the `x11grab` input**, specifying the region as `<width>x<height>+<x_offset>,<y_offset>`.
You can easily automate the FFmpeg command from within a NestJS application if needed.


In the context of **FFmpeg with `x11grab`**, the string

```
:0
```

(or sometimes written as `:0.0`) refers to your **X display**.

### What It Means

* **X11 display naming format:** `hostname:display.screen`

  * `hostname` – usually empty when you’re capturing your local machine.
  * `display` – the X server instance number.
  * `screen` – the screen number within that display.

* `:0` is shorthand for `:0.0`

  * **`:0`** → first display (`display number 0`)
  * **`.0`** → first screen of that display.

This is the default for most desktop environments on Linux running a single graphical session.

### Usage in FFmpeg

When you run:

```bash
ffmpeg -f x11grab -i :0 ...
```

you are telling FFmpeg:

> “Connect to the first X server running on the local machine and capture from its first screen.”

If you need to capture a particular region, you typically add an offset:

```bash
ffmpeg -video_size 1280x720 -f x11grab -i :0.0+100,200 output.mkv
```

* `+100,200` is the **x,y offset** (pixels from the top-left corner of the display).

### Checking Your Display

You can verify your current display setting:

```bash
echo $DISPLAY
```

Typical output:

```
:0
```

If your session is on a different display (for example via remote X forwarding) you might see something like `:1` or `localhost:10.0`. Use that value instead in the FFmpeg command.

---

**Summary:**
`:0` simply identifies the primary X server display of your running Linux desktop, and is required by `x11grab` so FFmpeg knows which X server to capture.


Below is an **advanced FFmpeg + `x11grab` workflow** you can adapt to a NestJS service or script when you need more than a simple “capture this rectangle” command.
This example demonstrates:

* **Region capture with audio**
* **Hardware-accelerated encoding**
* **On-the-fly compression**
* **Segmented recording** for long sessions (auto-splits files)
* **Custom timestamps & metadata**

---

## 1️⃣ Advanced FFmpeg Command

```bash
ffmpeg \
  -thread_queue_size 512 \
  -video_size 1920x1080 \
  -framerate 60 \
  -f x11grab -i :0.0+200,100 \
  -f pulse -i default \
  -c:v h264_vaapi -b:v 8M -maxrate 8M -bufsize 16M \
  -c:a aac -b:a 192k \
  -preset fast \
  -pix_fmt yuv420p \
  -strftime 1 \
  -f segment -segment_time 600 \
  -reset_timestamps 1 \
  "recordings/desktop_%Y-%m-%d_%H-%M-%S.mkv"
```

### Key Features

| Option                                     | Purpose                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `-thread_queue_size 512`                   | Buffers incoming audio/video packets to avoid desync when CPU spikes.                                |
| `-video_size 1920x1080`                    | Capture region size.                                                                                 |
| `-framerate 60`                            | Smooth 60 FPS capture.                                                                               |
| `-f x11grab -i :0.0+200,100`               | Capture from display `:0.0`, offset 200px right and 100px down.                                      |
| `-f pulse -i default`                      | Capture system audio (PulseAudio default sink).                                                      |
| `-c:v h264_vaapi`                          | Hardware-accelerated H.264 encoding via VAAPI (Intel/AMD GPU). Replace with `h264_nvenc` for NVIDIA. |
| `-b:v 8M -maxrate 8M -bufsize 16M`         | Control bitrate and buffer for consistent quality.                                                   |
| `-c:a aac -b:a 192k`                       | Encode audio in AAC at 192 kbps.                                                                     |
| `-preset fast`                             | Good speed/quality trade-off.                                                                        |
| `-pix_fmt yuv420p`                         | Ensures broad compatibility.                                                                         |
| `-strftime 1`                              | Enables strftime-style filenames.                                                                    |
| `-f segment -segment_time 600`             | Automatically split recording into 10-minute files.                                                  |
| `-reset_timestamps 1`                      | Start timestamps at 0 in each segment.                                                               |
| `recordings/desktop_%Y-%m-%d_%H-%M-%S.mkv` | Time-stamped output filenames.                                                                       |

> **Result:** FFmpeg writes sequential 10-minute video files like
> `desktop_2025-09-23_00-30-00.mkv`, `desktop_2025-09-23_00-40-00.mkv`, etc.

---

## 2️⃣ Integrating into a NestJS Service

You can spawn the same command programmatically:

```ts
import { Injectable } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as path from 'path';

@Injectable()
export class AdvancedScreenRecorderService {
  private ffmpegProcess: ChildProcessWithoutNullStreams | null = null;

  startRecording(): void {
    const outputDir = path.resolve('recordings');
    const args = [
      '-thread_queue_size', '512',
      '-video_size', '1920x1080',
      '-framerate', '60',
      '-f', 'x11grab', '-i', ':0.0+200,100',
      '-f', 'pulse', '-i', 'default',
      '-c:v', 'h264_vaapi', '-b:v', '8M', '-maxrate', '8M', '-bufsize', '16M',
      '-c:a', 'aac', '-b:a', '192k',
      '-preset', 'fast',
      '-pix_fmt', 'yuv420p',
      '-strftime', '1',
      '-f', 'segment', '-segment_time', '600',
      '-reset_timestamps', '1',
      path.join(outputDir, 'desktop_%Y-%m-%d_%H-%M-%S.mkv'),
    ];

    this.ffmpegProcess = spawn('ffmpeg', args);

    this.ffmpegProcess.stderr.on('data', (data) =>
      console.log(`[FFmpeg] ${data.toString()}`)
    );
  }

  stopRecording(): void {
    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill('SIGINT'); // Graceful stop
      this.ffmpegProcess = null;
    }
  }
}
```

---

## 3️⃣ Practical Tips

* **Audio Source:** On PulseAudio systems `default` captures system mix; use `pactl list sources` to pick another source if required.
* **Hardware Encoder:** Change `-c:v h264_vaapi` to `h264_nvenc` (NVIDIA) or `hevc_vaapi` (H.265) depending on hardware support.
* **Long Sessions:** Segmentation avoids massive single-file recordings and protects against data loss if interrupted.
* **Permissions:** Ensure the user running FFmpeg has access to the X11 display and PulseAudio.

---

### ✅ Takeaway

This configuration gives you:

* High-framerate desktop region capture,
* Simultaneous system-audio recording,
* GPU-accelerated encoding,
* Automatic file segmentation with time-stamped filenames.

You can use or adapt this exact FFmpeg invocation in a **NestJS service** to schedule, control, or automate advanced desktop-region recordings.


The `pactl list sources` output shows the **PulseAudio sources** you can use when capturing audio.
Here is how to read and use it with the FFmpeg + `x11grab` command.

---

### Ubuntu audio list

```bash

Source #0
	State: SUSPENDED
	Name: alsa_output.pci-0000_00_1b.0.analog-stereo.monitor
	Description: Monitor of Built-in Audio Analog Stereo
	Driver: module-alsa-card.c
	Sample Specification: s16le 2ch 44100Hz
	Channel Map: front-left,front-right
	Owner Module: 8
	Mute: no
	Volume: front-left: 65536 / 100% / 0.00 dB,   front-right: 65536 / 100% / 0.00 dB
	        balance 0.00
	Base Volume: 65536 / 100% / 0.00 dB
	Monitor of Sink: alsa_output.pci-0000_00_1b.0.analog-stereo
	Latency: 0 usec, configured 0 usec
	Flags: DECIBEL_VOLUME LATENCY 
	Properties:
		device.description = "Monitor of Built-in Audio Analog Stereo"
		device.class = "monitor"
		alsa.card = "1"
		alsa.card_name = "HDA Intel PCH"
		alsa.long_card_name = "HDA Intel PCH at 0xc0614000 irq 49"
		alsa.driver_name = "snd_hda_intel"
		device.bus_path = "pci-0000:00:1b.0"
		sysfs.path = "/devices/pci0000:00/0000:00:1b.0/sound/card1"
		device.bus = "pci"
		device.vendor.id = "8086"
		device.vendor.name = "Intel Corporation"
		device.product.id = "9c20"
		device.product.name = "8 Series HD Audio Controller"
		device.form_factor = "internal"
		device.string = "1"
		module-udev-detect.discovered = "1"
		device.icon_name = "audio-card-pci"
	Formats:
		pcm

Source #1
	State: SUSPENDED
	Name: alsa_input.pci-0000_00_1b.0.analog-stereo
	Description: Built-in Audio Analog Stereo
	Driver: module-alsa-card.c
	Sample Specification: s16le 2ch 44100Hz
	Channel Map: front-left,front-right
	Owner Module: 8
	Mute: no
	Volume: front-left: 25443 /  39% / -24.65 dB,   front-right: 25443 /  39% / -24.65 dB
	        balance 0.00
	Base Volume: 13076 /  20% / -42.00 dB
	Monitor of Sink: n/a
	Latency: 0 usec, configured 0 usec
	Flags: HARDWARE HW_MUTE_CTRL HW_VOLUME_CTRL DECIBEL_VOLUME LATENCY 
	Properties:
		alsa.resolution_bits = "16"
		device.api = "alsa"
		device.class = "sound"
		alsa.class = "generic"
		alsa.subclass = "generic-mix"
		alsa.name = "CX20751/2 Analog"
		alsa.id = "CX20751/2 Analog"
		alsa.subdevice = "0"
		alsa.subdevice_name = "subdevice #0"
		alsa.device = "0"
		alsa.card = "1"
		alsa.card_name = "HDA Intel PCH"
		alsa.long_card_name = "HDA Intel PCH at 0xc0614000 irq 49"
		alsa.driver_name = "snd_hda_intel"
		device.bus_path = "pci-0000:00:1b.0"
		sysfs.path = "/devices/pci0000:00/0000:00:1b.0/sound/card1"
		device.bus = "pci"
		device.vendor.id = "8086"
		device.vendor.name = "Intel Corporation"
		device.product.id = "9c20"
		device.product.name = "8 Series HD Audio Controller"
		device.form_factor = "internal"
		device.string = "front:1"
		device.buffering.buffer_size = "352800"
		device.buffering.fragment_size = "176400"
		device.access_mode = "mmap+timer"
		device.profile.name = "analog-stereo"
		device.profile.description = "Analog Stereo"
		device.description = "Built-in Audio Analog Stereo"
		module-udev-detect.discovered = "1"
		device.icon_name = "audio-card-pci"
	Ports:
		analog-input-internal-mic: Internal Microphone (priority: 8900)
		analog-input-mic: Microphone (priority: 8700, not available)
	Active Port: analog-input-internal-mic
	Formats:
		pcm
``


## 1️⃣ Understanding the Sources

Your machine currently exposes **two** PulseAudio sources:

| # | Source Name                                          | Description                               | Typical Use                                                  |
| - | ---------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| 0 | `alsa_output.pci-0000_00_1b.0.analog-stereo.monitor` | *Monitor of Built-in Audio Analog Stereo* | **System audio (what you hear through speakers/headphones)** |
| 1 | `alsa_input.pci-0000_00_1b.0.analog-stereo`          | *Built-in Audio Analog Stereo*            | **Microphone input**                                         |

### Key

* **“monitor”** sources capture the output of the sink (i.e., system playback audio).
* **non-monitor** sources capture live input from a device such as a microphone.

---

## 2️⃣ Choosing the Right Source

* **Record system sound only (desktop audio):**
  Use:

  ```
  alsa_output.pci-0000_00_1b.0.analog-stereo.monitor
  ```

* **Record microphone input only:**
  Use:

  ```
  alsa_input.pci-0000_00_1b.0.analog-stereo
  ```

* **Record both:**
  Record them as separate inputs and mix in FFmpeg, or mix at the PulseAudio level (e.g., with a combined sink).

---

## 3️⃣ Example FFmpeg Command with Audio

Capture a 1280×720 region of the desktop (offset 100,200) **including system audio**:

```bash
ffmpeg \
  -video_size 1280x720 \
  -framerate 30 \
  -f x11grab -i :0.0+100,200 \
  -f pulse -i alsa_output.pci-0000_00_1b.0.analog-stereo.monitor \
  -c:v libx264 -preset veryfast -pix_fmt yuv420p \
  -c:a aac -b:a 192k \
  output-with-audio.mkv
```

Explanation:

* `-f pulse -i <source>` tells FFmpeg which PulseAudio source to use.
* `monitor` source records the same sound you hear from speakers.

---

## 4️⃣ Optional: Microphone + System Audio Together

To capture **system audio + microphone** simultaneously you need two audio inputs:

```bash
ffmpeg \
  -video_size 1280x720 \
  -framerate 30 \
  -f x11grab -i :0.0+100,200 \
  -f pulse -i alsa_output.pci-0000_00_1b.0.analog-stereo.monitor \
  -f pulse -i alsa_input.pci-0000_00_1b.0.analog-stereo \
  -filter_complex "[1:a][2:a]amix=inputs=2:duration=longest[aout]" \
  -map 0:v -map "[aout]" \
  -c:v libx264 -preset veryfast -pix_fmt yuv420p \
  -c:a aac -b:a 192k \
  output-mixed.mkv
```

Here:

* `[1:a][2:a]amix=inputs=2` mixes the two audio streams into a single track.

---

### ✅ Summary

Use the **Source Name** value from `pactl list sources` directly in FFmpeg’s `-f pulse -i` option:

* **System playback** → `alsa_output...monitor`
* **Microphone** → `alsa_input...analog-stereo`

This allows you to combine X11 screen capture (`x11grab`) with PulseAudio sound recording in one FFmpeg command.
