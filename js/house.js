/* Casa Refúgio — ground floor model.
   Plan coordinates (metres): X 0 → 16 runs from the front door end to the living-room end.
   Z 0 = veranda side (glass doors, hammock), Z 11 = kitchen-window side. Y is up. */
var HOUSE = (function(){

function build(scene){
  var statics = [];            // {g: BufferGeometry (world space), m: Material}
  var walls = [];              // hard collision boxes {x0,x1,z0,z1}
  var soft = [];               // furniture that the baby can crawl under
  var shade = [];              // footprints that get a soft contact shadow on the floor
  var items = {};              // hideable objects
  var tmp = new THREE.Object3D();

  /* ---------------- materials ---------------- */
  var LC = {};
  function L(color, o){ var key = color + '|' + (o ? JSON.stringify({ e: o.emissive, op: o.opacity, s: o.side, t: o.tile, m: !!o.map, p: o.phong }) : ''); if (!(o && o.map) && LC[key]) return LC[key]; var r = L0(color, o); if (!(o && o.map)) LC[key] = r; return r; }
  function L0(color, o){ o = o || {}; var m = new (o.phong ? THREE.MeshPhongMaterial : THREE.MeshLambertMaterial)({ color: color, map: o.map || null, transparent: !!o.opacity, opacity: o.opacity || 1, side: o.side || THREE.FrontSide }); if (o.phong) { m.shininess = o.phong; m.specular = new THREE.Color(o.spec || 0x222222); } if (o.opacity) m.depthWrite = false; m.userData.tile = o.tile || 0; if (o.emissive) m.emissive = new THREE.Color(o.emissive); return m; }
  function Bm(color, o){ o = o || {}; var m = new THREE.MeshBasicMaterial({ color: color, map: o.map || null, transparent: !!o.opacity, opacity: o.opacity || 1, side: o.side || THREE.FrontSide }); if (o.opacity) m.depthWrite = false; m.userData.tile = o.tile || 0; return m; }
  var M = {
    wall: L(0xeeeae2), wallWarm: L(0xece6dc),
    floor: L(0xece6dc, { map: TEX.floor(), tile: 2.0, phong: 40, spec: 0x2a2824 }),
    ceil: L(0xffffff, { map: TEX.planks('#6b3a22', '#3f2112', 16), tile: 1.6 }),
    roof: L(0xffffff, { map: TEX.planks('#7a4527', '#46240f', 14), tile: 1.8, side: THREE.DoubleSide }),
    beamDark: L(0x3d2418), beam: L(0x9a5a2e), beamMid: L(0x6e3d22),
    woodTop: L(0x8a5532, { phong: 20, spec: 0x1a1410 }), woodLight: L(0xa8703f), doorDark: L(0x4a2218),
    mosaic: L(0xffffff, { map: TEX.mosaic(), tile: 0.5 }),
    granite: L(0xffffff, { map: TEX.granite('#151515', ['#3a3a3a', '#555', '#2a2a2a', '#6b5a48']), tile: 0.6, phong: 60, spec: 0x444444 }),
    stair: L(0xffffff, { map: TEX.granite('#d8cbb0', ['#b9a888', '#efe5cf', '#a89574', '#cbbd9e']), tile: 0.5 }),
    cabinet: L(0xe9e5dc), cabinetLine: L(0x9a958c), white: L(0xfafafa), offwhite: L(0xe8e2d4),
    subway: L(0xffffff, { map: TEX.subway(), tile: 0.5 }),
    steel: L(0xc3c7cb, { phong: 50, spec: 0x888888 }), steelDark: L(0x8d9196), black: L(0x1b1b1b), blackSoft: L(0x2b2b2b),
    glass: Bm(0xcfe6ef, { opacity: 0.16, side: THREE.DoubleSide }),
    glassShelf: Bm(0xd8f0f0, { opacity: 0.35, side: THREE.DoubleSide }),
    frame: L(0xf4f4f4),
    red: L(0xc8131f), redLamp: L(0xc0101c, { emissive: 0x300000 }),
    sofa: L(0x4f4038), stripes: L(0xffffff, { map: TEX.stripes(), tile: 0.6 }),
    terracotta: L(0xb7663a), plant: L(0x3f7d35), plantDark: L(0x2d5e27), plantLight: L(0x5e9c43),
    soil: L(0x4a3424), curtain: Bm(0xffffff, { opacity: 0.55, side: THREE.DoubleSide }),
    water: Bm(0x7fd6d8, { opacity: 0.65 }),
    playmat: L(0xffffff, { map: TEX.playmat(), tile: 1.2 }),
    grass: L(0xffffff, { map: TEX.grass(), tile: 4 }),
    deck: L(0xffffff, { map: TEX.planks('#7b4a2c', '#4f2c18', 22), tile: 1.5 }),
    brick: L(0xffffff, { map: TEX.brick(), tile: 0.8 }),
    shedWood: L(0xffffff, { map: TEX.planks('#6a4a30', '#3f2a18', 10), tile: 1.2 }),
    roofRed: L(0x8a3b2a), leaf: L(0x3f7f34), leaf2: L(0x568f3c), leaf3: L(0x2f6a2d), trunk: L(0x5b4030),
    picket: L(0x8a5a36), hammock: L(0xb06b36, { side: THREE.DoubleSide }), tankBlue: L(0x2a8fd0),
    logs: L(0xffffff, { map: TEX.photo('logs') }), cds: L(0xffffff, { map: TEX.photo('cds') }),
    tubtile: L(0xffffff, { map: TEX.photo('tubtile', true), tile: 1.2 }),
    stereo: L(0xffffff, { map: TEX.photo('stereo') }), speaker: L(0xffffff, { map: TEX.photo('speaker') }),
    quest: L(0xffffff, { map: TEX.photo('quest') }), keepcalm: L(0xffffff, { map: TEX.photo('keepcalm') }),
    consul: L(0xffffff, { map: TEX.photo('consul') }), woodPanel: L(0xffffff, { map: TEX.photo('woodpanel', true), tile: 1.4 }), hatsign: L(0xffffff, { map: TEX.photo('hatsign') }),
    sculpt: L(0xf6f6f2), apple: L(0xc22a2a), banana: L(0xe6c13c), toy: L(0xf2b134), toy2: L(0x6fb7e8),
    bowl: L(0x8b5a2b), fanBlack: L(0x202020), shadow: Bm(0x000000, { opacity: 0.28 })
  };

  /* ---------------- geometry helpers ---------------- */
  function uvScale(g, w, h, d, tile){
    var uv = g.attributes.uv.array, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (var f = 0; f < 6; f++) for (var v = 0; v < 4; v++) { var i = (f * 4 + v) * 2; uv[i] *= dims[f][0] / tile; uv[i + 1] *= dims[f][1] / tile; }
  }
  function pushStatic(g, m){ statics.push({ g: g, m: m }); }
  // axis-aligned box by extents
  function B(x0, x1, y0, y1, z0, z1, m, col){
    var w = x1 - x0, h = y1 - y0, d = z1 - z0;
    var g = new THREE.BoxGeometry(w, h, d);
    if (m.userData.tile) uvScale(g, w, h, d, m.userData.tile);
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    pushStatic(g, m);
    if (col && y0 <= 0.05) shade.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) });
    if (col === 'w') walls.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) });
    else if (col === 's') soft.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) });
  }
  // any geometry placed with transform
  function G(g, m, x, y, z, rx, ry, rz, s){
    tmp.position.set(x, y, z); tmp.rotation.set(rx || 0, ry || 0, rz || 0); tmp.scale.setScalar(s || 1); tmp.updateMatrix();
    g.applyMatrix4(tmp.matrix); pushStatic(g, m);
  }
  // vertical decal plane facing a direction: 'x+','x-','z+','z-'
  function D(face, a0, a1, y0, y1, c, m){
    var w = a1 - a0, h = y1 - y0, g = new THREE.PlaneGeometry(w, h), mid = (a0 + a1) / 2, my = (y0 + y1) / 2;
    if (m.userData.tile) { var uv = g.attributes.uv.array; for (var i = 0; i < uv.length; i += 2) { uv[i] *= w / m.userData.tile; uv[i + 1] *= h / m.userData.tile; } }
    if (face === 'z+') G(g, m, mid, my, c, 0, 0, 0);
    else if (face === 'z-') G(g, m, mid, my, c, 0, Math.PI, 0);
    else if (face === 'x+') G(g, m, c, my, mid, 0, Math.PI / 2, 0);
    else G(g, m, c, my, mid, 0, -Math.PI / 2, 0);
  }
  function cyl(rt, rb, h, seg){ return new THREE.CylinderGeometry(rt, rb, h, seg || 12); }
  function sph(r, ws, hs){ return new THREE.SphereGeometry(r, ws || 10, hs || 8); }
  function lathe(pts, seg){ return new THREE.LatheGeometry(pts.map(function(p){ return new THREE.Vector2(p[0], p[1]); }), seg || 16); }
  function blockCircle(x, z, r, kind){ var b = { x0: x - r, x1: x + r, z0: z - r, z1: z + r }; (kind === 's' ? soft : walls).push(b); shade.push(b); }
  // rounded box (bevelled) by extents
  function RB(x0, x1, y0, y1, z0, z1, m, r, col){
    var w = x1 - x0, h = y1 - y0, d = z1 - z0; r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
    var sh = new THREE.Shape(); sh.moveTo(-w / 2 + r, -h / 2 + r); sh.lineTo(w / 2 - r, -h / 2 + r); sh.lineTo(w / 2 - r, h / 2 - r); sh.lineTo(-w / 2 + r, h / 2 - r); sh.lineTo(-w / 2 + r, -h / 2 + r);
    var g = new THREE.ExtrudeGeometry(sh, { depth: d - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r - 0.0005, bevelSegments: 3, curveSegments: 1 });
    g.translate(0, 0, -(d - 2 * r) / 2);
    if (m.userData.tile) { var uv = g.attributes.uv.array; for (var i = 0; i < uv.length; i++) uv[i] /= m.userData.tile; }
    G(g, m, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    var rc = { x0: x0, x1: x1, z0: z0, z1: z1 };
    if (col === 'w') walls.push(rc); else if (col === 's') soft.push(rc);
    if (col && y0 <= 0.05) shade.push(rc);
  }

  // mesh helper for item groups
  function mesh(g, m, x, y, z, rx, ry, rz){ var o = new THREE.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); o.rotation.set(rx || 0, ry || 0, rz || 0); return o; }
  function addItem(key, name, grp, x, y, z, ry){
    var mb = {}, rm = [];
    grp.children.forEach(function(o){ if (!o.isMesh || Array.isArray(o.material)) return; o.updateMatrix(); var g = o.geometry.clone(); g.applyMatrix4(o.matrix); (mb[o.material.uuid] = mb[o.material.uuid] || { m: o.material, l: [] }).l.push(g); rm.push(o); });
    rm.forEach(function(o){ grp.remove(o); });
    Object.keys(mb).forEach(function(k){ grp.add(new THREE.Mesh(TEX.merge(mb[k].l), mb[k].m)); });
    grp.position.set(x, y, z); grp.rotation.y = ry || 0;
    scene.add(grp);
    items[key] = { key: key, name: name, obj: grp, home: { x: x, y: y, z: z, ry: ry || 0 } };
  }

  /* =========================================================
     STRUCTURE
     ========================================================= */
  var H1 = 2.75;              // ground-floor ceiling / mezzanine floor
  var EAVE = 3.0, RIDGE = 6.8, RZ = 6.2, BACK = 5.0;   // roof profile in Z
  function roofY(z){ return z <= RZ ? EAVE + (RIDGE - EAVE) * (z / RZ) : RIDGE - (RIDGE - BACK) * ((z - RZ) / (11 - RZ)); }

  // floor
  B(0, 16, -0.06, 0, 0, 11, M.floor);

  // ---- X = 0 end wall (front door, hot tub window, bathroom) ----
  B(-0.2, 0, 0, 0.9, 0, 2.4, M.tubtile, 'w');          // below hot-tub window
  B(-0.2, 0, 2.7, EAVE, 0, 2.4, M.wall);                // above window
  D('x+', 0.0, 2.4, 0.9, 2.7, 0.0, M.glass); walls.push({ x0: -0.2, x1: 0, z0: 0, z1: 2.4 });
  B(-0.2, 0, 0, H1, 2.4, 4.0, M.wall, 'w');
  D('x+', 2.4, 4.0, 0, 2.65, 0.005, M.tubtile);
  B(-0.25, 0, 2.45, H1, 4.0, 5.3, M.wall);             // over door
  B(-0.2, 0, 0, H1, 5.3, 11, M.wall, 'w');
  walls.push({ x0: -0.3, x1: 0, z0: 4.0, z1: 5.3 });   // closed front door
  // gable above, X=0
  (function(){
    var s = new THREE.Shape(); s.moveTo(0, H1); s.lineTo(11, H1); s.lineTo(11, BACK); s.lineTo(RZ, RIDGE); s.lineTo(0, EAVE); s.lineTo(0, H1);
    var g = new THREE.ShapeGeometry(s); G(g.clone(), M.wall, 0.0, 0, 0, 0, Math.PI / 2, 0); G(g, M.wall, 16.0, 0, 0, 0, -Math.PI / 2, 0);
    // flip: ShapeGeometry in XY, rotated so shape X -> world -Z (x+ facing) ; fix sign by mirroring
  })();

  // ---- X = 16 end wall (glass corner, cabinet, dining windows) ----
  // glass Z 0..5
  for (var gz = 0; gz < 5; gz += 1.25) B(15.95, 16.05, 0, EAVE, gz, gz + 0.06, M.frame);
  B(15.95, 16.05, 0, 0.06, 0, 5, M.frame); B(15.95, 16.05, 2.55, 2.62, 0, 5, M.frame);
  D('x-', 0, 5, 0, 2.55, 16.0, M.glass); walls.push({ x0: 16, x1: 16.2, z0: 0, z1: 5 });
  B(15.95, 16.05, 2.62, EAVE, 0, 5, M.wall);
  B(16, 16.2, 0, H1, 5, 11, M.wall, 'w');
  // dining windows X=16 (Z 6.8..10.6)
  D('x-', 6.8, 10.6, 0.95, 2.3, 15.99, M.glass);
  B(15.9, 16, 0.9, 0.95, 6.8, 10.6, M.frame); B(15.9, 16, 2.3, 2.36, 6.8, 10.6, M.frame);
  D('x-', 6.6, 10.8, 0.6, 2.5, 15.8, M.curtain);

  // ---- Z = 0 veranda side (mostly glass) ----
  function glassRun(x0, x1, panes){
    var w = (x1 - x0) / panes;
    for (var i = 0; i <= panes; i++) B(x0 + i * w - 0.04, x0 + i * w + 0.04, 0, 2.55, -0.05, 0.05, M.frame);
    B(x0, x1, 0, 0.06, -0.05, 0.05, M.frame); B(x0, x1, 2.5, 2.6, -0.05, 0.05, M.frame);
    D('z+', x0, x1, 0.06, 2.5, 0.0, M.glass);
    walls.push({ x0: x0, x1: x1, z0: -0.2, z1: 0 });
    B(x0, x1, 2.6, EAVE, -0.05, 0.08, M.wall);
  }
  glassRun(0, 3.2, 2);                                    // hot tub
  B(3.2, 3.5, 0, EAVE, -0.05, 0.55, M.wall, 'w');          // column with hat + sign
  D('x+', 0.1, 0.48, 1.25, 2.45, 3.505, M.hatsign);
  glassRun(3.5, 7.6, 3);                                  // entrance hall
  glassRun(11.2, 16, 4);                                  // living

  // ---- Z = 11 back wall ----
  B(0, 3.0, 0, BACK, 11, 11.2, M.wall, 'w');
  B(3.0, 4.6, 0, 1.0, 11, 11.2, M.wall, 'w'); B(3.0, 4.6, 1.7, BACK, 11, 11.2, M.wall); D('z-', 3.2, 4.4, 1.0, 1.7, 11.0, M.glass); // laundry window
  B(4.6, 6.3, 0, BACK, 11, 11.2, M.wall, 'w');
  B(6.3, 8.8, 0, 1.05, 11, 11.2, M.wall, 'w'); B(6.3, 8.8, 2.3, BACK, 11, 11.2, M.wall); // kitchen window
  D('z-', 6.3, 8.8, 1.05, 2.3, 11.0, M.glass); B(6.3, 8.8, 1.0, 1.05, 10.9, 11, M.frame);
  B(7.52, 7.58, 1.05, 2.3, 10.95, 11, M.frame);
  B(8.8, 11.2, 0, BACK, 11, 11.2, M.wall, 'w');
  B(11.2, 15.4, 0, 0.95, 11, 11.2, M.wall, 'w'); B(11.2, 15.4, 2.3, BACK, 11, 11.2, M.wall);
  D('z-', 11.2, 15.4, 0.95, 2.3, 11.0, M.glass); D('z-', 11.0, 15.6, 0.6, 2.5, 10.8, M.curtain);
  B(15.4, 16, 0, BACK, 11, 11.2, M.wall, 'w');
  // tall stair window (upper)
  D('z-', 3.2, 4.0, 3.0, 4.8, 10.99, M.glass);

  // ---- roof (visible from the double-height hall/living) ----
  (function(){
    var len = Math.sqrt(RZ * RZ + (RIDGE - EAVE) * (RIDGE - EAVE)), ang = Math.atan2(RIDGE - EAVE, RZ);
    var g = new THREE.PlaneGeometry(16.6, len); var uv = g.attributes.uv.array; for (var i = 0; i < uv.length; i += 2) { uv[i] *= 16.6 / 1.8; uv[i + 1] *= len / 1.8; }
    G(g, M.roof, 8, (EAVE + RIDGE) / 2, RZ / 2, Math.PI / 2 - ang, 0, 0);
    var len2 = Math.sqrt((11 - RZ) * (11 - RZ) + (RIDGE - BACK) * (RIDGE - BACK)), ang2 = Math.atan2(RIDGE - BACK, 11 - RZ);
    var g2 = new THREE.PlaneGeometry(16.6, len2); G(g2, M.roof, 8, (RIDGE + BACK) / 2, (RZ + 11) / 2, Math.PI / 2 + ang2, 0, 0);
    // trusses (dark) + purlins
    [0.15, 3.35, 7.7, 12.1, 15.85].forEach(function(x){
      B(x - 0.09, x + 0.09, EAVE - 0.12, EAVE + 0.1, 0, 6.5, M.beamDark);
      var r = new THREE.BoxGeometry(0.16, 0.22, len); G(r, M.beamDark, x, (EAVE + RIDGE) / 2 - 0.12, RZ / 2, -ang, 0, 0);
      B(x - 0.07, x + 0.07, EAVE, RIDGE - 0.1, RZ - 0.07, RZ + 0.07, M.beamDark);
      var br = new THREE.BoxGeometry(0.12, 0.14, 3.2); G(br, M.beamDark, x, EAVE + 1.25, RZ - 1.4, -0.75, 0, 0);
    });
    for (var k = 1; k < 5; k++) { var z = RZ * k / 5, y = roofY(z) - 0.12; B(0, 16, y - 0.08, y + 0.06, z - 0.06, z + 0.06, M.beamMid); }
    B(0, 16, RIDGE - 0.25, RIDGE - 0.05, RZ - 0.1, RZ + 0.1, M.beamDark);
  })();

  // ---- mezzanine (upper floor) over kitchen / dining / bathroom ----
  B(0, 3.0, H1 - 0.12, H1 + 0.18, 6.0, 11, M.wall);
  B(4.2, 16, H1 - 0.12, H1 + 0.18, 6.5, 11, M.ceil);
  B(3.0, 4.2, H1 - 0.12, H1 + 0.18, 8.8, 11, M.ceil);
  B(4.2, 16, H1 - 0.35, H1 + 0.18, 6.42, 6.6, M.beamDark);           // big edge beam
  for (var jx = 4.5; jx < 16; jx += 0.55) B(jx, jx + 0.09, H1 - 0.3, H1 - 0.12, 6.6, 11, M.beam);
  // glass railing + upper wall
  B(0, 16, H1 + 0.18, H1 + 1.15, 6.5, 6.53, M.glass);
  B(0, 16, H1 + 1.12, H1 + 1.18, 6.48, 6.55, M.steel);
  B(0, 16, H1 + 0.18, BACK + 0.4, 7.7, 7.85, M.wall);
  B(5.0, 5.9, H1 + 0.18, H1 + 2.25, 7.66, 7.7, M.doorDark); B(9.5, 10.4, H1 + 0.18, H1 + 2.25, 7.66, 7.7, M.doorDark); B(13.4, 14.3, H1 + 0.18, H1 + 2.25, 7.66, 7.7, M.doorDark);
  B(7.0, 7.9, H1 + 1.8, H1 + 2.1, 7.45, 7.7, M.white);             // AC unit
  B(0, 3.0, H1 + 0.18, H1 + 1.15, 6.0, 6.03, M.glass);

  /* =========================================================
     ENTRANCE + HOT TUB
     ========================================================= */
  // front door (dark wood, horizontal grooves, long steel handle)
  B(-0.02, 0.06, 0, 2.45, 4.02, 5.28, M.doorDark);
  for (var dy = 0.3; dy < 2.4; dy += 0.3) B(0.06, 0.07, dy, dy + 0.015, 4.04, 5.26, M.beamDark);
  B(0.07, 0.1, 0.8, 1.8, 4.18, 4.21, M.steel); B(0.06, 0.1, 0.85, 0.87, 4.18, 4.21, M.steel); B(0.06, 0.1, 1.73, 1.75, 4.18, 4.21, M.steel);
  B(-0.02, 0.1, 2.45, 2.55, 3.95, 5.35, M.doorDark);
  // hot tub on raised wooden platform
  var TP = 0.55;
  B(0, 3.05, 0, TP, 0, 0.35, M.deck, 'w'); B(0, 3.05, 0, TP, 2.35, 3.0, M.deck, 'w');
  B(0, 0.35, 0, TP, 0.35, 2.35, M.deck, 'w'); B(2.6, 3.05, 0, TP, 0.35, 2.35, M.deck, 'w');
  B(0.35, 2.6, 0, TP - 0.55, 0.35, 2.35, M.white);
  B(0.35, 2.6, 0.05, TP - 0.05, 0.35, 0.42, M.white); B(0.35, 2.6, 0.05, TP - 0.05, 2.28, 2.35, M.white);
  B(0.35, 0.42, 0.05, TP - 0.05, 0.35, 2.35, M.white); B(2.53, 2.6, 0.05, TP - 0.05, 0.35, 2.35, M.white);
  B(0.42, 2.53, 0.05, 0.08, 0.42, 2.28, M.white);
  B(0.42, 2.53, 0.43, 0.44, 0.42, 2.28, M.water);
  walls.push({ x0: 0.35, x1: 2.6, z0: 0.35, z1: 2.35 });
  B(3.05, 3.4, 0, 0.27, 0.9, 2.2, M.deck);   // step
  // pillows (headrests)
  G(sph(0.09, 8, 6), M.black, 0.6, TP, 1.2, 0, 0, 0, 1); G(sph(0.09, 8, 6), M.black, 1.4, TP, 0.45, 0, 0, 0, 1);
  // lucky bamboo in white vase
  G(cyl(0.12, 0.09, 0.55, 14), M.white, 3.25, 0.28, 0.75);
  for (var bb = 0; bb < 3; bb++) { G(cyl(0.015, 0.015, 1.3, 5), M.plantLight, 3.22 + bb * 0.03, 1.15, 0.75 + (bb - 1) * 0.03); for (var lf = 0; lf < 5; lf++) G(new THREE.ConeGeometry(0.05, 0.3, 4), M.plant, 3.22 + bb * 0.03, 0.9 + lf * 0.22 + bb * 0.05, 0.75, 0.6 * (lf % 2 ? 1 : -1), lf, 0); }

  /* =========================================================
     BATHROOM (X 0..3, Z 6..11)
     ========================================================= */
  B(0, 1.0, 0, H1, 6.0, 6.12, M.wall, 'w'); B(1.85, 3.0, 0, H1, 6.0, 6.12, M.wall, 'w'); B(1.0, 1.85, 2.15, H1, 6.0, 6.12, M.wall);
  B(1.0, 1.05, 0, 2.15, 6.12, 6.95, M.woodTop);   // open door (swung inside)
  B(2.95, 3.05, 0, H1, 6.0, 11, M.wall, 'w');     // stair side wall
  // shower (glass box) at the back
  B(0.0, 1.4, 0, 0.04, 9.6, 11, M.white);
  B(0.0, 1.4, 0, 2.0, 9.58, 9.6, M.glass); B(1.38, 1.4, 0, 2.0, 9.6, 11, M.glass);
  walls.push({ x0: 1.38, x1: 1.42, z0: 9.6, z1: 11 });
  G(cyl(0.12, 0.12, 0.02, 14), M.steel, 0.7, 2.05, 10.6); G(cyl(0.012, 0.012, 0.3, 6), M.steel, 0.7, 2.2, 10.85, Math.PI / 2, 0, 0);
  // toilet
  B(2.25, 2.85, 0, 0.42, 10.2, 10.6, M.white, 's'); G(cyl(0.2, 0.17, 0.4, 14), M.white, 2.45, 0.2, 10.15); B(2.7, 2.92, 0.42, 0.85, 9.95, 10.4, M.white);
  // vanity + mirror
  B(2.45, 2.95, 0, 0.85, 7.3, 8.4, M.woodTop, 'w'); B(2.4, 2.95, 0.85, 0.9, 7.25, 8.45, M.granite); G(cyl(0.18, 0.15, 0.12, 14), M.white, 2.65, 0.96, 7.85);
  D('x-', 7.4, 8.3, 1.2, 2.0, 2.94, L(0xbfd3db));

  /* =========================================================
     STAIRS (X 3..4.2, bottom Z 4.6 → top Z 8.8) + niches + wine rack
     ========================================================= */
  var NST = 15, run = (8.8 - 4.6) / NST, rise = H1 / NST;
  for (var s = 0; s < NST; s++) {
    var z0 = 4.6 + s * run, y1 = (s + 1) * rise;
    B(3.05, 4.2, 0, y1 - 0.04, z0, z0 + run, M.wall);
    B(3.05, 4.25, y1 - 0.04, y1, z0 - 0.03, z0 + run, M.stair);
  }
  walls.push({ x0: 3.0, x1: 4.28, z0: 4.55, z1: 8.8 });
  // handrail on wall
  var hrl = Math.sqrt(4.2 * 4.2 + H1 * H1); G(cyl(0.02, 0.02, hrl, 6), M.steel, 3.1, H1 / 2 + 0.9, 6.7, Math.atan2(4.2, H1), 0, 0);
  // wine rack (hexagon terracotta tubes) at the low end, facing +X
  for (var wr = 0; wr < 4; wr++) for (var wc = 0; wc < 7 - wr; wc++) {
    var wz = 4.95 + wc * 0.2 + wr * 0.1, wy = 0.14 + wr * 0.17;
    if (wy + 0.1 > (wz - 4.6) / run * rise - 0.05) continue;
    G(cyl(0.095, 0.095, 0.35, 6), M.terracotta, 4.1, wy, wz, 0, 0, Math.PI / 2);
    G(cyl(0.07, 0.07, 0.36, 10), M.black, 4.1, wy, wz, 0, 0, Math.PI / 2);
    if ((wc + wr) % 2 === 0) G(cyl(0.035, 0.035, 0.08, 8), M.plantDark, 4.29, wy, wz, 0, 0, Math.PI / 2);
  }
  // lit niches + black doors further up
  [[6.55, 1.0, 1.55], [7.25, 0.35, 0.95], [7.25, 1.05, 1.7], [7.95, 0.35, 0.95], [7.95, 1.05, 1.75]].forEach(function(n, i){
    B(4.15, 4.21, n[1], n[2], n[0] - 0.3, n[0] + 0.3, i === 1 || i === 3 ? M.black : M.blackSoft);
  });
  G(lathe([[0, 0], [0.07, 0], [0.05, 0.12], [0.03, 0.2], [0.06, 0.28], [0, 0.34]], 12), M.sculpt, 4.1, 1.06, 7.25);
  G(lathe([[0, 0], [0.06, 0], [0.04, 0.15], [0.05, 0.25], [0, 0.3]], 12), M.sculpt, 4.1, 1.01, 6.55);
  B(4.2, 4.22, 0.35, 0.95, 6.0, 6.6, M.black);

  /* =========================================================
     LAUNDRY (X 3..4.6, Z 8.8..11)
     ========================================================= */
  B(3.0, 4.6, 0, H1, 8.8, 8.9, M.wall, 'w');
  B(4.55, 4.65, 0, H1, 8.8, 9.2, M.wall, 'w'); B(4.55, 4.65, 0, H1, 10.0, 11, M.wall, 'w'); B(4.55, 4.65, 2.1, H1, 9.2, 10.0, M.wall);
  B(3.05, 3.65, 0, 0.85, 10.35, 10.98, M.white, 'w'); B(3.1, 3.6, 0.8, 0.86, 10.4, 10.9, M.steel);   // tank
  G(cyl(0.27, 0.25, 0.85, 16), M.white, 3.95, 0.43, 10.65); blockCircle(3.95, 10.65, 0.28);           // tanquinho
  G(cyl(0.2, 0.2, 0.05, 16), L(0x7fc7e0), 3.95, 0.87, 10.65);
  B(3.3, 3.7, 1.55, 2.15, 10.9, 11.0, M.white); D('z-', 3.36, 3.64, 1.95, 2.05, 10.89, M.red);         // Rinnai heater
  G(cyl(0.04, 0.04, 0.6, 8), M.steel, 3.5, 2.45, 10.95);
  G(cyl(0.22, 0.2, 0.6, 12), M.black, 3.3, 0.3, 9.2); blockCircle(3.3, 9.2, 0.22);                       // bin
  B(3.05, 3.08, 1.1, 1.8, 9.3, 9.6, M.red);                                                               // dustpan/towel

  /* =========================================================
     KITCHEN
     ========================================================= */
  // oven / microwave tower + fridge at the galley end (against X = 4.65)
  B(4.65, 5.3, 0, 2.3, 8.15, 8.85, M.cabinet, 'w');
  B(5.3, 5.31, 0.85, 1.45, 8.22, 8.78, M.black); B(5.3, 5.315, 1.55, 1.95, 8.22, 8.78, M.white); B(5.315, 5.32, 1.6, 1.9, 8.28, 8.65, M.blackSoft);
  B(4.65, 5.4, 0, 1.9, 10.15, 10.95, M.white, 'w'); B(5.4, 5.43, 0.3, 1.8, 10.2, 10.24, M.steel); // fridge
  D('x+', 10.4, 10.7, 1.3, 1.55, 5.405, L(0xffffff, { map: TEX.label('GELADEIRA', '#2a6a3a') }));
  // bar: red mosaic half wall + wood top (living side), island with cooktop (kitchen side)
  B(5.0, 10.0, 0, 1.08, 6.55, 6.8, M.mosaic, 'w');
  B(4.95, 10.05, 1.08, 1.13, 6.32, 6.85, M.woodTop);
  B(5.0, 10.0, 0, 0.86, 6.8, 7.55, M.cabinet, 'w'); B(4.98, 10.02, 0.86, 0.9, 6.78, 7.58, M.granite);
  B(5.0, 10.0, 0.9, 1.08, 6.76, 6.8, M.granite);
  for (var dx = 5.4; dx < 10; dx += 0.6) B(dx, dx + 0.02, 0.05, 0.84, 7.55, 7.56, M.cabinetLine);
  B(5.0, 10.0, 0.42, 0.43, 7.55, 7.56, M.cabinetLine);
  B(7.15, 7.95, 0.9, 0.915, 6.92, 7.45, M.black);                      // cooktop
  [[7.3, 7.05], [7.8, 7.05], [7.3, 7.32], [7.8, 7.32], [7.55, 7.18]].forEach(function(p){ G(cyl(0.06, 0.07, 0.03, 10), M.steelDark, p[0], 0.93, p[1]); });
  B(7.15, 7.95, 0.12, 0.8, 7.555, 7.57, M.black);                       // oven door
  // back counter with sink under the window
  B(5.45, 10.0, 0, 0.86, 10.4, 11.0, M.cabinet, 'w'); B(5.43, 10.0, 0.86, 0.9, 10.35, 11.0, M.granite);
  for (var dx2 = 5.8; dx2 < 10; dx2 += 0.6) B(dx2, dx2 + 0.02, 0.05, 0.84, 10.39, 10.4, M.cabinetLine);
  B(6.7, 7.9, 0.75, 0.905, 10.48, 10.88, M.steel); B(6.75, 7.85, 0.76, 0.77, 10.52, 10.84, M.steelDark);
  G(cyl(0.02, 0.025, 0.45, 8), M.steel, 7.3, 1.12, 10.92); G(new THREE.TorusGeometry(0.12, 0.018, 6, 12, Math.PI), M.steel, 7.3, 1.34, 10.8, 0, Math.PI / 2, 0);
  B(8.0, 8.5, 0.9, 1.05, 10.5, 10.85, M.steel);                         // dish rack
  for (var pl = 0; pl < 3; pl++) G(cyl(0.12, 0.12, 0.012, 16), M.white, 8.1 + pl * 0.13, 1.03, 10.68, 0, 0, Math.PI / 2);
  D('z-', 5.45, 10.0, 0.9, 2.3, 10.99, M.subway);
  B(5.5, 9.6, 2.28, 2.33, 10.68, 11.0, M.woodTop);                     // floating shelf + jars
  [5.9, 6.5, 8.9, 9.3].forEach(function(x, i){ G(cyl(0.08, 0.08, 0.22, 12), M.glassShelf, x, 2.44, 10.84); if (i % 2) G(cyl(0.085, 0.085, 0.03, 12), M.woodLight, x, 2.56, 10.84); });
  G(cyl(0.03, 0.04, 0.28, 8), L(0x3a4a1a), 9.7, 1.04, 10.85);            // olive oil
  G(cyl(0.14, 0.14, 0.14, 14), L(0x1f8fa8), 9.2, 0.97, 10.7); G(cyl(0.15, 0.15, 0.02, 14), L(0x1f8fa8), 9.2, 1.05, 10.7); // blue pot
  // knife block, detergent, eggs, candy jar on the island
  B(8.4, 8.55, 0.9, 1.15, 7.05, 7.2, M.black);
  G(cyl(0.035, 0.04, 0.22, 8), L(0xf08a3a), 8.8, 1.01, 7.3); G(cyl(0.012, 0.012, 0.05, 6), M.red, 8.8, 1.14, 7.3);
  B(6.1, 6.4, 0.9, 0.97, 7.0, 7.2, L(0xf3efe6)); for (var e = 0; e < 6; e++) G(sph(0.022, 6, 5), L(0xf5f2ea), 6.14 + (e % 3) * 0.1, 0.98, 7.05 + ((e / 3) | 0) * 0.1);
  G(sph(0.11, 12, 10), M.glassShelf, 6.7, 1.0, 7.3); G(sph(0.08, 8, 6), L(0xd94a6a), 6.7, 0.97, 7.3);
  B(5.6, 5.95, 0.9, 0.96, 7.2, 7.45, L(0x5a2e1e));                     // brownie dish
  // wood-panel column at the east end of the bar + Consul cooler unit
  B(10.0, 10.7, 0, H1 - 0.12, 8.6, 11.0, M.woodPanel, 'w');
  B(10.0, 10.7, 0, H1 - 0.12, 7.6, 8.6, M.cabinet, 'w');
  D('x+', 7.68, 8.52, 0.15, 1.05, 10.71, M.consul);
  B(10.68, 10.71, 1.15, 1.6, 7.7, 8.5, M.black);
  B(10.7, 10.75, 0.95, 1.6, 9.35, 10.05, M.white); B(10.7, 10.71, 1.22, 1.25, 9.4, 10.0, M.offwhite);  // niche w/ fruit
  G(sph(0.045, 8, 6), M.apple, 10.78, 1.0, 9.5); G(sph(0.045, 8, 6), M.apple, 10.78, 1.0, 9.6); G(sph(0.04, 8, 6), L(0xd9a32c), 10.78, 1.0, 9.7);
  // bar stools (chrome + brown wicker seats) on the living side
  [5.6, 6.5, 7.4, 8.3, 9.2].forEach(function(x){
    G(cyl(0.2, 0.2, 0.06, 14), L(0x4a3428), x, 0.76, 5.95); G(cyl(0.2, 0.18, 0.28, 14, 1), L(0x4a3428), x, 0.92, 6.12);
    G(cyl(0.025, 0.025, 0.74, 6), M.steel, x, 0.37, 5.95); G(new THREE.TorusGeometry(0.2, 0.015, 5, 16), M.steel, x, 0.3, 5.95, Math.PI / 2, 0, 0);
    G(new THREE.TorusGeometry(0.22, 0.015, 5, 16), M.steel, x, 0.02, 5.95, Math.PI / 2, 0, 0);
    soft.push({ x0: x - 0.22, x1: x + 0.22, z0: 5.73, z1: 6.17 });
  });
  B(6.48, 6.9, 0.75, 1.05, 6.02, 6.12, L(0xcbb6dc));    // lilac towel over a stool
  // red pendant lamps + track lights
  [5.6, 6.6, 7.6, 8.6, 9.6].forEach(function(x){
    G(lathe([[0.01, 0], [0.06, 0], [0.13, -0.18], [0.16, -0.32], [0.01, -0.32]], 16), M.redLamp, x, 2.1, 6.55);
    G(cyl(0.004, 0.004, 0.32, 4), M.black, x, 2.26, 6.55);
  });
  B(5.0, 9.8, 2.38, 2.42, 7.4, 7.44, M.white); for (var tl = 5.3; tl < 9.8; tl += 0.9) G(cyl(0.035, 0.035, 0.12, 8), M.white, tl, 2.3, 7.42);

  /* =========================================================
     DINING (round table, chairs, glass cabinet)
     ========================================================= */
  var TX = 13.6, TZ = 8.9;
  G(cyl(1.05, 1.05, 0.05, 32), M.woodTop, TX, 0.76, TZ); G(cyl(0.12, 0.18, 0.72, 10), M.woodTop, TX, 0.37, TZ); G(cyl(0.45, 0.45, 0.04, 16), M.woodTop, TX, 0.02, TZ);
  G(cyl(0.55, 0.55, 0.03, 28), M.woodLight, TX, 0.8, TZ);
  soft.push({ x0: TX - 0.9, x1: TX + 0.9, z0: TZ - 0.9, z1: TZ + 0.9 });
  for (var c = 0; c < 8; c++) {
    var a = c / 8 * Math.PI * 2 + 0.2, cx = TX + Math.cos(a) * 1.3, cz = TZ + Math.sin(a) * 1.3;
    chair(cx, cz, -a - Math.PI / 2);
  }
  function chair(cx, cz, ry){
    var parts = [];
    var g1 = new THREE.BoxGeometry(0.42, 0.04, 0.42); g1.translate(0, 0.45, 0); parts.push(g1);
    [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(function(p){ var l = new THREE.BoxGeometry(0.04, 0.45, 0.04); l.translate(p[0], 0.225, p[1]); parts.push(l); });
    var bk = new THREE.BoxGeometry(0.42, 0.06, 0.03); bk.translate(0, 0.95, 0.19); parts.push(bk);
    for (var k = -2; k <= 2; k++) { var sl = new THREE.BoxGeometry(0.03, 0.5, 0.025); sl.translate(k * 0.08, 0.7, 0.19); parts.push(sl); }
    parts.forEach(function(g){ G(g, M.woodTop, cx, 0, cz, 0, ry, 0); });
    soft.push({ x0: cx - 0.22, x1: cx + 0.22, z0: cz - 0.22, z1: cz + 0.22 });
  }
  G(lathe([[0, 0], [0.2, 0.0], [0.3, 0.08], [0.32, 0.12], [0.28, 0.1], [0.18, 0.04], [0, 0.04]], 20), M.bowl, TX, 0.82, TZ);
  G(sph(0.06, 8, 6), L(0xd8a95a), TX - 0.05, 0.88, TZ); G(sph(0.05, 8, 6), L(0xc98a4a), TX + 0.08, 0.88, TZ + 0.04);
  G(sph(0.06, 8, 6), M.toy, TX - 0.6, 0.83, TZ - 0.4); G(sph(0.05, 8, 6), M.toy2, TX - 0.5, 0.83, TZ - 0.5);
  G(cyl(0.12, 0.12, 0.012, 16), M.white, TX + 0.5, 0.79, TZ - 0.6); G(cyl(0.05, 0.04, 0.08, 12), L(0x7a1a1a), TX + 0.2, 0.83, TZ - 0.75);
  // glass display cabinet (cristaleira) in the X=16 wall
  B(15.55, 16.0, 0, 0.35, 5.05, 6.3, M.white, 'w'); B(15.55, 16.0, 2.35, 2.5, 5.05, 6.3, M.white);
  B(15.55, 16.0, 0.35, 2.35, 5.0, 5.08, M.white, 'w'); B(15.55, 16.0, 0.35, 2.35, 6.27, 6.35, M.white, 'w');
  B(15.9, 16.0, 0.35, 2.35, 5.08, 6.27, L(0xdde8ea));
  D('x-', 5.08, 6.27, 0.35, 2.35, 15.55, M.glass); walls.push({ x0: 15.5, x1: 16, z0: 5.0, z1: 6.35 });
  for (var sh = 0; sh < 5; sh++) {
    var sy = 0.4 + sh * 0.4; B(15.58, 15.98, sy, sy + 0.012, 5.08, 6.27, M.glassShelf);
    for (var gq = 0; gq < 5; gq++) G(lathe([[0, 0], [0.035, 0], [0.006, 0.01], [0.006, 0.09], [0.04, 0.13], [0.045, 0.2], [0.042, 0.2], [0.035, 0.14], [0, 0.1]], 10), M.glassShelf, 15.78, sy + 0.012, 5.25 + gq * 0.21);
  }

  /* =========================================================
     LIVING (fireplace, TV wall, sofa, glass corner)
     ========================================================= */
  // chimney with log wall facing the entrance
  B(7.6, 8.6, 0, roofY(1.3) + 0.2, -0.05, 1.3, M.wall, 'w');
  D('x-', 0.2, 1.15, 0.15, 2.55, 7.595, M.logs);
  // TV wall
  B(8.6, 11.2, 0, EAVE, -0.05, 0.35, M.wall, 'w');
  B(8.6, 9.75, 0, 1.05, 0.35, 0.55, M.granite, 'w'); B(8.75, 9.6, 0.15, 0.85, 0.551, 0.56, M.black); // fireplace
  B(8.6, 9.75, 1.05, 1.12, 0.33, 0.6, M.granite);
  for (var lg = 0; lg < 3; lg++) G(cyl(0.05, 0.05, 0.5, 8), L(0x6a4a2a), 9.17, 0.2 + lg * 0.02, 0.45 - lg * 0.03, 0, 0, Math.PI / 2);
  B(9.75, 11.15, 1.8, 1.85, 0.35, 0.65, M.woodTop);                      // upper shelf
  B(9.75, 11.15, 0.6, 0.66, 0.35, 0.72, M.woodTop);                      // TV/CD shelf
  D('z+', 9.85, 11.05, 0.08, 0.58, 0.37, M.cds);                         // CDs
  B(9.8, 11.1, 0, 0.08, 0.35, 0.6, M.white);
  B(9.78, 10.12, 0.66, 1.0, 0.4, 0.68, M.steel); D('z+', 9.78, 10.12, 0.66, 1.0, 0.681, M.stereo);   // micro-system
  B(9.6, 9.76, 0.2, 0.58, 0.4, 0.6, M.black); D('z+', 9.6, 9.76, 0.2, 0.58, 0.601, M.speaker);
  B(10.98, 11.14, 0.2, 0.58, 0.4, 0.6, M.black); D('z+', 10.98, 11.14, 0.2, 0.58, 0.601, M.speaker);
  B(9.85, 10.05, 1.85, 1.88, 0.42, 0.55, M.black); G(cyl(0.004, 0.004, 0.15, 4), M.black, 9.9, 1.95, 0.5); // router
  G(sph(0.07, 8, 6), L(0x9b6b4a), 11.0, 1.93, 0.5);                       // elephant figurine
  // chair by the fireplace + fireplace tool stand
  (function(){ var cx = 8.95, cz = 1.7; chair(cx, cz, 0.4); })();
  G(cyl(0.01, 0.01, 0.75, 4), M.black, 7.45, 0.38, 1.6); G(cyl(0.12, 0.14, 0.02, 8), M.black, 7.45, 0.01, 1.6);
  for (var ft = 0; ft < 3; ft++) G(cyl(0.006, 0.006, 0.6, 4), M.black, 7.42 + ft * 0.03, 0.4, 1.62);
  // sofa (L) facing the TV, back toward the dining
  RB(9.5, 12.9, 0.04, 0.42, 3.65, 4.62, M.sofa, 0.06, 'w'); RB(9.5, 12.9, 0.36, 0.9, 4.28, 4.66, M.sofa, 0.09);
  RB(9.32, 9.6, 0.04, 0.64, 3.62, 4.66, M.sofa, 0.08); RB(12.0, 12.95, 0.04, 0.42, 2.3, 3.7, M.sofa, 0.06, 'w');
  B(9.55, 12.9, 0, 0.05, 3.7, 4.6, M.black); B(12.05, 12.9, 0, 0.05, 2.35, 3.65, M.black);
  for (var cu = 0; cu < 4; cu++) { var cg = new THREE.Group(); RB(-0.36, 0.36, -0.24, 0.24, -0.1, 0.1, M.stripes, 0.07); var last = statics.pop(); last.g.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.22)); last.g.translate(9.95 + cu * 0.78, 0.68, 4.15); statics.push(last); }
  RB(9.6, 12.85, 0.4, 0.53, 3.68, 4.32, L(0x5c4a40), 0.05); RB(12.05, 12.9, 0.4, 0.53, 2.35, 3.72, L(0x5c4a40), 0.05);
  G(sph(0.12, 8, 6), L(0xc9a07a), 12.5, 0.55, 3.0); G(sph(0.09, 8, 6), L(0xe8c3c8), 10.2, 0.55, 3.9);   // plush toys
  // round trunk coffee table + plant
  G(cyl(0.42, 0.42, 0.08, 18), M.woodLight, 10.5, 0.45, 2.3); G(cyl(0.12, 0.16, 0.42, 10), M.woodTop, 10.5, 0.21, 2.3);
  blockCircle(10.5, 2.3, 0.4, 's');
  G(cyl(0.06, 0.05, 0.12, 10), M.offwhite, 10.5, 0.55, 2.3); for (var pk = 0; pk < 4; pk++) G(new THREE.ConeGeometry(0.02, 0.45, 4), M.plant, 10.5 + (pk - 1.5) * 0.03, 0.8, 2.3, 0, 0, (pk - 1.5) * 0.25);
  // kids play mat near the glass corner
  B(12.9, 15.4, 0, 0.012, 0.4, 2.4, M.playmat);
  // plants: crates with peace lilies + croton in clay pot
  function crate(x, z){
    B(x - 0.25, x + 0.25, 0.05, 0.45, z - 0.25, z + 0.25, M.white, 'w');
    for (var yy = 0.15; yy < 0.45; yy += 0.13) B(x - 0.26, x + 0.26, yy, yy + 0.02, z - 0.26, z + 0.26, M.cabinetLine);
    for (var lv = 0; lv < 10; lv++) { var aa = lv * 2.4; G(sph(0.16, 6, 4), lv % 2 ? M.plant : M.plantDark, x + Math.cos(aa) * 0.16, 0.65 + (lv % 3) * 0.12, z + Math.sin(aa) * 0.16, 0, aa, 0.8, 1); }
    G(new THREE.ConeGeometry(0.03, 0.12, 6), M.white, x, 0.95, z);
  }
  crate(6.3, 2.5); crate(14.9, 0.55);
  G(cyl(0.18, 0.13, 0.32, 12), M.terracotta, 5.4, 0.16, 0.6); for (var cr = 0; cr < 6; cr++) G(new THREE.ConeGeometry(0.06, 0.3, 4), cr % 2 ? L(0xc2702a) : L(0x7a8a2a), 5.4 + Math.cos(cr) * 0.08, 0.5, 0.6 + Math.sin(cr) * 0.08, 0.4 * Math.cos(cr), 0, 0.4 * Math.sin(cr));
  blockCircle(5.4, 0.6, 0.2);

  /* =========================================================
     OUTSIDE: veranda, lawn, deck, shed, trees
     ========================================================= */
  B(-30, 50, -0.12, -0.07, -40, 40, M.grass);
  B(-0.5, 16.5, -0.07, 0, -3.6, 0, M.floor);
  B(-0.5, 16.5, 2.95, 3.05, -3.8, 0, M.roof);
  [0.2, 4.2, 8.2, 12.2, 16.2].forEach(function(x){ B(x - 0.18, x + 0.18, 0, 2.95, -3.55, -3.2, M.brick); });
  for (var fx = 0.4; fx < 16; fx += 0.16) if (Math.abs(fx - 6.2) > 0.6) B(fx, fx + 0.08, 0, 0.85, -3.5, -3.47, M.picket);
  B(0.2, 16.2, 0.7, 0.76, -3.5, -3.45, M.picket); B(0.2, 16.2, 0.25, 0.31, -3.5, -3.45, M.picket);
  (function(){ // hammock between two columns
    var pos = [], idx = [], N = 16, x0 = 8.4, x1 = 12.0, z = -3.3;
    for (var i = 0; i <= N; i++) { var t = i / N, x = x0 + (x1 - x0) * t, y = 1.7 - Math.sin(t * Math.PI) * 1.1; pos.push(x, y, z - 0.45, x, y + 0.05, z + 0.45); }
    for (var j = 0; j < N; j++) { var a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(pos.length / 3 * 2).fill(0), 2));
    pushStatic(g, M.hammock);
  })();
  B(4.6, 5.2, 0, 0.35, -1.4, -0.9, M.tankBlue); B(4.62, 5.18, 0.1, 0.3, -0.89, -0.88, M.black);       // pet carrier
  G(cyl(0.1, 0.08, 0.05, 12), M.steel, 7.0, 0.03, -0.5);
  // deck (east) + low wooden bench wall
  B(16.0, 21.0, 0, 0.12, -1.0, 6.0, M.deck); B(20.6, 21.0, 0, 0.8, -1.0, 6.0, M.deck); B(16, 21, 0, 0.5, 5.8, 6.0, M.deck);
  // shed
  B(23, 29, 0, 2.6, -4, 2, M.shedWood);
  (function(){ var g = new THREE.BoxGeometry(6.6, 0.1, 3.6); G(g.clone(), M.roofRed, 26, 3.05, -2.6, 0.32, 0, 0); G(g, M.roofRed, 26, 3.05, 0.6, -0.32, 0, 0); })();
  B(24, 24.9, 0, 2.0, 2.0, 2.05, M.doorDark); B(26, 27.2, 1.1, 1.9, 2.0, 2.05, M.glass);
  // water tank on stilts
  G(cyl(0.9, 0.9, 1.2, 16), M.tankBlue, 19, 4.6, -8); for (var tk = 0; tk < 4; tk++) G(cyl(0.05, 0.05, 4, 6), M.steelDark, 19 + (tk % 2 ? 0.6 : -0.6), 2, -8 + (tk > 1 ? 0.6 : -0.6));
  // trees
  var trees = [[-6, -8], [-9, 2], [-7, 9], [-12, -3], [4, -12], [10, -14], [16, -11], [24, -10], [31, -5], [32, 5], [27, 9], [20, 14], [12, 16], [5, 15], [-2, 16], [-14, 12], [-15, -12], [36, -14], [8, -22], [-4, -20]];
  trees.forEach(function(t, i){
    var h = 2.5 + (i % 4) * 0.7;
    G(cyl(0.15, 0.22, h, 6), M.trunk, t[0], h / 2, t[1]);
    G(new THREE.IcosahedronGeometry(1.6 + (i % 3) * 0.4, 0), [M.leaf, M.leaf2, M.leaf3][i % 3], t[0], h + 0.9, t[1]);
    G(new THREE.IcosahedronGeometry(1.1 + (i % 2) * 0.3, 0), [M.leaf2, M.leaf3, M.leaf][i % 3], t[0] + 0.8, h + 0.2, t[1] - 0.5);
  });
  var sky = new THREE.Mesh(new THREE.SphereGeometry(80, 16, 10), new THREE.MeshBasicMaterial({ map: TEX.sky(), side: THREE.BackSide, fog: false }));
  sky.position.set(8, -10, 5); scene.add(sky);

  /* =========================================================
     HIDEABLE ITEMS (separate meshes)
     ========================================================= */
  // paper towel on its steel holder — bar top, living-side end
  (function(){
    var g = new THREE.Group();
    g.add(mesh(cyl(0.08, 0.08, 0.015, 14), M.steel, 0, 0.008, 0));
    g.add(mesh(cyl(0.006, 0.006, 0.32, 6), M.steel, 0, 0.16, 0));
    g.add(mesh(cyl(0.065, 0.065, 0.27, 16), M.white, 0, 0.15, 0));
    g.add(mesh(cyl(0.02, 0.02, 0.272, 8), L(0xc9b28f), 0, 0.15, 0));
    addItem('papel', 'o papel-toalha', g, 9.8, 1.13, 6.55);
  })();
  // TV (screen shows the game)
  var tvCanvas = document.createElement('canvas'); tvCanvas.width = 512; tvCanvas.height = 288;
  var tvTex = new THREE.CanvasTexture(tvCanvas);
  (function(){
    var g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(1.12, 0.66, 0.05), M.black, 0, 0, 0));
    var scr = mesh(new THREE.PlaneGeometry(1.08, 0.61), new THREE.MeshBasicMaterial({ map: tvTex }), 0, 0, 0.027); g.add(scr);
    addItem('tv', 'a TV', g, 10.45, 1.32, 0.4);
  })();
  // a special CD (standing on the TV shelf)
  (function(){
    var g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(0.14, 0.125, 0.012), L(0xe2c94a), 0, 0.0625, 0));
    g.add(mesh(new THREE.CircleGeometry(0.05, 18), L(0xd8dfe6), 0, 0.0625, 0.0065));
    g.add(mesh(new THREE.CircleGeometry(0.012, 10), L(0x888888), 0, 0.0625, 0.0068));
    addItem('cd', 'o CD do Hermeto', g, 10.95, 0.66, 0.58, -0.2);
  })();
  // Quest board game on the upper shelf
  (function(){
    var g = new THREE.Group();
    var mats = [L(0x2a6aa8), L(0x2a6aa8), L(0xe8c43a), L(0x2a6aa8), M.quest, M.quest];
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.11, 0.26), mats).translateY(0.055));
    addItem('quest', 'o jogo Quest', g, 10.5, 1.85, 0.5);
  })();
  // kettle on the island
  (function(){
    var g = new THREE.Group();
    g.add(mesh(lathe([[0, 0], [0.09, 0], [0.1, 0.05], [0.085, 0.2], [0.05, 0.23], [0, 0.235]], 18), M.steel, 0, 0, 0));
    g.add(mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 12, Math.PI), M.black, -0.1, 0.13, 0, 0, 0, -Math.PI / 2));
    g.add(mesh(cyl(0.012, 0.02, 0.1, 6), M.steel, 0.1, 0.15, 0, 0, 0, -0.9));
    g.add(mesh(cyl(0.1, 0.1, 0.02, 14), M.black, 0, 0.01, 0));
    addItem('chaleira', 'a chaleira', g, 8.2, 0.9, 7.35);
  })();
  // Keep Calm frame on the wood column
  (function(){
    var g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(0.06, 0.62, 0.32), M.black, 0, 0, 0));
    g.add(mesh(new THREE.PlaneGeometry(0.27, 0.56), M.keepcalm, 0.031, 0, 0, 0, Math.PI / 2, 0));
    addItem('quadro', 'o quadro "Keep Calm"', g, 10.74, 1.95, 9.7);
  })();
  // conical straw hat hanging on the column
  (function(){
    var g = new THREE.Group();
    g.add(mesh(new THREE.ConeGeometry(0.24, 0.12, 20, 1, true), L(0xd9c08a, {}), 0, 0, 0, 0, 0, Math.PI / 2));
    g.children[0].material.side = THREE.DoubleSide;
    addItem('chapeu', 'o chapéu de palha', g, 3.56, 2.55, 0.3);
  })();
  // black table fan on the dining table
  (function(){
    var g = new THREE.Group();
    g.add(mesh(cyl(0.1, 0.12, 0.03, 12), M.fanBlack, 0, 0.015, 0));
    g.add(mesh(cyl(0.015, 0.015, 0.3, 6), M.fanBlack, 0, 0.17, 0));
    g.add(mesh(cyl(0.16, 0.16, 0.08, 16, 1), M.fanBlack, 0, 0.42, 0, Math.PI / 2, 0, 0));
    g.add(mesh(cyl(0.05, 0.05, 0.1, 10), M.blackSoft, 0, 0.42, 0.06, Math.PI / 2, 0, 0));
    addItem('ventilador', 'o ventilador', g, TX + 0.55, 0.81, TZ + 0.45, 2.4);
  })();
  // black lantern on the hot-tub platform
  (function(){
    var g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(0.14, 0.02, 0.14), M.black, 0, 0.01, 0));
    g.add(mesh(new THREE.BoxGeometry(0.11, 0.16, 0.11), M.glassShelf, 0, 0.1, 0));
    g.add(mesh(new THREE.ConeGeometry(0.1, 0.1, 4), M.black, 0, 0.23, 0, 0, Math.PI / 4, 0));
    g.add(mesh(new THREE.TorusGeometry(0.03, 0.006, 4, 10), M.black, 0, 0.3, 0));
    g.add(mesh(cyl(0.02, 0.02, 0.06, 8), L(0xfff3d0, { emissive: 0x806020 }), 0, 0.06, 0));
    addItem('lanterna', 'a lanterna', g, 2.75, TP, 2.65);
  })();
  // TV remote on the coffee table
  (function(){
    var g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(0.05, 0.02, 0.18), M.blackSoft, 0, 0.01, 0));
    g.add(mesh(new THREE.BoxGeometry(0.012, 0.005, 0.012), M.red, 0, 0.022, -0.065));
    addItem('controle', 'o controle remoto', g, 10.35, 0.49, 2.25, 0.5);
  })();
  // wine bottle on the bar top
  (function(){
    var g = new THREE.Group();
    g.add(mesh(lathe([[0, 0], [0.04, 0], [0.04, 0.2], [0.015, 0.26], [0.013, 0.32], [0, 0.32]], 14), L(0x2d4a22), 0, 0, 0));
    g.add(mesh(cyl(0.041, 0.041, 0.08, 14), L(0xf0e6cc), 0, 0.1, 0));
    addItem('vinho', 'a garrafa de vinho', g, 6.0, 1.13, 6.6);
  })();
  // white sculpture in the lit niche
  (function(){
    var g = new THREE.Group();
    g.add(mesh(lathe([[0, 0], [0.07, 0], [0.05, 0.1], [0.035, 0.2], [0.07, 0.3], [0.05, 0.36], [0, 0.4]], 14), M.sculpt, 0, 0, 0));
    g.add(mesh(sph(0.05, 10, 8), M.sculpt, 0, 0.45, 0));
    addItem('escultura', 'a escultura branca', g, 4.1, 1.06, 7.95);
  })();
  // Marshal's food bowl near the glass doors
  (function(){
    var g = new THREE.Group();
    g.add(mesh(lathe([[0, 0], [0.1, 0], [0.12, 0.06], [0.11, 0.065], [0.09, 0.02], [0, 0.02]], 18), M.steel, 0, 0, 0));
    g.add(mesh(cyl(0.085, 0.085, 0.01, 12), L(0x8a5a2a), 0, 0.03, 0));
    addItem('tigela', 'a tigela do Marshal', g, 4.4, 0, 0.5);
  })();

  /* ---------------- soft contact shadows on the floor (fake ambient occlusion) ---------------- */
  (function(){
    var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d');
    g.filter = 'blur(14px)'; g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(30, 30, 68, 68);
    if (!('filter' in g) || g.filter === 'none') { var gr = g.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
    var tex = new THREE.CanvasTexture(c);
    var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color: 0x2a2018, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    var P = [], U = [], N = [], E = 0.22;
    shade.forEach(function(b){
      var ex = Math.min(E, (b.x1 - b.x0) * 0.5 + 0.1), ez = Math.min(E, (b.z1 - b.z0) * 0.5 + 0.1);
      var x0 = b.x0 - ex, x1 = b.x1 + ex, z0 = b.z0 - ez, z1 = b.z1 + ez, y = 0.004;
      P.push(x0, y, z0, x0, y, z1, x1, y, z1, x0, y, z0, x1, y, z1, x1, y, z0);
      U.push(0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1);
      for (var k = 0; k < 6; k++) N.push(0, 1, 0);
    });
    var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    var sm = new THREE.Mesh(geo, mat); sm.renderOrder = 1; scene.add(sm);
  })();

  /* ---------------- merge statics by material ---------------- */
  var byMat = {};
  statics.forEach(function(s){ (byMat[s.m.uuid] = byMat[s.m.uuid] || { m: s.m, list: [] }).list.push(s.g); });
  Object.keys(byMat).forEach(function(k){
    var e = byMat[k], total = 0, list = e.list.map(function(g){ g = g.index ? g.toNonIndexed() : g; total += g.attributes.position.count; return g; });
    var P = new Float32Array(total * 3), N = new Float32Array(total * 3), U = new Float32Array(total * 2), o = 0;
    list.forEach(function(g){
      var c = g.attributes.position.count;
      P.set(g.attributes.position.array, o * 3);
      if (g.attributes.normal) N.set(g.attributes.normal.array, o * 3);
      if (g.attributes.uv) U.set(g.attributes.uv.array, o * 2);
      o += c;
    });
    var mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.BufferAttribute(P, 3)); mg.setAttribute('normal', new THREE.BufferAttribute(N, 3)); mg.setAttribute('uv', new THREE.BufferAttribute(U, 2));
    mg.computeBoundingSphere();
    var mesh2 = new THREE.Mesh(mg, e.m); mesh2.matrixAutoUpdate = false;
    if (e.m.transparent) mesh2.renderOrder = 2;
    else { mesh2.castShadow = true; e.m.shadowSide = THREE.DoubleSide; }
    mesh2.receiveShadow = !e.m.isMeshBasicMaterial;
    scene.add(mesh2);
  });

  /* ---------------- search spots ---------------- */
  var spots = [
    { id: 'forno', name: 'no forno', x: 5.6, z: 8.5 },
    { id: 'geladeira', name: 'na geladeira', x: 5.75, z: 10.5 },
    { id: 'lavanderia', name: 'no tanque da lavanderia', x: 3.8, z: 9.8 },
    { id: 'adega', name: 'na adega, debaixo da escada', x: 4.6, z: 5.5 },
    { id: 'nichos', name: 'nos nichos da escada', x: 4.6, z: 7.4 },
    { id: 'banheira', name: 'na banheira', x: 3.6, z: 1.5 },
    { id: 'banheiro', name: 'no box do banheiro', x: 1.9, z: 9.2 },
    { id: 'lareira', name: 'na lareira', x: 9.2, z: 1.0 },
    { id: 'cds', name: 'na estante de CDs', x: 10.45, z: 1.05 },
    { id: 'sofa', name: 'debaixo do sofá', x: 11.2, z: 3.25 },
    { id: 'cristaleira', name: 'na cristaleira', x: 15.0, z: 5.65 },
    { id: 'mesa', name: 'debaixo da mesa de jantar', x: 13.6, z: 7.2 },
    { id: 'pia', name: 'na pia', x: 7.3, z: 9.8 },
    { id: 'fogao', name: 'no fogão', x: 7.55, z: 8.1 },
    { id: 'cooler', name: 'no cooler vermelho', x: 11.2, z: 8.1 },
    { id: 'tapete', name: 'no tapetinho das crianças', x: 14.0, z: 1.5 },
    { id: 'vaso', name: 'no vaso de planta', x: 6.3, z: 3.2 },
    { id: 'porta', name: 'perto da porta de entrada', x: 0.6, z: 4.6 },
    { id: 'banquetas', name: 'nas banquetas do bar', x: 7.4, z: 5.4 },
    { id: 'mesa_centro', name: 'na mesinha de centro', x: 10.5, z: 3.0 }
  ];

  return { walls: walls, soft: soft, items: items, spots: spots, tvCanvas: tvCanvas, tvTex: tvTex, M: M };
}
return { build: build };
})();
