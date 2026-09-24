import { pipeline, env } from '@huggingface/transformers';

// Disable local models to prevent Next.js trying to bundle node fs
env.allowLocalModels = false;

if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
}

let transcriber: any = null;

self.addEventListener('message', async (e: MessageEvent) => {
  const { type, audioData } = e.data;

  if (type === 'init') {
    if (!transcriber) {
      try {
        self.postMessage({ type: 'progress', message: 'Loading model (WebGPU)...' });
        
        try {
          transcriber = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', {
            device: 'webgpu',
            dtype: {
              encoder_model: 'fp32', // webgpu works best with fp32 or fp16
              decoder_model_merged: 'q4', // q4 for smaller size
            }
          });
          self.postMessage({ type: 'progress', message: 'Model loaded using WebGPU.' });
        } catch (err) {
          console.warn('WebGPU failed, falling back to WASM:', err);
          self.postMessage({ type: 'progress', message: 'WebGPU unavailable. Loading model (WASM)...' });
          transcriber = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', {
            device: 'wasm',
            dtype: 'q8'
          });
          self.postMessage({ type: 'progress', message: 'Model loaded using WASM.' });
        }
        
        self.postMessage({ type: 'ready' });
      } catch (err: any) {
        self.postMessage({ type: 'error', error: err.message });
      }
    } else {
      self.postMessage({ type: 'ready' });
    }
  } else if (type === 'transcribe') {
    if (!transcriber) {
      self.postMessage({ type: 'error', error: 'Model not initialized' });
      return;
    }

    try {
      self.postMessage({ type: 'progress', message: 'Transcribing audio...' });
      
      const result = await transcriber(audioData, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
      });
      // console.log(`[STT-WORKER] RESULT_CHUNKS=${result?.chunks?.length} RAW_FIRST_CHUNK=${JSON.stringify(result?.chunks?.[0] || {})}`);

      // console.log("[STT-WORKER] Transcription result:", result); self.postMessage({ type: 'complete', result });
    } catch (err: any) {
      self.postMessage({ type: 'error', error: err.message });
    }
  }
});
