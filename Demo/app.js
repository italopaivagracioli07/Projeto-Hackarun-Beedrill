import { vibeStorage, CATEGORIES, CATEGORY_LABELS, DISCOUNT_TABLE, drawDiscount } from "../src/storage/vibemindStorage.js";
import { showToast } from "./toast.js";
import { enableSpooky, disableSpooky, playPortal } from "./spooky.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const HALLOWEEN_THEME_COLOR = "#0d2a17";
const DEFAULT_THEME_COLOR = "#1a1033";
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const CATEGORY_ICONS = { musica: "🎵", jogos: "🎮", cultura: "🎨", infantil: "🎡", gastronomia: "🍲", tecnologia: "🤖" };
const CATEGORY_COLORS = { musica: "#ff5fa2", jogos: "#4cc9ff", cultura: "#ffb23f", infantil: "#3be0b0", gastronomia: "#ff7a59", tecnologia: "#a98bff" };

const showStatus = (message, error = false) =>
  showToast({ title: message, variant: error ? "error" : "ok", life: error ? 8000 : 5000 });
const run = (fn) => { try { fn(); } catch (error) { showStatus(error.message, true); } };

function showTab(target) {
  $$(".tab").forEach(button => {
    const isActive = button.dataset.target === target;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  ["visitor", "admin", "storage"].forEach(id => { $(`#${id}`).hidden = id !== target; });
  if (target === "admin") renderDashboard();
  if (target === "storage") renderSnapshot();
}
$$(".tab").forEach(button => button.addEventListener("click", () => showTab(button.dataset.target)));

function newElement(tag, className, content) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content !== undefined) el.textContent = String(content);
  return el;
}
const formatDate = (iso) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).replace(".", "");
};
const renderSnapshot = () => { $("#snapshot").textContent = vibeStorage.exportJSON({ maskPhones: true }); };

function setHaunted(on) {
  document.body.classList.toggle("haunted-mode", on);
  $("#secret-exit").hidden = !on;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", on ? HALLOWEEN_THEME_COLOR : DEFAULT_THEME_COLOR);
  if (on) enableSpooky(); else disableSpooky();
}

function maskCenter() {
  const box = $("#secret-trigger").getBoundingClientRect();
  return { x: box.left + box.width / 2, y: Math.min(box.top + box.height / 2, innerHeight - 10) };
}

function enterSecret({ animate }) {
  if (document.body.classList.contains("haunted-mode")) return;
  if (!animate) { setHaunted(true); return; }
  const { x, y } = maskCenter();
  playPortal({ x, y, color: "rgba(60,230,120,.75)", onMid: () => setHaunted(true) });
  setTimeout(() => showToast({
    title: "Conquista desbloqueada: Sexta-feira 13",
    message: "Evento secreto: A Noite das 13 Experiências.",
    variant: "secret", life: 5000,
  }), 900);
}

function exitSecret() {
  vibeStorage.lockSecret();
  $("#secret-trigger").dataset.heat = "0";
  const { x, y } = maskCenter();
  playPortal({ x, y, color: "rgba(139,92,246,.7)", onMid: () => setHaunted(false) });
  showToast({ title: "Voltamos ao normal", message: "Clique 13 vezes na máscara escondida para voltar.", variant: "info" });
}
$("#secret-exit").addEventListener("click", exitSecret);

$("#secret-trigger").addEventListener("click", () => run(() => {
  const button = $("#secret-trigger");
  if (document.body.classList.contains("haunted-mode")) { exitSecret(); return; }
  button.classList.remove("poke");
  void button.offsetWidth; // reinicia a animação de tremida
  button.classList.add("poke");
  const result = vibeStorage.registerSecretClick();
  const clicks = result.clicks ?? 0;
  button.dataset.heat = String(clicks < 4 ? 0 : clicks < 8 ? 1 : clicks < 11 ? 2 : 3);
  if (result.unlocked) enterSecret({ animate: true });
}));

