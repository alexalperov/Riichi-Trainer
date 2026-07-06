/**
 * Small synthesized sound effects for the trainer, built with WebAudio so no
 * audio assets are needed. Everything is wrapped in try/catch: sound is pure
 * garnish and must never break the trainer (e.g. no AudioContext support, or
 * autoplay restrictions when a discard is triggered by the timer).
 */

let audioContext = null;

function getContext() {
    if (audioContext == null) {
        let Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioContext = new Ctx();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    return audioContext;
}

/** A short burst of band-passed noise: the "clack" of a tile hitting the table. */
export function playTileClack() {
    try {
        let ctx = getContext();
        if (!ctx) return;

        let now = ctx.currentTime;

        // Noise burst
        let bufferLength = Math.floor(ctx.sampleRate * 0.06);
        let buffer = ctx.createBuffer(1, bufferLength, ctx.sampleRate);
        let data = buffer.getChannelData(0);
        for (let i = 0; i < bufferLength; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferLength, 2);
        }

        let noise = ctx.createBufferSource();
        noise.buffer = buffer;

        let filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 2400;
        filter.Q.value = 0.8;

        let noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.28, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        noise.connect(filter).connect(noiseGain).connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.08);

        // Low "thump" underneath to give the clack some body
        let thump = ctx.createOscillator();
        thump.type = "sine";
        thump.frequency.setValueAtTime(190, now);
        thump.frequency.exponentialRampToValueAtTime(70, now + 0.06);

        let thumpGain = ctx.createGain();
        thumpGain.gain.setValueAtTime(0.22, now);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        thump.connect(thumpGain).connect(ctx.destination);
        thump.start(now);
        thump.stop(now + 0.1);
    } catch { }
}

/** A gentle rising two-note chime for reaching tenpai. */
export function playTenpaiChime() {
    try {
        let ctx = getContext();
        if (!ctx) return;

        let now = ctx.currentTime;
        let notes = [523.25, 659.25, 783.99]; // C5 E5 G5

        notes.forEach((frequency, i) => {
            let osc = ctx.createOscillator();
            osc.type = "triangle";
            osc.frequency.value = frequency;

            let gain = ctx.createGain();
            let start = now + i * 0.09;
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.55);
        });
    } catch { }
}
