// Starport Forever — Cozy idle station core prototype
(() => {
  const el = (q) => document.querySelector(q);
  const elAll = (q) => Array.from(document.querySelectorAll(q));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = (n) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000     ? `${(n / 1_000).toFixed(2)}k`
    : Math.floor(n).toString();
  const now = () => Date.now();

  // ─── Species & Ships ──────────────────────────────────────────────────────────
  const SPECIES = ["Organic", "Synthetic", "Aquatic", "Tourist"];
  const SHIP_TYPES = [
    {
      id: "shuttle",
      name: "Shuttle",
      baseFee: 10,
      baseTip: { Organic: 6, Synthetic: 5, Aquatic: 7, Tourist: 8 },
      service: 3.5
    },
    {
      id: "freighter",
      name: "Freighter",
      baseFee: 30,
      baseTip: { Organic: 8, Synthetic: 7, Aquatic: 9, Tourist: 10 },
      service: 6.5
    },
    {
      id: "cruiser",
      name: "Tourist Cruiser",
      baseFee: 18,
      baseTip: { Organic: 7, Synthetic: 6, Aquatic: 8, Tourist: 12 },
      service: 5.0
    }
  ];

  // ─── Modules Catalog ─────────────────────────────────────────────────────────
  const MODS = [
    {
      id: "extraDock",
      name: "Docking Arm",
      desc: "Adds a new dock to handle more ships.",
      baseCost: 50, costMult: 1.7, max: 6
    },
    {
      id: "fuelPump",
      name: "Fuel Pump",
      desc: "+5% ship turnaround speed per level.",
      baseCost: 25, costMult: 1.15, max: 50
    },
    {
      id: "cafe",
      name: "Alien Café",
      desc: "+10% tips from organic and aquatic species per level.",
      baseCost: 40, costMult: 1.2, max: 40
    },
    {
      id: "obsDome",
      name: "Observation Dome",
      desc: "+6% traffic and +15% tourist chance per level.",
      baseCost: 60, costMult: 1.22, max: 30
    },
    {
      id: "maintBay",
      name: "Maintenance Bay",
      desc: "+5% ship speed per level; reduces random slowdowns.",
      baseCost: 35, costMult: 1.18, max: 40
    },
    {
      id: "garden",
      name: "Hydro Garden",
      desc: "+10% tips (organic & aquatic). Synergy with Café.",
      baseCost: 45, costMult: 1.2, max: 40
    },
    {
      id: "neon",
      name: "Neon Signage",
      desc: "+5% tips (all). Attracts synthetic visitors.",
      baseCost: 30, costMult: 1.17, max: 50
    }
  ];

  // ─── Game State ──────────────────────────────────────────────────────────────
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
    offlineGains: 0
  };

  // ─── Persistence ──────────────────────────────────────────────────────────────
  function save() {
    State.lastSave = now();
    localStorage.setItem("starport_save", JSON.stringify(State));
    flashStatus("Game Saved.");
  }

  function load() {
    const raw = localStorage.getItem("starport_save");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      Object.assign(State, data);
      flashStatus("Save Loaded.");
    } catch {
      console.warn("Failed to load save.");
    }
  }

  function reset() {
    if (!confirm("Hard reset? All progress will be lost.")) return;
    localStorage.removeItem("starport_save");
    location.reload();
  }

  // ─── Rendering ───────────────────────────────────────────────────────────────
  function renderHUD() {
    el("#credits").textContent       = fmt(State.credits);
    el("#starCred").textContent      = fmt(State.starCred);
    el("#lifetimeCredits").textContent = fmt(State.lifetimeCredits);
    el("#dockCount").textContent     = docks();
    el("#trafficStat").textContent   = `${trafficMult().toFixed(2)}x`;
    el("#speedStat").textContent     = `${speedMult().toFixed(2)}x`;
    el("#tipsStat").textContent      = `${tipsMultAll().toFixed(2)}x`;
    el("#offlineGains").textContent  = fmt(State.offlineGains);
    el("#rebrandBtn").disabled       = !canRebrand();
  }

  function renderStore() {
    const container = el("#storeList");
    container.innerHTML = "";
    for (const mod of MODS) {
      const lvl    = State.modules[mod.id];
      const price  = Math.floor(mod.baseCost * Math.pow(mod.costMult, lvl));
      const afford = State.credits >= price;
      const div = document.createElement("div");
      div.className = "store-item";
      div.innerHTML = `
        <div class="info">
          <div class="name">${mod.name} <span class="meta">Lv ${lvl}${mod.max?"/"+mod.max:""}</span></div>
          <div class="desc">${mod.desc}</div>
          <div class="meta">${synergyText(mod.id)}</div>
        </div>
        <div class="price">
          <div class="meta">Cost: <strong>${fmt(price)}</strong></div>
          <button ${!afford|| (mod.max&&lvl>=mod.max)?"disabled":""} data-buy="${mod.id}">Buy</button>
        </div>`;
      container.append(div);
    }
    elAll('[data-buy]').forEach(btn => {
      btn.onclick = () => buy(btn.getAttribute("data-buy"));
    });
  }

  function renderDocks() {
    const container = el("#dockList");
    container.innerHTML = "";
    ensureDockSlots(docks());
    for (let i = 0; i < State.docksBusy.length; i++) {
      const d   = State.docksBusy[i];
      const pct = d.busy ? clamp((1 - d.timeLeft / d.serviceTime) * 100, 0, 100) : 0;
      const div = document.createElement("div");
      div.className = "dock";
      div.innerHTML = `
        <div class="tag">Dock ${i+1}</div>
        <div class="progress"><div style="width:${pct.toFixed(1)}%"></div></div>
        <div class="ship">${d.busy?`${d.ship.name} — ${d.species} (${d.timeLeft.toFixed(1)}s)`:"Idle"}</div>`;
      container.append(div);
    }
  }

  function renderLog() {
    const ul = el("#log");
    ul.innerHTML = "";
    State.log.slice(-50).reverse().forEach(item => {
      const li = document.createElement("li");
      if (item.kind) li.classList.add(item.kind);
      li.textContent = item.text;
      ul.append(li);
    });
  }

  function renderEventsBar() {
    const bar = el("#eventsBar");
    bar.innerHTML = "";
    State.events.forEach(ev => {
      const span = document.createElement("span");
      span.className = "badge";
      span.textContent = `${ev.name} ${Math.ceil((ev.ends - now())/1000)}s`;
      bar.append(span);
    });
  }

  function flashStatus(msg) {
    el("#statusLine").textContent = msg;
  }

  // ─── Module Purchases ────────────────────────────────────────────────────────
  function buy(id) {
    const lvl   = State.modules[id];
    const mod   = MODS.find(m => m.id === id);
    const price = Math.floor(mod.baseCost * Math.pow(mod.costMult, lvl));
    if (State.credits < price) return;
    State.credits -= price;
    State.modules[id]++;
    addLog(`Purchased ${mod.name} (Lv ${lvl+1}).`, "good");
    if (id === "cafe")   addLog("Café brews Nebula Latte!", "good");
    if (id === "garden") addLog("Hydro Garden smells fresh!", "good");
    renderHUD(); renderStore(); renderDocks();
  }

  // ─── Core Multipliers & Effects ─────────────────────────────────────────────
  function level(id) { return State.modules[id] || 0; }

  // Star Cred permanent perks
  function starCredMultipliers() {
    const sc = State.starCred;
    return {
      credits: 1 + 0.10 * sc,
      traffic: 1 + 0.03 * sc,
      speed:   1 + 0.03 * sc,
      tips:    1 + 0.05 * sc
    };
  }

  // Traffic multiplier
  function trafficMult() {
    const base = 1
      + 0.06 * level("obsDome")
      + 0.02 * level("neon")
      + State.boosts.traffic;
    return base * starCredMultipliers().traffic;
  }

  // Speed multiplier
  function speedMult() {
    const base = 1
      + 0.05 * level("fuelPump")
      + 0.05 * level("maintBay")
      + State.boosts.speed;
    return base * starCredMultipliers().speed;
  }

  // Tips multiplier per species
  function tipsMult(species) {
    let base = 1
      + 0.05 * level("neon")
      + State.boosts.tips;

    if (species === "Organic" || species === "Aquatic") {
      base += 0.10 * level("cafe")
           + 0.10 * level("garden");
      if (level("cafe") > 0 && level("garden") > 0) {
        base += 0.10; // Botanical Brunch synergy
      }
    }
    return base * starCredMultipliers().tips;
  }

  // Rough average across all species
  function tipsMultAll() {
    return SPECIES.reduce((sum, sp) => sum + tipsMult(sp), 0) / SPECIES.length;
  }

  // ─── Species & Ship Selection ────────────────────────────────────────────────
  function speciesWeights() {
    return {
      Organic:   1 + 0.10*level("cafe")   + 0.06*level("garden"),
      Aquatic:   1 + 0.08*level("garden"),
      Synthetic: 1 + 0.10*level("neon")   + 0.04*level("maintBay"),
      Tourist:   1 + 0.15*level("obsDome") + 0.05*level("neon")
    };
  }

  function pickSpecies() {
    const w = speciesWeights();
    const entries = Object.entries(w);
    const sum = entries.reduce((a,[,v]) => a+v, 0);
    let r = Math.random()*sum;
    for (const [sp,val] of entries) {
      if ((r -= val) <= 0) return sp;
    }
    return "Organic";
  }

  function pickShipType(species) {
    const r = Math.random();
    if (species === "Tourist") {
      if (r < 0.65) return SHIP_TYPES[2];
      if (r < 0.85) return SHIP_TYPES[0];
      return SHIP_TYPES[1];
    }
    if (species === "Synthetic") {
      if (r < 0.55) return SHIP_TYPES[1];
      if (r < 0.85) return SHIP_TYPES[0];
      return SHIP_TYPES[2];
    }
    if (r < 0.65) return SHIP_TYPES[0];
    if (r < 0.90) return SHIP_TYPES[2];
    return SHIP_TYPES[1];
  }

  // ─── Synergies ───────────────────────────────────────────────────────────────
  function synergyText(id) {
    if (id === "cafe" || id === "garden") {
      return level("cafe") > 0 && level("garden") > 0
        ? "Synergy: Botanical Brunch active!"
        : "Pair Café + Garden for Brunch bursts.";
    }
    if (id === "obsDome") return "Pairs with Neon to draw more tourists.";
    if (id === "neon")   return "Pairs with Dome to draw tourists.";
    if (id === "maintBay") return "Reduces slowdown event effects.";
    return "";
  }

  // ─── Events System ──────────────────────────────────────────────────────────
  function addEvent(name, dur, apply, remove) {
    const ev = { name, ends: now() + dur*1000, apply, remove };
    if (apply) apply();
    State.events.push(ev);
    addLog(`${name} began!`, "good");
  }

  function updateEvents() {
    const t = now();
    for (let i = State.events.length-1; i >= 0; i--) {
      const ev = State.events[i];
      if (t >= ev.ends) {
        if (ev.remove) ev.remove();
        State.events.splice(i,1);
        addLog(`${ev.name} ended.`, "warn");
      }
    }
  }

  function maybeTriggerRandomEvent(dt) {
    if (Math.random() < dt * 0.00012) {
      addEvent("Comet Flyby", 30,
        () => State.boosts.traffic += 0.5,
        () => State.boosts.traffic -= 0.5
      );
    }
  }

  // ─── Logging ────────────────────────────────────────────────────────────────
  function addLog(text, kind="") {
    State.log.push({ t: now(), text, kind });
    if (State.log.length > 500) State.log.shift();
    renderLog();
  }

  // ─── Docks Management ────────────────────────────────────────────────────────
  function ensureDockSlots(n) {
    while (State.docksBusy.length < n) {
      State.docksBusy.push({ busy:false, timeLeft:0, serviceTime:0, species:"", ship:null });
    }
    while (State.docksBusy.length > n) {
      State.docksBusy.pop();
    }
  }

  let spawnAccum = 0;
  function spawnInterval() {
    return 3.5 / trafficMult(); // base spawn every 3.5s adjusted by traffic
  }

  function serviceTimeFor(ship) {
    return Math.max(1.2, ship.service / speedMult());
  }

  function shipPayout(ship, species) {
    const fee  = ship.baseFee;
    const tip  = ship.baseTip[species] * tipsMult(species);
    return fee + tip;
  }

  function trySpawnShip() {
    const idx = State.docksBusy.findIndex(d => !d.busy);
    if (idx < 0) return;
    const species = pickSpecies();
    const ship    = pickShipType(species);
    const time    = serviceTimeFor(ship);
    State.docksBusy[idx] = { busy:true, timeLeft:time, serviceTime:time, species, ship };
  }

  // ─── Tick Loop ───────────────────────────────────────────────────────────────
  function tick(dt) {
    updateEvents();
    maybeTriggerRandomEvent(dt);

    spawnAccum += dt;
    const interval = spawnInterval();
    while (spawnAccum >= interval) {
      trySpawnShip();
      spawnAccum -= interval;
    }

    for (const d of State.docksBusy) {
      if (!d.busy) continue;
      // random hiccup
      if (Math.random() < 0.0006 * dt * (1 - 0.02 * level("maintBay"))) {
        d.timeLeft += 0.5;
      }
      d.timeLeft -= dt;
      if (d.timeLeft <= 0) {
        const payout = shipPayout(d.ship, d.species);
        State.credits += payout;
        State.lifetimeCredits += payout;
        addLog(`+${fmt(payout)} from ${d.ship.name} (${d.species}).`, "good");

        // Botanical Brunch burst chance
        if (
          (d.species === "Organic" || d.species === "Aquatic") &&
          level("cafe") > 0 && level("garden") > 0 &&
          Math.random() < 0.05
        ) {
          addEvent("Botanical Brunch", 20,
            () => State.boosts.tips += 0.20,
            () => State.boosts.tips -= 0.20
          );
        }

        d.busy = false;
      }
    }
  }

  // ─── Offline Progress ────────────────────────────────────────────────────────
  function applyOfflineProgress() {
    const elapsed = Math.max(0, Math.floor((now() - State.lastSave) / 1000));
    if (!elapsed) return;
    const cap   = Math.min(elapsed, 8*3600);
    const avgService = (SHIP_TYPES[0].service + SHIP_TYPES[1].service + SHIP_TYPES[2].service) / 3;
    const spdMult    = speedMult();
    const perDockSec = Math.max(1.2, avgService / spdMult) + spawnInterval();
    const shipsEach  = cap / perDockSec;
    const weights    = speciesWeights();
    const sumW       = Object.values(weights).reduce((a,b)=>a+b,0);

    let avgP = 0;
    for (const sp of SPECIES) {
      const w = weights[sp] / sumW;
      const avgTip  = SHIP_TYPES.reduce((a,s)=>a + s.baseTip[sp], 0) / SHIP_TYPES.length;
      const avgFee  = SHIP_TYPES.reduce((a,s)=>a + s.baseFee, 0) / SHIP_TYPES.length;
      avgP += w * (avgFee + avgTip * tipsMult(sp));
    }

    const totalShips = Math.floor(shipsEach * docks() * 0.9);
    const gains = Math.floor(totalShips * avgP);
    State.credits += gains;
    State.lifetimeCredits += gains;
    State.offlineGains = gains;
    addLog(`While you were away, you earned ${fmt(gains)} credits.`, gains ? "good" : "");
  }

  // ─── Prestige / Rebrand ─────────────────────────────────────────────────────
  function canRebrand() {
    return State.lifetimeCredits >= 25_000;
  }

  function rebrand() {
    if (!canRebrand()) return;
    if (!confirm("Rebrand for +1 Star Cred per 25,000 lifetime credits?")) return;
    const earned = Math.floor(State.lifetimeCredits / 25_000) - State.starCred;
    State.starCred += Math.max(1, earned);
    // reset soft
    State.credits      = 0;
    State.modules      = Object.fromEntries(MODS.map(m => [m.id, 0]));
    State.docksBusy    = [];
    State.events       = [];
    State.boosts       = { traffic:0, tips:0, speed:0 };
    addLog(`Rebrand complete! Star Cred: ${State.starCred}`, "good");
    flashStatus("Station rebranded! Growth is faster now.");
    save();
    renderStore(); renderDocks(); renderHUD();
  }

  // ─── Session Timer ──────────────────────────────────────────────────────────
  function fmtTime(sec) {
    const h = Math.floor(sec/3600).toString().padStart(2,"0");
    const m = Math.floor((sec%3600)/60).toString().padStart(2,"0");
    const s = Math.floor(sec%60).toString().padStart(2,"0");
    return `${h}:${m}:${s}`;
  }

  // ─── Main Loop & Init ───────────────────────────────────────────────────────
  function step() {
    const t  = now();
    const dt = Math.min(0.25, (t - State.lastTick)/1000);
    State.lastTick = t;
    tick(dt);
    renderDocks();
    renderHUD();
    renderEventsBar();
  }

  function init() {
    load();
    applyOfflineProgress();

    ensureDockSlots(docks());
    renderStore();
    renderDocks();
    renderHUD();
    renderLog();
    addLog("Welcome aboard. Dock 1 smells like cinnamon rolls.", "good");

    el("#saveBtn").onclick       = save;
    el("#resetBtn").onclick      = reset;
    el("#rebrandBtn").onclick    = rebrand;

    setInterval(step, 100);
    setInterval(save, 30_000);
    setInterval(() => {
      el("#sessionTime").textContent =
        fmtTime((now() - State.sessionStart)/1000);
    }, 1000);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) save();
    });
    window.addEventListener("beforeunload", save);

    flashStatus("All systems nominal. Enjoy your station!");
  }

  init();

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function docks() {
    return 1 + (State.modules.extraDock || 0);
  }
})();
