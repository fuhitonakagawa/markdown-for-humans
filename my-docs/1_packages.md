以下が「自分専用のローカル拡張（.vsix）」にしてインストール／アンインストールする手順です。

---

## 1) ローカル専用パッケージ（.vsix）を作る手順

### ① 拡張ID（衝突回避）の変更（推奨）

同じ拡張IDだと、元の拡張（Marketplace版）と競合したり、上書きされたりします。  
`package.json` の `publisher`** と **`name` を自分用に変えるのがおすすめです。

例：

- `publisher`: `yourname-local`
- `name`: `markdown-for-humans-upnote`

（ついでに `displayName` も分かりやすく変えると管理しやすいです）

### ② 依存関係のインストール

```bash
npm install
```

### ③ vsce で .vsix を作成

VS Code公式手順では `vsce package` で `.vsix` を作ります。([Visual Studio Code](https://code.visualstudio.com/api/working-with-extensions/publishing-extension?utm_source=chatgpt.com))

```bash
npm install -g @vscode/vsce
vsce package
```

これでルート直下に `*.vsix` が生成されます。

> リポジトリに `npm run package:release` などが用意されている場合は、それを使ってもOKです（中で `vsce package` が走ります）。

---

## 2) インストール方法（VSIXから）

### GUI（おすすめ）

1. VS Code の拡張機能ビュー（⇧⌘X）を開く
2. 右上の `…` メニュー → **Install from VSIX…**
3. 作成した `.vsix` を選択

公式にもこの手順が記載されています。([Visual Studio Code](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace?utm_source=chatgpt.com))

### CLI（スクリプト化したい場合）

```bash
code --install-extension /path/to/your-extension.vsix


```

([Visual Studio Code](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace?utm_source=chatgpt.com))

---

## 3) 「拡張機能のサイドバーに表示される？」への回答

ここは2種類あります。

### A. 拡張機能ビュー（⇧⌘X）の「インストール済み一覧」

**表示されます。**

VSIXで入れても「Installed（インストール済み）」に出ます。([Visual Studio Code](https://code.visualstudio.com/docs/getstarted/extensions?utm_source=chatgpt.com))

### B. 左のアクティビティバー（Explorer/Source Control などの縦アイコン列）

これは **拡張が“独自のビュー（サイドバー機能）”を追加している場合のみ**増えます。

Markdown for Humans 系は主に **カスタムエディタ**なので、通常はここに新しいアイコンは増えません（増えるのは拡張機能ビューでの表示・コマンド・Open With など）。

---

## 4) アンインストール方法

### GUI

拡張機能ビュー（⇧⌘X）→ 対象拡張の歯車 → **Uninstall**

([Visual Studio Code](https://code.visualstudio.com/docs/getstarted/extensions?utm_source=chatgpt.com))

### CLI

拡張ID（`publisher.name`）を指定して削除できます。

```bash
code --uninstall-extension yourname-local.markdown-for-humans-upnote


```

([Visual Studio Code](https://code.visualstudio.com/docs/configure/command-line?utm_source=chatgpt.com))

---

## 補足：更新したいとき

ローカルVSIX運用はMarketplaceの自動更新が効かないので、**新しい `.vsix` を作って再インストール**するのが基本です（上書き更新になります）。([Visual Studio Code](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace?utm_source=chatgpt.com))

---

必要なら、あなたのフォルダ構成（zip展開した場所）を前提に、`package.json` のどの項目をどう変えるのが安全か（ID衝突回避／表示名／バージョン付け）を「差分パッチ形式」で提示します。