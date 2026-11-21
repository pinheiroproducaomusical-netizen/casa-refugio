/* Binaural (HRTF) one-shot sounds for each phone. Positions are given relative to the listener. */
var AUDIO = (function(){
  var ctx = null, master = null, buffers = {};
  function init(){
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    buffers.bark = synthBark();
    load('bark', 'snd/latido.mp3');
  }
  function load(name, url){
    try {
      fetch(url).then(function(r){ if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(function(ab){ ctx.decodeAudioData(ab, function(b){ buffers[name] = b; }, function(){}); })
        .catch(function(){});
    } catch (e) {}
  }
  // placeholder "au-au" until the real recording arrives
  function synthBark(){
    var sr = ctx.sampleRate, len = Math.floor(sr * 0.6), b = ctx.createBuffer(1, len, sr), d = b.getChannelData(0);
    [0, 0.27].forEach(function(t0, k){
      var s0 = Math.floor(t0 * sr), n = Math.floor(0.16 * sr), ph = 0, lp = 0;
      for (var i = 0; i < n; i++) {
        var t = i / sr, f = (k ? 470 : 520) - 900 * t, env = Math.min(1, t / 0.006) * Math.exp(-t * 22);
        ph += 2 * Math.PI * f / sr;
        var v = 0; for (var h = 1; h <= 8; h++) v += Math.sin(ph * h) / (h * 0.9 + (h === 3 || h === 4 ? -0.6 : 0));
        var nz = (Math.random() * 2 - 1) * 0.6; lp += (nz - lp) * 0.35;
        d[s0 + i] += (v * 0.22 + lp * 0.5) * env;
      }
    });
    return b;
  }
  // rel = {x: right, y: up, z: -forward} in metres; occluded -> muffled through walls
  function play(name, rel, occluded, gain){
    if (!ctx || !buffers[name]) return;
    if (ctx.state === 'suspended') ctx.resume();
    var src = ctx.createBufferSource(); src.buffer = buffers[name];
    var lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = occluded ? 900 : 16000;
    var pan = ctx.createPanner(); pan.panningModel = 'HRTF'; pan.distanceModel = 'inverse'; pan.refDistance = 1.2; pan.rolloffFactor = 1.4; pan.maxDistance = 40;
    if (pan.positionX) { pan.positionX.value = rel.x; pan.positionY.value = rel.y; pan.positionZ.value = rel.z; } else pan.setPosition(rel.x, rel.y, rel.z);
    var g = ctx.createGain(); g.gain.value = (gain || 1) * (occluded ? 0.7 : 1);
    src.connect(lpf); lpf.connect(pan); pan.connect(g); g.connect(master);
    src.start();
  }
  // world (x,z) of a source relative to a listener at (px,pz) facing angle a
  function rel(px, pz, a, sx, sz, dy){
    var dx = sx - px, dz = sz - pz, fx = Math.cos(a), fz = Math.sin(a);
    return { x: dx * -fz + dz * fx, y: dy || 0, z: -(dx * fx + dz * fz) };
  }
  return { init: init, play: play, rel: rel };
})();
