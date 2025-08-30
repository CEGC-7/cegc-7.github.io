// Starport Forever — Cozy idle station core prototype
(() => {
  const el = (q) => document.querySelector(q);
  const elAll = (q) => Array.from(document.querySelectorAll(q));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = (n) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` :
                      n >= 1_000 ? `${(n / 1_000).toFixed(2)}k` :
                      Math.floor(n).toString());
  const now = () => Date.now();

  // Species and ship definitions
  const SPECIES = ["Organic", "Synthetic", "Aquatic", "Tourist"];
  const SHIP_TYPES = [
    { id: "shuttle", name: "Shuttle", baseFee: 10, baseTip: {Organic:6,Synthetic:5,Aquatic:7,Tourist:8}, service: 3.5 },
    { id: "freighter", name: "Freighter", baseFee: 30, baseTip: {Organic:8,Synthetic:7,Aquatic:9,Tourist:10}, service: 6.5 },
    { id: "cruiser", name: "Tourist Cruiser", baseFee: 18, baseTip: {Organic:7,Synthetic:6,Aquatic:8,Tourist:12}, service: 5.0 },
  ];

  // Module catalog
  const MODS = [
    {
      id: "extraDock",
      name: "Docking Arm",
      desc: "Adds a new dock to handle more ships.",
      baseCost: 50, costMult: 1.7, max: 6,
      effect: () => {}
    },
    {
      id: "fuelPump",
      name: "Fuel Pump",
      desc: "+5% ship turnaround speed per level.",
      baseCost: 25, costMult: 1.15, max: 50,
      effect: () => {}
    },
    {
      id: "cafe",
      name: "Alien Café",
      desc: "+10% tips from organic and aquatic species per level.",
      baseCost: 40, costMult: 1.2, max: 40,
      effect: () => {}
    },
    {
      id: "obsDome",
      name: "Observation Dome",
      desc: "+15% chance of tourist traffic per level; +6% traffic.",
      baseCost: 60, costMult: 1.22, max: 30,
      effect: () => {}
    },
    {
      id: "maintBay",
      name: "Maintenance Bay",
      desc: "+5% ship speed per level; reduces random slowdowns.",
      baseCost: 35, costMult: 1.18, max: 40,
      effect: () => {}
    },
    {
      id: "garden",
      name: "Hydro Garden",
      desc: "+10% tips (organic, aquatic). Synergy with Café.",
      baseCost: 45, costMult: 1.2, max: 40,
      effect: () => {}
    },
    {
      id: "neon",
      name: "Neon Signage",
      desc: "+5% tips (all). Attracts synthetic visitors.",
      baseCost: 30, costMult: 1.17, max: 50,
      effect: () => {}
    },
  ];

  // Game state
  const State = {
    version: 1,
    credits: 0,
    lifetimeCredits: 0,
    starCred: 0,
    modules: Object.fromEntries(MODS.map(m => [m.id, 0])),
    docksBusy: [],
    log: [],
    boosts: { traffic: 0, tips: 0, speed: 0 },
    events: [],
    sessionStart: now(),
    lastTick: now(),
    lastSave: now(),
    offlineGains: 0,
  };

  // Persistence
  function save() {
    State.lastSave = now();
    localStorage.setItem("starport_save", JSON.stringify(State));
    flashStatus("Saved.");
  }
  function load() {
    const raw = localStorage.getItem("starport_save");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data && data.version === State.version) {
        Object.assign(State, data);
        flashStatus("Save loaded.");
      } else if (data) {
        Object.assign(State, data); // simple forward-compat
        State.version = 1;
        flashStatus("Save loaded (migrated).");
      }
    } catch {}
  }
  function reset() {
    if (!confirm("Hard reset your station? This will erase local progress.")) return;
    localStorage.removeItem("starport_save");
    location.reload();
  }

  // UI rendering
  function renderHUD() {
    el("#credits").textContent = fmt(State.credits);
    el("#starCred").textContent = fmt(State.starCred);
    el("#lifetimeCredits").textContent = fmt(State.lifetimeCredits);
    el("#dockCount").textContent = docks();
    el("#trafficStat").textContent = `${trafficMult().toFixed(2)}x`;
    el("#speedStat").textContent = `${speedMult().toFixed(2)}x`;
    el("#tipsStat").textContent = `${tipsMultAll().toFixed(2)}x`;
    el("#offlineGains").textContent = fmt(State.offlineGains);
    el("#rebrandBtn").disabled = !canRebrand();
  }

  function renderStore() {
    const container = el("#storeList");
    container.innerHTML = "";
    for (const mod of MODS) {
      const lvl = level(mod.id);
      const price = modCost(mod.id);
      const afford = State.credits >= price;
      const div = document.createElement("div");
      div.className = "store-item";
      div.innerHTML = `
        <div class="info">
          <div class="name">${mod.name} <span class="meta">Lv ${lvl}${mod.max ? "/" + mod.max : ""}</span></div>
          <div class="desc">${mod.desc}</div>
          <div class="meta">${synergyText(mod.id)}</div>
        </div>
        <div class="price">
          <div class="meta">Cost: <strong>${fmt(price)}</strong></div>
          <button ${!afford || (mod.max && lvl >= mod.max) ? "disabled" : ""} data-buy="${mod.id}">
            Buy
          </button>
        </div>
      `;
      container.appendChild(div);
    }
    elAll('button[data-buy]').forEach(btn => {
      btn.onclick = () => buy(btn.getAttribute('data-buy'));
    });
  }

  function renderDocks() {
    const container = el("#dockList");
    container.innerHTML = "";
    const count = docks();
    ensureDockSlots(count);
    for (let i = 0; i < count; i++) {
      const d = State.docksBusy[i];
      const pct = d.busy ? clamp((1 - d.timeLeft / d.serviceTime) * 100, 0, 100) : 0;
      const div = document.createElement("div");
      div.className = "dock";
      div.innerHTML = `
        <div class="tag">Dock ${i+1}</div>
        <div class="progress"><div style="width:${pct.toFixed(1)}%"></div></div>
        <div class="ship">${d.busy ? `${d.ship.name} — ${d.species} (${d.timeLeft.toFixed(1)}s)` : "Idle"}</div>
      `;
      container.appendChild(div);
    }
  }

  function renderLog() {
    const ul = el("#log");
    ul.innerHTML = "";
    for (const item of State.log.slice(-50).reverse()) {
      const li = document.createElement("li");
      if (item.kind) li.classList.add(item.kind);
      li.textContent = item.text;
      ul.appendChild(li);
    }
  }

  function renderEventsBar() {
    const bar = el("#eventsBar");
    bar.innerHTML = "";
    for (const ev of State.events) {
      const span = document.createElement("span");
      span.className = "badge";
      span.textContent = `${ev.name} ${Math.ceil((ev.ends - now())/1000)}s`;
      bar.appendChild(span);
    }
  }

  function flashStatus(msg) {
    el("#statusLine").textContent = msg;
  }

  // Levels, costs, and effects
  function level(id) { return State.modules[id] || 0; }
  function modCost(id) {
    const m = MODS.find(x => x.id === id);
    const lvl = level(id);
    return Math.floor(m.baseCost * Math.pow(m.costMult, lvl));
  }
  function buy(id) {
    const price = modCost(id);
    if (State.credits < price) return;
    const m = MODS.find(x => x.id === id);
    const lvl = level(id);
    if (m.max && lvl >= m.max) return;
    State.credits -= price;
    State.modules[id] = lvl + 1;
    addLog(`Purchased ${m.name} (Lv ${lvl+1}).`, "good");
    // small flavor bump
    if (id === "cafe") addLog(`Café opens: today's special is Nebula Latte.`, "good");
    if (id === "garden") addLog(`Hydro Garden planted: oxygen smells crisp.`, "good");
    renderHUD(); renderStore(); renderDocks();
  }

  // Derived multipliers
  function docks() {
    return 1 + level("extraDock");
  }
  function speedMult() {
    const base = 1 + 0.05 * level("fuelPump") + 0.05 * level("maintBay");
    return base + State.boosts.speed;
  }
  function tipsMult(species) {
    let mult = 1 + 0.05 * level("neon");
    const cafe = level("cafe");
    const garden = level("garden");
    if (species === "Organic" || species === "Aquatic") {
      mult += 0.10 * cafe;
      mult += 0.10 * garden;
    }
    if (hasSynergyCafeGarden()) mult += 0.10; // synergy passive
    mult += State.boosts.tips;
    return mult;
  }
  function tipsMultAll() {
    // rough overall
    const avg = (SPECIES.reduce((acc, s) => acc + tipsMult(s), 0) / SPECIES.length);
    return avg;
  }
  function trafficMult() {
    let mult = 1 + 0.06 * level("obsDome");
    mult += 0.02 * level("neon");
    return mult + State.boosts.traffic;
  }

  // Species weights influenced by modules
  function speciesWeights() {
    let w = { Organic: 1, Synthetic: 1, Aquatic: 1, Tourist: 1 };
    w.Organic += 0.10 * level("cafe") + 0.06 * level("garden");
    w.Aquatic += 0.08 * level("garden");
    w.Synthetic += 0.10 * level("neon") + 0.04 * level("maintBay");
    w.Tourist += 0.15 * level("obsDome") + 0.05 * level("neon");
    // Normalize later
    return w;
  }

  function pickSpecies() {
    const w = speciesWeights();
    const entries = Object.entries(w);
    const sum = entries.reduce((a, [,v]) => a + v, 0);
    let r = Math.random() * sum;
    for (const [sp, val] of entries) {
      if ((r -= val) <= 0) return sp;
    }
    return "Organic";
  }

  function pickShipType(species) {
    // Slight bias: tourists more cruisers, synthetics more freighters
    const r = Math.random();
    if (species === "Tourist") {
      if (r < 0.65) return SHIP_TYPES[2]; // cruiser
      if (r < 0.85) return SHIP_TYPES[0]; // shuttle
      return SHIP_TYPES[1]; // freighter
    }
    if (species === "Synthetic") {
      if (r < 0.55) return SHIP_TYPES[1];
      if (r < 0.85) return SHIP_TYPES[0];
      return SHIP_TYPES[2];
    }
    // others: shuttles common
    if (r < 0.65) return SHIP_TYPES[0];
    if (r < 0.9) return SHIP_TYPES[2];
    return SHIP_TYPES[1];
  }

  // Synergies
  function hasSynergyCafeGarden() {
    return level("cafe") > 0 && level("garden") > 0;
  }
  function synergyText(id) {
    if (id === "cafe" || id === "garden") {
      return hasSynergyCafeGarden() ? "Synergy active: Botanical Brunch (+10% tips, bursts)" :
             "Synergy with Hydro Garden/Café for bursts of extra tips.";
    }
    if (id === "obsDome") return "Pairs with Neon to draw tourists.";
    if (id === "neon") return "Pairs with Observation Dome to draw tourists.";
    if (id === "maintBay") return "Reduces slowdown event effects.";
    return "";
  }

  // Events system
  function addEvent(name, durSec, apply, remove) {
    const ev = { name, ends: now() + durSec * 1000, apply, remove };
    if (apply) apply();
    State.events.push(ev);
    addLog(`${name} began!`, "good");
  }
  function updateEvents() {
    const t = now();
    for (let i = State.events.length - 1; i >= 0; i--) {
      const ev = State.events[i];
      if (t >= ev.ends) {
        if (ev.remove) ev.remove();
        State.events.splice(i, 1);
        addLog(`${ev.name} ended.`, "warn");
      }
    }
  }
  function maybeTriggerRandomEvent(dt) {
    // Small chance each minute of a comet boosting traffic
    if (Math.random() < dt * 0.00012) { // ~0.7% per minute
      addEvent("Comet Flyby", 30,
        () => State.boosts.traffic += 0.5,
        () => State.boosts.traffic -= 0.5
      );
    }
  }

  // Logging
  function addLog(text, kind = "") {
    State.log.push({ t: now(), text, kind });
    if (State.log.length > 500) State.log.shift();
    renderLog();
  }

  // Docks
  function ensureDockSlots(n) {
    while (State.docksBusy.length < n) {
      State.docksBusy.push({ busy: false, timeLeft: 0, serviceTime: 0, species: "", ship: null });
    }
    while (State.docksBusy.length > n) {
      State.docksBusy.pop();
    }
  }

  // Ship handling
  let spawnAccum = 0;
  function spawnInterval() {
    const base = 3.5; // seconds
    return base / trafficMult();
  }
  function serviceTimeFor(ship) {
    return Math.max(1.2, ship.service / speedMult());
  }
  function shipPayout(ship, species) {
    const fee = ship.baseFee;
    const tips = ship.baseTip[species] * tipsMult(species);
    const total = fee + tips;
    return total;
  }

  function trySpawnShip() {
    const freeIndex = State.docksBusy.findIndex(d => !d.busy);
    if (freeIndex === -1) return;
    const species = pickSpecies();
    const ship = pickShipType(species);
    const time = serviceTimeFor(ship);
    State.docksBusy[freeIndex] = {
      busy: true,
      timeLeft: time,
      serviceTime: time,
      species, ship
    };
  }

  function tick(dt) {
    // Events
    updateEvents();
    maybeTriggerRandomEvent(dt);

    // Spawning
    spawnAccum += dt;
    const sInt = spawnInterval();
    while (spawnAccum >= sInt) {
      trySpawnShip();
      spawnAccum -= sInt;
    }

    // Progress docks
    for (const d of State.docksBusy) {
      if (!d.busy) continue;
      // occasional slowdown mitigated by maintBay
      if (Math.random() < 0.0006 * dt * (1 - 0.02 * level("maintBay"))) {
        d.timeLeft += 0.5; // little hiccup
      }
      d.timeLeft -= dt;
      if (d.timeLeft <= 0) {
        // Finish service
        const payout = shipPayout(d.ship, d.species);
        State.credits += payout;
        State.lifetimeCredits += payout;
        addLog(`+${fmt(payout)} from ${d.ship.name} (${d.species}).`, "good");

        // Botanical Brunch burst
        if (hasSynergyCafeGarden() && (d.species === "Organic" || d.species === "Aquatic") && Math.random() < 0.05) {
          addEvent("Botanical Brunch", 20,
            () => State.boosts.tips += 0.20,
            () => State.boosts.tips -= 0.20
          );
        }

        d.busy = false;
        d.ship = null;
        d.species = "";
        d.timeLeft = 0;
      }
    }
  }

  // Offline progress approximation
  function applyOfflineProgress() {
    const elapsed = Math.max(0, Math.floor((now() - State.lastSave) / 1000));
    if (!elapsed) return;
    const cap = Math.min(elapsed, 8 * 3600); // cap 8h
    // Rough averages based on current multipliers
    const avgService = (SHIP_TYPES[0].service + SHIP_TYPES[1].service + SHIP_TYPES[2].service) / 3;
    const servicePerDock = Math.max(1.2, avgService / speedMult());
    const shipsPerDock = cap / (servicePerDock + spawnInterval());
    // Estimate average payout over species
    const weights = speciesWeights();
    const sumW = Object.values(weights).reduce((a,b)=>a+b,0);
    let avgPayout = 0;
    for (const sp of SPECIES) {
      const w = weights[sp] / sumW;
      const avgTips = SHIP_TYPES.reduce((a, s) => a + s.baseTip[sp], 0) / SHIP_TYPES.length;
      const avgFee = SHIP_TYPES.reduce((a, s) => a + s.baseFee, 0) / SHIP_TYPES.length;
      avgPayout += w * (avgFee + avgTips * tipsMult(sp));
    }
    const docksCount = docks();
    const estShips = Math.floor(shipsPerDock * docksCount * 0.9); // conservative
    const gains = Math.max(0, Math.floor(estShips * avgPayout));
    State.credits += gains;
    State.lifetimeCredits += gains;
    State.offlineGains = gains;
    addLog(`While you were away, your station earned ${fmt(gains)} credits.`, gains ? "good" : "");
  }

  // Prestige
  function canRebrand() {
    return State.lifetimeCredits >= 25_000;
  }
  function rebrand() {
    if (!canRebrand()) return;
    if (!confirm("Rebrand your station now for +1 Star Cred per 25,000 lifetime credits? This resets modules and credits.")) return;
    const gained = Math.floor(State.lifetimeCredits / 25_000) - State.starCred;
    State.starCred += Math.max(1, gained);
    // Reset soft progress
    State.credits = 0;
    State.modules = Object.fromEntries(MODS.map(m => [m.id, 0]));
    State.docksBusy = [];
    State.events = [];
    State.boosts = { traffic: 0, tips: 0, speed: 0 };
    addLog(`Rebrand complete! You earned ${State.starCred} Star Cred.`, "good");
    flashStatus("Fresh paint, fresh vibes. Growth will be faster now.");
    save();
    renderStore(); renderDocks(); renderHUD();
  }

  // Star Cred passive perks (simple global multipliers)
  function starCredMultipliers() {
    const sc = State.starCred;
    return {
      credits: 1 + 0.10 * sc,
      traffic: 1 + 0.03 * sc,
      speed: 1 + 0.03 * sc,
      tips: 1 + 0.05 * sc,
    };
  }

  // Apply Star Cred on read
  const _shipPayout = shipPayout;
  function shipPayout(ship, species) {
    const base = _shipPayout(ship, species);
    const m = starCredMultipliers();
    return base * m.credits;
  }
  const _trafficMult = trafficMult;
  function trafficMult() {
    const m = starCredMultipliers();
    return _trafficMult() * m.traffic;
   }

  const _speedMult = speedMult;
  function speedMult() {
    const m = starCredMultipliers();
    return _speedMult() * m.speed;
  }

  const _tipsMult = tipsMult;
  function tipsMult(species) {
    const m = starCredMultipliers();
    return _tipsMult(species) * m.tips;
  }

  // Session time formatting
  function fmtTime(totalSec) {
    const h = Math.floor(totalSec / 3600).toString().padStart(2, "0");
    const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, "0");
    const s = Math.floor(totalSec % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  // Main step loop
  function step() {
    const t = now();
    const dt = Math.min(0.25, (t - State.lastTick) / 1000); // cap dt to avoid huge jumps
    State.lastTick = t;

    tick(dt);
    renderDocks();
    renderHUD();
    renderEventsBar();
  }

  // Initialize UI and wire events
  function init() {
    load();
    applyOfflineProgress();

    ensureDockSlots(docks());
    renderStore();
    renderDocks();
    renderHUD();
    renderLog();

    addLog("Welcome aboard. Dock 1 smells like cinnamon rolls.", "good");

    // Buttons
    const saveBtn = el("#saveBtn");
    if (saveBtn) saveBtn.onclick = save;
    const resetBtn = el("#resetBtn");
    if (resetBtn) resetBtn.onclick = reset;
    const rebrandBtn = el("#rebrandBtn");
    if (rebrandBtn) rebrandBtn.onclick = rebrand;

    // Timers
    setInterval(step, 100);                 // core loop
    setInterval(save, 30_000);              // autosave
    setInterval(() => {                     // session timer
      el("#sessionTime").textContent = fmtTime((now() - State.sessionStart) / 1000);
    }, 1000);

    // Save on tab hide as a courtesy
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) save();
    });
    window.addEventListener("beforeunload", save);

    flashStatus("All systems nominal. Clear skies and friendly traffic.");
  }

  // Kick it off
  init();
})();
