以下は、fork した拡張（Markdown for Humans: WYSIWYG Editor）に対して、あなたが挙げた **機能追加** と **不具合修正**を、AIエージェント（実装担当）へそのまま渡せる粒度に整理した **実装チケット一式（日本語）**です。  

---

# プロジェクト概要（AIエージェント向け）

## 目的

- UpNote に近い編集体験を VS Code 上の WYSIWYG Markdown エディタで実現する。
- 特に、添付（PDF）運用・ショートカット・閲覧性（エディタ内ズーム）・マルチ表示（Split/別ウィンドウ）を強化する。

## 成果物

- fork 版拡張のローカル動作（Extension Development Host）での検証完了
- （任意）VSIX パッケージ化して自己利用可能

## 優先度（推奨）

1. **Split/別ウィンドウで空表示**（基盤バグ。開発効率に直結）
2. **UpNoteショートカット**（体感価値が高い & 低リスク）
3. **PDF貼り付け→保存→リンク挿入**（運用価値が高い）
4. **PDFプレビュー**
5. **エディタ内ズーム**（UX改善）

---

# チケット一覧

- MFH-UPN-001: **[Bug] Split Right / 別ウィンドウ分離で空表示になる**
- MFH-UPN-002: **[Feature] UpNote互換ショートカット（Cmd+2/3, Cmd+7…）**
- MFH-UPN-003: **[Feature] PDF貼り付け/ドロップ → 指定フォルダ保存 → mdへリンク挿入**
- MFH-UPN-004: **[Feature] PDFリンククリックで VS Code 内プレビュー**
- MFH-UPN-005: **[Feature] エディタ内のみの拡大縮小（独自ズーム）**
- MFH-UPN-006: **[Chore] 設定/README/検証手順の整備（自分用運用含む）**

---

## MFH-UPN-001 — [Bug] Split Right / 別ウィンドウ分離で空表示になる

### 背景

- 本拡張の WYSIWYG で開いた `.md` を
  - タブ右クリック → **Split Right**
  - タブをドラッグして **別ウィンドウへ分離**
  すると、分割先/分離先で **内容が表示されず空**になる。

### 期待動作

- Split Right / 別ウィンドウ分離のいずれでも、同じ内容が表示・編集可能。

### 再現手順

**パターンA（Split Right）**

1. 本拡張で `.md` を開く（WYSIWYG表示）
2. タブ右クリック → Split Right
3. 右側が空表示

**パターンB（別ウィンドウ分離）**

1. 本拡張で `.md` を開く（WYSIWYG表示）
2. タブをドラッグして別ウィンドウへ分離
3. 分離先が空表示

### 原因仮説（高確度）

- カスタムエディタ（Webview）を **同一ドキュメントで複数表示**した際の初期化・同期が想定されていない
- 既存実装が「1ドキュメント=1ビュー」を前提にしている、または `postMessage` 依存で初期コンテンツ投入が失敗すると空になる

### 対応方針（推奨）

**方針A（推奨 / 正攻法）：複数エディタ表示を正式サポート**

- `resolveCustomTextEditor` / provider 実装で、同一 `document.uri` に対して複数 webview を保持し、状態同期する
- 具体的には以下：
  - `Map<docUri, Set<webviewPanel>>` を保持
  - ドキュメント変更（onDidChangeTextDocument）時に、該当 doc の全 webview にブロードキャスト
  - webview からの編集イベントを受けたら、TextDocument へ適用し、他の webview にも配布
  - panel dispose 時に set から除去

**方針B（応急処置）：初期コンテンツを HTML に埋め込み、postMessage失敗でも空を回避**

- `webview.html` 生成時に、初期 Markdown を `<script>window.__INITIAL_MD__=...` に埋め込み
- webview 側は起動直後に埋め込み値で初期描画し、以後は message で更新

> 実装負荷を下げるなら「Bで空表示を回避」→「Aで完全同期」でも可。

### 実装タスク

- [ ] 同一ドキュメントを複数表示した場合のライフサイクル設計（登録・破棄・同期）
- [ ] 初期ロード方式の見直し（埋め込み + ready handshake）
- [ ] Split Right / 別ウィンドウ分離での再現確認・修正
- [ ] ログ（Extension Host / webview console）を追加して切り分け容易にする（最終的に必要最小限に整理）

