/* Bleep Studio — deterministic, local Web Audio synthesis. MIT License. */
(function (root) {
  'use strict';
  const SOUNDS = [
    { id: 'coin', name: ['金币拾取', 'Coin pickup'], category: 'reward', icon: 'coin', notes: [988, 1319], gap: .085, decay: .18 },
    { id: 'jump', name: ['跳跃', 'Jump'], category: 'action', icon: 'jump', sweep: [180, 740], decay: .26 },
    { id: 'click', name: ['按钮点击', 'UI click'], category: 'ui', icon: 'cursor', notes: [680], decay: .075 },
    { id: 'hover', name: ['悬停提示', 'UI hover'], category: 'ui', icon: 'cursor', notes: [920], decay: .045 },
    { id: 'confirm', name: ['确认选择', 'Confirm'], category: 'ui', icon: 'check', notes: [523, 784], gap: .08, decay: .16 },
    { id: 'cancel', name: ['取消返回', 'Cancel'], category: 'ui', icon: 'back', notes: [440, 294], gap: .075, decay: .13 },
    { id: 'hit', name: ['受到伤害', 'Damage'], category: 'action', icon: 'bolt', sweep: [190, 48], decay: .2, noise: .45 },
    { id: 'explosion', name: ['爆炸', 'Explosion'], category: 'action', icon: 'burst', sweep: [85, 28], decay: .75, noise: 1 },
    { id: 'laser', name: ['激光发射', 'Laser'], category: 'action', icon: 'target', sweep: [1800, 130], decay: .32, noise: .08 },
    { id: 'powerup', name: ['能量提升', 'Power-up'], category: 'reward', icon: 'bolt', notes: [262, 330, 392, 523, 659, 784], gap: .065, decay: .2 },
    { id: 'levelup', name: ['等级提升', 'Level up'], category: 'reward', icon: 'stairs', notes: [392, 523, 659, 784, 1047], gap: .11, decay: .32 },
    { id: 'victory', name: ['胜利', 'Victory'], category: 'reward', icon: 'flag', notes: [523, 659, 784, 659, 1047], gap: .16, decay: .42 },
    { id: 'gameover', name: ['游戏结束', 'Game over'], category: 'action', icon: 'heart', notes: [392, 370, 330, 262, 196], gap: .15, decay: .35 },
    { id: 'whoosh', name: ['快速掠过', 'Whoosh'], category: 'action', icon: 'wind', sweep: [360, 140], decay: .35, noise: .85 },
    { id: 'notification', name: ['新消息', 'Notification'], category: 'ui', icon: 'bell', notes: [784, 1047, 784], gap: .11, decay: .22 },
    { id: 'unlock', name: ['解锁成就', 'Unlock'], category: 'reward', icon: 'lock', notes: [330, 494, 659, 988], gap: .09, decay: .35 },
    { id: 'heal', name: ['生命恢复', 'Heal'], category: 'reward', icon: 'heart', notes: [349, 440, 523, 698], gap: .1, decay: .3 },
    { id: 'error', name: ['操作错误', 'Error'], category: 'ui', icon: 'alert', notes: [147, 139], gap: .12, decay: .18 }
  ];
  const STYLES = {
    arcade: { name: ['像素街机', 'Pixel Arcade'], wave: 'square', cutoff: 3800, attack: .003, overtone: .04, detune: 0 },
    cozy: { name: ['可爱经营', 'Cozy Garden'], wave: 'sine', cutoff: 4200, attack: .009, overtone: .28, detune: 0 },
    space: { name: ['科幻电子', 'Space Signal'], wave: 'sawtooth', cutoff: 2800, attack: .006, overtone: .1, detune: 7 }
  };
  const DEFAULTS = { pitch: 0, duration: 1, brightness: 60, punch: 55, room: 12, seed: 42 };
  function random(seed) {
    let a = seed >>> 0;
    return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const clamp = (v, lo, hi, fallback) => Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Number(v))) : fallback;
  function parameters(p = {}) {
    return { pitch: clamp(p.pitch, -12, 12, 0), duration: clamp(p.duration, .4, 2, 1), brightness: clamp(p.brightness, 0, 100, 60), punch: clamp(p.punch, 0, 100, 55), room: clamp(p.room, 0, 70, 12), seed: Math.floor(clamp(p.seed, 1, 999999, 42)) };
  }
  function recipe(id, styleId = 'arcade', input = {}) {
    const sound = SOUNDS.find(s => s.id === id);
    if (!sound || !Object.prototype.hasOwnProperty.call(STYLES, styleId)) throw new Error('Unknown sound or style');
    const p = parameters(input), rng = random(p.seed);
    const rate = Math.pow(2, p.pitch / 12) * (1 + (rng() - .5) * .065);
    const decay = sound.decay * p.duration;
    const gap = (sound.gap || 0) * p.duration;
    const voices = (sound.notes || [sound.sweep[0]]).map((f, i) => ({
      start: i * gap, duration: decay, from: f * rate, to: (sound.sweep ? sound.sweep[1] : f * (styleId === 'cozy' ? .997 : 1)) * rate
    }));
    const dryEnd = voices[voices.length - 1].start + decay;
    return { id, styleId, p, sound, style: STYLES[styleId], voices, dryEnd, seconds: dryEnd + (p.room ? .16 + .65 * p.room / 70 : .025) };
  }
  async function render(id, styleId, input, sampleRate = 44100) {
    const spec = recipe(id, styleId, input), { p, style, sound } = spec;
    const Offline = root.OfflineAudioContext || root.webkitOfflineAudioContext;
    if (!Offline) throw new Error('This browser does not support OfflineAudioContext. Try current Chrome, Edge, Firefox or Safari.');
    if (![44100, 48000].includes(sampleRate)) throw new Error('Unsupported sample rate');
    const ctx = new Offline(1, Math.ceil(spec.seconds * sampleRate), sampleRate);
    const mix = ctx.createGain(), dry = ctx.createGain();
    dry.gain.value = .85; mix.connect(dry).connect(ctx.destination);
    if (p.room > 0) {
      const tail = .16 + .65 * p.room / 70, ir = ctx.createBuffer(1, Math.ceil(tail * sampleRate), sampleRate);
      const data = ir.getChannelData(0), rng = random(p.seed + 31415);
      for (let i = 0; i < data.length; i++) data[i] = (rng() * 2 - 1) * Math.pow(1 - i / data.length, 3);
      const convolver = ctx.createConvolver(), wet = ctx.createGain();
      convolver.buffer = ir; wet.gain.value = p.room / 170; mix.connect(convolver).connect(wet).connect(ctx.destination);
    }
    function envelope(start, duration, amplitude) {
      const gain = ctx.createGain(), end = start + duration;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(amplitude, start + Math.min(style.attack, duration / 8));
      gain.gain.exponentialRampToValueAtTime(.0001, Math.max(start + style.attack + .001, end - .006));
      gain.gain.linearRampToValueAtTime(0, end);
      return gain;
    }
    const strength = .18 + p.punch * .0018;
    for (const v of spec.voices) {
      const osc = ctx.createOscillator(), filter = ctx.createBiquadFilter();
      osc.type = style.wave; osc.detune.value = style.detune;
      osc.frequency.setValueAtTime(v.from, v.start); osc.frequency.exponentialRampToValueAtTime(Math.max(20, v.to), v.start + v.duration * .85);
      filter.type = 'lowpass'; filter.Q.value = styleId === 'space' ? 2 : .7;
      filter.frequency.setValueAtTime(Math.min(sampleRate * .44, 300 + style.cutoff * p.brightness / 60), v.start);
      const gain = envelope(v.start, v.duration, strength * (sound.noise ? .65 : 1));
      osc.connect(filter).connect(gain).connect(mix); osc.start(v.start); osc.stop(v.start + v.duration);
      if (style.overtone) {
        const overtone = ctx.createOscillator(), g = envelope(v.start, v.duration * .8, strength * style.overtone);
        overtone.type = 'sine'; overtone.frequency.setValueAtTime(v.from * (styleId === 'space' ? 1.5 : 2), v.start);
        overtone.frequency.exponentialRampToValueAtTime(Math.max(20, v.to * 2), v.start + v.duration * .7);
        overtone.connect(g).connect(mix); overtone.start(v.start); overtone.stop(v.start + v.duration);
      }
    }
    if (sound.noise) {
      const length = Math.ceil(spec.dryEnd * sampleRate), buffer = ctx.createBuffer(1, length, sampleRate), data = buffer.getChannelData(0), rng = random(p.seed + 91);
      let held = 0;
      for (let i = 0; i < length; i++) { if (styleId !== 'arcade' || i % 5 === 0) held = rng() * 2 - 1; data[i] = held; }
      const src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = envelope(0, spec.dryEnd, strength * sound.noise * 1.2);
      src.buffer = buffer; filter.type = id === 'whoosh' ? 'bandpass' : 'lowpass'; filter.Q.value = .8;
      filter.frequency.setValueAtTime(500 + p.brightness * 65, 0); filter.frequency.exponentialRampToValueAtTime(100, spec.dryEnd);
      src.connect(filter).connect(gain).connect(mix); src.start(0);
    }
    const buffer = await ctx.startRendering(), samples = buffer.getChannelData(0);
    let peak = 0; for (const s of samples) peak = Math.max(peak, Math.abs(s));
    const scale = peak > .9 ? .9 / peak : 1;
    const fade = Math.min(220, Math.floor(samples.length / 8));
    for (let i = 0; i < samples.length; i++) {
      samples[i] *= scale;
      if (i < fade) samples[i] *= i / fade;
      if (i >= samples.length - fade) samples[i] *= (samples.length - 1 - i) / fade;
    }
    return buffer;
  }
  function wav(buffer) {
    const samples = buffer.getChannelData(0), bytes = new Uint8Array(44 + samples.length * 2), view = new DataView(bytes.buffer);
    const str = (offset, s) => { for (let i = 0; i < s.length; i++) bytes[offset + i] = s.charCodeAt(i); };
    str(0, 'RIFF'); view.setUint32(4, bytes.length - 8, true); str(8, 'WAVE'); str(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, buffer.sampleRate, true); view.setUint32(28, buffer.sampleRate * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true); str(36, 'data'); view.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) { const s = Math.max(-1, Math.min(1, samples[i])); view.setInt16(44 + i * 2, Math.round(s * (s < 0 ? 32768 : 32767)), true); }
    return bytes;
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xEDB88320 ^ n >>> 1 : n >>> 1; return n >>> 0; });
  function crc32(data) { let c = 0xFFFFFFFF; for (const b of data) c = crcTable[(c ^ b) & 255] ^ c >>> 8; return (c ^ 0xFFFFFFFF) >>> 0; }
  // ZIP STORE format: deterministic, standards-compatible and dependency free.
  function zip(files) {
    const encoder = new TextEncoder(), local = [], central = []; let offset = 0;
    for (const file of files) {
      const name = encoder.encode(file.name), data = typeof file.data === 'string' ? encoder.encode(file.data) : file.data, crc = crc32(data);
      const header = new Uint8Array(30 + name.length), h = new DataView(header.buffer);
      h.setUint32(0, 0x04034B50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x800, true); h.setUint16(12, 33, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); header.set(name, 30);
      const directory = new Uint8Array(46 + name.length), d = new DataView(directory.buffer);
      d.setUint32(0, 0x02014B50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true); d.setUint16(8, 0x800, true); d.setUint16(14, 33, true);
      d.setUint32(16, crc, true); d.setUint32(20, data.length, true); d.setUint32(24, data.length, true); d.setUint16(28, name.length, true); d.setUint32(42, offset, true); directory.set(name, 46);
      local.push(header, data); central.push(directory); offset += header.length + data.length;
    }
    const centralLength = central.reduce((n, b) => n + b.length, 0), end = new Uint8Array(22), e = new DataView(end.buffer);
    e.setUint32(0, 0x06054B50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, centralLength, true); e.setUint32(16, offset, true);
    const result = new Uint8Array(offset + centralLength + 22); let cursor = 0;
    for (const part of [...local, ...central, end]) { result.set(part, cursor); cursor += part.length; }
    return result;
  }
  const api = { SOUNDS, STYLES, DEFAULTS, random, parameters, recipe, render, wav, zip, crc32 };
  root.Bleep = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
