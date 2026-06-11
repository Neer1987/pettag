/**
 * Generates short notification WAV files for iOS/Android (via expo-notifications plugin).
 * Run: node scripts/generate-notification-sounds.cjs
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

function writeWav(filePath, samples) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.floor(clamped * 32767), 44 + i * 2);
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
}

function tone(freq, durationSec, volume = 0.55, attack = 0.01, decay = 6) {
  const count = Math.floor(SAMPLE_RATE * durationSec);
  const out = new Array(count);
  for (let i = 0; i < count; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.min(1, t / attack) * Math.exp(-t * decay);
    out[i] = Math.sin(2 * Math.PI * freq * t) * envelope * volume;
  }
  return out;
}

function silence(durationSec) {
  return new Array(Math.floor(SAMPLE_RATE * durationSec)).fill(0);
}

function concat(chunks) {
  return chunks.flat();
}

const soundsDir = path.join(__dirname, '..', 'assets', 'sounds');

// Urgent triple alert — distinct from inbox
writeWav(
  path.join(soundsDir, 'lost_pet_alert.wav'),
  concat([
    tone(880, 0.22, 0.85, 0.005, 5),
    silence(0.08),
    tone(988, 0.22, 0.85, 0.005, 5),
    silence(0.08),
    tone(880, 0.32, 0.9, 0.005, 4),
  ]),
);

// Friendly two-note chime for inbox/messages
writeWav(
  path.join(soundsDir, 'inbox_message.wav'),
  concat([
    tone(523.25, 0.12, 0.5, 0.008, 8),
    silence(0.04),
    tone(659.25, 0.18, 0.55, 0.008, 7),
  ]),
);

console.log('Wrote assets/sounds/lost_pet_alert.wav');
console.log('Wrote assets/sounds/inbox_message.wav');
