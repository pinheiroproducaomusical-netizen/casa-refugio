/* Phone controller */
var PAD = (function(){
  function $(id){ return document.getElementById(id); }
  var myId, code, mq = null, ch = null, x = 0, y = 0, a = false, startN = 0, leaveN = 0, state = null, rtt = 0, lastSc = -1;
  try { myId = localStorage.getItem('crId'); } catch (e) {}
  if (!myId) { myId = 'p' + Math.random().toString(36).slice(2, 9); try { localStorage.setItem('crId', myId); } catch (e) {} }

  function show(id){ ['join', 'choose', 'ctl'].forEach(function(s){ $(s).style.display = s === id ? 'flex' : 'none'; }); }
  function status(t){ $('status').textContent = t; }

  function start(){
    $('pad').style.display = 'block'; status('');
    try { $('codeIn').value = localStorage.getItem('crCode') || ''; ch = localStorage.getItem('crCh') || null; } catch (e) {}
    show('join');
    $('joinBtn').onclick = join;
    buildChooser();
    buildControls();
  }

  function join(){
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
      b.onclick = function(){ if (b.disabled) return; ch = id; try { localStorage.setItem('crCh', id); } catch (e) {} show('ctl'); render(); };
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
    function rel(){ sid = null; x = y = 0; knob.style.transform = ''; }
    stick.addEventListener('touchstart', function(e){ e.preventDefault(); var t = e.changedTouches[0]; sid = t.identifier; mv(t.clientX, t.clientY); }, { passive: false });
    stick.addEventListener('touchmove', function(e){ e.preventDefault(); for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === sid) mv(e.changedTouches[i].clientX, e.changedTouches[i].clientY); }, { passive: false });
    stick.addEventListener('touchend', function(e){ for (var i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === sid) rel(); });
    stick.addEventListener('touchcancel', rel);
    var A = $('btnA');
    A.addEventListener('touchstart', function(e){ e.preventDefault(); a = true; A.classList.add('down'); try { navigator.vibrate(15); } catch (err) {} }, { passive: false });
    function up(){ a = false; A.classList.remove('down'); }
    A.addEventListener('touchend', up); A.addEventListener('touchcancel', up);
    $('startBtn').onclick = function(){ startN = 4; };
    $('swapBtn').onclick = function(){ leaveN = 3; setTimeout(function(){ ch = null; show('choose'); }, 200); };
  }

  function send(){
    if (!mq) return;
    var msg = { id: myId, x: +x.toFixed(2), y: +y.toFixed(2), a: a };
    if (ch && leaveN <= 0) msg.ch = ch;
    if (startN > 0) { msg.st = 1; startN--; }
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
    if (me && me.sc > lastSc && lastSc >= 0) { try { navigator.vibrate([80, 60, 160]); } catch (e) {} }
    if (me) lastSc = me.sc;
    if (ch && !me && taken[ch]) { ch = null; show('choose'); status('Esse personagem já foi escolhido.'); return; }
    var lobby = state.ph === 'lobby', end = state.ph === 'end';
    $('lobbyBtns').style.display = (lobby || end) ? 'flex' : 'none';
    $('startBtn').textContent = end ? 'Jogar de novo' : 'Começar';
    $('swapBtn').style.display = lobby ? 'block' : 'none';
    var h = '';
    if (lobby) h = '<div class="ph">Esperando todo mundo entrar...</div><div class="sub">Ande pela casa! Quando todos estiverem prontos, toque em Começar.</div>';
    else if (end) h = '<div class="ph">Fim de jogo!</div><div class="sub">' + (state.win || '') + '</div>';
    else {
      h = '<div class="sub">Rodada ' + state.r + ' de ' + state.R + '</div><div class="ph">Sumiu ' + (state.obj || '') + '!</div>';
      h += (state.hints || []).map(function(t){ return '<div class="hint">' + t + '</div>'; }).join('');
      if (state.found) h += '<div class="found">' + state.found + '</div>';
    }
    if ($('info')._h !== h) { $('info').innerHTML = h; $('info')._h = h; }
    $('aLabel').textContent = me && me.near && state.ph === 'round' ? 'procurar ' + me.near : '';
    $('meMsg').textContent = me && me.msg ? me.msg : '';
    status(rtt ? 'atraso ' + rtt + ' ms' : '');
  }

  return { start: start };
})();
