## 1. Project Setup

### Install Dependencies

```bash
npm install --save @nestjs/common @nestjs/core @nestjs/platform-express
npm install --save @google/generative-ai
npm install --save-dev playwright
```

*(Run `npx playwright install` to install the required browsers.)*

---

## 2. Architecture Overview

A clean design typically involves:

* **PlaywrightService**
  Encapsulates browser automation logic (launching browsers, scraping pages, taking screenshots, etc.).

* **GeminiService**
  Handles interaction with the Google Gemini API for text/image processing or analysis of the Playwright outputs.

* **TasksModule**
  Combines both services and exposes endpoints or scheduled jobs.

---

## 3. Environment Configuration

Add the Gemini API key to your `.env`:

```
GEMINI_API_KEY=your_api_key_here
```

And register it in `ConfigModule` or similar.

---

## 4. Playwright Service Example

```ts
// src/playwright/playwright.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';

@Injectable()
export class PlaywrightService implements OnModuleDestroy {
  private browser: Browser | null = null;

  async launch(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
    return this.browser;
  }

  async capturePageContent(url: string): Promise<string> {
    const browser = await this.launch();
    const page: Page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    const content = await page.content();
    await page.close();
    return content;
  }

  async onModuleDestroy() {
    if (this.browser) await this.browser.close();
  }
}
```

---

## 5. Gemini Service Example

```ts
// src/gemini/gemini.service.ts
import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private model;

  constructor() {
    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = client.getGenerativeModel({ model: 'gemini-pro' });
  }

  async analyzeContent(html: string): Promise<string> {
    const prompt = `Analyze the following HTML and summarize its key points:\n\n${html}`;
    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }
}
```

---

## 6. Combine Services in a Controller

```ts
// src/tasks/tasks.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { PlaywrightService } from '../playwright/playwright.service';
import { GeminiService } from '../gemini/gemini.service';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly playwrightService: PlaywrightService,
    private readonly geminiService: GeminiService,
  ) {}

  @Get('analyze-page')
  async analyzePage(@Query('url') url: string) {
    const html = await this.playwrightService.capturePageContent(url);
    const summary = await this.geminiService.analyzeContent(html);
    return { url, summary };
  }
}
```

---

## 7. Module Registration

```ts
// src/tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { PlaywrightService } from '../playwright/playwright.service';
import { GeminiService } from '../gemini/gemini.service';
import { TasksController } from './tasks.controller';

@Module({
  controllers: [TasksController],
  providers: [PlaywrightService, GeminiService],
})
export class TasksModule {}
```

Register `TasksModule` in `AppModule`.

---

## 8. Running the Service

```bash
npm run start:dev
```

Then visit:

```
http://localhost:3000/tasks/analyze-page?url=https://example.com
```

You should receive a JSON response summarizing the page content.

---

## 9. Additional Considerations

* **Error handling & timeouts**: Add `try/catch` around Playwright and Gemini calls.
* **Scaling**: Consider a job queue (e.g., BullMQ) if many browser tasks run in parallel.
* **Security**: Validate URLs before visiting them to avoid SSRF or malicious pages.
* **Headless vs. headed mode**: For debugging, set `headless: false`.

---

### Key Takeaway

Use **PlaywrightService** to automate and extract data from web pages, then pass that data to **GeminiService** to perform advanced reasoning, summarization, or transformation. This modular NestJS pattern keeps concerns clean and allows easy scaling as your browser-automation tasks grow.


Playwright can capture a full **screen recording (video)** of a browser session.
Below is a professional, **NestJS-friendly** implementation that records a page visit and stores the video.

---

## 1️⃣ Install & Prepare

Install Playwright and browsers (if you have not already):

```bash
npm install --save-dev playwright
npx playwright install
```

---

## 2️⃣ Service Implementation

Create a dedicated **PlaywrightRecorderService**.
It will launch a Chromium browser, record the session to a file, and return the video path.

