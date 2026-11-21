/* Tiny MQTT 3.1.1 client over WebSocket (QoS 0). Works on old TV browsers (Chromium 63). */
var BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081/mqtt'
];
var _enc = new TextEncoder(), _dec = new TextDecoder();
function _mqStr(s){ var b = _enc.encode(s); var o = new Uint8Array(2 + b.length); o[0] = b.length >> 8; o[1] = b.length & 255; o.set(b, 2); return o; }
function _mqPacket(type, parts){
  var len = 0, i; for (i = 0; i < parts.length; i++) len += parts[i].length;
  var lb = [], x = len;
  do { var d = x % 128; x = Math.floor(x / 128); if (x > 0) d |= 128; lb.push(d); } while (x > 0);
  var out = new Uint8Array(1 + lb.length + len), p = 0;
  out[p++] = type; for (i = 0; i < lb.length; i++) out[p++] = lb[i];
  for (i = 0; i < parts.length; i++) { out.set(parts[i], p); p += parts[i].length; }
  return out;
}
function MQ(url, onMsg, onOpen, onFail, onLost){
  var self = this, ws, opened = false, ping;
  try { ws = new WebSocket(url, ['mqtt']); } catch (e) { setTimeout(onFail, 0); return; }
  ws.binaryType = 'arraybuffer';
  var to = setTimeout(function(){ if (!opened) { try { ws.close(); } catch (e) {} onFail(); onFail = function(){}; } }, 6000);
  ws.onopen = function(){
    var id = 'cr' + Math.random().toString(36).slice(2, 10);
    ws.send(_mqPacket(0x10, [_mqStr('MQTT'), new Uint8Array([4, 2, 0, 60]), _mqStr(id)]));
  };
  ws.onmessage = function(ev){
    var b = new Uint8Array(ev.data), p = 0;
    while (p < b.length) {
      var type = b[p] >> 4, mult = 1, len = 0, q = p + 1, d;
      do { d = b[q++]; len += (d & 127) * mult; mult *= 128; } while (d & 128);
      var body = b.subarray(q, q + len);
      if (type === 2) {
        opened = true; clearTimeout(to);
        ping = setInterval(function(){ try { ws.send(new Uint8Array([0xC0, 0])); } catch (e) {} }, 25000);
        onOpen();
      } else if (type === 3) {
        var tl = (body[0] << 8) | body[1];
        var topic = _dec.decode(body.subarray(2, 2 + tl));
        var qos = (b[p] >> 1) & 3, start = 2 + tl + (qos ? 2 : 0);
        try { onMsg(topic, _dec.decode(body.subarray(start))); } catch (e) { if (window.console) console.log(e); }
      }
      p = q + len;
    }
  };
  ws.onclose = ws.onerror = function(){
    clearInterval(ping);
    if (!opened) { clearTimeout(to); onFail(); onFail = function(){}; }
    else if (onLost) { onLost(); onLost = null; }
  };
  self.sub = function(t){ try { ws.send(_mqPacket(0x82, [new Uint8Array([0, 1]), _mqStr(t), new Uint8Array([0])])); } catch (e) {} };
  self.pub = function(t, s){ if (ws.readyState === 1) ws.send(_mqPacket(0x30, [_mqStr(t), _enc.encode(s)])); };
}
/* idx: broker index or null to try all in order. cb(mq, idx) — mq null on failure. */
function connectBroker(idx, onMsg, cb, onLost, onTry){
  var list = idx == null ? [0, 1, 2] : [idx], k = 0;
  function next(){
    if (k >= list.length) { cb(null, -1); return; }
    var i = list[k++]; if (onTry) onTry(i);
    var m = new MQ(BROKERS[i], onMsg, function(){ cb(m, i); }, next, onLost);
  }
  next();
}
