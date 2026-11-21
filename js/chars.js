/* Characters: stylized, no facial identity (Vitor gets his hair, beard and blue shirt) */
var CHARS = {
  list: ['vitor', 'steh', 'vivi', 'aria', 'joao', 'marshal'],
  info: {
    vitor:   { name: 'Vitor',   color: '#5b7c99', kind: 'adult', speed: 2.6, cam: 1.75, perk: '' },
    steh:    { name: 'Steh',    color: '#e76f51', kind: 'adult', speed: 2.6, cam: 1.65, perk: '' },
    vivi:    { name: 'Vivi',    color: '#2a9d8f', kind: 'adult', speed: 2.6, cam: 1.65, perk: '' },
    aria:    { name: 'Aria',    color: '#f28ca0', kind: 'kid',   speed: 2.4, cam: 1.2,  perk: 'brilho quando chega perto' },
    joao:    { name: 'João',    color: '#f2c14e', kind: 'baby',  speed: 1.7, cam: 0.7,  perk: 'engatinha por baixo das mesas' },
    marshal: { name: 'Marshal', color: '#9a9a9a', kind: 'dog',   speed: 2.8, cam: 0.75, perk: 'faro: quente ou frio' }
  },
  make: function(id){
    var info = CHARS.info[id];
    function L(c){ return new THREE.MeshLambertMaterial({ color: c }); }
    function m(g, mat, x, y, z){ var o = new THREE.Mesh(g, mat); o.position.set(x || 0, y || 0, z || 0); return o; }
    function cyl(a, b, h, s){ return new THREE.CylinderGeometry(a, b, h, s || 10); }
    function sph(r){ return new THREE.SphereGeometry(r, 12, 10); }
    var root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    var skin = L(0xe9b896), legs = [], arms = [];
    var eyeMat = L(0x222222);

    if (info.kind === 'adult' || info.kind === 'kid') {
      var s = info.kind === 'kid' ? 0.66 : (id === 'vitor' ? 1.04 : 0.97);
      var shirt = L(info.color), pants = L(id === 'vitor' ? 0x2e3a4e : (id === 'aria' ? 0xf7c6d0 : 0x3d3d48));
      var hairC = id === 'vitor' ? 0x3a2418 : (id === 'steh' ? 0x2b1d14 : (id === 'vivi' ? 0x6b4226 : 0x9a6a3a));
      var hair = L(hairC);
      // legs (pivot at hip)
      [-0.1, 0.1].forEach(function(x){
        var p = new THREE.Group(); p.position.set(x * s, 0.82 * s, 0);
        p.add(m(cyl(0.065 * s, 0.06 * s, 0.8 * s), pants, 0, -0.4 * s, 0));
        p.add(m(new THREE.BoxGeometry(0.12 * s, 0.07 * s, 0.22 * s), L(0x3a2a20), 0, -0.8 * s, 0.04 * s));
        body.add(p); legs.push(p);
      });
      if (id === 'aria') body.add(m(cyl(0.16 * s, 0.3 * s, 0.4 * s), shirt, 0, 0.85 * s, 0)); // dress
      // torso
      body.add(m(cyl(0.19 * s, 0.17 * s, 0.62 * s), shirt, 0, 1.13 * s, 0));
      var sh0 = m(sph(0.19 * s), shirt, 0, 1.42 * s, 0); sh0.scale.set(1, 0.5, 0.85); body.add(sh0);
      // arms (pivot at shoulder)
      [-0.25, 0.25].forEach(function(x){
        var p = new THREE.Group(); p.position.set(x * s, 1.42 * s, 0);
        p.add(m(cyl(0.055 * s, 0.05 * s, 0.6 * s), shirt, 0, -0.3 * s, 0));
        p.add(m(sph(0.055 * s), skin, 0, -0.63 * s, 0));
        body.add(p); arms.push(p);
      });
      // head
      var head = new THREE.Group(); head.position.set(0, 1.66 * s, 0); body.add(head);
      head.add(m(sph(0.15 * s), skin));
      head.add(m(sph(0.022 * s), eyeMat, -0.05 * s, 0.02 * s, 0.135 * s));
      head.add(m(sph(0.022 * s), eyeMat, 0.05 * s, 0.02 * s, 0.135 * s));
      var cap = m(sph(0.158 * s), hair, 0, 0.02 * s, -0.01 * s); cap.scale.set(1, 0.85, 1); head.add(cap);
      // front of the cap cut away by a skin "face" sphere in front
      head.add(m(sph(0.13 * s), skin, 0, -0.01 * s, 0.04 * s));
      if (id === 'vitor') {
        head.add(m(new THREE.BoxGeometry(0.3 * s, 0.32 * s, 0.1 * s), hair, 0, -0.17 * s, -0.1 * s));   // long hair to the shoulders
        [-1, 1].forEach(function(sd){ head.add(m(new THREE.BoxGeometry(0.06 * s, 0.28 * s, 0.14 * s), hair, sd * 0.14 * s, -0.12 * s, -0.01 * s)); });
        var beard = m(sph(0.135 * s), hair, 0, -0.08 * s, 0.05 * s); beard.scale.set(0.95, 0.8, 0.8); head.add(beard);
        head.add(m(new THREE.BoxGeometry(0.08 * s, 0.02 * s, 0.02 * s), L(0xb06a5a), 0, -0.035 * s, 0.155 * s));
        // collar of the chambray shirt
        body.add(m(new THREE.BoxGeometry(0.22 * s, 0.05 * s, 0.05 * s), L(0x4a6a86), 0, 1.5 * s, 0.13 * s));
      } else if (id === 'steh') {
        head.add(m(new THREE.BoxGeometry(0.28 * s, 0.3 * s, 0.08 * s), hair, 0, -0.14 * s, -0.11 * s));
      } else if (id === 'vivi') {
        head.add(m(sph(0.07 * s), hair, 0, 0.03 * s, -0.19 * s));
        head.add(m(cyl(0.04 * s, 0.02 * s, 0.22 * s), hair, 0, -0.1 * s, -0.22 * s));
      } else if (id === 'aria') {
        [-1, 1].forEach(function(sd){ head.add(m(sph(0.06 * s), hair, sd * 0.17 * s, -0.02 * s, -0.04 * s)); head.add(m(cyl(0.035 * s, 0.015 * s, 0.2 * s), hair, sd * 0.19 * s, -0.14 * s, -0.04 * s)); });
        var band = m(new THREE.TorusGeometry(0.15 * s, 0.015 * s, 6, 16, Math.PI), L(0xff5d8f), 0, 0.03 * s, 0); band.rotation.set(0, Math.PI / 2, 0); head.add(band);
      }
    } else if (info.kind === 'baby') {
      // crawling baby
      var onesie = L(info.color), diaper = L(0xffffff);
      var torso = m(sph(0.16), onesie, 0, 0.3, 0); torso.scale.set(0.9, 0.85, 1.35); body.add(torso);
      body.add(m(sph(0.13), diaper, 0, 0.3, -0.16));
      var bh = new THREE.Group(); bh.position.set(0, 0.42, 0.26); body.add(bh);
      bh.add(m(sph(0.14), skin));
      bh.add(m(sph(0.018), eyeMat, -0.05, 0.02, 0.125)); bh.add(m(sph(0.018), eyeMat, 0.05, 0.02, 0.125));
      var tuft = m(sph(0.142), L(0xd9b26a), 0, 0.03, -0.01); tuft.scale.set(1, 0.6, 1); bh.add(tuft);
      bh.add(m(sph(0.12), skin, 0, -0.005, 0.035));
      [[-0.11, 0.18], [0.11, 0.18], [-0.11, -0.16], [0.11, -0.16]].forEach(function(p, i){
        var g = new THREE.Group(); g.position.set(p[0], 0.3, p[1]);
        g.add(m(cyl(0.045, 0.04, 0.26), i < 2 ? onesie : onesie, 0, -0.13, 0));
        g.add(m(sph(0.045), skin, 0, -0.27, 0));
        body.add(g); (i % 3 === 0 ? legs : arms).push(g);
      });
    } else {
      // Marshal — grey Lhasa Apso: long fluffy coat, curled tail
      var fur = L(0x9c9c9c), furD = L(0x6f6f6f), furL = L(0xc2c2c2);
      var bodyM = m(sph(0.2), fur, 0, 0.3, 0); bodyM.scale.set(0.85, 0.75, 1.45); body.add(bodyM);
      for (var k = 0; k < 8; k++) { var a = k / 8 * Math.PI * 2; body.add(m(sph(0.09), k % 2 ? furL : fur, Math.cos(a) * 0.15, 0.2, Math.sin(a) * 0.2)); }
      var dh = new THREE.Group(); dh.position.set(0, 0.45, 0.3); body.add(dh);
      dh.add(m(sph(0.14), furL));
      dh.add(m(sph(0.075), furD, 0, -0.03, 0.12));
      dh.add(m(sph(0.028), eyeMat, 0, -0.01, 0.19));
      dh.add(m(sph(0.022), eyeMat, -0.05, 0.04, 0.12)); dh.add(m(sph(0.022), eyeMat, 0.05, 0.04, 0.12));
      [-1, 1].forEach(function(sd){ var ear = m(sph(0.07), furD, sd * 0.13, -0.04, -0.01); ear.scale.set(0.6, 1.6, 0.8); dh.add(ear); });
      dh.add(m(sph(0.06), furD, 0, 0.12, 0.02));
      var tail = m(new THREE.TorusGeometry(0.08, 0.04, 6, 10, Math.PI * 1.4), furL, 0, 0.48, -0.25); tail.rotation.set(0, Math.PI / 2, 0); body.add(tail);
      [[-0.09, 0.17], [0.09, 0.17], [-0.09, -0.17], [0.09, -0.17]].forEach(function(p, i){
        var g = new THREE.Group(); g.position.set(p[0], 0.22, p[1]);
        g.add(m(cyl(0.05, 0.06, 0.22), i % 2 ? fur : furL, 0, -0.11, 0));
        body.add(g); (i === 0 || i === 3 ? legs : arms).push(g);
      });
    }
    // blob shadow
    var sh = new THREE.Mesh(new THREE.CircleGeometry(info.kind === 'adult' ? 0.32 : 0.26, 16), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.25, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; root.add(sh);
    // name label
    var lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.label(info.name, info.color), depthTest: false, transparent: true }));
    var top = info.kind === 'adult' ? 2.05 : info.kind === 'kid' ? 1.4 : 0.85;
    lab.position.y = top; lab.scale.set(0.9, 0.225, 1); lab.renderOrder = 10; root.add(lab);

    // merge the non-animated parts by material (fewer draw calls on the TV)
    root.updateMatrixWorld(true);
    var limbs = legs.concat(arms), bake = {}, rem = [], inv = new THREE.Matrix4().copy(body.matrixWorld).invert();
    body.traverse(function(o){
      if (!o.isMesh) return;
      for (var q = o.parent; q && q !== body; q = q.parent) if (limbs.indexOf(q) >= 0) return;
      var g = o.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      (bake[o.material.uuid] = bake[o.material.uuid] || { m: o.material, l: [] }).l.push(g); rem.push(o);
    });
    rem.forEach(function(o){ o.parent.remove(o); });
    Object.keys(bake).forEach(function(k){ body.add(new THREE.Mesh(TEX.merge(bake[k].l), bake[k].m)); });
    limbs.forEach(function(l){
      var lb = {}, lr = [];
      l.children.forEach(function(o){ if (!o.isMesh) return; var g = o.geometry.clone(); o.updateMatrix(); g.applyMatrix4(o.matrix); (lb[o.material.uuid] = lb[o.material.uuid] || { m: o.material, l: [] }).l.push(g); lr.push(o); });
      lr.forEach(function(o){ l.remove(o); });
      Object.keys(lb).forEach(function(k){ l.add(new THREE.Mesh(TEX.merge(lb[k].l), lb[k].m)); });
    });
    var phase = 0, quad = info.kind === 'baby' || info.kind === 'dog';
    return {
      root: root, label: lab,
      animate: function(dt, speed){
        phase += dt * (quad ? 9 : 7) * Math.min(1, speed);
        var sw = Math.sin(phase) * 0.6 * Math.min(1, speed * 1.5);
        legs.forEach(function(l, i){ l.rotation.x = i % 2 ? -sw : sw; });
        arms.forEach(function(a, i){ a.rotation.x = i % 2 ? sw : -sw; });
        body.position.y = Math.abs(Math.sin(phase)) * 0.03 * Math.min(1, speed);
      }
    };
  }
};
