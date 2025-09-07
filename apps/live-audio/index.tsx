/* tslint:disable */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI, LiveServerMessage, Modality, Session} from '@google/genai';
import {LitElement, css, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {createBlob, decode, decodeAudioData} from './utils';
import './visual-3d';

const VOICES = [
  {id: 'Orus', name: 'Orus (Male)'},
  {id: 'Aia', name: 'Aia (Female)'},
  {id: 'Zola', name: 'Zola (Female)'},
  {id: 'Onyx', name: 'Onyx (Male)'},
  {id: 'Nova', name: 'Nova (Female)'},
  {id: 'Luna', name: 'Luna (Female)'},
];

@customElement('gdm-live-audio')
export class GdmLiveAudio extends LitElement {
  @state() isRecording = false;
  @state() status = '';
  @state() error = '';
  @state() selectedVoice = 'Orus';

  private client: GoogleGenAI;
  private session: Session;
  // Use device's default sample rate for input to avoid mismatch.
  private inputAudioContext = new ((window as any).AudioContext ||
    (window as any).webkitAudioContext)();
  // Output audio from Gemini is 24kHz.
  private outputAudioContext = new ((window as any).AudioContext ||
    (window as any).webkitAudioContext)({sampleRate: 24000});
  @state() inputNode = this.inputAudioContext.createGain();
  @state() outputNode = this.outputAudioContext.createGain();
  private nextStartTime = 0;
  private mediaStream: MediaStream;
  private sourceNode: AudioBufferSourceNode;
  private scriptProcessorNode: ScriptProcessorNode;
  private sources = new Set<AudioBufferSourceNode>();

  static styles = css`
    #status {
      position: absolute;
      bottom: 5vh;
      left: 0;
      right: 0;
      z-index: 10;
      text-align: center;
      color: white;
      font-family: sans-serif;
    }

    .controls {
      z-index: 10;
      position: absolute;
      bottom: 10vh;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 20px;

      button {
        outline: none;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.1);
        width: 64px;
        height: 64px;
        cursor: pointer;
        font-size: 24px;
        padding: 0;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }

      button[disabled] {
        display: none;
      }
    }

    .voice-selector {
      display: flex;
      gap: 10px;
      align-items: center;
      background: rgba(255, 255, 255, 0.1);
      padding: 8px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
    }

    .voice-selector label {
      font-family: sans-serif;
      font-size: 14px;
    }

    .voice-selector select {
      background: transparent;
      border: none;
      color: white;
      font-size: 14px;
      font-family: sans-serif;
      outline: none;
      cursor: pointer;
    }

    .voice-selector select:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .voice-selector select option {
      background: #222;
      color: white;
    }

    .button-group {
      display: flex;
      gap: 10px;
      justify-content: center;
    }
  `;

  constructor() {
    super();
    this.initClient();
  }

  private initAudio() {
    this.nextStartTime = this.outputAudioContext.currentTime;
  }

  private async initClient() {
    this.initAudio();

    this.client = new GoogleGenAI({
      apiKey: process.env.API_KEY,
    });

    this.outputNode.connect(this.outputAudioContext.destination);

    this.initSession();
  }

  private async initSession() {
    const model = 'gemini-2.5-flash-preview-native-audio-dialog';

    try {
      this.session = await this.client.live.connect({
        model: model,
        callbacks: {
          onopen: () => {
            this.updateStatus('Connected');
          },
          onmessage: async (message: LiveServerMessage) => {
            const audio =
              message.serverContent?.modelTurn?.parts[0]?.inlineData;

            if (audio) {
              this.nextStartTime = Math.max(
                this.nextStartTime,
                this.outputAudioContext.currentTime,
              );

              const audioBuffer = await decodeAudioData(
                decode(audio.data),
                this.outputAudioContext,
                24000,
                1,
              );
              const source = this.outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(this.outputNode);
              source.addEventListener('ended', () => {
                this.sources.delete(source);
              });

              source.start(this.nextStartTime);
              this.nextStartTime = this.nextStartTime + audioBuffer.duration;
              this.sources.add(source);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of this.sources.values()) {
                source.stop();
                this.sources.delete(source);
              }
              this.nextStartTime = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            this.updateError(e.message);
          },
          onclose: (e: CloseEvent) => {
            this.updateStatus('Connection closed: ' + e.reason);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {prebuiltVoiceConfig: {voiceName: this.selectedVoice}},
          },
        },
      });
    } catch (e) {
      console.error(e);
      this.updateError((e as Error).message);
    }
  }

  private updateStatus(msg: string) {
    this.status = msg;
    this.error = '';
  }

  private updateError(msg: string) {
    this.error = msg;
  }

  private async startRecording() {
    if (this.isRecording) {
      return;
    }

    this.inputAudioContext.resume();

    this.updateStatus('Requesting microphone access...');

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.updateStatus('Microphone access granted. Starting capture...');

      this.sourceNode = this.inputAudioContext.createMediaStreamSource(
        this.mediaStream,
      );
      this.sourceNode.connect(this.inputNode);

      const bufferSize = 4096;
      this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(
        bufferSize,
        1,
        1,
      );

      this.scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
        if (!this.isRecording) return;

        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0);

        const resampledData = this.resampleBuffer(
          pcmData,
          this.inputAudioContext.sampleRate,
          16000,
        );
        this.session.sendRealtimeInput({media: createBlob(resampledData)});
      };

      this.sourceNode.connect(this.scriptProcessorNode);
      this.scriptProcessorNode.connect(this.inputAudioContext.destination);

      this.isRecording = true;
      this.updateStatus('🔴 Recording...');
    } catch (err) {
      console.error('Error starting recording:', err);
      this.updateStatus(`Error: ${err.message}`);
      this.stopRecording();
    }
  }

  private stopRecording() {
    if (!this.isRecording && !this.mediaStream && !this.inputAudioContext)
      return;

    this.updateStatus('Stopping recording...');

    this.isRecording = false;

    if (this.scriptProcessorNode && this.sourceNode && this.inputAudioContext) {
      this.scriptProcessorNode.disconnect();
      this.sourceNode.disconnect();
    }

    this.scriptProcessorNode = null;
    this.sourceNode = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.updateStatus('Recording stopped. Click Start to begin again.');
  }

  private reset() {
    this.stopRecording();
    this.session?.close();
    this.initSession();
    this.updateStatus('Session reset.');
  }

  private resampleBuffer(
    input: Float32Array,
    fromSampleRate: number,
    toSampleRate: number,
  ): Float32Array {
    if (fromSampleRate === toSampleRate) {
      return input;
    }

    const ratio = fromSampleRate / toSampleRate;
    const outputLength = Math.floor(input.length / ratio);
    const result = new Float32Array(outputLength);
    let outputIndex = 0;
    let inputIndex = 0;
    while (outputIndex < outputLength) {
      result[outputIndex++] = input[Math.floor(inputIndex)];
      inputIndex += ratio;
    }
    return result;
  }

  private handleVoiceChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.selectedVoice = select.value;
    this.reset();
  }

  render() {
    return html`
      <div>
        <div class="controls">
          <div class="voice-selector">
            <label for="voice-select">Voice:</label>
            <select
              id="voice-select"
              @change=${this.handleVoiceChange}
              ?disabled=${this.isRecording}
              aria-label="Select AI Voice">
              ${VOICES.map(
                (voice) => html`
                  <option
                    value=${voice.id}
                    ?selected=${voice.id === this.selectedVoice}>
                    ${voice.name}
                  </option>
                `,
              )}
            </select>
          </div>
          <div class="button-group">
            <button
              id="resetButton"
              @click=${this.reset}
              ?disabled=${this.isRecording}
              aria-label="Reset Session">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="40px"
                viewBox="0 -960 960 960"
                width="40px"
                fill="#ffffff">
                <path
                  d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
              </svg>
            </button>
            <button
              id="startButton"
              @click=${this.startRecording}
              ?disabled=${this.isRecording}
              aria-label="Start Recording">
              <svg
                viewBox="0 0 100 100"
                width="32px"
                height="32px"
                fill="#c80000"
                xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="50" />
              </svg>
            </button>
            <button
              id="stopButton"
              @click=${this.stopRecording}
              ?disabled=${!this.isRecording}
              aria-label="Stop Recording">
              <svg
                viewBox="0 0 100 100"
                width="32px"
                height="32px"
                fill="#000000"
                xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="100" height="100" rx="15" />
              </svg>
            </button>
          </div>
        </div>

        <div id="status"> ${this.error || this.status} </div>
        <gdm-live-audio-visuals-3d
          .inputNode=${this.inputNode}
          .outputNode=${this.outputNode}></gdm-live-audio-visuals-3d>
      </div>
    `;
  }
}