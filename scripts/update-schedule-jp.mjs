#!/usr/bin/env node
// Refresh the public JP-server career calendar snapshot from GameTora-derived UmaTools data.
// Uses only Node.js built-ins. The public source is third-party fan data, not an official API.
import { readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();
const PREFIX = 'https://raw.githubusercontent.com/daftuyda/UmaTools/main/public/assets/';
const norm = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const source = {
  characters: PREFIX + 'uma_data.json',
  races: PREFIX + 'races.json',
};
async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw Error('Upstream HTTP ' + response.status + ' ' + url);
  return response.json();
}
const [rawCharacters, rawRaces] = await Promise.all([
  fetchJson(source.characters),
  fetchJson(source.races),
]);
if (!Array.isArray(rawCharacters) || rawCharacters.length < 240 ||
    !Array.isArray(rawRaces) || rawRaces.length < 300) {
  throw Error('Upstream data unexpectedly small or malformed; leaving existing snapshot intact.');
}
const supports = JSON.parse(await readFile(join(ROOT, 'data/support_cards.json'), 'utf8'));
const characterKorean = JSON.parse(await readFile(join(ROOT, 'data/character_ko_names.json'), 'utf8')).characters;
const raceKorean = JSON.parse(await readFile(join(ROOT, 'data/race_ko_names.json'), 'utf8')).names;
const extraKorean = {
  'Satono Crown':'사토노 크라운','Furioso':'후리오소',
  'Loves Only You':'러브즈 온리 유','Believe':'빌리브',
  'Epiphaneia':'에피파네이아','Phalaenopsis':'팔레놉시스',
  'Rose Kingdom':'로즈 킹덤',
};

const names = new Map();
for (const s of supports) {
  const key = norm((s.urlName || '').replace(/^\d+-/, ''));
  if (key && s.characterKo && !names.has(key)) names.set(key, s.characterKo);
}
const characters = rawCharacters
  .filter(x => x && x.UmaId && x.UmaName && Array.isArray(x.UmaObjectives))
  .map(x => {
    const grouped = new Map();
    for (const objective of x.UmaObjectives) {
      const turn = Number(objective.Turn);
      if (!Number.isInteger(turn) || turn < 1 || turn > 72) continue;
      if (!grouped.has(turn)) grouped.set(turn, { t: turn, c: false, o: [] });
      const entry = grouped.get(turn);
      const name = String(objective.ObjectiveName || '').trim();
      if (name && !entry.o.some(y => y.n === name)) {
        entry.o.push({ n: name, g: '', s: '', d: String(objective.ObjectiveCondition || ''), f: 0, ko: raceKorean[name] || '' });
      }
    }
    const goals = [...grouped.values()].filter(g => g.o.length).sort((a, b) => a.t - b.t);
    for (const g of goals) g.c = g.o.length > 1;
    const translated = characterKorean[String(x.UmaId)];
    return {
      id: 'uma-' + String(x.UmaId),
      en: x.UmaName,
      ko: translated?.name || names.get(norm(x.UmaName)) || extraKorean[x.UmaName] || x.UmaName,
      variant: x.UmaNickname || '',
      variantKo: translated?.nickname || '',
      jp: x.UmaNameJP || '',
      variantJP: x.UmaNicknameJP || '',
      server: x.UmaServer,
      goals,
    };
  })
  .sort((a, b) => a.ko.localeCompare(b.ko, 'ko') || a.id.localeCompare(b.id));

const grades = { 100: 'G1', 200: 'G2', 300: 'G3', 400: 'OP', 500: 'Pre-OP', 700: 'other' };
const races = [];
for (const x of rawRaces) {
  if (!Array.isArray(x.instances)) continue;
  for (const q of x.instances) {
    const year = Number(q.year), month = Number(q.month), half = Number(q.half);
    if (year < 1 || year > 3 || month < 1 || month > 12 || half < 1 || half > 2) continue;
    races.push({
      n: String(x.name_en || x.name || ''),
      ko: raceKorean[String(x.name_en || x.name || '')] || '',
      t: (year - 1) * 24 + (month - 1) * 2 + half,
      g: grades[Number(x.grade)] || '',
      track: String(x.venue || ''),
      surface: Number(x.terrain) === 1 ? '잔디' : Number(x.terrain) === 2 ? '더트' : '',
      m: Number(x.distance) || 0,
      dir: '',
      f: 0,
    });
  }
}
races.sort((a, b) => a.t - b.t || a.n.localeCompare(b.n));
const lookupRace = new Map();
for (const race of races) {
  const key = race.t + '|' + race.n.trim().toLowerCase();
  if (!lookupRace.has(key)) lookupRace.set(key, race);
}
for (const character of characters) {
  for (const goal of character.goals) {
    for (const objective of goal.o) {
      const race = lookupRace.get(goal.t + '|' + objective.n.trim().toLowerCase());
      if (!race) continue;
      objective.g = race.g;
      objective.s = race.surface;
      objective.track = race.track;
      objective.m = race.m;
      objective.dir = race.dir;
      objective.f = race.f || 0;
    }
  }
}

if (characters.length < 240 || races.length < 350 ||
    new Set(characters.map(c => c.id)).size !== characters.length) {
  throw Error('Normalized JP data failed validation; leaving existing snapshot intact.');
}
const output = JSON.stringify({
  source: 'GameTora-derived UmaTools Japan+Global character data',
  sourceCharacterUrl: source.characters,
  sourceRaceUrl: source.races,
  scope: 'Japan server (includes characters also released globally)',
  characters,
  races,
});
const dest = join(ROOT, 'data/schedule_jp.json');
const tmp = dest + '.tmp';
await writeFile(tmp, output, 'utf8');
await rename(tmp, dest);
console.log('JP schedule updated: ' + characters.length + ' characters, ' + races.length + ' race instances.');
