const { getTable } = require('./shared');

// Every tunable that affects difficulty. `def` must match CFG in index.html.
// The master slider maps 0 → easy, 50 → def, 100 → hard for every parameter.
const PARAMS = [
  { key: 'spawnBase',         label: 'Fiender ved start',            unit: '/s',  step: 0.05,   easy: 0.6,   def: 1.1,    hard: 1.8,   help: 'Hvor mange fiender som kommer per sekund helt i starten.' },
  { key: 'spawnGrowth',       label: 'Økning i antall fiender',      unit: '',    step: 0.0001, easy: 0.001, def: 0.0022, hard: 0.0045, help: 'Hvor fort antall fiender øker over tid.' },
  { key: 'enemySpeedBase',    label: 'Fiendefart ved start',         unit: 'u/s', step: 0.5,    easy: 16,    def: 24,     hard: 34,    help: 'Hvor fort fiendene beveger seg i starten.' },
  { key: 'speedDoubleTime',   label: 'Sekunder til dobbel fart',     unit: 's',   step: 1,      easy: 75,    def: 48,     hard: 28,    help: 'Etter så mange sekunder går fiendene dobbelt så fort.' },
  { key: 'playerMaxSpeed',    label: 'Spillerens maksfart',          unit: 'u/s', step: 1,      easy: 95,    def: 70,     hard: 52,    help: 'Hvor fort ballen kan følge musen.' },
  { key: 'hitboxForgiveness', label: 'Hitbox-størrelse',             unit: '%',   step: 0.01,   easy: 0.6,   def: 0.75,   hard: 0.92,  help: 'Hvor stor del av kulene som teller som treff.' },
  { key: 'aimedShare',        label: 'Andel som sikter på deg',      unit: '%',   step: 0.01,   easy: 0.4,   def: 0.65,   hard: 0.9,   help: 'Resten krysser skjermen tilfeldig.' },
  { key: 'aimSpread',         label: 'Unøyaktighet i siktingen',     unit: 'rad', step: 0.01,   easy: 0.6,   def: 0.35,   hard: 0.15,  help: 'Høyere tall betyr at de bommer mer.' },
  { key: 'graceTime',         label: 'Pause før første fiende',      unit: 's',   step: 0.1,    easy: 3,     def: 1.5,    hard: 0.5,   help: '' },
  { key: 'dartsFrom',         label: 'Raske piler starter etter',    unit: 's',   step: 1,      easy: 35,    def: 20,     hard: 8,     help: 'De gule, raske kulene.' },
  { key: 'dartChance',        label: 'Andel raske piler',            unit: '%',   step: 0.01,   easy: 0.06,  def: 0.15,   hard: 0.28,  help: '' },
  { key: 'burstsFrom',        label: 'Vifte-angrep starter etter',   unit: 's',   step: 1,      easy: 55,    def: 35,     hard: 15,    help: 'De rosa vifte-angrepene med 5 kuler.' },
  { key: 'burstEvery',        label: 'Tid mellom vifte-angrep',      unit: 's',   step: 0.5,    easy: 10,    def: 6,      hard: 3.5,   help: '' },
];

const DEFAULT_MASTER = 50;

// keep only known keys, clamped to the easy..hard range
function cleanValues(input) {
  const values = {};
  for (const p of PARAMS) {
    const v = Number(input && input[p.key]);
    const lo = Math.min(p.easy, p.hard), hi = Math.max(p.easy, p.hard);
    values[p.key] = Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : p.def;
  }
  return values;
}

async function readSettings() {
  const table = await getTable('settings');
  try {
    const row = await table.getEntity('config', 'difficulty');
    return { master: row.master >= 0 ? row.master : null, values: cleanValues(JSON.parse(row.values)) };
  } catch (e) {
    if (e.statusCode !== 404) throw e;
    return { master: DEFAULT_MASTER, values: cleanValues({}) };
  }
}

// master is 0..100, or null when the individual sliders have been tuned by hand (stored as -1)
async function writeSettings(master, values) {
  const table = await getTable('settings');
  const clean = { master: master === null ? null : Math.min(100, Math.max(0, Number(master) || 0)), values: cleanValues(values) };
  await table.upsertEntity({ partitionKey: 'config', rowKey: 'difficulty', master: clean.master === null ? -1 : clean.master, values: JSON.stringify(clean.values) }, 'Replace');
  return clean;
}

module.exports = { PARAMS, readSettings, writeSettings };
