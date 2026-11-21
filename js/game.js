/* TV side: renders the house in split screen and runs the treasure hunt. */
var GAME = (function(){
  var ROUNDS = 5, HINT_EVERY = 25, SEARCH_R = 1.35;
  var renderer, scene, house, mq = null, code = '';
  var slots = [null, null, null];
  var phase = 'lobby', round = 0, used = [], cur = null, roundT = 0, phaseT = 0, foundBy = null;
  var hud = {}, scale = /hq/.test(location.search) ? 1 : 0.75, fps = 60, fpsFrames = 0, fpsT = 0, lowT = 0;
  var sparkle, pongs = {}, dirty = true, lastPub = 0;

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
    function send(ch){ var m = { id: 'me', ch: ch || CHARS.list[chIdx], x: x, y: y, a: aDown }; if (st > 0) { m.st = 1; st--; } onMsg('l', JSON.stringify(m)); }
    var xa = $('xA');
    xa.addEventListener('touchstart', function(e){ e.preventDefault(); aDown = true; xa.classList.add('down'); try { navigator.vibrate(22); } catch (err) {} }, { passive: false });
    xa.addEventListener('touchend', function(){ aDown = false; xa.classList.remove('down'); });
    xa.addEventListener('mousedown', function(){ aDown = true; }); xa.addEventListener('mouseup', function(){ aDown = false; });
    $('xstart').onclick = function(){ st = 2; try { navigator.vibrate(12); } catch (e) {} };
    setInterval(function(){ $('xstart').style.display = (phase === 'lobby' || phase === 'end') ? 'block' : 'none'; $('xstart').textContent = phase === 'end' ? '▶ Jogar de novo' : '▶ Começar o jogo'; $('xchar').style.display = phase === 'lobby' ? 'block' : 'none'; }, 300);
    send();
    setInterval(function(){ send(); }, 50);
    function mv(cx, cy){ var r = stick.getBoundingClientRect(), dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2), max = r.width / 2 - 20, d = Math.sqrt(dx * dx + dy * dy); if (d > max) { dx *= max / d; dy *= max / d; } knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; x = dx / max; y = dy / max; }
    function rel(){ sid = null; x = y = 0; knob.style.transform = ''; zone = 0; }
    var zone = 0;
    setInterval(function(){ var z = Math.min(3, Math.floor(Math.sqrt(x * x + y * y) * 3.2)); if (z !== zone) { if (z > zone) { try { navigator.vibrate(z === 3 ? 18 : 8); } catch (e) {} } zone = z; } }, 30);
    var sniffT = 0;
    setInterval(function(){ var p = slots[0]; if (!p || p.ch !== 'marshal') return; var h = heatOf(p); if (h < 0.55) return; sniffT -= 0.1; if (sniffT <= 0) { try { navigator.vibrate(h > 0.8 ? 35 : 15); } catch (e) {} sniffT = h > 0.8 ? 0.35 : 0.9; } }, 100);
    stick.addEventListener('touchstart', function(e){ e.preventDefault(); var t = e.changedTouches[0]; sid = t.identifier; mv(t.clientX, t.clientY); try { navigator.vibrate(10); } catch (err) {} }, { passive: false });
    stick.addEventListener('touchmove', function(e){ e.preventDefault(); for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === sid) mv(e.changedTouches[i].clientX, e.changedTouches[i].clientY); }, { passive: false });
    stick.addEventListener('touchend', rel); stick.addEventListener('touchcancel', rel);
    var down = false;
    stick.addEventListener('mousedown', function(e){ down = true; mv(e.clientX, e.clientY); });
    addEventListener('mousemove', function(e){ if (down) mv(e.clientX, e.clientY); });
    addEventListener('mouseup', function(){ if (down) { down = false; rel(); } });
    $('xchar').onclick = function(){
      try { navigator.vibrate(12); } catch (e) {}
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
    if (d.st && (phase === 'lobby' || phase === 'end')) startGame();
    if (d.lv) { removePlayer(p); return; }
    if (d.t) pongs[d.id] = d.t;
  }
  function chTaken(ch){ for (var i = 0; i < 3; i++) if (slots[i] && slots[i].ch === ch) return true; return false; }
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }

  function publish(now){
    if (!mq || !code) return;
    if (!dirty && now - lastPub < 250) return;
    lastPub = now; dirty = false;
    var st = { ph: phase, r: round, R: ROUNDS, pl: [], hints: [], pg: pongs };
    pongs = {};
    slots.forEach(function(p){ if (p) st.pl.push({ id: p.id, ch: p.ch, sc: p.score, near: p.nearSpot ? p.nearSpot.name : '', msg: p.msgT > 0 ? p.msg : '', bp: p.bump || 0, ht: p.ch === 'marshal' ? Math.round(heatOf(p) * 100) / 100 : 0 }); });
    if (cur && phase !== 'lobby') { st.obj = house.items[cur.item].name; st.hints = cur.hints.slice(0, hintCount()); }
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

  function blocked(x, z, r, baby){
    var lists = baby ? [house.walls] : [house.walls, house.soft];
    for (var l = 0; l < lists.length; l++) { var L = lists[l]; for (var i = 0; i < L.length; i++) { var b = L[i]; if (x + r > b.x0 && x - r < b.x1 && z + r > b.z0 && z - r < b.z1) return true; } }
    return x < r || x > 16 - r || z < r || z > 11 - r;
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
    var hit = false;
    if (!blocked(p.x + dx, p.z, p.r, baby)) p.x += dx; else if (Math.abs(dx) > 0.001) hit = true;
    if (!blocked(p.x, p.z + dz, p.r, baby)) p.z += dz; else if (Math.abs(dz) > 0.001) hit = true;
    p.bumpT = (p.bumpT || 0) - dt;
    if (hit && p.bumpT <= 0) { p.bump = (p.bump || 0) + 1; p.bumpT = 0.5; dirty = true; buzz(p, 25); }
    p.speedNow = Math.abs(sp) / p.info.speed;
    var m = p.model.root; m.position.set(p.x, 0, p.z); m.rotation.y = -p.ang + Math.PI / 2;
    p.model.animate(dt, p.speedNow + (p.searchT > 0 ? 0.6 : 0));
    // nearest search spot
    p.nearSpot = null; var best = SEARCH_R;
    house.spots.forEach(function(s){ var d = Math.sqrt((s.x - p.x) * (s.x - p.x) + (s.z - p.z) * (s.z - p.z)); if (d < best) { best = d; p.nearSpot = s; } });
    if (p.msgT > 0) { p.msgT -= dt; if (p.msgT <= 0) dirty = true; }
    // search
    if (p.press) {
      p.press = false;
      if (phase === 'round' && p.nearSpot && p.searchT <= 0) { p.searchT = 0.9; p.searching = p.nearSpot; say(p, 'Procurando ' + p.nearSpot.name + '...', 1); }
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
    var cy = hgt; if (p.z - fz * p.camDist > 6.45 || p.z > 6.45) cy = Math.min(cy, 2.45);
    p.cam.position.set(p.x - fx * p.camDist, cy, p.z - fz * p.camDist);
    p.cam.lookAt(p.x + fx * 1.2, p.info.cam * 0.8, p.z + fz * 1.2);
  }
  function say(p, text, sec){ p.msg = text; p.msgT = sec; dirty = true; }
  function buzz(p, pat){ if (explore && p.id === 'me') { try { navigator.vibrate(pat); } catch (e) {} } }
  function heatOf(p){ if (!cur || phase !== 'round') return 0; var sp = spotById(cur.spot), d = Math.sqrt((sp.x - p.x) * (sp.x - p.x) + (sp.z - p.z) * (sp.z - p.z)); return clamp(1 - d / 12, 0, 1); }

  /* ---------------- game flow ---------------- */
  function startGame(){
    round = 0; used = []; slots.forEach(function(p){ if (p) p.score = 0; });
    nextRound();
  }
  function nextRound(){
    restoreItem();
    if (round >= ROUNDS) { phase = 'end'; phaseT = 0; dirty = true; drawTvScreen(); return; }
    round++;
    var pool = CHALLENGES.filter(function(c, i){ return used.indexOf(i) < 0; });
    if (!pool.length) { used = []; pool = CHALLENGES.slice(); }
    cur = pool[(Math.random() * pool.length) | 0]; used.push(CHALLENGES.indexOf(cur));
    house.items[cur.item].obj.visible = false;
    phase = 'round'; roundT = 0; foundBy = null; dirty = true;
    drawTvScreen();
  }
  function hintCount(){ return Math.min(3, 1 + Math.floor(roundT / HINT_EVERY)); }
  function found(p){
    p.score++; phase = 'found'; phaseT = 0;
    var it = house.items[cur.item], sp = spotById(cur.spot);
    it.obj.visible = true; it.obj.position.set(sp.x, 1.3, sp.z);
    foundBy = p.info.name + ' achou ' + it.name + ' ' + sp.name + '!';
    slots.forEach(function(q){ if (q) { say(q, q === p ? 'Você achou! +1 ponto' : foundBy, 6); buzz(q, q === p ? [80, 60, 160] : [40]); } });
    dirty = true; drawTvScreen();
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
      '<div class="bigcode" id="hcode">----</div><div class="step">3. Escolha seu personagem. Quando todos entrarem, toque em <b>Começar</b>.</div><div class="lmsg" id="lmsg"></div>';
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
        html += '<div class="round">Rodada ' + round + ' de ' + ROUNDS + '</div>';
        html += '<div class="missing">Sumiu ' + house.items[cur.item].name + '!</div>';
        html += cur.hints.slice(0, hintCount()).map(function(t){ return '<div class="hint">' + t + '</div>'; }).join('');
        if (phase === 'round' && hintCount() < 3) html += '<div class="next">próxima dica em ' + Math.ceil(HINT_EVERY - roundT % HINT_EVERY) + ' s</div>';
        if (phase === 'found') html += '<div class="foundmsg">' + foundBy + '</div>';
      } else if (phase === 'end') {
        html += '<div class="missing">Fim de jogo!</div><div class="foundmsg">' + winnerText() + '</div><div class="next">Toque em <b>Jogar de novo</b> no celular.</div>';
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
      var pr2 = (phase === 'round' && p.nearSpot && p.searchT <= 0) ? 'Aperte A: procurar ' + p.nearSpot.name : '';
      v.children[2].textContent = pr2; v.children[2].style.display = pr2 ? 'block' : 'none';
      var sn = v.children[3];
      if (p.ch === 'marshal' && phase === 'round') {
        var sp = spotById(cur.spot), d = Math.sqrt((sp.x - p.x) * (sp.x - p.x) + (sp.z - p.z) * (sp.z - p.z));
        var heat = clamp(1 - d / 12, 0, 1);
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
    var line = phase === 'lobby' ? (code ? 'código ' + code : 'conectando...') : phase === 'end' ? winnerText() : (cur ? 'Sumiu ' + house.items[cur.item].name + '!' : '');
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
    if (phase === 'round') { var hc = hintCount(); roundT += dt; if (hintCount() !== hc) { dirty = true; slots.forEach(function(q){ if (q) buzz(q, [40, 40, 40]); }); } }
    if (phase === 'found') { phaseT += dt; var it = house.items[cur.item].obj; it.rotation.y += dt * 2; if (phaseT > 6) nextRound(); }
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
      var sp = spotById(cur.spot), d = Math.sqrt((sp.x - p.x) * (sp.x - p.x) + (sp.z - p.z) * (sp.z - p.z));
      if (d < 3) { sparkle.visible = true; sparkle.position.set(sp.x, 1.0 + Math.sin(performance.now() / 200) * 0.1, sp.z); }
    }
    renderer.render(scene, cam);
  }

  return { start: start, _msg: onMsg, _slots: function(){ return slots; }, _phase: function(){ return phase; }, _cur: function(){ return cur; }, _house: function(){ return house; }, _info: function(){ return renderer.info; } };
})();