### 受け入れ条件（DoD）

- [ ] Split Right 後に内容が表示される
- [ ] 別ウィンドウ分離後に内容が表示される
- [ ] Reload Window を必要としない（少なくとも “何も出ない” 状態にならない）
- [ ] 既存の単一表示での編集・保存が壊れていない

### テスト観点（手動）

- macOS: Split Right / Split Down / 別ウィンドウ分離
- 片側で編集→もう片側に反映（最小でOK、同期方式に応じて要件化）
- webview の console / Extension Host のログに致命エラーがない

---

## MFH-UPN-002 — [Feature] UpNote互換ショートカット（Cmd+2/3, Cmd+7…）

### 背景

- UpNote の操作感を再現したい。
- VS Code 全体のショートカットではなく、**WYSIWYGエディタ（webview）にフォーカスがある時のみ**有効にしたい。

### 対象ショートカット（必須）

- Cmd+2 → H2 トグル
- Cmd+3 → H3 トグル
- Cmd+7 → 箇条書きトグル

### 対象ショートカット（任意）

- Cmd+8 → 番号付きリスト
- Cmd+9 → チェックリスト
- Cmd+1 → H1（任意）

### 実装方針

- webview 側の keydown ハンドラで `metaKey/ctrlKey` を判定して TipTap コマンドを実行
- VS Code 標準操作と衝突しないよう、**エディタフォーカス時のみ **`preventDefault` する

### 実装タスク

- [ ] webview 側でショートカット検知（Mac=meta, Win/Linux=ctrl）
- [ ] TipTap の heading / list / taskList コマンドに接続
- [ ] 既存のショートカット（保存/検索等）への影響を回避

### 受け入れ条件（DoD）

- [ ] WYSIWYG上で Cmd+2/3/7 が期待通りに反映される
- [ ] WYSIWYG以外（サイドバー等）で誤発火しない
- [ ] Undo/Redo が破綻しない

### テスト観点

- 見出し適用→解除（トグル確認）
- リスト→通常文への戻し
- 入力IME中に誤発火しない（最低限確認）

---

## MFH-UPN-003 — [Feature] PDF貼り付け/ドロップ → 指定フォルダ保存 → mdへリンク挿入

### 背景

- PDFを “ノート添付” 的に運用したい
- PDFを貼り付け/ドラッグ&ドロップしたら、ワークスペース内に保存し Markdown へリンクを自動挿入したい

### 要件

- 入力：
  - Finder/Explorer からのドロップ
  - クリップボード経由の貼り付け（可能なら）
- 出力：
  - `attachments/`（設定可能）に保存（ファイル名衝突回避）
  - Markdownに相対リンク挿入：`[filename.pdf](./attachments/filename.pdf)`

### 設定（新規）

- `attachmentPath`（default: `attachments`）
- `attachmentPathBase`（`relativeToDocument` / `workspaceFolder` など、画像と同等の概念）

### 実装方針

- 既存の “画像貼り付け/ドロップ” の実装パターンを横展開
  - webview側：drop/paste を捕捉して Host へ送信（bytes or path）
  - Host側：保存/コピーして相対パスを生成
  - webview側：リンクを挿入（TipTap link mark）

### 実装タスク

- [ ] webview: PDFファイルを検知し、Hostへ `saveAttachment` / `handleWorkspaceAttachment` を送る
- [ ] Host: 指定フォルダへ保存（衝突回避・相対パス生成）
- [ ] webview: `insertFileLink` を受け取り、リンク挿入
- [ ] エラーハンドリング（保存失敗時の通知）

### 受け入れ条件（DoD）

- [ ] PDFをドロップすると attachments に保存される
- [ ] 本文にリンクが挿入される
- [ ] 同名ファイルがある場合でも安全に保存できる（連番など）
- [ ] ワークスペース外からのドロップでもコピーされる（要件化するなら）

### テスト観点

- PDF 1つ/複数のドロップ
- ワークスペース外からのドロップ
- 読み取り専用ディレクトリ等の失敗パス

---

## MFH-UPN-004 — [Feature] PDFリンククリックで VS Code 内プレビュー

### 背景

- PDFリンクをクリックしたときに、外部アプリではなく VS Code 内でプレビューしたい

