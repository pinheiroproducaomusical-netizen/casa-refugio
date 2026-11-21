/* TV side: renders the house in split screen and runs the treasure hunt. */
var GAME = (function(){
  var ROUNDS = 5, HINT_EVERY = 20, ROUND_TIME = 60, SEARCH_R = 1.35, CATCH_R = 1.25;
  var renderer, scene, house, mq = null, code = '';
  var slots = [null, null, null];
  var phase = 'lobby', round = 0, used = [], cur = null, roundT = 0, phaseT = 0, foundBy = null;
  var hud = {}, scale = /hq/.test(location.search) ? 1 : 0.75, fps = 60, fpsFrames = 0, fpsT = 0, lowT = 0;
  var sparkle, pongs = {}, dirty = true, lastPub = 0;
  var mode = 'sumiu', npc = null, poos = [], pooGeo = null, pooMat = null, grid = null, barkN = 0, timedOut = false, roundsPlayed = 0;

  function $(id){ return document.getElementById(id); }
  function el(tag, cls, parent){ var e = document.createElement(tag); if (cls) e.className = cls; (parent || document.body).appendChild(e); return e; }

  var explore = false;
  function start(opts){
    explore = !!(opts && opts.explore);
    $('tv').style.display = 'block';
    var lite = /lite/.test(location.search);
    renderer = new THREE.WebGLRenderer({ antialias: !lite });
    renderer.shadowMap.enabled = !lite; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = false;
    renderer.setPixelRatio(1);
    renderer.autoClear = false; renderer.info.autoReset = false;
    $('tv').appendChild(renderer.domElement);
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xcfe0ea, 25, 70);
    scene.add(new THREE.HemisphereLight(0xf2f4ff, 0x7a6a58, 0.7));
    var sun = new THREE.DirectionalLight(0xffe6c0, 0.95);
    sun.position.set(8 - 9, 10, 4 - 13); sun.target.position.set(8, 0, 4); scene.add(sun.target);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    var sc = sun.shadow.camera; sc.left = -17; sc.right = 17; sc.top = 15; sc.bottom = -15; sc.near = 1; sc.far = 45;
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
    scene.add(sun);
    var fill = new THREE.DirectionalLight(0xdfe8ff, 0.16); fill.position.set(10, 6, 14); scene.add(fill);
    house = HOUSE.build(scene);
    renderer.shadowMap.needsUpdate = true;
    // sparkle (Aria's perk)
    sparkle = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkleTex(), transparent: true, depthTest: false, blending: THREE.AdditiveBlending }));
    sparkle.scale.set(0.8, 0.8, 1); sparkle.visible = false; sparkle.renderOrder = 20; scene.add(sparkle);
    buildHud();
    resize(); addEventListener('resize', resize);
    drawTvScreen();
    if (explore) { startExplore(); requestAnimationFrame(loop); return; }
    connectBroker(null, onMsg, function(m, idx){
      if (!m) { hud.code.textContent = 'Sem conexão'; hud.lobbyMsg.textContent = 'Não consegui conectar ao servidor. Verifique a internet da TV e recarregue.'; return; }
      mq = m; code = String(idx + 1) + String(Math.floor(100 + Math.random() * 900));
      mq.sub('casarefugio/' + code + '/pad');
      hud.code.textContent = code; dirty = true; drawTvScreen();
    }, function(){ hud.lobbyMsg.textContent = 'Conexão perdida — recarregue a página da TV.'; });
    requestAnimationFrame(loop);
  }

  function startExplore(){
    var chIdx = 0, x = 0, y = 0, sid = null, stick = $('xstick'), knob = $('xknob'), aDown = false, st = 0;
    $('explore').style.display = 'block';
    function send(ch){ var m = { id: 'me', ch: ch || CHARS.list[chIdx], x: x, y: y, a: aDown, j: jDown }; if (st > 0) { m.st = 1; m.gm = gm; st--; } onMsg('l', JSON.stringify(m)); }
    var jDown = false, xj = $('xJ');
    xj.addEventListener('touchstart', function(e){ e.preventDefault(); jDown = true; xj.classList.add('down'); try { navigator.vibrate(15); } catch (err) {} }, { passive: false });
    xj.addEventListener('touchend', function(){ jDown = false; xj.classList.remove('down'); });
    xj.addEventListener('mousedown', function(){ jDown = true; }); xj.addEventListener('mouseup', function(){ jDown = false; });
    var xa = $('xA');
    xa.addEventListener('touchstart', function(e){ e.preventDefault(); aDown = true; xa.classList.add('down'); try { navigator.vibrate(22); } catch (err) {} }, { passive: false });
    xa.addEventListener('touchend', function(){ aDown = false; xa.classList.remove('down'); });
    xa.addEventListener('mousedown', function(){ aDown = true; }); xa.addEventListener('mouseup', function(){ aDown = false; });
    var gm = 'sumiu';
    $('xstart1').onclick = function(){ gm = 'sumiu'; st = 2; AUDIO.init(); try { navigator.vibrate(12); } catch (e) {} };
    $('xstart2').onclick = function(){ gm = 'marshal'; st = 2; AUDIO.init(); try { navigator.vibrate(12); } catch (e) {} };
    setInterval(function(){ var show = (phase === 'lobby' || phase === 'end') ? 'block' : 'none'; $('xstarts').style.display = show; $('xchar').style.display = phase === 'lobby' ? 'block' : 'none'; }, 300);
    send();
    setInterval(function(){ send(); }, 50);
    function mv(cx, cy){ var r = stick.getBoundingClientRect(), dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2), max = r.width / 2 - 20, d = Math.sqrt(dx * dx + dy * dy); if (d > max) { dx *= max / d; dy *= max / d; } knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; x = dx / max; y = dy / max; }
    function rel(){ sid = null; x = y = 0; knob.style.transform = ''; zone = 0; }
    var zone = 0;
    setInterval(function(){ var z = Math.min(3, Math.floor(Math.sqrt(x * x + y * y) * 3.2)); if (z !== zone) { if (z > zone) { try { navigator.vibrate(z === 3 ? 18 : 8); } catch (e) {} } zone = z; } }, 30);
    var sniffT = 0;
    setInterval(function(){ var p = slots[0]; if (!p || p.ch !== 'marshal' || mode !== 'sumiu') return; var h = heatOf(p); if (h < 0.55) return; sniffT -= 0.1; if (sniffT <= 0) { try { navigator.vibrate(h > 0.8 ? 35 : 15); } catch (e) {} sniffT = h > 0.8 ? 0.35 : 0.9; } }, 100);
    stick.addEventListener('touchstart', function(e){ e.preventDefault(); var t = e.changedTouches[0]; sid = t.identifier; mv(t.clientX, t.clientY); AUDIO.init(); try { navigator.vibrate(10); } catch (err) {} }, { passive: false });
    stick.addEventListener('touchmove', function(e){ e.preventDefault(); for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === sid) mv(e.changedTouches[i].clientX, e.changedTouches[i].clientY); }, { passive: false });
    stick.addEventListener('touchend', rel); stick.addEventListener('touchcancel', rel);
    var down = false;
    stick.addEventListener('mousedown', function(e){ down = true; mv(e.clientX, e.clientY); });
    addEventListener('mousemove', function(e){ if (down) mv(e.clientX, e.clientY); });
    addEventListener('mouseup', function(){ if (down) { down = false; rel(); } });
    $('xchar').onclick = function(){
      try { navigator.vibrate(12); } catch (e) {} AUDIO.init();
      var p = slots[0]; chIdx = (chIdx + 1) % CHARS.list.length;
      if (p) { setChar(p, CHARS.list[chIdx]); p.camInit = false; }
      $('xchar').textContent = '👤 ' + CHARS.info[CHARS.list[chIdx]].name;
    };
    $('xchar').textContent = '👤 ' + CHARS.info[CHARS.list[0]].name;
  }

  function sparkleTex(){
    var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d');
    var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,220,1)'); gr.addColorStop(0.3, 'rgba(255,220,120,0.7)'); gr.addColorStop(1, 'rgba(255,200,80,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.fillStyle = '#fff'; g.fillRect(30, 4, 4, 56); g.fillRect(4, 30, 56, 4);
    return new THREE.CanvasTexture(c);
  }

  /* ---------------- networking ---------------- */
  function onMsg(topic, s){
    var d; try { d = JSON.parse(s); } catch (e) { return; }
    if (!d || typeof d.id !== 'string') return;
    var p = null, i;
    for (i = 0; i < 3; i++) if (slots[i] && slots[i].id === d.id) p = slots[i];
    if (!p) {
      if (!d.ch || !CHARS.info[d.ch] || chTaken(d.ch)) return;
      for (i = 0; i < 3; i++) if (!slots[i]) { p = slots[i] = newPlayer(d.id, d.ch, i); break; }
      if (!p) return;
      dirty = true;
    }
    if (d.ch && d.ch !== p.ch && phase === 'lobby' && !chTaken(d.ch)) { setChar(p, d.ch); dirty = true; }
    p.seen = performance.now();
    p.ix = clamp(+d.x || 0, -1, 1); p.iy = clamp(+d.y || 0, -1, 1);
    var a = !!d.a; if (a && !p.a) p.press = true; p.a = a;
    var j = !!d.j; if (j && !p.j) p.jump = true; p.j = j;
    if (d.st && (phase === 'lobby' || phase === 'end')) startGame(d.gm === 'marshal' ? 'marshal' : 'sumiu');
    if (d.lv) { removePlayer(p); return; }
    if (d.t) pongs[d.id] = d.t;
  }
  function chTaken(ch){ for (var i = 0; i < 3; i++) if (slots[i] && slots[i].ch === ch) return true; return false; }
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function r2(v){ return Math.round(v * 100) / 100; }

  function publish(now){
    if (!mq || !code) return;
    var fast = mode === 'marshal' && phase === 'round';
    if (!dirty && now - lastPub < (fast ? 120 : 250)) return;
    lastPub = now; dirty = false;
    var st = { ph: phase, gm: mode, r: round, R: ROUNDS, pl: [], hints: [], pg: pongs, tl: phase === 'round' ? Math.max(0, Math.ceil(ROUND_TIME - roundT)) : 0 };
    pongs = {};
    slots.forEach(function(p){ if (p) st.pl.push({ id: p.id, ch: p.ch, sc: p.score, near: p.nearSpot ? p.nearSpot.name : '', msg: p.msgT > 0 ? p.msg : '', bp: p.bump || 0, ht: p.ch === 'marshal' && mode === 'sumiu' ? Math.round(heatOf(p) * 100) / 100 : 0,
      nd: p.nearDog ? 1 : 0, px: r2(p.x), pz: r2(p.z), pa: r2(p.ang), oc: npc && mode === 'marshal' ? (occluded(p.x, p.z, npc.x, npc.z) ? 1 : 0) : 0 }); });
    if (npc && mode === 'marshal') { st.mx = r2(npc.x); st.mz = r2(npc.z); st.bk = barkN; }
    if (phase !== 'lobby' && phase !== 'end') { st.obj = title(); st.hints = hintsNow(); }
    if (phase === 'found' && foundBy) st.found = foundBy;
    if (phase === 'end') st.win = winnerText();
    mq.pub('casarefugio/' + code + '/tv', JSON.stringify(st));
  }

  /* ---------------- players ---------------- */
  var STARTS = [[6.0, 4.6], [7.2, 4.0], [5.0, 4.0]];
  function newPlayer(id, ch, i){
    var p = { id: id, slot: i, x: STARTS[i][0], z: STARTS[i][1], ang: Math.PI / 2, ix: 0, iy: 0, a: false, press: false,
      score: 0, msg: '', msgT: 0, searchT: 0, seen: performance.now(), cam: new THREE.PerspectiveCamera(70, 1, 0.05, 120),
      cx: 0, cy: 0, cz: 0, camInit: false, speedNow: 0, nearSpot: null };
    setChar(p, ch);
    return p;
  }
  function setChar(p, ch){
    if (p.model) scene.remove(p.model.root);
    p.ch = ch; p.info = CHARS.info[ch]; p.model = CHARS.make(ch); scene.add(p.model.root);
    p.r = p.info.kind === 'adult' ? 0.26 : 0.22;
  }
  function removePlayer(p){ scene.remove(p.model.root); slots[p.slot] = null; dirty = true; }

  var STEP = 0.12;
  function blocked(x, z, r, baby, y){
    y = y || 0;
    var lists = baby ? [house.walls] : [house.walls, house.soft];
    for (var l = 0; l < lists.length; l++) { var L = lists[l]; for (var i = 0; i < L.length; i++) { var b = L[i]; if (x + r > b.x0 && x - r < b.x1 && z + r > b.z0 && z - r < b.z1 && (b.h === undefined ? 99 : b.h) > y + STEP) return true; } }
    return x < r || x > 16 - r || z < r || z > 11 - r;
  }
  // height of whatever the character is standing on (sofa, chair, hot-tub deck...)
  function groundAt(x, z, r, baby, y){
    var g = 0, lists = baby ? [house.walls] : [house.walls, house.soft];
    for (var l = 0; l < lists.length; l++) { var L = lists[l]; for (var i = 0; i < L.length; i++) { var b = L[i], h = b.h === undefined ? 99 : b.h; if (h > g && h <= y + STEP && x + r * 0.6 > b.x0 && x - r * 0.6 < b.x1 && z + r * 0.6 > b.z0 && z - r * 0.6 < b.z1) g = h; } }
    return g;
  }
  function wallAt(x, z){
    var W = house.walls; for (var i = 0; i < W.length; i++) { var b = W[i]; if (x > b.x0 - 0.08 && x < b.x1 + 0.08 && z > b.z0 - 0.08 && z < b.z1 + 0.08) return true; }
    return x < 0.08 || x > 15.92 || z < 0.08 || z > 10.92;
  }

  function updatePlayer(p, dt){
    // turning: soft curve so small pushes turn gently
    var tx = Math.abs(p.ix) < 0.12 ? 0 : p.ix, ty = Math.abs(p.iy) < 0.12 ? 0 : p.iy;
    p.ang += (tx < 0 ? -1 : 1) * Math.pow(Math.abs(tx), 1.8) * 2.0 * dt;
    var sp = -ty * p.info.speed; if (sp < 0) sp *= 0.5;
    if (p.searchT > 0) sp = 0;
    var dx = Math.cos(p.ang) * sp * dt, dz = Math.sin(p.ang) * sp * dt, baby = p.ch === 'joao';
    // jump + gravity
    if (p.y === undefined) { p.y = 0; p.vy = 0; }
    var g0 = groundAt(p.x, p.z, p.r, baby, p.y);
    if (p.jump) { p.jump = false; if (p.y - g0 < 0.03) { p.vy = p.info.kind === 'adult' ? 4.0 : 3.6; buzz(p, 12); } }
    p.vy -= 12 * dt; p.y += p.vy * dt;
    var hit = false;
    if (!blocked(p.x + dx, p.z, p.r, baby, p.y)) p.x += dx; else if (Math.abs(dx) > 0.001) hit = true;
    if (!blocked(p.x, p.z + dz, p.r, baby, p.y)) p.z += dz; else if (Math.abs(dz) > 0.001) hit = true;
    var g1 = groundAt(p.x, p.z, p.r, baby, p.y);
    if (p.y <= g1) { if (p.vy < -3.5) buzz(p, 15); p.y = g1; p.vy = 0; }
    p.bumpT = (p.bumpT || 0) - dt;
    if (hit && p.bumpT <= 0) { p.bump = (p.bump || 0) + 1; p.bumpT = 0.5; dirty = true; buzz(p, 25); }
    p.speedNow = Math.abs(sp) / p.info.speed;
    var m = p.model.root; m.position.set(p.x, p.y, p.z); m.rotation.y = -p.ang + Math.PI / 2;
    p.model.animate(dt, p.speedNow + (p.searchT > 0 ? 0.6 : 0));
    // nearest search spot (game 1) / Marshal in reach (game 2)
    p.nearSpot = null; var best = SEARCH_R;
    p.nearDog = mode === 'marshal' && npc && phase === 'round' && Math.sqrt((npc.x - p.x) * (npc.x - p.x) + (npc.z - p.z) * (npc.z - p.z)) < CATCH_R;
    if (mode === 'sumiu') house.spots.forEach(function(s){ var d = Math.sqrt((s.x - p.x) * (s.x - p.x) + (s.z - p.z) * (s.z - p.z)); if (d < best) { best = d; p.nearSpot = s; } });
    if (p.msgT > 0) { p.msgT -= dt; if (p.msgT <= 0) dirty = true; }
    // search
    if (p.press) {
      p.press = false;
      if (p.nearDog) caught(p);
      else if (phase === 'round' && mode === 'sumiu' && p.nearSpot && p.searchT <= 0) { p.searchT = 0.9; p.searching = p.nearSpot; say(p, 'Procurando ' + p.nearSpot.name + '...', 1); }
    }
    if (p.searchT > 0) {
      p.searchT -= dt;
      if (p.searchT <= 0 && phase === 'round') {
        if (p.searching.id === cur.spot) found(p);
        else { say(p, 'Nada ' + p.searching.name + '...', 1.8); buzz(p, [30, 50, 30]); }
      }
    }
    // camera: rigidly behind the character (no lag when walking backwards); only the angle is smoothed,
    // and it moves in quickly when a wall is behind, then eases back out slowly.
    var dist = p.info.kind === 'adult' ? 2.3 : 1.7, hgt = p.info.cam + 0.45;
    if (!p.camInit) { p.camAng = p.ang; p.camDist = dist; p.camInit = true; }
    var da = p.ang - p.camAng; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    p.camAng += da * Math.min(1, dt * 8);
    var fx = Math.cos(p.camAng), fz = Math.sin(p.camAng), want = dist;
    for (var t = 0.3; t <= dist; t += 0.08) { if (wallAt(p.x - fx * t, p.z - fz * t)) { want = Math.max(0.3, t - 0.15); break; } }
    p.camDist += (want - p.camDist) * Math.min(1, dt * (want < p.camDist ? 14 : 2));
    p.camY = p.camY === undefined ? p.y : p.camY + (p.y - p.camY) * Math.min(1, dt * 6);
    var cy = hgt + p.camY * 0.7; if (p.z - fz * p.camDist > 6.45 || p.z > 6.45) cy = Math.min(cy, 2.45);
    p.cam.position.set(p.x - fx * p.camDist, cy, p.z - fz * p.camDist);
    p.cam.lookAt(p.x + fx * 1.2, p.info.cam * 0.8 + p.camY * 0.7, p.z + fz * 1.2);
  }
  function say(p, text, sec){ p.msg = text; p.msgT = sec; dirty = true; }
  function buzz(p, pat){ if (explore && p.id === 'me') { try { navigator.vibrate(pat); } catch (e) {} } }
  function heatOf(p){ if (phase !== 'round') return 0; var sp = targetPos(); if (!sp) return 0; var d = Math.sqrt((sp.x - p.x) * (sp.x - p.x) + (sp.z - p.z) * (sp.z - p.z)); return clamp(1 - d / 12, 0, 1); }

  /* ---------------- game flow ---------------- */
  function startGame(gm){
    mode = gm; round = 0; used = []; slots.forEach(function(p){ if (p) p.score = 0; });
    // nobody can play as Marshal while Marshal is the one hiding
    if (mode === 'marshal') slots.forEach(function(p){ if (p && p.ch === 'marshal') { var free = CHARS.list.filter(function(c){ return c !== 'marshal' && !chTaken(c); })[0]; if (free) setChar(p, free); } });
    nextRound();
  }
  function nextRound(){
    restoreItem(); clearDog();
    if (round >= ROUNDS) { phase = 'end'; phaseT = 0; dirty = true; drawTvScreen(); return; }
    round++; roundT = 0; foundBy = null; timedOut = false;
    if (mode === 'sumiu') {
      var pool = CHALLENGES.filter(function(c, i){ return used.indexOf(i) < 0; });
      if (!pool.length) { used = []; pool = CHALLENGES.slice(); }
      cur = pool[(Math.random() * pool.length) | 0]; used.push(CHALLENGES.indexOf(cur));
      house.items[cur.item].obj.visible = false;
    } else spawnDog();
    phase = 'round'; dirty = true;
    drawTvScreen();
  }
  function hintCount(){ return Math.min(3, 1 + Math.floor(roundT / HINT_EVERY)); }
  function title(){ return mode === 'marshal' ? 'Cadê o Marshal?' : (cur ? 'Sumiu ' + house.items[cur.item].name + '!' : ''); }
  function hintsNow(){
    if (mode === 'sumiu') return cur ? cur.hints.slice(0, hintCount()) : [];
    var h = ['🐾 Ele fica indo e vindo pela casa. Siga os cocôs e os latidos (com fone de ouvido, o som vem da direção certa)!'];
    if (npc && hintCount() >= 2) h.push('🐶 Agora ele está ' + roomOf(npc.x, npc.z) + '.');
    if (npc && hintCount() >= 3) h.push('👃 Bem pertinho ' + nearestSpotName(npc.x, npc.z) + '.');
    return h;
  }
  function targetPos(){
    if (mode === 'marshal') return npc ? { x: npc.x, z: npc.z } : null;
    return cur ? spotById(cur.spot) : null;
  }
  function found(p){
    p.score++; phase = 'found'; phaseT = 0;
    var it = house.items[cur.item], sp = spotById(cur.spot);
    it.obj.visible = true; it.obj.position.set(sp.x, 1.3, sp.z);
    foundBy = p.info.name + ' achou ' + it.name + ' ' + sp.name + '!';
    slots.forEach(function(q){ if (q) { say(q, q === p ? 'Você achou! +1 ponto' : foundBy, 6); buzz(q, q === p ? [80, 60, 160] : [40]); } });
    dirty = true; drawTvScreen();
  }
  function caught(p){
    p.score++; phase = 'found'; phaseT = 0; npc.state = 'caught'; npc.wag = 0;
    foundBy = p.info.name + ' achou o Marshal ' + roomOf(npc.x, npc.z) + '!';
    slots.forEach(function(q){ if (q) { say(q, q === p ? 'Achou o Marshal! +1 ponto' : foundBy, 6); buzz(q, q === p ? [80, 60, 160] : [40]); } });
    bark(); dirty = true; drawTvScreen();
  }
  function timeUp(){
    phase = 'found'; phaseT = 0; timedOut = true;
    if (mode === 'sumiu') {
      var it = house.items[cur.item], sp = spotById(cur.spot);
      it.obj.visible = true; it.obj.position.set(sp.x, 1.3, sp.z);
      foundBy = 'Tempo esgotado! ' + it.name.charAt(0).toUpperCase() + it.name.slice(1) + ' estava ' + sp.name + '.';
    } else {
      foundBy = 'Tempo esgotado! O Marshal estava ' + roomOf(npc.x, npc.z) + '.'; npc.state = 'caught'; bark();
    }
    slots.forEach(function(q){ if (q) { say(q, foundBy, 5); buzz(q, [200]); } });
    dirty = true; drawTvScreen();
  }
  function roomOf(x, z){
    if (x < 3.2 && z < 3.8) return 'perto da banheira';
    if (x < 3 && z > 6) return 'no banheiro';
    if (x < 4.65 && z > 8.8) return 'na lavanderia';
    if (x >= 4.6 && x < 10.7 && z > 6.75) return 'na cozinha';
    if (x >= 10.7 && z > 6.3) return 'na sala de jantar';
    if (x >= 8.6 && z <= 6.3) return 'na sala de TV';
    if (z > 5.6 && x >= 4.6) return 'perto do bar';
    return 'no hall de entrada';
  }
  function nearestSpotName(x, z){
    var b = null, bd = 99; house.spots.forEach(function(s){ var d = (s.x - x) * (s.x - x) + (s.z - z) * (s.z - z); if (d < bd) { bd = d; b = s; } });
    if (!b) return '';
    return b.name.replace(/^(debaixo|perto) /, '').replace(/^no /, 'do ').replace(/^na /, 'da ').replace(/^nos /, 'dos ').replace(/^nas /, 'das ');
  }

  /* ---------------- Marshal (autonomous dog for game 2) ---------------- */
  var HIDES = [[13.6, 8.9], [11.0, 5.05], [1.8, 8.6], [3.8, 9.7], [3.55, 2.7], [7.25, 0.55], [7.0, 6.1], [5.9, 9.7], [15.4, 1.0], [0.7, 5.8], [15.2, 6.7], [15.4, 10.5], [11.3, 10.4], [9.1, 2.0], [6.6, 3.5], [12.6, 1.4], [4.9, 6.2], [9.6, 5.3]];
  var GS = 0.25, GX = 64, GZ = 44;
  function buildGrid(){
    grid = new Uint8Array(GX * GZ);
    for (var j = 0; j < GZ; j++) for (var i = 0; i < GX; i++) grid[j * GX + i] = blocked((i + 0.5) * GS, (j + 0.5) * GS, 0.17, true, 0) ? 0 : 1;
    HIDES = HIDES.filter(function(h){ return grid[cellOf(h[0], h[1])]; });
  }
  function cellOf(x, z){ return clamp(Math.floor(z / GS), 0, GZ - 1) * GX + clamp(Math.floor(x / GS), 0, GX - 1); }
  function findPath(x0, z0, x1, z1){
    var s = cellOf(x0, z0), t = cellOf(x1, z1);
    if (!grid[t]) return null;
    var g = new Float32Array(GX * GZ).fill(1e9), from = new Int32Array(GX * GZ).fill(-1), closed = new Uint8Array(GX * GZ), open = [s];
    g[s] = 0;
    var tx = t % GX, tz = (t / GX) | 0;
    function h(c){ var dx = Math.abs(c % GX - tx), dz = Math.abs(((c / GX) | 0) - tz); return Math.max(dx, dz) + 0.41 * Math.min(dx, dz); }
    var it = 0;
    while (open.length && it++ < 4000) {
      var bi = 0, bf = 1e9; for (var k = 0; k < open.length; k++) { var f = g[open[k]] + h(open[k]); if (f < bf) { bf = f; bi = k; } }
      var c = open[bi]; open.splice(bi, 1);
      if (c === t) break;
      closed[c] = 1;
      var cx = c % GX, cz = (c / GX) | 0;
      for (var dz = -1; dz <= 1; dz++) for (var dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        var nx = cx + dx, nz = cz + dz; if (nx < 0 || nz < 0 || nx >= GX || nz >= GZ) continue;
        var n = nz * GX + nx; if (!grid[n] || closed[n]) continue;
        if (dx && dz && (!grid[cz * GX + nx] || !grid[nz * GX + cx])) continue;
        var ng = g[c] + (dx && dz ? 1.41 : 1);
        if (ng < g[n]) { g[n] = ng; from[n] = c; if (open.indexOf(n) < 0) open.push(n); }
      }
    }
    if (from[t] < 0 && s !== t) return null;
    var path = [], c2 = t; while (c2 !== s && c2 >= 0) { path.unshift([(c2 % GX + 0.5) * GS, (((c2 / GX) | 0) + 0.5) * GS]); c2 = from[c2]; }
    path.push([x1, z1]);
    return path;
  }
  function spawnDog(){
    if (!grid) buildGrid();
    var model = CHARS.make('marshal'); model.label.visible = false; scene.add(model.root);
    var h = farHide(), ang = Math.random() * 6.28;
    npc = { model: model, x: h[0], z: h[1], ang: ang, path: null, state: 'hide', t: 6 + Math.random() * 6, barkT: 3 + Math.random() * 3, pooT: 0.8, speed: 2.0, wag: 0 };
  }
  function clearDog(){
    if (npc) { scene.remove(npc.model.root); npc = null; }
    poos.forEach(function(m){ scene.remove(m); }); poos = [];
  }
  function minPlayerDist(x, z){ var m = 99; slots.forEach(function(p){ if (p) m = Math.min(m, Math.sqrt((p.x - x) * (p.x - x) + (p.z - z) * (p.z - z))); }); return m; }
  function farHide(exclude){
    var c = HIDES.filter(function(h){ return !exclude || Math.abs(h[0] - exclude[0]) + Math.abs(h[1] - exclude[1]) > 1; });
    c.sort(function(a, b){ return minPlayerDist(b[0], b[1]) - minPlayerDist(a[0], a[1]); });
    return c[Math.floor(Math.random() * Math.min(5, c.length))];
  }
  function goTo(h, speed){ var path = findPath(npc.x, npc.z, h[0], h[1]); if (path && path.length) { npc.path = path; npc.state = 'move'; npc.speed = speed; npc.dest = h; return true; } return false; }
  function bark(){
    barkN++; dirty = true;
    if (explore && slots[0] && npc) { var p = slots[0]; AUDIO.play('bark', AUDIO.rel(p.x, p.z, p.ang, npc.x, npc.z, 0.4 - p.info.cam), occluded(p.x, p.z, npc.x, npc.z)); }
  }
  function occluded(x0, z0, x1, z1){
    var d = Math.sqrt((x1 - x0) * (x1 - x0) + (z1 - z0) * (z1 - z0)), n = Math.ceil(d / 0.25);
    for (var i = 1; i < n; i++) { var t = i / n; if (wallAt(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t)) return true; }
    return false;
  }
  function dropPoo(){
    if (!pooGeo) {
      var parts = [[0.07, 0.03], [0.055, 0.07], [0.038, 0.105]].map(function(q){ var g = new THREE.SphereGeometry(q[0], 10, 7); g.scale(1, 0.7, 1); g.translate(0, q[1], 0); return g; });
      var tip = new THREE.ConeGeometry(0.02, 0.05, 8); tip.translate(0, 0.14, 0); parts.push(tip);
      pooGeo = TEX.merge(parts); pooMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
    }
    var m = new THREE.Mesh(pooGeo, pooMat); m.position.set(npc.x, 0, npc.z); m.rotation.y = Math.random() * 6; scene.add(m); poos.push(m);
    if (poos.length > 14) scene.remove(poos.shift());
  }
  function updateDog(dt){
    if (!npc) return;
    var sp = 0;
    if (npc.state === 'caught') { npc.wag += dt; npc.model.root.position.y = Math.abs(Math.sin(npc.wag * 8)) * 0.12; npc.model.animate(dt, 0.6); return; }
    if (phase === 'round') {
      npc.barkT -= dt; if (npc.barkT <= 0) { bark(); npc.barkT = 5 + Math.random() * 5; }
      if (npc.state === 'hide') {
        npc.t -= dt;
        if (minPlayerDist(npc.x, npc.z) < 2.3 && Math.random() < dt * 1.6) { if (goTo(farHide([npc.x, npc.z]), 2.9)) bark(); }
        else if (npc.t <= 0) { if (!goTo(farHide([npc.x, npc.z]), 1.9)) npc.t = 2; }
      }
      if (npc.state === 'move' && npc.path) {
        var tgt = npc.path[0], dx = tgt[0] - npc.x, dz = tgt[1] - npc.z, d = Math.sqrt(dx * dx + dz * dz), step = npc.speed * dt;
        if (d <= step) { npc.x = tgt[0]; npc.z = tgt[1]; npc.path.shift(); if (!npc.path.length) { npc.state = 'hide'; npc.t = 7 + Math.random() * 7; } }
        else { npc.x += dx / d * step; npc.z += dz / d * step; var want = Math.atan2(dz, dx), da = want - npc.ang; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283; npc.ang += da * Math.min(1, dt * 10); }
        sp = npc.speed / 2.2;
        npc.pooT -= dt; if (npc.pooT <= 0) { dropPoo(); npc.pooT = 2.0 + Math.random() * 1.2; }
      }
    }
    var r = npc.model.root; r.position.set(npc.x, 0, npc.z); r.rotation.y = -npc.ang + Math.PI / 2;
    npc.model.animate(dt, sp);
  }

  function restoreItem(){
    if (!cur) return;
    var it = house.items[cur.item], h = it.home; it.obj.visible = true; it.obj.position.set(h.x, h.y, h.z); it.obj.rotation.set(0, h.ry, 0);
  }
  function spotById(id){ for (var i = 0; i < house.spots.length; i++) if (house.spots[i].id === id) return house.spots[i]; }
  function winnerText(){
    var ps = slots.filter(Boolean).sort(function(a, b){ return b.score - a.score; });
    if (!ps.length) return '';
    if (ps.length > 1 && ps[0].score === ps[1].score) return 'Empate! ' + ps.filter(function(p){ return p.score === ps[0].score; }).map(function(p){ return p.info.name; }).join(' e ');
    return ps[0].info.name + ' venceu!';
  }

  /* ---------------- HUD ---------------- */
  function buildHud(){
    var h = $('hud');
    hud.lobby = el('div', 'panel lobby', h);
    hud.lobby.innerHTML = '<div class="title">Casa Refúgio <span>caça ao tesouro</span></div>' +
      '<div class="step">1. No celular, abra <b>pinheiroproducaomusical-netizen.github.io/casa-refugio</b></div>' +
      '<div class="step">2. Toque em <b>Sou um controle</b> e digite o código:</div>' +
      '<div class="bigcode" id="hcode">----</div><div class="step">3. Escolha seu personagem. Quando todos entrarem, escolha o jogo no celular: <b>🔎 Sumiu!</b> ou <b>🐶 Cadê o Marshal?</b></div><div class="lmsg" id="lmsg"></div>';
    hud.code = $('hcode'); hud.lobbyMsg = $('lmsg');
    hud.panel = el('div', 'panel game', h);
    hud.views = [0, 1, 2].map(function(){ var v = el('div', 'view', h); v.innerHTML = '<div class="vname"></div><div class="vmsg"></div><div class="vprompt"></div><div class="sniff"><div class="sbar"></div><span></span></div>'; return v; });
    hud.small = el('div', 'smallcode', h);
    hud.fps = el('div', 'fps', h);
  }
  function layout(n){
    var W = innerWidth, H = innerHeight;
    if (n <= 1) return { views: [[0, 0, W, H]], panel: [W * 0.66, 0, W * 0.34, H] };
    if (n === 2) return { views: [[0, 0, W / 2, H], [W / 2, 0, W / 2, H]], panel: [W * 0.25, H * 0.66, W * 0.5, H * 0.34] };
    return { views: [[0, 0, W / 2, H / 2], [W / 2, 0, W / 2, H / 2], [0, H / 2, W / 2, H / 2]], panel: [W / 2, H / 2, W / 2, H / 2] };
  }
  function place(e, r){ e.style.left = r[0] + 'px'; e.style.top = r[1] + 'px'; e.style.width = r[2] + 'px'; e.style.height = r[3] + 'px'; }

  function updateHud(active, L){
    var lobby = phase === 'lobby';
    hud.lobby.style.display = lobby && !explore ? 'block' : 'none';
    hud.panel.style.display = lobby ? 'none' : 'block';
    hud.small.textContent = code ? 'código ' + code : '';
    if (explore) { hud.panel.style.display = lobby ? 'none' : 'block'; var pw = innerWidth > innerHeight; place(hud.panel, pw ? [innerWidth * 0.55, 0, innerWidth * 0.45, innerHeight * 0.62] : [0, 0, innerWidth, innerHeight * 0.36]); hud.panel.style.background = 'rgba(15,20,28,.72)'; hud.panel.className = 'panel game solo'; }
    var pr = L.panel; place(hud.panel, pr); place(hud.lobby, active.length ? pr : [innerWidth * 0.15, innerHeight * 0.1, innerWidth * 0.7, innerHeight * 0.8]);
    if (lobby) {
      if (active.length && !hud.lobby.querySelector('.who')) el('div', 'who', hud.lobby);
      var who = hud.lobby.querySelector('.who'); if (who) who.innerHTML = active.map(function(p){ return '<span style="color:' + p.info.color + '">● ' + p.info.name + '</span>'; }).join(' &nbsp; ');
    } else {
      var html = '';
      if (phase === 'round' || phase === 'found') {
        var tl = Math.max(0, Math.ceil(ROUND_TIME - roundT));
        html += '<div class="round">Rodada ' + round + ' de ' + ROUNDS + (phase === 'round' ? ' · <span class="timer' + (tl <= 10 ? ' hot' : '') + '">⏱ 0:' + (tl < 10 ? '0' : '') + tl + '</span>' : '') + '</div>';
        html += '<div class="missing">' + title() + '</div>';
        html += hintsNow().map(function(t){ return '<div class="hint">' + t + '</div>'; }).join('');
        if (phase === 'round' && hintCount() < 3) html += '<div class="next">próxima dica em ' + Math.ceil(HINT_EVERY - roundT % HINT_EVERY) + ' s</div>';
        if (phase === 'found') html += '<div class="foundmsg' + (timedOut ? ' late' : '') + '">' + foundBy + '</div>';
      } else if (phase === 'end') {
        html += '<div class="missing">Fim de jogo!</div><div class="foundmsg">' + winnerText() + '</div><div class="next">Escolha um jogo no celular para jogar de novo.</div>';
      }
      html += '<div class="scores">' + active.map(function(p){ return '<span style="color:' + p.info.color + '">' + p.info.name + ' ' + p.score + '</span>'; }).join(' · ') + '</div>';
      if (hud.panel._h !== html) { hud.panel.innerHTML = html; hud.panel._h = html; }
    }
    hud.views.forEach(function(v, i){
      var p = active[i];
      if (!p) { v.style.display = 'none'; return; }
      v.style.display = 'block'; place(v, L.views[i]);
      v.children[0].textContent = p.info.name + ' · ' + p.score; v.children[0].style.background = p.info.color;
      v.children[1].textContent = p.msgT > 0 ? p.msg : ''; v.children[1].style.display = p.msgT > 0 ? 'block' : 'none';
      var pr2 = p.nearDog ? 'Aperte A: pegar o Marshal!' : (phase === 'round' && mode === 'sumiu' && p.nearSpot && p.searchT <= 0) ? 'Aperte A: procurar ' + p.nearSpot.name : '';
      v.children[2].textContent = pr2; v.children[2].style.display = pr2 ? 'block' : 'none';
      var sn = v.children[3];
      if (p.ch === 'marshal' && phase === 'round' && mode === 'sumiu') {
        var heat = heatOf(p);
        sn.style.display = 'block'; sn.children[0].style.width = (heat * 100) + '%';
        sn.children[0].style.background = heat > 0.8 ? '#e63946' : heat > 0.55 ? '#f4a261' : '#4ea8de';
        sn.children[1].textContent = '👃 ' + (heat > 0.8 ? 'QUENTE!' : heat > 0.55 ? 'morno' : 'frio');
      } else sn.style.display = 'none';
    });
  }

  function drawTvScreen(){
    var c = house.tvCanvas, g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, 288); gr.addColorStop(0, '#2a6f97'); gr.addColorStop(1, '#14324a');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 288);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 46px sans-serif'; g.fillText('Casa Refúgio', 256, 90);
    g.font = '28px sans-serif';
    var line = phase === 'lobby' ? (code ? 'código ' + code : 'conectando...') : phase === 'end' ? winnerText() : title();
    g.fillText(line, 256, 170);
    g.font = '20px sans-serif'; g.fillStyle = '#ffd166'; g.fillText('caça ao tesouro', 256, 230);
    house.tvTex.needsUpdate = true;
  }

  /* ---------------- main loop ---------------- */
  var last = 0;
  function resize(){ renderer.setSize(Math.floor(innerWidth * scale), Math.floor(innerHeight * scale), false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%'; }
  function loop(now){
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    fpsFrames++; if (now - fpsT > 1000) { fps = fpsFrames; fpsFrames = 0; fpsT = now; hud.fps.textContent = fps + ' fps · ' + Math.round(scale * 100) + '%';
      if (fps < 28 && scale > 0.5 && !/hq/.test(location.search)) { lowT++; if (lowT >= 3) { scale = Math.max(0.5, scale - 0.1); resize(); lowT = 0; } } else lowT = 0; }
    // drop players that went silent
    slots.forEach(function(p){ if (p && now - p.seen > 20000) removePlayer(p); });
    if (phase === 'round') {
      var hc = hintCount(), secs = Math.ceil(ROUND_TIME - roundT); roundT += dt;
      if (hintCount() !== hc) { dirty = true; slots.forEach(function(q){ if (q) buzz(q, [40, 40, 40]); }); }
      if (Math.ceil(ROUND_TIME - roundT) !== secs) dirty = true;
      if (roundT >= ROUND_TIME) timeUp();
    }
    if (phase === 'found') { phaseT += dt; if (mode === 'sumiu') { var it = house.items[cur.item].obj; it.rotation.y += dt * 2; } if (phaseT > 6) nextRound(); }
    updateDog(dt);
    var active = slots.filter(Boolean);
    active.forEach(function(p){ updatePlayer(p, dt); });
    publish(now);

    var L = layout(active.length);
    updateHud(active, L);
    var W = innerWidth, H = innerHeight;
    renderer.info.reset(); renderer.setScissorTest(false); renderer.setClearColor(0x14161c); renderer.clear();
    renderer.setScissorTest(true);
    if (!active.length) { // attract mode: slow orbit
      var cam = GAME._attract || (GAME._attract = new THREE.PerspectiveCamera(60, 1, 0.1, 150));
      var a = now / 9000; cam.position.set(9 + Math.cos(a) * 4, 2.3, 3.2 + Math.sin(a) * 1.8); cam.lookAt(8, 1.3, 5);
      renderView(cam, [0, 0, W, H], null);
    }
    active.forEach(function(p, i){ renderView(p.cam, L.views[i], p); });
  }
  function renderView(cam, r, p){
    var s = scale, x = Math.floor(r[0] * s), y = Math.floor((innerHeight - r[1] - r[3]) * s), w = Math.floor(r[2] * s) - 2, h = Math.floor(r[3] * s) - 2;
    cam.aspect = w / h; cam.updateProjectionMatrix();
    renderer.setViewport(x, y, w, h); renderer.setScissor(x, y, w, h);
    // per-view visibility: hide own label; Aria sees a sparkle near the target
    slots.forEach(function(q){ if (q) q.model.label.visible = q !== p; });
    sparkle.visible = false;
    if (p && p.ch === 'aria' && phase === 'round') {
      var sp = targetPos(), d = sp ? Math.sqrt((sp.x - p.x) * (sp.x - p.x) + (sp.z - p.z) * (sp.z - p.z)) : 99;
      if (d < 3) { sparkle.visible = true; sparkle.position.set(sp.x, (mode === 'marshal' ? 0.9 : 1.0) + Math.sin(performance.now() / 200) * 0.1, sp.z); }
    }
    renderer.render(scene, cam);
  }

  return { start: start, _msg: onMsg, _slots: function(){ return slots; }, _phase: function(){ return phase; }, _cur: function(){ return cur; }, _house: function(){ return house; }, _info: function(){ return renderer.info; }, _npc: function(){ return npc; }, _poos: function(){ return poos; } };
})();
