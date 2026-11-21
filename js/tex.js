/* Procedural canvas textures + photo textures */
var TEX = (function(){
  function cv(w, h){ var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rnd(a, b){ return a + Math.random() * (b - a); }
  function noise(g, w, h, n, cols, smin, smax){
    for (var i = 0; i < n; i++) { g.fillStyle = cols[(Math.random() * cols.length) | 0]; var s = rnd(smin, smax); g.fillRect(Math.random() * w, Math.random() * h, s, s); }
  }
  function mk(c, repeat){
    var t = new THREE.CanvasTexture(c);
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    t.anisotropy = 1;
    return t;
  }
  var T = {};
  T.floor = function(){ // 2 x 2 large porcelain tiles, beige
    var c = cv(512, 512), g = c.getContext('2d');
    g.fillStyle = '#d9d2c6'; g.fillRect(0, 0, 512, 512);
    noise(g, 512, 512, 9000, ['#d2cabd', '#dfd8cc', '#cfc7b9', '#e3ddd2'], 1, 3);
    g.strokeStyle = '#bdb4a6'; g.lineWidth = 3;
    g.strokeRect(1, 1, 255, 255); g.strokeRect(257, 1, 254, 255); g.strokeRect(1, 257, 255, 254); g.strokeRect(257, 257, 254, 254);
    return mk(c, true);
  };
  T.planks = function(base, line, h){ // ceiling slats / deck
    var c = cv(256, 256), g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    for (var y = 0; y < 256; y += h) {
      g.fillStyle = 'rgba(' + ((Math.random() * 40) | 0) + ',' + ((Math.random() * 20) | 0) + ',0,0.12)'; g.fillRect(0, y, 256, h);
      g.fillStyle = line; g.fillRect(0, y, 256, 2);
      for (var k = 0; k < 6; k++) { g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(Math.random() * 256, y + 3 + Math.random() * (h - 6), rnd(20, 90), 1); }
    }
    return mk(c, true);
  };
  T.mosaic = function(){ // red glass pastilha
    var c = cv(256, 256), g = c.getContext('2d');
    g.fillStyle = '#e8e0e0'; g.fillRect(0, 0, 256, 256);
    var cols = ['#c0141c', '#a80f17', '#d01f26', '#b51219', '#9c0d14', '#c81a22'];
    for (var y = 0; y < 256; y += 16) for (var x = 0; x < 256; x += 16) { g.fillStyle = cols[(Math.random() * cols.length) | 0]; g.fillRect(x + 1, y + 1, 14, 14); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 2, y + 2, 5, 3); }
    return mk(c, true);
  };
  T.granite = function(base, cols){
    var c = cv(256, 256), g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    noise(g, 256, 256, 5000, cols, 1, 3);
    return mk(c, true);
  };
  T.subway = function(){
    var c = cv(256, 256), g = c.getContext('2d');
    g.fillStyle = '#f4f3ef'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#d6d3cb'; g.lineWidth = 2;
    for (var r = 0; r < 8; r++) { var off = (r % 2) * 32; for (var x = -64; x < 256; x += 64) g.strokeRect(x + off, r * 32, 64, 32); }
    return mk(c, true);
  };
  T.stripes = function(){
    var c = cv(128, 128), g = c.getContext('2d');
    var cols = ['#3b2f2a', '#8f8378', '#5a4c43', '#c9bfb2', '#2c2420', '#7a6d62', '#a89c8e'];
    var x = 0; while (x < 128) { var w = 3 + ((Math.random() * 10) | 0); g.fillStyle = cols[(Math.random() * cols.length) | 0]; g.fillRect(x, 0, w, 128); x += w; }
    return mk(c, true);
  };
  T.playmat = function(){
    var c = cv(256, 256), g = c.getContext('2d');
    var cols = ['#f7e3c8', '#d6eedf', '#fde2e4', '#dfe9f7'];
    for (var y = 0; y < 2; y++) for (var x = 0; x < 2; x++) {
      g.fillStyle = cols[y * 2 + x]; g.fillRect(x * 128, y * 128, 128, 128);
      for (var k = 0; k < 5; k++) { g.fillStyle = ['#f4a261', '#7ec8a9', '#f28ca0', '#8ab6e8', '#ffd166'][k]; g.beginPath(); g.arc(x * 128 + rnd(15, 113), y * 128 + rnd(15, 113), rnd(6, 16), 0, 7); g.fill(); }
    }
    g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; g.strokeRect(0, 0, 256, 256); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke();
    return mk(c, true);
  };
  T.grass = function(){
    var c = cv(256, 256), g = c.getContext('2d');
    g.fillStyle = '#6f9e3a'; g.fillRect(0, 0, 256, 256);
    noise(g, 256, 256, 7000, ['#7aab41', '#628f33', '#86b84b', '#5a8530'], 1, 3);
    return mk(c, true);
  };
  T.brick = function(){
    var c = cv(128, 128), g = c.getContext('2d');
    g.fillStyle = '#d9c9b5'; g.fillRect(0, 0, 128, 128);
    for (var r = 0; r < 8; r++) for (var x = -32; x < 128; x += 32) { g.fillStyle = ['#a4532f', '#b35f38', '#984a29'][(Math.random() * 3) | 0]; g.fillRect(x + (r % 2) * 16 + 1, r * 16 + 1, 30, 14); }
    return mk(c, true);
  };
  T.sky = function(){
    var c = cv(16, 256), g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#6fa8dc'); gr.addColorStop(0.55, '#bcd8ee'); gr.addColorStop(1, '#e9f2f7');
    g.fillStyle = gr; g.fillRect(0, 0, 16, 256);
    return mk(c, false);
  };
  T.label = function(text, color){
    var c = cv(256, 64), g = c.getContext('2d');
    g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.strokeText(text, 128, 34);
    g.fillStyle = color || '#fff'; g.fillText(text, 128, 34);
    return mk(c, false);
  };
  var loader = new THREE.TextureLoader();
  T.photo = function(name, repeat){
    var t = loader.load('tex/' + name + '.jpg');
    if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  };
  T.merge = function(list){
    var total = 0; list = list.map(function(g){ g = g.index ? g.toNonIndexed() : g; total += g.attributes.position.count; return g; });
    var P = new Float32Array(total * 3), N = new Float32Array(total * 3), U = new Float32Array(total * 2), o = 0;
    list.forEach(function(g){ var c = g.attributes.position.count; P.set(g.attributes.position.array, o * 3); if (g.attributes.normal) N.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) U.set(g.attributes.uv.array, o * 2); o += c; });
    var mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.BufferAttribute(P, 3)); mg.setAttribute('normal', new THREE.BufferAttribute(N, 3)); mg.setAttribute('uv', new THREE.BufferAttribute(U, 2));
    mg.computeBoundingSphere(); return mg;
  };
  return T;
})();
