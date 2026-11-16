# VibeMind — Módulo Storage (implementação demonstrativa)

**Equipe 04 — Mega Beedrill | HackaRun 2026**  
Responsável pelo módulo de armazenamento: **Luiz Fernando Azevedo Jales Pereira**.

> Este pacote complementa o planejamento técnico inicial da equipe. **Não substitua o README principal do repositório**: envie este arquivo como `README_STORAGE.md`.

## O que foi implementado?

- **`localStorage`**: eventos, respostas anônimas de interesse, avaliações de eventos e desbloqueio do Easter Egg.
- **`sessionStorage`**: rascunho da pesquisa enquanto a aba permanece aberta e contagem temporária de cliques no logo.
- **Dashboard demonstrativo**: total de eventos, total de respostas, interesses por categoria, canais de coleta e média das avaliações.
- **Recomendação por afinidade**: prioriza eventos de categorias escolhidas pela pessoa (não é IA treinada).
- **Importação e exportação JSON**: backup para demonstração e testes.
- **Cupom de desconto**: depois de avaliar um evento, a pessoa vê um desconto sorteado (5%, 10% ou 15%, editável em `DISCOUNT_TABLE`) e pode informar o WhatsApp para recebê-lo. O telefone fica em `vibemind:v1:coupons`, separado das respostas anônimas, e só é salvo com autorização marcada.
- **Easter Egg sexta-feira 13**: 13 cliques na máscara escondida (canto inferior esquerdo) ativam o modo com fantasmas, bolhas e bruxas. Para sair, use o botão "Sair da Sexta-feira 13" ou clique na máscara de novo.
- **Testes automatizados**: Node.js, sem dependências externas.

## Estrutura

```text
README_STORAGE.md
package.json
src/
  storage/
    vibemindStorage.js    <-- ARQUIVO PRINCIPAL para integrar ao React/Vite
demo/
  index.html              <-- interface local demonstrativa
  styles.css
  app.js                  <-- lógica da tela
  toast.js                <-- avisos que sobem e somem em 5s
  spooky.js               <-- efeitos da Sexta-feira 13
  fonts/                  <-- fontes locais (funciona offline)
tests/
  storage.test.mjs
```

## Como executar em Windows — passo a passo

### Opção A: Visual Studio Code

1. Extraia o ZIP em uma pasta.
2. Abra a pasta no VS Code.
3. Se tiver a extensão **Live Server**, clique com o botão direito em `demo/index.html` → **Open with Live Server**.
4. Abra a aba **③ Storage** e clique em **Carregar dados fictícios**.
5. Teste também **① Visitante** e **② EventMind**.

### Opção B: Python (sem extensão)

Abra o terminal na pasta que contém `README_STORAGE.md`:

```bash
py -m http.server 5500
```

Acesse **http://localhost:5500/demo/** no navegador. Se `py` não funcionar, tente `python -m http.server 5500`.

**Evite abrir `index.html` com duplo clique:** com `file://`, módulos JavaScript e o `localStorage` podem não funcionar da mesma forma em todos os navegadores.

### Testes automatizados (Node.js)

```bash
npm test
```

> Não é necessário instalar pacotes (`npm install`), porque não há dependências externas.

## Integrando ao React + Vite da equipe

Copie `src/storage/vibemindStorage.js` para a pasta `src/services/` do projeto principal. No componente React, importe:

```js
import { vibeStorage, CATEGORY_LABELS } from './services/vibemindStorage.js';

// Página de pesquisa — armazenar resposta local:
vibeStorage.savePreference({
  interests: ['musica', 'cultura'],
  channel: 'qr',
  ageRange: 'nao-informado',
  schedule: 'tarde'
});

const eventosSugeridos = vibeStorage.recommendEvents(['musica', 'cultura']);

const indicadores = vibeStorage.getDashboard();
```