/* ───────── Pesquisa e recomendações ───────── */
function renderRecommendations(interests = []) {
  const holder = $("#recommended");
  holder.replaceChildren();
  const recommendations = vibeStorage.recommendEvents(interests);
  if (!recommendations.length) {
    holder.append(newElement("p", "empty", "Nenhum evento cadastrado ainda. Cadastre um em EventMind ou carregue os dados fictícios em Storage."));
    return;
  }
  recommendations.slice(0, 6).forEach(event => {
    const card = newElement("div", "event-card");
    card.style.setProperty("--tile", CATEGORY_COLORS[event.category]);
    card.append(newElement("span", "event-icon", CATEGORY_ICONS[event.category]));
    const main = newElement("div", "event-main");
    main.append(newElement("strong", "", event.title));
    main.append(newElement("small", "", `${CATEGORY_LABELS[event.category]} · ${formatDate(event.date)}`));
    card.append(main);
    if (event.matchScore) card.append(newElement("span", "match", "Combina com você"));
    const rate = newElement("button", "mini", "Avaliar");
    rate.type = "button";
    rate.addEventListener("click", () => {
      $("#evaluation-event").value = event.id;
      $("#evaluation-block").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "center" });
    });
    card.append(rate);
    holder.append(card);
  });
}

function captureDraft() {
  return {
    interests: $$("input[name='interest']:checked").map(input => input.value),
    channel: $("#channel").value,
    ageRange: $("#age-range").value,
    schedule: $("#schedule").value,
  };
}
$("#save-draft").addEventListener("click", () => run(() => {
  vibeStorage.saveDraft(captureDraft());
  showStatus("Rascunho guardado. Recarregue a página para testar.");
}));
$("#preference-form").addEventListener("submit", event => {
  event.preventDefault();
  run(() => {
    const draft = captureDraft();
    vibeStorage.savePreference(draft);
    renderRecommendations(draft.interests);
    showStatus("Preferências salvas! Veja os eventos pra você logo abaixo.");
    $("#recommended-block").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  });
});

function renderEventSelectors() {
  const select = $("#evaluation-event");
  const previous = select.value;
  select.replaceChildren();
  const events = vibeStorage.listEvents();
  if (!events.length) select.append(new Option("Nenhum evento cadastrado", ""));
  events.forEach(event => select.append(new Option(event.title, event.id)));
  if (events.some(event => event.id === previous)) select.value = previous;
  $("#evaluation-form button[type=submit]").disabled = !events.length;
}

/* ───────── Estrelas ───────── */
const RATING_WORDS = { 1: "Ruim", 2: "Pode melhorar", 3: "Legal", 4: "Muito bom", 5: "Amei!" };
$$("input[name='rating']").forEach(input => input.addEventListener("change", () => {
  $("#rating-caption").textContent = RATING_WORDS[input.value];
}));
function resetStars() {
  $$("input[name='rating']").forEach(input => { input.checked = false; });
  $("#rating-caption").textContent = "Toque nas estrelas";
}

const reward = { percent: 0, eventId: "", timer: null };

function setRewardState(state) {
  $$("#reward [data-show]").forEach(part => { part.hidden = !part.dataset.show.split(" ").includes(state); });
  // "spin" mostra só o sorteio; "form" mostra sorteio + telefone
  $("#coupon-form").hidden = state !== "form";
}

function launchConfetti() {
  const box = $("#reward .confetti");
  box.replaceChildren();
  if (reduceMotion()) return;
  const colors = ["#ffd36b", "#ff5fa2", "#4cc9ff", "#3be0b0", "#a98bff"];
  for (let i = 0; i < 28; i++) {
    const piece = document.createElement("i");
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    piece.style.animationDuration = `${1.8 + Math.random() * 1.2}s`;
    box.append(piece);
  }
}

function openReward(eventId) {
  reward.percent = drawDiscount();
  reward.eventId = eventId;
  clearInterval(reward.timer);
  $("#phone").value = "";
  $("#consent").checked = false;
  $("#coupon-error").hidden = true;
  const slot = $(".slot");
  slot.classList.remove("landed");
  setRewardState("spin");
  $("#reward").showModal();

  const land = () => {
    $("#slot-number").textContent = String(reward.percent);
    slot.classList.add("landed");
    launchConfetti();
    setRewardState("form");
    $("#phone").focus({ preventScroll: true });
  };
  if (reduceMotion()) { land(); return; }
  const options = DISCOUNT_TABLE.map(item => item.percent);
  let ticks = 0;
  reward.timer = setInterval(() => {
    $("#slot-number").textContent = String(options[Math.floor(Math.random() * options.length)]);
    if (++ticks >= 18) { clearInterval(reward.timer); land(); }
  }, 80);
}

