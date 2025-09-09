/* Starport Forever — minimal idle loop with offline progress + save */
const TICK_MS = 1000 / 10; // 10 ticks/sec
const AUTOSAVE_MS = 15000;

const S = {
  time: { cycle: 1, day: 1, lastTs: Date.now() },
  res: { credits: 100, ore: 0, organics: 0, data: 0 },
  buildings: { crane: { count: 0, baseRate: 0.05, mult: 1 } },
  flags: { craneMotorUpg: false },
  stability: 1.0
};

function save() {
  localStorage.setItem('starport_save', JSON.stringify({ S, savedAt: Date.now() }));
}

function load() {
  const raw = localStorage.getItem('starport_save');
  if (!raw) return;
  try {
    const obj = JSON.parse(raw);
    Object.assign(S, obj.S);
    offlineProgress(obj.savedAt || Date.now());
  } catch (e) {
    console.warn('Save load failed', e);
  }
}

function offlineProgress(thenTs) {
  const now = Date.now();
  const dt = Math.max(0, now - thenTs);
  const ticks = Math.floor(dt / TICK_MS);
  const oreGain = ticks * buildingOrePerTick();
  S.res.ore += oreGain;
  // Award a tiny Credits trickle for idle operations
  S.res.credits += Math.floor(oreGain * 0.1);
}

function buildingOrePerTick() {
  const { count, baseRate, mult } = S.buildings.crane;
  const stabilityFactor = 0.8 + 0.4 * S.stability; // 0.8–1.2
  return count * baseRate * mult * stabilityFactor;
}

let tickAccum = 0;
function tick(dt) {
  // Production
  const ore = buildingOrePerTick();
  S.res.ore += ore;

  // Timekeeping (simple day counter per real-time minute)
  tickAccum += dt;
  if (tickAccum >= 60000) {
    tickAccum = 0;
    S.time.day++;
    if (S.time.day % 7 === 0) randomEvent();
  }

  render();
}

function randomEvent() {
  // Minimal: 50/50 good/bad
  if (Math.random() < 0.5) {
    S.stability = Math.min(1.2, S.stability + 0.05);
    toast('Solar tailwind: +Stability');
  } else {
    S.stability = Math.max(0.6, S.stability - 0.05);
    toast('Cargo jam: -Stability');
  }
}

function buyCrane() {
  if (S.res.credits >= 100) {
    S.res.credits -= 100;
    S.buildings.crane.count++;
    render();
  }
}

function upgradeCraneMotor() {
  if (S.flags.craneMotorUpg) return;
  if (S.res.credits >= 250) {
    S.res.credits -= 250;
    S.flags.craneMotorUpg = true;
    S.buildings.crane.mult *= 1.5;
    toast('Crane motors upgraded!');
    render();
  }
}

function toast(msg) {
  // Simple footer log for now
  console.log('[Starport]', msg);
}

function bindUI() {
  document.getElementById('buy-crane').addEventListener('click', buyCrane);
  document.getElementById('upg-crane-motor').addEventListener('click', upgradeCraneMotor);
  document.getElementById('btnManualUnload').addEventListener('click', () => {
    S.res.ore += 1;
    S.res.credits += 1;
    toast('Manual unload: +1 Ore, +1 Credits');
    render();
  });
  document.getElementById('btnSave').addEventListener('click', () => { save(); toast('Saved'); });
  document.getElementById('btnWipe').addEventListener('click', () => { localStorage.removeItem('starport_save'); location.reload(); });
}

function render() {
  const $ = (id) => document.getElementById(id);
  $('r-credits').textContent = Math.floor(S.res.credits);
  $('r-ore').textContent = Math.floor(S.res.ore);
  $('r-organics').textContent = Math.floor(S.res.organics);
  $('r-data').textContent = Math.floor(S.res.data);
  $('b-crane-count').textContent = S.buildings.crane.count;
  $('b-crane-rate').textContent = buildingOrePerTick().toFixed(2);
  $('stability').textContent = `Stability: ${(S.stability * 100).toFixed(0)}%`;

  // Button states
  document.getElementById('buy-crane').disabled = S.res.credits < 100;
  const upgBtn = document.getElementById('upg-crane-motor');
  upgBtn.disabled = S.flags.craneMotorUpg || S.res.credits < 250;
  upgBtn.textContent = S.flags.craneMotorUpg ? 'Crane Motors: Upgraded' : 'Upgrade Crane Motors (+50% rate) — 250 Credits';

  // Flavor dock queue
  const q = [];
  const ships = Math.min(5, 1 + Math.floor(S.time.day % 5));
  for (let i = 0; i < ships; i++) q.push(`• Freighter ${100 + i} — ETA ${i}m`);
  document.getElementById('dockQueue').textContent = q.join('\n');
}

(function main() {
  load();
  bindUI();
  render();
  let last = performance.now();
  setInterval(() => {
    const now = performance.now();
    const dt = now - last; last = now;
    tick(dt);
  }, TICK_MS);
  setInterval(save, AUTOSAVE_MS);
})();
