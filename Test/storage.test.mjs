import test from 'node:test';
import assert from 'node:assert/strict';
import { createVibeMindStorage, drawDiscount, normalizePhone, DISCOUNT_TABLE } from '../src/storage/vibemindStorage.js';

class MemoryStorage {
  data = new Map();
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key, value) { this.data.set(key, String(value)); }
  removeItem(key) { this.data.delete(key); }
  clear() { this.data.clear(); }
}

function init() {
  const localStore = new MemoryStorage();
  const sessionStore = new MemoryStorage();
  return { store: createVibeMindStorage({ localStore, sessionStore }), localStore, sessionStore };
}

test('cria e lista eventos', () => {
  const { store } = init();
  const item = store.addEvent({ title: 'Noite Musical', category: 'musica', date: '2026-11-20' });
  assert.equal(store.listEvents().length, 1);
  assert.equal(store.listEvents()[0].id, item.id);
  assert.equal(store.removeEvent(item.id), true);
  assert.equal(store.listEvents().length, 0);
});

test('salva preferencias anonimas e contabiliza interesses corretamente', () => {
  const { store } = init();
  store.savePreference({ interests: ['musica', 'cultura', 'musica'], channel: 'totem', ageRange: 'idoso' });
  store.savePreference({ interests: ['jogos'], channel: 'qr' });
  const stats = store.getDashboard();
  assert.equal(stats.totalResponses, 2);
  assert.equal(stats.byInterest.musica, 1);
  assert.equal(stats.byInterest.cultura, 1);
  assert.equal(stats.byInterest.jogos, 1);
  assert.equal(stats.byChannel.totem, 1);
  assert.equal(stats.byAgeRange.idoso, 1);
});

test('avalia eventos somente com nota de 1 a 5', () => {
  const { store } = init();
  const e = store.addEvent({ title: 'Feira Cultural', category: 'cultura', date: '2026-11-20' });
  store.saveEvaluation({ eventId: e.id, rating: 5 });
  store.saveEvaluation({ eventId: e.id, rating: 3 });
  assert.equal(store.getDashboard().byEvent[0].averageRating, 4);
  assert.throws(() => store.saveEvaluation({ eventId: e.id, rating: 7 }));
  assert.throws(() => store.saveEvaluation({ eventId: 'nao-existe', rating: 5 }));
});

test('rascunho usa sessionStorage e e removido ao enviar', () => {
  const { store, localStore, sessionStore } = init();
  store.saveDraft({ interests: ['musica'] });
  assert.deepEqual(store.loadDraft().interests, ['musica']);
  assert.equal(localStore.getItem('vibemind:v1:draft'), null);
  assert.ok(sessionStore.getItem('vibemind:v1:draft'));
  store.savePreference({ interests: ['musica'] });
  assert.equal(store.loadDraft(), null);
});

test('recomendacao ordena eventos compativeis primeiro', () => {
  const { store } = init();
  store.addEvent({ title: 'Jogos', category: 'jogos', date: '2026-11-20' });
  store.addEvent({ title: 'Musica', category: 'musica', date: '2026-11-22' });
  assert.equal(store.recommendEvents(['musica'])[0].title, 'Musica');
});

test('dados demonstrativos, backup e limpeza', () => {
  const { store } = init();
  const stats = store.seedDemoData();
  assert.equal(stats.demoData, true);
  assert.equal(stats.totalEvents, 6);
  assert.equal(stats.totalResponses, 4);
  const exported = store.exportJSON();
  assert.equal(JSON.parse(exported).schemaVersion, 1);
  store.clearAll();
  assert.equal(store.listPreferences().length, 0);
  store.importJSON(exported);
  assert.equal(store.listPreferences().length, 4);
  assert.equal(store.getDashboard().demoData, true);
});

test('easter egg desbloqueia ao clicar 13 vezes', () => {
  const { store } = init();
  for (let i = 0; i < 12; i++) assert.equal(store.registerLogoClick().unlocked, false);
  const result = store.registerLogoClick();
  assert.equal(result.justUnlocked, true);
  assert.equal(store.isSecretUnlocked(), true);
});

test('valida categorias para evitar valores inesperados', () => {
  const { store } = init();
  assert.throws(() => store.savePreference({ interests: ['desconhecido'] }));
  assert.throws(() => store.addEvent({ title: 'X', category: 'outra', date: '2026-11-20' }));
});

test('sorteio de desconto respeita a tabela', () => {
  const valid = DISCOUNT_TABLE.map(item => item.percent);
  for (let i = 0; i < 200; i++) assert.ok(valid.includes(drawDiscount()));
  assert.equal(drawDiscount(() => 0), 5);
  assert.equal(drawDiscount(() => 0.99), 15);
});

test('telefone e normalizado e validado', () => {
  assert.equal(normalizePhone('(63) 99999-0000'), '63999990000');
  assert.equal(normalizePhone('+55 63 99999-0000'), '63999990000');
  assert.throws(() => normalizePhone('1234'));
  assert.throws(() => normalizePhone('(63) 3215-0000'));
});

test('cupom exige autorizacao, evento valido e telefone unico', () => {
  const { store } = init();
  const e = store.addEvent({ title: 'Feira', category: 'cultura', date: '2026-11-20' });
  const base = { phone: '(63) 99999-0000', percent: 10, eventId: e.id, consent: true };
  assert.throws(() => store.saveCoupon({ ...base, consent: false }));
  assert.throws(() => store.saveCoupon({ ...base, percent: 99 }));
  assert.throws(() => store.saveCoupon({ ...base, eventId: 'x' }));
  const coupon = store.saveCoupon(base);
  assert.match(coupon.code, /^VIBE10-[A-Z0-9]{4}$/);
  assert.equal(coupon.phone, '63999990000');
  assert.throws(() => store.saveCoupon(base));
  assert.equal(store.getDashboard().totalCoupons, 1);
  store.markCouponSent(coupon.id);
  assert.ok(store.listCoupons()[0].sentAt);
});

test('telefone fica mascarado na tela e completo no backup; importa de volta', () => {
  const { store } = init();
  const e = store.addEvent({ title: 'Feira', category: 'cultura', date: '2026-11-20' });
  store.saveCoupon({ phone: '63999990000', percent: 5, eventId: e.id, consent: true });
  assert.match(store.exportJSON({ maskPhones: true }), /\(63\) 9\*\*\*\*-0000/);
  const full = store.exportJSON();
  assert.ok(full.includes('63999990000'));
  store.clearAll();
  assert.equal(store.listCoupons().length, 0);
  store.importJSON(full);
  assert.equal(store.listCoupons().length, 1);
});

test('saida do easter egg exige 13 cliques de novo', () => {
  const { store } = init();
  for (let i = 0; i < 13; i++) store.registerSecretClick();
  assert.equal(store.isSecretUnlocked(), true);
  store.lockSecret();
  assert.equal(store.isSecretUnlocked(), false);
  assert.equal(store.registerSecretClick().unlocked, false);
});
