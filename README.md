# Bypass Devtool Detection

Webサイトに実装された開発者ツール（DevTools）の検知・妨害メカニズムを回避するためのTampermonkey用UserScriptです。

多くのサイトで使用されている「F12キーの無効化」「右クリック禁止」「コンソールの強制クリア」「無限デバッガ（debugger loop）」などの対策を無効化し、正常なデバッグ環境を復元することを目的としています。

## 🚀 主な機能

このスクリプトは `document-start` で実行され、以下の手法で検知をバイパスします：

* **イベントリスナーの無効化・復元**:
    * `contextmenu`（右クリック）、`selectstart`（選択）、`copy/cut/paste` のブロックを解除。
    * F12キー、Ctrl+Shift+I/J などのショートカットキーに対する `preventDefault` を無効化。
* **タイマー監視の妨害**:
    * デバッグ検知によく使用される短期間の `setInterval` / `setTimeout` をブロック。
* **コンソール制御の無効化**:
    * `console.clear()` を無効化し、ログが消されるのを防ぎます。
* **ウィンドウサイズの偽装**:
    * DevToolsを開いた際の画面サイズ変化検知を防ぐため、`outerWidth` / `outerHeight` を偽装します。
* **整合性チェックの回避**:
    * `Function.toString` や `RegExp.toString` をオーバーライドし、コードの改変検知を回避します。
* **特定ライブラリへの対策**:
    * `DisableDevtool` などの有名な検知ライブラリを検出し、機能を停止させます。

## 📦 インストール方法

1.  ブラウザに拡張機能 [Tampermonkey](https://www.tampermonkey.net/) をインストールします。
2.  このリポジトリの [bypass-devtool-detection.user.js](ここにrawファイルのURLを貼る予定の場所) をクリックします。
3.  Tampermonkeyのインストール画面が表示されるので、「インストール」をクリックしてください。

## ⚠️ 注意事項・免責

* **互換性について**:
    * 本スクリプトは強力なバイパス機能を持っていますが、その副作用として**通常のWebサイトの動作（アニメーションや動的なデータ読み込みなど）に影響を与える可能性があります**。
    * 特に1000ms以下のタイマーをブロックする仕様のため、SPA（Single Page Application）などで予期せぬ挙動をする場合があります。
* **利用範囲**:
    * このスクリプトは、自身の所有するサイトのセキュリティ検証や、正当な学習・研究目的でのみ使用してください。
    * 本スクリプトの使用によって生じた、いかなる損害やトラブルについても作者は責任を負いません。

## 🛠 動作環境

* Chrome / Edge / Firefox
* Tampermonkey Extension