### 実装レベル（推奨：段階導入）

**Phase 1（最短）**

- `.pdf` リンククリック → `vscode.open` / `vscode.openWith` を試し、ダメなら `openExternal` フォールバック

**Phase 2（本命）**

- 拡張側で PDF プレビューパネル（webview）を開き、pdf.js 等で描画

### 実装タスク

- [ ] webview: リンククリックを捕捉し Host に通知（既存の open 処理があれば拡張）
- [ ] Host: `.pdf` 判定し、プレビューを開く（Phase 1）
- [ ] （任意）Host: pdf.js を同梱して webview で描画（Phase 2）

### 受け入れ条件（DoD）

- [ ] `.pdf` リンククリックで VS Code 内にプレビューが開く（Phase 1 の範囲でも可）
- [ ] 相対パスリンクでも解決できる
- [ ] 開けない場合はユーザーに分かるフォールバックがある

### テスト観点

- 相対リンク / 絶対リンク
- 大きめPDF（最低1つ）

---

## MFH-UPN-005 — [Feature] エディタ内のみの拡大縮小（独自ズーム）

### 背景

- VS Code の Cmd +/- は UI 全体（タブ/サイドバー等）も拡大縮小してしまう
- **WYSIWYGエディタ領域だけ**拡大縮小したい

### 要件

- エディタ内ズーム（フォントサイズ/スケール）を提供
- VS Code UI には影響しない
- 可能なら設定値を永続化（globalState / workspaceState）

### コマンド（新規）

- `editorZoomIn`
- `editorZoomOut`
- `editorZoomReset`

### 実装方針

- Host側で zoomLevel を保持（例：整数ステップ）
- webviewへ `setEditorZoom` を送る
- webview側で CSS 変数（例 `--mfh-editor-font-scale`）を更新し、エディタ根要素に適用
  - `font-size` 方式が安全（`transform: scale` は座標/選択が壊れやすい）
  - `zoom` はブラウザ互換が絡むので非推奨

### 実装タスク

- [ ] コマンド登録 + キーバインド（webviewフォーカス時に限定するなら `when` も検討）
- [ ] zoomLevel の永続化（例：`globalState`）
- [ ] webviewへ倍率を通知 → CSS変数反映
- [ ] エディタ再オープン時に倍率復元

### 受け入れ条件（DoD）

- [ ] エディタ内のみ拡大縮小され、タブ/サイドバーは変化しない
- [ ] リセットで既定値に戻る
- [ ] 再起動後も倍率が維持される（要件化するなら必須）

### テスト観点

- 拡大/縮小/リセット
- Split 表示時でも倍率が適用される（MFH-UPN-001 と合わせて確認）

---

## MFH-UPN-006 — [Feature] エディタ内ツールバーに「元のMarkdown表示に戻す」ボタン追加

### 背景

現状の `</>`（Source）相当は「別splitでMarkdownを開く」挙動で、**WYSIWYG自体を閉じて“通常のMarkdownテキスト表示に戻る”**操作がない。

### 要件

- エディタ上部ツールバーに「元のMarkdown（通常テキスト）に戻す」ボタンを追加
- クリックすると、**同じViewColumnでデフォルトエディタを開き直し**、WYSIWYGタブは閉じる（=戻る）
- Split/別ウィンドウなどでも破綻しない（MFH-UPN-001 と整合）

### 実装方針

- webview: ボタン押下 → hostへ `reopenInDefaultEditor` メッセージ送信
- host: `vscode.openWith(document.uri, 'default', viewColumn)` を実行し、成功後に該当webviewPanelを dispose

### 受け入れ条件

- [ ] ボタン押下で通常Markdownテキスト表示に切り替わる（同じタブ位置で）
- [ ] WYSIWYGタブが残らない（閉じられる）
- [ ] Split Right/別ウィンドウでも挙動が安定

---

## MFH-UPN-007 — [Feature] アップロードファイルのデフォルトはFiles/にする

いまは画像はimages/、その他はattachments/ に格納されるが、Files/ に統一する


---


## MFH-UPN-008 — [Chore] 画像挿入モーダルの削除

ペーストでスクショ画像を貼ると📸 Save 1 Imageというモーダルが出てくるが、これは不要