$("#phone").addEventListener("input", event => {
  const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
  let text = digits;
  if (digits.length > 7) text = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  else if (digits.length > 2) text = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  else if (digits.length) text = `(${digits}`;
  event.target.value = text;
});

$("#coupon-form").addEventListener("submit", event => {
  event.preventDefault();
  const error = $("#coupon-error");
  try {
    const coupon = vibeStorage.saveCoupon({
      phone: $("#phone").value, percent: reward.percent, eventId: reward.eventId, consent: $("#consent").checked,
    });
    $("#ticket-percent").textContent = `${coupon.percent}%`;
    $("#ticket-code").textContent = coupon.code;
    setRewardState("done");
    launchConfetti();
    if (!$("#admin").hidden) renderDashboard();
  } catch (problem) {
    error.textContent = problem.message;
    error.hidden = false;
  }
});
$("#coupon-skip").addEventListener("click", () => { clearInterval(reward.timer); setRewardState("skipped"); });
$("#reward-close").addEventListener("click", () => $("#reward").close());
$("#skip-close").addEventListener("click", () => $("#reward").close());
$("#reward").addEventListener("close", () => {
  clearInterval(reward.timer);
  resetStars();
});

$("#evaluation-form").addEventListener("submit", event => {
  event.preventDefault();
  const rating = $("input[name='rating']:checked")?.value;
  if (!rating) { showStatus("Escolha uma nota de 1 a 5 estrelas.", true); return; }
  run(() => {
    vibeStorage.saveEvaluation({ eventId: $("#evaluation-event").value, rating: Number(rating) });
    if (!$("#admin").hidden) renderDashboard();
    openReward($("#evaluation-event").value);
  });
});

function metric(title, number) {
  const card = newElement("div", "metric");
  card.append(newElement("b", "", number));
  card.append(newElement("span", "", title));
  return card;
}
function renderBars(targetSelector, values, labelMap) {
  const target = $(targetSelector);
  target.replaceChildren();
  const max = Math.max(1, ...Object.values(values));
  for (const [key, value] of Object.entries(values)) {
    const row = newElement("div", "bar-row");
    row.append(newElement("span", "", labelMap[key] ?? key));
    const track = newElement("div", "bar-track");
    const fill = newElement("div", "bar-fill");
    fill.style.width = `${(value / max) * 100}%`;
    track.append(fill);
    row.append(track);
    row.append(newElement("b", "", value));
    target.append(row);
  }
}

const formatPhone = (p) => `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}`;
function whatsappLink(coupon) {
  const text = `Oi! Aqui é o VibeMind 💜 Obrigado por avaliar "${coupon.eventTitle}". Seu cupom de ${coupon.percent}% de desconto: ${coupon.code}. Vale no dia do evento (${formatDate(coupon.eventDate)}). É só mostrar esta mensagem.`;
  return `https://wa.me/55${coupon.phone}?text=${encodeURIComponent(text)}`;
}
function renderCoupons() {
  const holder = $("#coupons-admin");
  holder.replaceChildren();
  const coupons = vibeStorage.listCoupons();
  if (!coupons.length) { holder.append(newElement("p", "empty", "Ainda não há cupons. Eles aparecem aqui quando alguém avalia um evento e informa o WhatsApp.")); return; }
  coupons.forEach(coupon => {
    const card = newElement("div", "event-card coupon-card");
    card.append(newElement("span", "event-icon", "🎁"));
    const main = newElement("div", "event-main");
    const title = newElement("strong");
    title.append(newElement("span", "code", coupon.code), ` · ${coupon.percent}%`);
    main.append(title);
    main.append(newElement("small", "", `${formatPhone(coupon.phone)} · ${coupon.eventTitle} · ${formatDate(coupon.eventDate)}`));
    card.append(main);
    const send = newElement("button", "mini", coupon.sentAt ? "Enviar de novo" : "Abrir no WhatsApp");
    send.type = "button";
    send.addEventListener("click", () => {
      window.open(whatsappLink(coupon), "_blank", "noopener");
      run(() => { vibeStorage.markCouponSent(coupon.id); renderCoupons(); });
    });
    if (coupon.sentAt) card.append(newElement("span", "match sent", "Enviado ✓"));
    card.append(send);
    holder.append(card);
  });
}