> **Observação React:** depois de salvar, atualize o estado da interface ou recarregue os indicadores. A API de Storage não faz renderização React automaticamente.

## Contrato das funções

|---|---|
| `addEvent({ title, category, date })` | Cadastra um evento local |
| `listEvents()` / `removeEvent(id)` | Lista/remove eventos |
| `savePreference({ interests, channel, ageRange, schedule })` | Registra pesquisa anônima |
| `listPreferences()` | Lista preferências locais |
| `recommendEvents(['musica'])` | Ordena eventos pelo interesse |
| `saveEvaluation({ eventId, rating })` | Registra avaliação de 1–5 |
| `getDashboard()` | Gera indicadores locais |
| `saveDraft(data)` / `loadDraft()` / `clearDraft()` | Usa sessionStorage |
| `exportJSON()` / `importJSON(json)` | Backup dos registros |
| `seedDemoData()` / `clearAll()` | Cria dados fictícios / limpa tudo |
| `registerSecretClick()` / `lockSecret()` | Easter Egg: conta 13 cliques / sai do modo |
| `drawDiscount()` / `saveCoupon({ phone, percent, eventId, consent })` | Sorteia o desconto / registra o cupom com telefone |
| `listCoupons()` / `markCouponSent(id)` | Lista cupons / marca como enviado |

### Valores válidos

**Categorias**: `musica`, `jogos`, `cultura`, `infantil`, `gastronomia`, `tecnologia`.

**Canais**: `qr`, `totem`, `assistido`.

**Faixas etárias** (opcionais): `nao-informado`, `crianca`, `adolescente`, `adulto`, `idoso`.

**Horários**: `indiferente`, `manha`, `tarde`, `noite`.

## Ponto fundamental: limites de Storage

`localStorage` é **local ao navegador/origem** e não sincroniza automaticamente dados entre celulares ou notebooks. Por isso, **os totais mostrados neste MVP são apenas dos dados salvos no navegador que abre o dashboard**. Não representem esses números como contagem real de visitantes do shopping.

Para um piloto com vários celulares, será necessário implementar **persistência compartilhada** (como Supabase/PostgreSQL) no fluxo de respostas e avaliações. `localStorage` e `sessionStorage` poderão continuar armazenando preferências locais e rascunhos; o dashboard central consultará o banco remoto. Essa integração **não está neste pacote**.

Não salve dados sensíveis, senhas ou tokens privados no `localStorage`. A pesquisa de interesses é anônima. O único dado pessoal é o telefone, pedido de forma opcional na tela do cupom, e ele fica separado das respostas. O site não envia WhatsApp sozinho: no EventMind, o botão "Abrir no WhatsApp" abre a conversa com a mensagem pronta. Envio automático e armazenamento do telefone de verdade exigem um backend (e atenção à LGPD). Dados gerados por `seedDemoData()` são **fictícios** e o painel os identifica.

## Teste manual rápido

1. Clique em **③ Storage → Carregar dados fictícios**.
2. Em **② EventMind**, confira 6 eventos, 4 respostas e 3 avaliações.
3. Em **① Visitante**, marque Música + Cultura, clique em **Salvar preferências** e veja o ranking.
4. Volte a **② EventMind**: agora são 5 respostas e as barras mudaram.
5. Em **① Visitante**, escolha um evento e dê uma nota.
6. Vá a **③ Storage**: o JSON mostra eventos, pesquisas e avaliações.
7. Recarregue a aba: os registros continuam presentes, pois foram salvos no `localStorage`.
8. Avalie um evento (escolha as estrelas): aparece o sorteio do cupom. Informe um WhatsApp, marque a autorização e veja o cupom em EventMind.
9. Clique **13 vezes na máscara** escondida no canto inferior esquerdo: surge o Easter Egg da sexta-feira 13. Use "Sair da Sexta-feira 13" para voltar.

## Fontes técnicas

- [MDN — Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [MDN — localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [MDN — Storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
