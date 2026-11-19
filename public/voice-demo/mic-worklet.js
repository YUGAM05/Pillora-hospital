// Runs on the audio thread: converts the mic (usually 48 kHz float) to
// 16 kHz 16-bit PCM and posts ~100 ms chunks to the page.
class MicProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.pos = 0;
    this.out = new Int16Array(1600); // 100 ms at 16 kHz
    this.n = 0;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;
    // Simple averaging downsampler (good enough for speech).
    while (this.pos < input.length) {
      const start = Math.floor(this.pos);
      const end = Math.min(input.length, Math.floor(this.pos + this.ratio));
      let sum = 0;
      for (let i = start; i < end; i++) sum += input[i];
      const v = end > start ? sum / (end - start) : input[start];
      this.out[this.n++] = Math.max(-1, Math.min(1, v)) * 0x7fff;
      if (this.n === this.out.length) {
        this.port.postMessage(this.out.buffer.slice(0));
        this.n = 0;
      }
      this.pos += this.ratio;
    }
    this.pos -= input.length;
    return true;
  }
}
registerProcessor('mic-processor', MicProcessor);
