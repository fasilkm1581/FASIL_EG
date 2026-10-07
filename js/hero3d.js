import * as THREE from 'three';

// Procedural 3D gold bar + dust, exposed to main.js through window.EG3D.
const canvas = document.getElementById('gl');
const state = { pose: 0, scroll: 0, mx: 0, my: 0 };
window.EG3D = state;

(function init() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.4, 9);

  // Studio-style environment drawn on a canvas -> PMREM, gives the metal something to reflect.
  const ec = document.createElement('canvas'); ec.width = 1024; ec.height = 512;
  const g = ec.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#fff3cf'); grd.addColorStop(.45, '#6b4c12'); grd.addColorStop(.55, '#1a1307'); grd.addColorStop(1, '#3a2a0a');
  g.fillStyle = grd; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = '#fff'; [[120, 90, 190, 70], [520, 60, 240, 50], [820, 120, 150, 90]].forEach(r => { g.globalAlpha = .95; g.fillRect(...r); });
  g.globalAlpha = .5; g.fillStyle = '#ffd98a'; g.fillRect(0, 300, 1024, 14);
  const envTex = new THREE.CanvasTexture(ec); envTex.mapping = THREE.EquirectangularReflectionMapping; envTex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(envTex).texture;

  // Gold bar: box with a narrower top (frustum), bevel-like look from shading.
  const W = 3.2, H = .8, D = 1.5, inset = .22;
  const geo = new THREE.BoxGeometry(W, H, D, 1, 1, 1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) > 0) { p.setX(i, p.getX(i) * (1 - inset * .9 / (W / 2) * 1)); p.setZ(i, p.getZ(i) * (1 - inset / (D / 2) * .8)); }
  }
  geo.computeVertexNormals();
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9a936, metalness: 1, roughness: .22, envMapIntensity: 1.4 });
  const bar = new THREE.Mesh(geo, gold);

  // Engraved label on the top face
  const lc = document.createElement('canvas'); lc.width = 1024; lc.height = 512;
  const l = lc.getContext('2d');
  l.fillStyle = '#000'; l.fillRect(0, 0, 1024, 512);
  l.fillStyle = '#fff'; l.textAlign = 'center';
  l.font = '600 96px "Cormorant Garamond", Georgia, serif'; l.fillText('EMIRATES GOLD', 512, 190);
  l.font = '500 54px Georgia, serif'; l.fillText('1 KILOBAR  ·  GOLD 999.9', 512, 280);
  l.font = '500 40px Georgia, serif'; l.fillText('REFINER & MINT · DUBAI', 512, 350);
  const lt = new THREE.CanvasTexture(lc);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(W * .72, D * .6),
    new THREE.MeshStandardMaterial({ color: 0x5a3f08, metalness: 1, roughness: .5, alphaMap: lt, transparent: true, envMapIntensity: .6 }));
  label.rotation.x = -Math.PI / 2; label.position.y = H / 2 + .004;
  bar.add(label);

  const group = new THREE.Group(); group.add(bar); scene.add(group);

  // Small satellite coins
  const coins = [];
  const cg = new THREE.CylinderGeometry(.42, .42, .07, 64);
  for (let i = 0; i < 5; i++) {
    const c = new THREE.Mesh(cg, gold);
    c.userData = { r: 3 + Math.random() * 1.8, a: Math.random() * 6.28, s: .15 + Math.random() * .25, y: (Math.random() - .5) * 2.4 };
    scene.add(c); coins.push(c);
  }

  // Gold dust
  const N = 900, pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 18; pos[i * 3 + 1] = (Math.random() - .5) * 10; pos[i * 3 + 2] = (Math.random() - .5) * 10; seed[i] = Math.random() * 100; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xf1d98a, size: .035, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  scene.add(new THREE.AmbientLight(0xffffff, .2));
  const key = new THREE.DirectionalLight(0xfff0c8, 2.2); key.position.set(4, 5, 5); scene.add(key);
  const rim = new THREE.PointLight(0xffb347, 30, 20); rim.position.set(-5, 1, -2); scene.add(rim);

  // Per-slide poses [rx, ry, rz, x, scale]
  const poses = [
    [.55, -.6, -.08, 1.7, 1], [.2, .9, .12, 1.8, 1.05], [.95, -.2, .25, 1.6, 1.12], [-.4, 1.8, -.2, 1.8, .95]
  ];
  const cur = { rx: .55, ry: -.6, rz: -.08, x: 1.7, s: 0 }; // s=0 -> intro grows in
  state.cur = cur; state.intro = 0;

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    state.narrow = w < 1000;
  }
  addEventListener('resize', resize); resize();

  let visible = true;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(canvas);
  const clock = new THREE.Clock();
  const lerp = (a, b, t) => a + (b - a) * t;

  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const t = clock.getElapsedTime();
    const tp = poses[state.pose];
    const k = .045;
    cur.rx = lerp(cur.rx, tp[0], k); cur.ry = lerp(cur.ry, tp[1] + state.scroll * 2.2, k); cur.rz = lerp(cur.rz, tp[2], k);
    const tx = state.narrow ? 0 : tp[3]; cur.x = lerp(cur.x, tx, k);
    cur.s = lerp(cur.s, tp[4] * state.intro * (state.narrow ? .62 : 1), .06);
    group.position.set(cur.x, (state.narrow ? 1.5 : 0) + Math.sin(t * .9) * .12 - state.scroll * 1.5, 0);
    group.rotation.set(cur.rx + state.my * .15, cur.ry + Math.sin(t * .35) * .12 + state.mx * .25, cur.rz);
    group.scale.setScalar(Math.max(cur.s, .0001));
    coins.forEach((c, i) => {
      const d = c.userData; d.a += d.s * .004;
      c.position.set(cur.x + Math.cos(d.a) * d.r * .7, d.y + Math.sin(t + i) * .2, Math.sin(d.a) * d.r * .5);
      c.rotation.set(t * .6 + i, t * .4, 0); c.scale.setScalar(Math.max(state.intro, .0001));
    });
    const a = pg.attributes.position.array;
    for (let i = 0; i < N; i++) { a[i * 3 + 1] += Math.sin(t * .4 + seed[i]) * .0015 + .0015; if (a[i * 3 + 1] > 5) a[i * 3 + 1] = -5; }
    pg.attributes.position.needsUpdate = true;
    dust.rotation.y = t * .02 + state.mx * .05;
    camera.position.x = lerp(camera.position.x, state.mx * .4, .05);
    camera.position.y = lerp(camera.position.y, .4 + state.my * .25, .05);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  });
})();
