/* Phone controller */
var PAD = (function(){
  function $(id){ return document.getElementById(id); }
  var myId, code, mq = null, pose = null, tg = null, jmp = false, gmSel = 'sumiu', lastBk = -1, zone = 0, lastBp = -1, lastHints = 0, sniffT = 0, lastHt = 0, ch = null, x = 0, y = 0, a = false, startN = 0, leaveN = 0, state = null, rtt = 0, lastSc = -1;
  try { myId = localStorage.getItem('crId'); } catch (e) {}
  if (!myId) { myId = 'p' + Math.random().toString(36).slice(2, 9); try { localStorage.setItem('crId', myId); } catch (e) {} }

  function buzz(p){ try { navigator.vibrate(p); } catch (e) {} }
  function show(id){ ['join', 'choose', 'ctl'].forEach(function(s){ $(s).style.display = s === id ? 'flex' : 'none'; }); }
  function status(t){ $('status').textContent = t; }

  function start(){
    $('pad').style.display = 'block'; status('');
    try { $('codeIn').value = localStorage.getItem('crCode') || ''; ch = localStorage.getItem('crCh') || null; } catch (e) {}
    show('join');
    $('joinBtn').onclick = join;
    buildChooser();
    buildControls();
    if (window.JOIN_CODE) { $('codeIn').value = window.JOIN_CODE; join(); }
  }

  function join(){
    AUDIO.init();
    code = $('codeIn').value.replace(/\D/g, '');
    if (code.length !== 4 || code[0] < '1' || code[0] > '3') { status('Código inválido — são 4 números, aparecem na TV.'); return; }
    try { localStorage.setItem('crCode', code); } catch (e) {}
    status('Conectando...');
    connectBroker(+code[0] - 1, onMsg, function(m){
      if (!m) { status('Não consegui conectar. Confira a internet.'); return; }
      mq = m; mq.sub('casarefugio/' + code + '/tv'); status('');
      show('choose'); setInterval(send, 50);
    }, function(){ status('Conexão perdida — recarregue a página.'); });
  }

  function onMsg(topic, s){
    var d; try { d = JSON.parse(s); } catch (e) { return; }
    state = d;
    if (d.pg && d.pg[myId]) rtt = Math.round(performance.now() - d.pg[myId]);
    render();
  }

  function buildChooser(){
    var box = $('chars'); box.innerHTML = '';
    CHARS.list.forEach(function(id){
      var info = CHARS.info[id], b = document.createElement('button');
      b.className = 'charbtn'; b.dataset.ch = id; b.style.background = info.color;
      b.innerHTML = '<b>' + info.name + '</b>' + (info.perk ? '<small>' + info.perk + '</small>' : '');
      b.onclick = function(){ if (b.disabled) return; buzz(12); ch = id; try { localStorage.setItem('crCh', id); } catch (e) {} show('ctl'); render(); };
      box.appendChild(b);
    });
  }

  function buildControls(){
    var stick = $('stick'), knob = $('knob'), sid = null;
    function mv(cx, cy){
      var r = stick.getBoundingClientRect(), dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2), max = r.width / 2 - 24, d = Math.sqrt(dx * dx + dy * dy);
      if (d > max) { dx *= max / d; dy *= max / d; }
      knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; x = dx / max; y = dy / max;
    }
    function rel(){ sid = null; x = y = 0; knob.style.transform = ''; zone = 0; }
    setInterval(function(){ var z = Math.min(3, Math.floor(Math.sqrt(x * x + y * y) * 3.2)); if (z !== zone) { if (z > zone) buzz(z === 3 ? 18 : 8); zone = z; } }, 30);
    setInterval(function(){ if (lastHt < 0.55) return; sniffT -= 0.1; if (sniffT <= 0) { buzz(lastHt > 0.8 ? 35 : 15); sniffT = lastHt > 0.8 ? 0.35 : 0.9; } }, 100);
    stick.addEventListener('touchstart', function(e){ e.preventDefault(); var t = e.changedTouches[0]; sid = t.identifier; mv(t.clientX, t.clientY); buzz(10); }, { passive: false });
    stick.addEventListener('touchmove', function(e){ e.preventDefault(); for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === sid) mv(e.changedTouches[i].clientX, e.changedTouches[i].clientY); }, { passive: false });
    stick.addEventListener('touchend', function(e){ for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === sid) rel(); });
    stick.addEventListener('touchcancel', rel);
    var J = $('btnJ');
    J.addEventListener('touchstart', function(e){ e.preventDefault(); jmp = true; J.classList.add('down'); buzz(15); }, { passive: false });
    function upJ(){ jmp = false; J.classList.remove('down'); }
    J.addEventListener('touchend', upJ); J.addEventListener('touchcancel', upJ);
    var A = $('btnA');
    A.addEventListener('touchstart', function(e){ e.preventDefault(); a = true; A.classList.add('down'); buzz(22); }, { passive: false });
    function up(){ a = false; A.classList.remove('down'); }
    A.addEventListener('touchend', up); A.addEventListener('touchcancel', up);
    $('startBtn').onclick = function(){ gmSel = 'sumiu'; startN = 4; buzz(12); AUDIO.init(); };
    $('startBtn2').onclick = function(){ gmSel = 'marshal'; startN = 4; buzz(12); AUDIO.init(); };
    $('startBtn3').onclick = function(){ gmSel = 'aves'; startN = 4; buzz(12); AUDIO.init(); };
    $('hearBtn').onclick = function(){ AUDIO.init(); if (tg) AUDIO.preview(tg); };
    // listener prediction: apply this phone's own joystick right away, the TV's updates correct it
    setInterval(function(){
      if (!pose || !ch) return;
      var info = CHARS.info[ch], lag = Math.min(0.5, (performance.now() - pose.t) / 1000 + (rtt ? rtt / 2000 : 0.1));
      var tx = Math.abs(x) < 0.12 ? 0 : x, ty = Math.abs(y) < 0.12 ? 0 : y;
      var a = pose.a + (tx < 0 ? -1 : 1) * Math.pow(Math.abs(tx), 1.8) * 2.0 * lag;
      var sp = -ty * info.speed; if (sp < 0) sp *= 0.5;
      AUDIO.setListener(pose.x + Math.cos(a) * sp * lag, pose.y, pose.z + Math.sin(a) * sp * lag, a);
    }, 30);
    $('swapBtn').onclick = function(){ leaveN = 3; setTimeout(function(){ ch = null; show('choose'); }, 200); };
  }

  function send(){
    if (!mq) return;
    var msg = { id: myId, x: +x.toFixed(2), y: +y.toFixed(2), a: a, j: jmp };
    if (ch && leaveN <= 0) msg.ch = ch;
    if (startN > 0) { msg.st = 1; msg.gm = gmSel; startN--; }
    if (leaveN > 0) { msg.lv = 1; leaveN--; }
    if (Math.random() < 0.1) msg.t = performance.now();
    if (!ch && leaveN <= 0) return;
    mq.pub('casarefugio/' + code + '/pad', JSON.stringify(msg));
  }

  function render(){
    if (!state) return;
    var me = null, taken = {};
    (state.pl || []).forEach(function(p){ if (p.id === myId) me = p; else taken[p.ch] = 1; });
    var btns = document.querySelectorAll('.charbtn');
    for (var i = 0; i < btns.length; i++) { var t = !!taken[btns[i].dataset.ch]; btns[i].disabled = t; btns[i].style.opacity = t ? 0.3 : 1; }
    if ($('ctl').style.display === 'none') return;
    var info = ch ? CHARS.info[ch] : null;
    $('meName').textContent = info ? info.name : ''; $('meName').style.background = info ? info.color : '#444';
    $('meScore').textContent = me ? me.sc + ' pts' : (ch ? 'entrando...' : '');
    if (me && me.nd && !render._nd) buzz([15, 30, 15]); render._nd = me && me.nd;
    if (me && me.sc > lastSc && lastSc >= 0) { try { navigator.vibrate([80, 60, 160]); } catch (e) {} }
    if (me) lastSc = me.sc;
    if (me && me.ch !== ch && CHARS.info[me.ch]) { ch = me.ch; try { localStorage.setItem('crCh', ch); } catch (e) {} }
    // spatial audio: the TV sends where each sound should come from for *this* player
    if (me && typeof me.px === 'number') {
      pose = { x: me.px, z: me.pz, a: me.pa, y: me.py || 1.6, t: performance.now() };
      AUDIO.setSources((me.au || []).map(function(e){ return { id: e[0], t: e[1], x: e[2], y: e[3], z: e[4], o: e[5], n: e[6], mv: e[7] }; }));
    }
    $('hearBtn').style.display = state.gm === 'aves' && state.ph === 'round' ? 'inline-block' : 'none'; tg = state.tg;
    if (me) { if (lastBp >= 0 && me.bp > lastBp) buzz(25); lastBp = me.bp; lastHt = me.ht || 0;
      if (me.msg && me.msg.indexOf('Nada') === 0 && render._lastMsg !== me.msg) buzz([30, 50, 30]); render._lastMsg = me.msg; }
    var nh = (state.hints || []).length; if (state.ph === 'round' && nh > lastHints) buzz([40, 40, 40]); lastHints = state.ph === 'round' ? nh : 0;
    if (ch && !me && taken[ch]) { ch = null; show('choose'); status('Esse personagem já foi escolhido.'); return; }
    var lobby = state.ph === 'lobby', end = state.ph === 'end';
    $('lobbyBtns').style.display = (lobby || end) ? 'flex' : 'none';
    $('startBtn').textContent = '🔎 Sumiu!'; $('startBtn2').textContent = '🐶 Cadê o Marshal?'; $('startBtn3').textContent = '🐦 Passarinhos';
    $('swapBtn').style.display = lobby ? 'block' : 'none';
    $('startBtn2').style.display = 'block'; $('startBtn3').style.display = 'block';
    var h = '';
    if (lobby) h = '<div class="ph">Esperando todo mundo entrar...</div><div class="sub">Ande pela casa! Quando todos estiverem prontos, escolha o jogo aqui embaixo. No "Cadê o Marshal?" e no "Passarinhos", use fone de ouvido: o som vem da direção certa.</div>';
    else if (end) h = '<div class="ph">Fim de jogo!</div><div class="sub">' + (state.win || '') + '</div><div class="sub">Escolha um jogo para jogar de novo.</div>';
    else {
      h = '<div class="sub">Rodada ' + state.r + ' de ' + state.R + (state.ph === 'round' ? ' · ⏱ ' + state.tl + ' s' : '') + '</div><div class="ph">' + (state.obj || '') + '</div>';
      h += (state.hints || []).map(function(t){ return '<div class="hint">' + t + '</div>'; }).join('');
      if (state.found) h += '<div class="found">' + state.found + '</div>';
    }
    if ($('info')._h !== h) { $('info').innerHTML = h; $('info')._h = h; }
    $('aLabel').textContent = me && me.nd ? 'pegar o Marshal!' : state.gm === 'aves' && state.ph === 'round' ? 'fotografar' : (me && me.near && state.ph === 'round' ? 'procurar ' + me.near : '');
    $('meMsg').textContent = me && me.msg ? me.msg : '';
    status(rtt ? 'atraso ' + rtt + ' ms' : '');
  }

  return { start: start };
})();