```ts
// src/playwright/playwright-recorder.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PlaywrightRecorderService implements OnModuleDestroy {
  private browser: Browser | null = null;

  async recordPage(
    url: string,
    outputDir: string = 'recordings',
    videoFileName: string = 'session.webm',
  ): Promise<string> {
    // Ensure directory exists
    const absoluteDir = path.resolve(outputDir);
    if (!fs.existsSync(absoluteDir)) fs.mkdirSync(absoluteDir, { recursive: true });

    // Launch browser once (reuse if desired)
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true, // set false to see the browser while recording
      });
    }

    // Create a new context with video recording enabled
    const context = await this.browser.newContext({
      recordVideo: {
        dir: absoluteDir,       // directory for raw videos
        size: { width: 1280, height: 720 }, // optional: video resolution
      },
    });

    const page: Page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });

    // Example user interactions
    await page.waitForTimeout(5000); // record 5 seconds for demo

    // Closing context stops recording and saves the file
    await context.close();

    // Playwright names the video file automatically when context closes.
    // Retrieve the video path from the first page's video object:
    const video = await page.video();
    if (!video) throw new Error('Video not found.');
    const tempVideoPath = await video.path();

    // Rename/move to desired filename
    const finalPath = path.join(absoluteDir, videoFileName);
    fs.renameSync(tempVideoPath, finalPath);

    return finalPath;
  }

  async onModuleDestroy() {
    if (this.browser) await this.browser.close();
  }
}
```

---

## 3️⃣ Controller Endpoint

```ts
// src/playwright/playwright-recorder.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { PlaywrightRecorderService } from './playwright-recorder.service';

@Controller('record')
export class PlaywrightRecorderController {
  constructor(private readonly recorderService: PlaywrightRecorderService) {}

  @Get()
  async record(@Query('url') url: string) {
    if (!url) throw new Error('Missing "url" query parameter');
    const videoPath = await this.recorderService.recordPage(url);
    return { message: 'Recording complete', videoPath };
  }
}
```

---

## 4️⃣ Module Registration

```ts
// src/playwright/playwright.module.ts
import { Module } from '@nestjs/common';
import { PlaywrightRecorderService } from './playwright-recorder.service';
import { PlaywrightRecorderController } from './playwright-recorder.controller';

@Module({
  controllers: [PlaywrightRecorderController],
  providers: [PlaywrightRecorderService],
})
export class PlaywrightModule {}
```

Add `PlaywrightModule` to your `AppModule`.

---

## 5️⃣ Running the Recorder

Start the application:

```bash
npm run start:dev
```

Call the endpoint:

```
http://localhost:3000/record?url=https://example.com
```

**Response:**

```json
{
  "message": "Recording complete",
  "videoPath": "/absolute/path/to/project/recordings/session.webm"
}
```

The recorded video is saved as **WebM** by default.

---

## ✅ Notes & Best Practices

* **Headed mode:** Set `headless: false` for debugging (to watch the browser while recording).
* **Video lifecycle:** The video file is finalized only after the **context is closed**.
* **File naming:** Playwright creates a random temporary file. Rename or move it after `context.close()` as shown.
* **Storage:** For cloud storage (e.g., S3, GCS), upload the `finalPath` after recording.

---

**Summary:**
Use a `BrowserContext` with the `recordVideo` option in Playwright.
Close the context to finalize the video file, then move or serve it as needed inside your NestJS application.


Those two points are key to getting reliable screen recordings with Playwright:

---

### 1. **Headed Mode (`headless: false`)**

* **Purpose:**
  By default, Playwright runs the browser in *headless* mode (no UI).
  If you want to **see the browser window while it is recording**, you must launch the browser in *headed* mode.

* **Usage Example:**

  ```ts
  const browser = await chromium.launch({
    headless: false, // <-- shows the real browser window
    slowMo: 100      // optional: slows down actions for easier debugging
  });
  ```

* **When to use:**

  * Debugging or visually confirming interactions during a recording.
  * Demonstrations or live presentations.

* **Performance note:**
  Headed mode is slightly heavier on resources and not recommended for high-volume automated runs.

---

### 2. **Video Lifecycle & Context Closure**

* **How Playwright records video:**
  Video capture is tied to the **BrowserContext**, not just the Page.
  You specify the recording directory when you create the context:

  ```ts
  const context = await browser.newContext({
    recordVideo: { dir: 'recordings', size: { width: 1280, height: 720 } }
  });
  ```

* **Finalizing the video:**
  The video is streamed to a temporary file while the context is active.
  **It is not finalized until `context.close()` is called.**

