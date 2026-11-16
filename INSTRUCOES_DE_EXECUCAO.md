# VibeMind — instruções para executar o MVP

**Equipe 04 — Mega Beedrill | HackaRun 2026**

> Estas instruções correspondem à versão **HTML/CSS/JavaScript** do protótipo com a pasta `demo/` e o módulo `src/storage/vibemindStorage.js`. Se o projeto final foi reorganizado ou migrado para React/Vite, verifique e atualize os caminhos e comandos antes de publicar.

## 1. Requisitos

- Um computador com navegador atualizado (Chrome, Edge ou Firefox).
- **Visual Studio Code** com uma extensão de servidor local, como **Live Server**, **ou** Python 3 para usar o servidor alternativo.
- Não é necessário configurar banco de dados remoto nem instalar dependências JavaScript para esta demo.

## 2. Arquivos importantes

```text
VibeMind/
├── demo/
│   ├── index.html                # Página inicial da demonstração
│   ├── styles.css                # Estilo e animações
│   └── app.js                    # Interações da interface
├── src/
│   └── storage/
│       └── vibemindStorage.js    # Armazenamento e funções do MVP
├── tests/
│   └── storage.test.mjs          # Testes automatizados (se incluídos)
└── package.json                 # Comandos de teste (se incluído)
```

## 3. Executar pelo VS Code (recomendado)

1. Baixe o repositório pelo GitHub em **Code → Download ZIP** e extraia os arquivos (ou clone com Git).
2. Abra **a pasta raiz do projeto** no Visual Studio Code: **File → Open Folder**.
3. Instale a extensão **Live Server**, caso ainda não a tenha.
4. No explorador de arquivos do VS Code, abra `demo/index.html`.
5. Clique com o botão direito no arquivo e selecione **Open with Live Server**. Se sua extensão usa um ícone de globo ou **Go Live**, use-o para abrir a mesma página por um servidor local.
6. Caso o navegador abra a raiz do projeto, entre na pasta `/demo/` ou acesse diretamente `demo/index.html`.

## 4. Executar sem extensão (alternativa)

Abra o terminal **na pasta raiz** do projeto (a que contém `demo/`) e execute:

```bash
py -m http.server 5500
```

Em sistemas com `python3` em vez de `py`, execute:

```bash
python3 -m http.server 5500
```

No navegador, acesse:

```text
http://localhost:5500/demo/
```

Para encerrar o servidor, volte ao terminal e pressione **Ctrl+C**.

> **Atenção:** não abra `demo/index.html` diretamente por duplo clique (`file://`); o navegador pode bloquear os módulos JavaScript. Use um servidor local HTTP.

## 5. Como testar as funcionalidades

1. Abra a aba **Storage** e clique em **Carregar dados fictícios** (confirme a substituição de registros locais).
2. Na aba **Visitante**, escolha interesses e clique em **Salvar preferências**. Confira as recomendações.
3. Na aba **EventMind**, confira os números de eventos, respostas, avaliações e os gráficos por categoria/canal.
4. Cadastre um evento e faça uma avaliação para observar a atualização do painel.
5. Volte para **Storage** e experimente **Exportar backup JSON**; também é possível importar um backup compatível.
6. Recarregue a página: os registros devem permanecer no mesmo navegador.
7. **Easter Egg:** clique 13 vezes na máscara discreta no canto direito do rodapé para ativar a ambientação da sexta-feira 13.

## 6. Testes automatizados (opcional)

Se o repositório incluir `package.json` e a pasta `tests/`, instale **Node.js** e, no terminal da raiz do projeto, execute:

```bash
npm test
```

O módulo original não exige `npm install` para esses testes, pois não utiliza dependências externas.

## 7. Observações e limitações do MVP

- Dados do protótipo ficam em **localStorage** do próprio navegador; o rascunho da pesquisa usa **sessionStorage**.
- Os dados **não são sincronizados entre diferentes computadores ou celulares**. O dashboard apresenta somente registros locais; dados de demonstração são fictícios.
- As recomendações são calculadas por **afinidade de categorias** — não utilizam um modelo de IA treinado.
- Para uma implantação real no shopping, seriam necessários um banco compartilhado, políticas de privacidade, revisão de acessibilidade e controles de administração.

## 8. Problemas comuns

| Problema | Como resolver |
|---|---|
| Página em branco / erro de módulo | Abra a aplicação por Live Server ou `http://localhost`, não por `file://`. |
| Link `localhost` não abre | Verifique se o servidor está ligado e se a porta `5500` está livre. |
| Gráficos sem registros | Em **Storage**, carregue os dados fictícios ou envie preferências pela aba **Visitante**. |
| Conquista já aparece desbloqueada | `localStorage` guardou o desbloqueio: teste em janela anônima ou limpe os dados locais da demonstração. |
| Dados não aparecem em outro computador | Comportamento esperado do MVP: armazenamento é local. |

**Recomendação para avaliação:** abra o protótipo já carregado com dados fictícios e deixe o repositório com as instruções acima, para que o avaliador consiga reproduzir a execução.
