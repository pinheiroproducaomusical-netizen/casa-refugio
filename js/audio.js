/* Spatial audio for each phone.
   Resonance Audio (Google, Apache-2.0): per-room shoebox model (early reflections + late reverb)
   + 3rd-order Ambisonics decoded binaurally. Falls back to the browser's HRTF panner if needed.
   World coordinates are the house plan in metres (X 0→16, Z 0→11, Y up). */
var AUDIO = (function(){
  var ctx = null, master = null, scene = null, buffers = {}, srcs = {}, roomId = null, room = null;
  var L = { x: 6, y: 1.6, z: 4, a: Math.PI / 2 };
  var TILE = 'polished-concrete-or-tile';
  var ROOMS = {
    main:    { x0: 0, x1: 16, z0: 0, z1: 11, h: 3.8, m: { left: 'plaster-smooth', right: 'glass-thick', front: 'glass-thick', back: 'plaster-smooth', down: TILE, up: 'wood-ceiling' } },
    bath:    { x0: 0, x1: 3, z0: 6, z1: 11, h: 2.75, m: { left: TILE, right: TILE, front: TILE, back: TILE, down: TILE, up: 'plaster-smooth' } },
    laundry: { x0: 3, x1: 4.6, z0: 8.8, z1: 11, h: 2.75, m: { left: TILE, right: TILE, front: 'plaster-smooth', back: TILE, down: TILE, up: 'plaster-smooth' } },
    out:     { x0: -25, x1: 41, z0: -25, z1: 36, h: 30, m: { left: 'transparent', right: 'transparent', front: 'transparent', back: 'transparent', down: 'grass', up: 'transparent' } }
  };
  var FILES = { bark: 'latido', sabia: 'sabia', joao: 'joao', quero: 'quero', periquito: 'periquito', andorinha: 'andorinha', bemtevi: 'bemtevi' };

  function init(){
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 1.0; master.connect(ctx.destination);
    if (window.ResonanceAudio) {
      try {
        scene = new ResonanceAudio(ctx, { ambisonicOrder: 3 });
        scene.output.connect(master);
      } catch (e) { scene = null; }
    }
    SYNTH.make(ctx, buffers);
    setListener(L.x, L.y, L.z, L.a);
    Object.keys(FILES).forEach(function(k){ load(k, 'snd/' + FILES[k] + '.mp3'); });
    load('pant', 'snd/ofego.wav');
    setInterval(tick, 30);
  }
  function load(name, url){
    try {
      fetch(url).then(function(r){ if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(function(ab){ ctx.decodeAudioData(ab, function(b){ buffers[name] = b; if (name === 'pant') Object.keys(srcs).forEach(function(k){ var s = srcs[k]; if (s.loop) { try { s.loop.stop(); } catch (e) {} var lp = ctx.createBufferSource(); lp.buffer = b; lp.loop = true; lp.connect(s.loopGain); lp.start(); s.loop = lp; } }); }, function(){}); })
        .catch(function(){});
    } catch (e) {}
  }
  function roomFor(x, z){
    if (x < 3 && z > 6.06 && x >= 0 && z <= 11) return 'bath';
    if (x >= 3 && x < 4.6 && z > 8.85 && z <= 11) return 'laundry';
    if (x >= 0 && x <= 16 && z >= 0 && z <= 11) return 'main';
    return 'out';
  }
  function local(x, y, z){ // world -> coordinates centred on the current room (Resonance convention)
    return [x - (room.x0 + room.x1) / 2, y - room.h / 2, z - (room.z0 + room.z1) / 2];
  }
  function setListener(x, y, z, a){
    if (!isFinite(x) || !isFinite(y) || !isFinite(z) || !isFinite(a)) return;
    L.x = x; L.y = y; L.z = z; L.a = a;
    if (!ctx) return;
    var rid = roomFor(x, z);
    if (rid !== roomId) {
      roomId = rid; room = ROOMS[rid];
      if (scene) scene.setRoomProperties({ width: room.x1 - room.x0, height: room.h, depth: room.z1 - room.z0 }, room.m);
    }
    var fx = Math.cos(a), fz = Math.sin(a);
    if (scene) {
      var p = local(x, y, z); scene.setListenerPosition(p[0], p[1], p[2]); scene.setListenerOrientation(fx, 0, fz, 0, 1, 0);
    } else {
      var li = ctx.listener;
      if (li.positionX) { li.positionX.value = x; li.positionY.value = y; li.positionZ.value = z; li.forwardX.value = fx; li.forwardY.value = 0; li.forwardZ.value = fz; li.upX.value = 0; li.upY.value = 1; li.upZ.value = 0; }
      else { li.setPosition(x, y, z); li.setOrientation(fx, 0, fz, 0, 1, 0); }
    }
  }
  function makeSource(id, t){
    var s = { id: id, t: t, n: -1, mv: 0, o: 0, cur: null, tgt: null, clickT: 0, seen: 0 };
    s.lpf = ctx.createBiquadFilter(); s.lpf.type = 'lowpass'; s.lpf.frequency.value = 18000; s.lpf.Q.value = 0.5;
    s.gain = ctx.createGain(); s.gain.value = 1;
    s.lpf.connect(s.gain);
    if (scene) {
      s.res = scene.createSource({ minDistance: 0.6, maxDistance: 45, rolloff: 'logarithmic' });
      s.gain.connect(s.res.input);
    } else {
      s.pan = ctx.createPanner(); s.pan.panningModel = 'HRTF'; s.pan.distanceModel = 'inverse'; s.pan.refDistance = 1; s.pan.rolloffFactor = 1.2; s.pan.maxDistance = 45;
      s.gain.connect(s.pan); s.pan.connect(master);
    }
    if (t === 'bark') { // Marshal pants softly all the time
      var lp = ctx.createBufferSource(); lp.buffer = buffers.pant; lp.loop = true;
      var lg = ctx.createGain(); lg.gain.value = 0; lp.connect(lg); lg.connect(s.lpf); lp.start(); s.loop = lp; s.loopGain = lg;
    }
    return s;
  }
  function trigger(s, name, gain){
    var b = buffers[name]; if (!b) return;
    var src = ctx.createBufferSource(); src.buffer = b;
    var g = ctx.createGain(); g.gain.value = gain || 1; src.connect(g); g.connect(s.lpf); src.start();
  }
  // list: [{id, t, x, y, z, o (0..1 occlusion), n (event counter), mv (moving)}]
  function setSources(list){
    if (!ctx) return;
    var now = performance.now(), seen = {};
    list.forEach(function(e){
      var s = srcs[e.id];
      if (!s || s.t !== e.t) { if (s) drop(s); s = srcs[e.id] = makeSource(e.id, e.t); }
      seen[e.id] = 1; s.seen = now;
      if (!isFinite(e.x) || !isFinite(e.y) || !isFinite(e.z)) return;
      s.tgt = [e.x, e.y, e.z]; if (!s.cur) s.cur = s.tgt.slice();
      s.o = e.o || 0; s.mv = e.mv || 0;
      if (s.n >= 0 && e.n > s.n) trigger(s, e.t, 1);
      s.n = e.n;
    });
    Object.keys(srcs).forEach(function(k){ if (!seen[k]) { drop(srcs[k]); delete srcs[k]; } });
  }
  function drop(s){
    try { if (s.loop) s.loop.stop(); s.gain.disconnect(); if (s.pan) s.pan.disconnect(); } catch (e) {}
  }
  function clear(){ Object.keys(srcs).forEach(function(k){ drop(srcs[k]); delete srcs[k]; }); }
  function tick(){
    if (!ctx) return;
    Object.keys(srcs).forEach(function(k){
      var s = srcs[k]; if (!s.cur) return;
      for (var i = 0; i < 3; i++) s.cur[i] += (s.tgt[i] - s.cur[i]) * 0.3;
      if (scene) { var p = local(s.cur[0], s.cur[1], s.cur[2]); s.res.setPosition(p[0], p[1], p[2]); }
      else if (s.pan.positionX) { s.pan.positionX.value = s.cur[0]; s.pan.positionY.value = s.cur[1]; s.pan.positionZ.value = s.cur[2]; }
      else s.pan.setPosition(s.cur[0], s.cur[1], s.cur[2]);
      // occlusion: glass ~0.4, around a doorway ~0.45, through walls ~0.8
      var f = s.o <= 0.01 ? 18000 : Math.max(500, 18000 * Math.pow(1 - s.o, 2.6));
      s.lpf.frequency.setTargetAtTime(f, ctx.currentTime, 0.05);
      s.gain.gain.setTargetAtTime(1 - s.o * 0.5, ctx.currentTime, 0.05);
      if (s.loopGain) { var dx = s.cur[0] - L.x, dz = s.cur[2] - L.z, dd = Math.sqrt(dx * dx + dz * dz); s.loopGain.gain.setTargetAtTime(dd < 4.5 ? 0.3 * (1 - dd / 4.5) : 0, ctx.currentTime, 0.2); }
      if (s.t === 'bark' && s.mv) { s.clickT -= 0.03; if (s.clickT <= 0) { trigger(s, 'click', 0.5 + Math.random() * 0.4); s.clickT = 0.13 + Math.random() * 0.06; } }
    });
  }
  // non-spatial preview of a sound (e.g. "listen to the bird you are looking for")
  function preview(name){
    if (!ctx || !buffers[name]) return;
    var src = ctx.createBufferSource(); src.buffer = buffers[name]; var g = ctx.createGain(); g.gain.value = 0.8; src.connect(g); g.connect(master); src.start();
  }
  function engine(){ return !ctx ? 'off' : scene ? 'resonance' : 'hrtf'; }
  return { init: init, setListener: setListener, setSources: setSources, clear: clear, preview: preview, engine: engine, roomFor: roomFor };
})();

/* Placeholder sounds, synthesized until the real recordings arrive (snd/*.mp3 replaces them). */
var SYNTH = (function(){
  function buf(ctx, sec, fn){ var sr = ctx.sampleRate, n = Math.floor(sr * sec), b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0); fn(d, sr); var m = 0; for (var i = 0; i < n; i++) m = Math.max(m, Math.abs(d[i])); if (m > 0) for (i = 0; i < n; i++) d[i] *= 0.85 / m; return b; }
  // tone with a pitch glide, vibrato and some harmonics
  function note(d, sr, t0, dur, f0, f1, amp, o){
    o = o || {}; var s0 = Math.floor(t0 * sr), n = Math.floor(dur * sr), ph = 0, nz = 0;
    for (var i = 0; i < n && s0 + i < d.length; i++) {
      var t = i / n, f = f0 + (f1 - f0) * (o.curve ? Math.pow(t, o.curve) : t);
      if (o.vib) f += Math.sin(2 * Math.PI * o.vib * i / sr) * (o.vibDepth || 40);
      ph += 2 * Math.PI * f / sr;
      var env = Math.min(1, i / (sr * (o.att || 0.006))) * Math.min(1, (n - i) / (sr * (o.rel || 0.02)));
      var v = Math.sin(ph) + (o.h2 || 0) * Math.sin(2 * ph) + (o.h3 || 0) * Math.sin(3 * ph);
      if (o.noise) { nz += ((Math.random() * 2 - 1) - nz) * 0.5; v += nz * o.noise; }
      d[s0 + i] += v * env * amp;
    }
  }
  function make(ctx, B){
    B.bark = buf(ctx, 0.62, function(d, sr){
      [0, 0.28].forEach(function(t0, k){
        var s0 = Math.floor(t0 * sr), n = Math.floor(0.16 * sr), ph = 0, lp = 0;
        for (var i = 0; i < n; i++) {
          var t = i / sr, f = (k ? 470 : 520) - 900 * t, env = Math.min(1, t / 0.006) * Math.exp(-t * 22);
          ph += 2 * Math.PI * f / sr; var v = 0; for (var h = 1; h <= 8; h++) v += Math.sin(ph * h) / h;
          var nz = Math.random() * 2 - 1; lp += (nz - lp) * 0.35;
          d[s0 + i] += (v * 0.35 + lp * 0.5) * env;
        }
      });
    });
    // dog panting: short "hah" breaths through a vocal-tract-like resonance (not a constant hiss)
    B.pant = buf(ctx, 1.0, function(d, sr){
      var y1 = 0, y2 = 0, f = 1300, bw = 500, r = Math.exp(-Math.PI * bw / sr), c1 = 2 * r * Math.cos(2 * Math.PI * f / sr), c2 = -r * r;
      for (var i = 0; i < d.length; i++) {
        var t = i / sr, ph = (t % 0.25) / 0.25, inhale = Math.floor(t / 0.25) % 2;
        var env = ph < 0.45 ? Math.sin(Math.PI * ph / 0.45) : 0; env = Math.pow(env, 1.5) * (inhale ? 0.55 : 1);
        var x = (Math.random() * 2 - 1) * env, y = x + c1 * y1 + c2 * y2; y2 = y1; y1 = y;
        d[i] = y;
      }
    });
    B.click = buf(ctx, 0.02, function(d, sr){ for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.002)); });
    // bem-te-vi: "bem - te - viii"
    B.bemtevi = buf(ctx, 0.8, function(d, sr){
      note(d, sr, 0.00, 0.10, 2500, 2900, 0.8, { h2: 0.3, noise: 0.15 });
      note(d, sr, 0.16, 0.09, 2700, 3000, 0.8, { h2: 0.3, noise: 0.15 });
      note(d, sr, 0.31, 0.40, 3200, 2100, 1.0, { h2: 0.35, noise: 0.2, curve: 1.6, vib: 30, vibDepth: 60, rel: 0.08 });
    });
    // sabiá-laranjeira: melodic, flute-like phrase
    B.sabia = buf(ctx, 2.2, function(d, sr){
      var t = 0, sc = [1900, 2150, 2400, 2700, 3000, 2250, 1750];
      for (var k = 0; k < 8; k++) { var f = sc[(k * 3 + 2) % sc.length], dur = 0.12 + (k % 3) * 0.06; note(d, sr, t, dur, f, f * (k % 2 ? 1.08 : 0.94), 0.8, { h2: 0.12, vib: 22, vibDepth: 35, rel: 0.04 }); t += dur + 0.06 + (k % 4 === 3 ? 0.18 : 0); }
    });
    // quero-quero: harsh repeated alarm
    B.quero = buf(ctx, 1.3, function(d, sr){
      for (var k = 0; k < 6; k++) note(d, sr, k * 0.2, 0.1, 2400, 2000, 1, { h2: 0.6, h3: 0.4, noise: 0.5, att: 0.003 });
    });
    // joão-de-barro: accelerating duet "laugh"
    B.joao = buf(ctx, 2.0, function(d, sr){
      var t = 0, gap = 0.17;
      for (var k = 0; k < 16; k++) { var a = Math.sin(Math.PI * k / 16); note(d, sr, t, 0.05, 2700 - k * 30, 2400 - k * 30, 0.5 + a * 0.5, { h2: 0.4, noise: 0.15 }); note(d, sr, t + 0.025, 0.045, 2100 - k * 20, 1900 - k * 20, (0.4 + a * 0.4), { h2: 0.3 }); t += gap; gap = Math.max(0.05, gap * 0.9); }
    });
    // periquito-rico: high, noisy chatter
    B.periquito = buf(ctx, 1.1, function(d, sr){
      var t = 0; for (var k = 0; k < 9; k++) { var f = 3500 + ((k * 7919) % 1300); note(d, sr, t, 0.05, f, f + 600, 0.9, { noise: 0.6, h2: 0.2, att: 0.002 }); t += 0.08 + (k % 3) * 0.03; }
    });
    // andorinha: soft twittering
    B.andorinha = buf(ctx, 1.2, function(d, sr){
      var t = 0; for (var k = 0; k < 11; k++) { var f = 4500 + ((k * 4241) % 1500); note(d, sr, t, 0.035, f, f - 900, 0.6, { vib: 120, vibDepth: 300, att: 0.002 }); t += 0.07 + (k % 2) * 0.04; }
    });
  }
  return { make: make };
})();