* **Example:**

  ```ts
  await page.goto('https://example.com');
  await page.waitForTimeout(5000); // record actions
  await context.close();           // <--- video file finalized here
  ```

* **Retrieving the path:**

  ```ts
  const video = await page.video();
  const tempPath = await video.path(); // available only after context.close()
  ```

  Move or rename this file afterwards if you want a custom filename.

---

**Summary:**

* Set `headless: false` when you want to watch the browser as it records.
* Always call `context.close()` before accessing the video file; this step finalizes and flushes the recording.

### Install playwright

```bash
	pnpm add -D  playwright
```

```bash

	Downloading Chromium 140.0.7339.16 (playwright build v1187) from https://cdn.playwright.dev/dbazure/download/playwright/builds/chromium/1187/chromium-linux.zip
	173.7 MiB [====================] 100% 0.0s
	Chromium 140.0.7339.16 (playwright build v1187) downloaded to /home/eddie/.cache/ms-playwright/chromium-1187
	Downloading Chromium Headless Shell 140.0.7339.16 (playwright build v1187) from https://cdn.playwright.dev/dbazure/download/playwright/builds/chromium/1187/chromium-headless-shell-linux.zip
	104.3 MiB [====================] 100% 0.0s
	Chromium Headless Shell 140.0.7339.16 (playwright build v1187) downloaded to /home/eddie/.cache/ms-playwright/chromium_headless_shell-1187
	Downloading Firefox 141.0 (playwright build v1490) from https://cdn.playwright.dev/dbazure/download/playwright/builds/firefox/1490/firefox-ubuntu-20.04.zip
	96 MiB [====================] 100% 0.0s
	Firefox 141.0 (playwright build v1490) downloaded to /home/eddie/.cache/ms-playwright/firefox-1490
	You are using a frozen webkit browser which does not receive updates anymore on ubuntu20.04-x64. Please update to the latest version of your operating system to test up-to-date browsers.
	Downloading Webkit playwright build v2092 from https://cdn.playwright.dev/dbazure/download/playwright/builds/webkit/2092/webkit-ubuntu-20.04.zip
	142.7 MiB [====================] 100% 0.0s
	Webkit playwright build v2092 downloaded to /home/eddie/.cache/ms-playwright/webkit_ubuntu20.04_x64_special-2092
	Downloading FFMPEG playwright build v1011 from https://cdn.playwright.dev/dbazure/download/playwright/builds/ffmpeg/1011/ffmpeg-linux.zip
	2.3 MiB [====================] 100% 0.0s
	FFMPEG playwright build v1011 downloaded to /home/eddie/.cache/ms-playwright/ffmpeg-1011

	╔══════════════════════════════════════════════════════╗
	║ Host system is missing dependencies to run browsers. ║
	║ Please install them with the following command:      ║
	║                                                      ║
	║     sudo npx playwright install-deps                 ║
	║                                                      ║
	║ Alternatively, use apt:                              ║
	║     sudo apt-get install libevent-2.1-7              ║
	║                                                      ║
	║ <3 Playwright Team                                   ║
	╚══════════════════════════════════════════════════════╝
	  

```
### Install Dependencies

```bash
	## Ubuntu Install dependencies
	sudo npx playwright install-deps
```

#### Response

```bash
	Reading package lists... Done
	Building dependency tree       
	Reading state information... Done
	The following NEW packages will be installed:
	  libevent-2.1-7
	0 upgraded, 1 newly installed, 0 to remove and 3 not upgraded.
	Need to get 138 kB of archives.
	After this operation, 406 kB of additional disk space will be used.
	Get:1 http://archive.ubuntu.com/ubuntu focal/main amd64 libevent-2.1-7 amd64 2.1.11-stable-1 [138 kB]
	Fetched 138 kB in 2s (71.2 kB/s)         
	Selecting previously unselected package libevent-2.1-7:amd64.
	(Reading database ... 197981 files and directories currently installed.)
	Preparing to unpack .../libevent-2.1-7_2.1.11-stable-1_amd64.deb ...
	Unpacking libevent-2.1-7:amd64 (2.1.11-stable-1) ...
	Setting up libevent-2.1-7:amd64 (2.1.11-stable-1) ...
	Processing triggers for libc-bin (2.31-0ubuntu9.18) ...
```