function renderDashboard() {
  const stats = vibeStorage.getDashboard();
  $("#demo-badge").hidden = !stats.demoData;
  $("#metrics").replaceChildren(
    metric("Eventos", stats.totalEvents),
    metric("Respostas", stats.totalResponses),
    metric("Avaliações", stats.totalEvaluations),
    metric("Cupons", stats.totalCoupons)
  );
  renderBars("#interests-chart", stats.byInterest, CATEGORY_LABELS);
  renderBars("#channel-chart", stats.byChannel, { qr: "QR Code", totem: "Totem", assistido: "Assistido" });
  const holder = $("#events-admin");
  holder.replaceChildren();
  if (!stats.byEvent.length) holder.append(newElement("p", "empty", "Nenhum evento cadastrado."));
  stats.byEvent.forEach(event => {
    const card = newElement("div", "event-card");
    const main = newElement("div", "event-main");
    main.append(newElement("strong", "", event.title));
    card.append(main);
    card.append(newElement("span", "match", event.averageRating === null
      ? "Sem avaliações"
      : `${event.averageRating}/5 · ${event.evaluations} ${event.evaluations === 1 ? "avaliação" : "avaliações"}`));
    holder.append(card);
  });
  renderCoupons();
  renderEventSelectors();
}

for (const category of CATEGORIES) $("#event-category").append(new Option(CATEGORY_LABELS[category], category));
$("#event-form").addEventListener("submit", event => {
  event.preventDefault();
  run(() => {
    vibeStorage.addEvent({ title: $("#event-title").value, category: $("#event-category").value, date: $("#event-date").value });
    $("#event-title").value = "";
    renderDashboard();
    showStatus("Evento cadastrado!");
  });
});

$("#seed-demo").addEventListener("click", () => run(() => {
  if (!confirm("Substituir os registros locais por dados FICTÍCIOS para demonstração?")) return;
  vibeStorage.seedDemoData();
  renderEventSelectors();
  renderSnapshot();
  showStatus("Dados fictícios carregados. Veja as abas Visitante e EventMind.");
}));
$("#clear-data").addEventListener("click", () => run(() => {
  if (!confirm("Apagar todos os registros deste navegador?")) return;
  vibeStorage.clearAll();
  renderEventSelectors();
  renderSnapshot();
  $("#recommended").replaceChildren(newElement("p", "empty", "Escolha seus interesses acima e toque em “Ver minhas recomendações”."));
  $("#secret-trigger").dataset.heat = "0";
  setHaunted(false);
  showStatus("Dados apagados.");
}));
$("#export-data").addEventListener("click", () => run(() => {
  const blob = new Blob([vibeStorage.exportJSON()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "vibemind-backup.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showStatus("Backup gerado.");
}));
$("#import-file").addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if (!file || !confirm("Importar backup e SUBSTITUIR os dados deste navegador?")) { event.target.value = ""; return; }
  try {
    vibeStorage.importJSON(await file.text());
    renderEventSelectors();
    renderSnapshot();
    showStatus("Backup importado. Veja o EventMind.");
  } catch (error) { showStatus(error.message, true); }
  event.target.value = "";
});

run(() => {
  const draft = vibeStorage.loadDraft();
  if (draft) {
    $$("input[name='interest']").forEach(input => { input.checked = draft.interests?.includes(input.value) ?? false; });
    $("#age-range").value = draft.ageRange ?? "nao-informado";
    $("#schedule").value = draft.schedule ?? "indiferente";
    $("#channel").value = draft.channel ?? "qr";
    showStatus("Rascunho recuperado. Continue de onde parou.");
  }
  if (vibeStorage.isSecretUnlocked()) enterSecret({ animate: false });
  renderEventSelectors();
});
