# Auto Page Capture Store Listing Source

This file is the source text for Microsoft Edge Add-ons and the Chrome Web Store.

It separates the short description from the detailed description so the same copy can be reused without repeating the same sentence twice in the listing.

## 0. Current package locales

The extension package currently includes these locales:

- `en`
- `ja`
- `zh_CN`
- `zh_TW`
- `ko`
- `es`
- `fr`
- `de`

## 1. Short description

Use this as the manifest short description / summary line.

### 1.1 English (`en`)

Automate page actions on a schedule and save the result as MHTML, HTML, PDF, or full-page screenshots.

### 1.2 Japanese (`ja`)

ページ操作を定期実行し、結果を MHTML / HTML / PDF / 全画面スクリーンショットとして保存します。

### 1.3 Simplified Chinese (`zh-CN`)

按计划自动执行页面操作，并将结果保存为 MHTML、HTML、PDF 或整页截图。

### 1.4 Traditional Chinese (`zh-TW`)

依排程自動執行頁面操作，並將結果儲存為 MHTML、HTML、PDF 或整頁截圖。

### 1.5 Korean (`ko`)

예약된 일정에 따라 페이지 작업을 자동 실행하고 결과를 MHTML, HTML, PDF 또는 전체 페이지 스크린샷으로 저장합니다.

### 1.6 Spanish (`es`)

Automatiza acciones en páginas web según una programación y guarda el resultado como MHTML, HTML, PDF o capturas de página completa.

### 1.7 French (`fr`)

Automatisez des actions sur des pages selon un planning et enregistrez le résultat au format MHTML, HTML, PDF ou capture pleine page.

### 1.8 German (`de`)

Automatisieren Sie Seitenaktionen nach Zeitplan und speichern Sie das Ergebnis als MHTML, HTML, PDF oder Ganzseiten-Screenshot.

## 2. Detailed description

Use this as the main body text in the store listing.

### 2.1 English (`en`)

Auto Page Capture helps you save pages after they reach the state you need.

Create one or more capture items, set the target URL, choose a schedule, and select an output format. Before saving, the extension can wait for a page to finish updating, click buttons or links, fill form fields, and wait for element or attribute changes. This makes it useful for dashboards, reports, charts, news pages, and other pages that need a short interaction before they can be archived correctly.

Scheduling note:

Scheduled captures run only while the browser is running and the extension is available.

If the browser is fully closed at a scheduled time, that run is skipped. When the browser starts again, the extension resumes from the next upcoming scheduled time instead of replaying missed runs.

Supported formats:

- MHTML
- HTML snapshot
- PDF
- PNG
- JPEG
- WebP

Main features:

- Multiple items with independent schedules
- Manual run from the popup
- Optional pre-save actions such as wait, click, set value, and wait for element state
- Recent history in the popup
- Detailed logs in the settings page
- Log export as JSON or CSV
- Per-site permission grant and revoke from the settings page
- UI language switching

Privacy:

Captured pages are saved to the local downloads folder. The extension does not upload captured page data to an external server or cloud service.

### 2.2 Japanese (`ja`)

Auto Page Capture は、ページが目的の状態になったあとで自動保存するための拡張機能です。

対象 URL、ごとのスケジュール、保存形式を設定し、必要に応じて保存前アクションを追加できます。保存前アクションでは、一定時間待機する、要素が現れるまで待つ、ボタンやリンクをクリックする、入力欄に値を設定する、要素や属性の変化を待つ、といった操作が可能です。ダッシュボード、レポート、チャート、ニュースページなど、表示完了後や軽い操作後に保存したいページに向いています。

スケジュールに関する注意:

スケジュールに基づく保存は、ブラウザーが起動しており、この拡張機能が利用可能な間だけ実行されます。

予定時刻にブラウザーが完全に終了していた場合、その実行はスキップされます。ブラウザーを再び起動すると、拡張機能は見逃した実行を自動で再実行せず、次回の予定時刻から再開します。

対応形式:

- MHTML
- HTML スナップショット
- PDF
- PNG
- JPEG
- WebP

主な機能:

- 複数アイテムを個別スケジュールで管理
- ポップアップからの手動実行
- 保存前アクションの設定
- ポップアップでの最近の実行履歴表示
- 設定画面での詳細ログ表示
- JSON / CSV でのログ出力
- 設定画面からのサイト権限の許可 / 解除
- UI 言語切り替え

プライバシー:

保存データはローカルの Downloads フォルダーに出力されます。外部サーバーやクラウドへのアップロードは行いません。

### 2.3 Simplified Chinese (`zh-CN`)

Auto Page Capture 可帮助您在页面达到所需状态后再进行保存。

您可以创建一个或多个采集项目，为每个项目设置目标 URL、执行计划和输出格式。保存前，扩展可以等待页面更新完成、点击按钮或链接、填写表单字段，以及等待元素或属性状态变化。因此，它适用于仪表板、报表、图表、新闻页面，以及其他需要在归档前先进行少量交互的页面。

计划说明：

计划任务仅会在浏览器正在运行且扩展可用时执行。

如果在计划时间浏览器已完全关闭，该次执行将被跳过。浏览器再次启动后，扩展不会自动补跑错过的任务，而是从下一次计划时间继续。

支持的格式：

- MHTML
- HTML 快照
- PDF
- PNG
- JPEG
- WebP

主要功能：

- 多个项目分别配置独立计划
- 从弹出窗口手动执行
- 支持保存前操作，例如等待、点击、填写值，以及等待元素状态变化
- 在弹出窗口中查看最近历史
- 在设置页面中查看详细日志
- 将日志导出为 JSON 或 CSV
- 在设置页面中按站点授予或撤销权限
- 切换界面语言

隐私：

采集结果仅保存到本地 Downloads 文件夹。扩展不会将页面数据上传到外部服务器或云服务。

### 2.4 Traditional Chinese (`zh-TW`)

Auto Page Capture 可協助您在頁面達到需要的狀態後再進行儲存。

您可以建立一個或多個擷取項目，為每個項目設定目標 URL、排程與輸出格式。儲存前，擴充功能可以等待頁面更新完成、點擊按鈕或連結、填寫表單欄位，以及等待元素或屬性狀態變化。因此，它很適合用於儀表板、報表、圖表、新聞頁面，以及其他在封存前需要進行少量互動的頁面。

排程注意事項：

排程擷取只會在瀏覽器正在執行且擴充功能可用時進行。

如果在排定時間瀏覽器已完全關閉，該次執行會被略過。瀏覽器再次啟動後，擴充功能不會自動補跑錯過的執行，而是從下一個排定時間繼續。

支援格式：

- MHTML
- HTML 快照
- PDF
- PNG
- JPEG
- WebP

主要功能：

- 多個項目可分別設定獨立排程
- 可從彈出視窗手動執行
- 支援儲存前動作，例如等待、點擊、設定值，以及等待元素狀態變化
- 在彈出視窗中查看最近歷程
- 在設定頁面中查看詳細記錄
- 可將記錄匯出為 JSON 或 CSV
- 可在設定頁面中依網站授與或撤銷權限
- 支援介面語言切換

隱私權：

擷取結果只會儲存到本機的 Downloads 資料夾。擴充功能不會將頁面資料上傳到外部伺服器或雲端服務。

### 2.5 Korean (`ko`)

Auto Page Capture는 페이지가 원하는 상태에 도달한 뒤 저장할 수 있도록 도와주는 확장 프로그램입니다.

하나 이상의 캡처 항목을 만들고, 각 항목마다 대상 URL, 실행 일정, 출력 형식을 설정할 수 있습니다. 저장 전에 확장 프로그램은 페이지 업데이트가 끝날 때까지 기다리거나, 버튼 또는 링크를 클릭하거나, 입력 필드에 값을 넣거나, 요소 또는 속성 상태가 바뀔 때까지 기다릴 수 있습니다. 따라서 대시보드, 보고서, 차트, 뉴스 페이지처럼 저장 전에 짧은 상호작용이 필요한 페이지에 적합합니다.

예약 실행 관련 안내:

예약 실행은 브라우저가 실행 중이고 확장 프로그램을 사용할 수 있을 때만 동작합니다.

예약 시각에 브라우저가 완전히 종료되어 있으면 해당 실행은 건너뜁니다. 브라우저를 다시 시작한 뒤에도 놓친 실행을 자동으로 다시 실행하지 않으며, 다음 예정 시각부터 계속합니다.

지원 형식:

- MHTML
- HTML 스냅샷
- PDF
- PNG
- JPEG
- WebP

주요 기능:

- 여러 항목을 각각 독립적인 일정으로 관리
- 팝업에서 수동 실행
- 대기, 클릭, 값 입력, 요소 상태 대기 등의 저장 전 작업 지원
- 팝업에서 최근 실행 기록 확인
- 설정 페이지에서 상세 로그 확인
- JSON 또는 CSV 형식으로 로그 내보내기
- 설정 페이지에서 사이트별 권한 허용 및 해제
- UI 언어 전환

개인정보 보호:

캡처된 결과는 로컬 Downloads 폴더에만 저장됩니다. 확장 프로그램은 페이지 데이터를 외부 서버나 클라우드 서비스로 업로드하지 않습니다.

### 2.6 Spanish (`es`)

Auto Page Capture te ayuda a guardar páginas cuando ya han llegado al estado que necesitas.

Puedes crear uno o varios elementos de captura y definir para cada uno la URL de destino, la programación y el formato de salida. Antes de guardar, la extensión puede esperar a que la página termine de actualizarse, hacer clic en botones o enlaces, rellenar campos de formulario y esperar cambios en elementos o atributos. Por eso resulta útil para paneles, informes, gráficos, páginas de noticias y otras páginas que requieren una pequeña interacción antes de archivarse correctamente.

Nota sobre la programación:

Las capturas programadas solo se ejecutan mientras el navegador está en ejecución y la extensión está disponible.

Si el navegador está completamente cerrado en la hora programada, esa ejecución se omite. Cuando el navegador vuelve a iniciarse, la extensión continúa desde la siguiente hora programada y no repite automáticamente las ejecuciones perdidas.

Formatos compatibles:

- MHTML
- Instantánea HTML
- PDF
- PNG
- JPEG
- WebP

Funciones principales:

- Varios elementos con programaciones independientes
- Ejecución manual desde la ventana emergente
- Acciones opcionales antes de guardar, como esperar, hacer clic, establecer valores y esperar cambios de estado
- Historial reciente en la ventana emergente
- Registros detallados en la página de configuración
- Exportación de registros en JSON o CSV
- Concesión y revocación de permisos por sitio desde la configuración
- Cambio del idioma de la interfaz

Privacidad:

Las páginas capturadas se guardan solo en la carpeta local de Downloads. La extensión no sube los datos capturados a servidores externos ni a servicios en la nube.

### 2.7 French (`fr`)

Auto Page Capture vous aide à enregistrer une page une fois qu'elle a atteint l'état souhaité.

Vous pouvez créer un ou plusieurs éléments de capture et définir pour chacun l'URL cible, la planification et le format de sortie. Avant l'enregistrement, l'extension peut attendre la fin d'une mise à jour de page, cliquer sur des boutons ou des liens, renseigner des champs de formulaire et attendre des changements d'état d'éléments ou d'attributs. Elle convient donc bien aux tableaux de bord, rapports, graphiques, pages d'actualités et autres pages qui nécessitent une courte interaction avant d'être archivées correctement.

Remarque sur la planification :

Les captures planifiées ne s'exécutent que lorsque le navigateur est en cours d'exécution et que l'extension est disponible.

Si le navigateur est complètement fermé à l'heure prévue, cette exécution est ignorée. Lorsque le navigateur redémarre, l'extension reprend au prochain horaire prévu et ne relance pas automatiquement les exécutions manquées.

Formats pris en charge :

- MHTML
- Instantané HTML
- PDF
- PNG
- JPEG
- WebP

Fonctionnalités principales :

- Plusieurs éléments avec des planifications indépendantes
- Exécution manuelle depuis la fenêtre contextuelle
- Actions facultatives avant l'enregistrement : attendre, cliquer, définir une valeur ou attendre un changement d'état
- Historique récent dans la fenêtre contextuelle
- Journaux détaillés dans la page de paramètres
- Export des journaux au format JSON ou CSV
- Autorisation et révocation des accès par site depuis la page de paramètres
- Changement de langue de l'interface

Confidentialité :

Les pages capturées sont enregistrées uniquement dans le dossier local Downloads. L'extension n'envoie pas les données capturées vers un serveur externe ou un service cloud.

### 2.8 German (`de`)

Auto Page Capture hilft Ihnen dabei, Seiten erst dann zu speichern, wenn sie den gewünschten Zustand erreicht haben.

Sie können ein oder mehrere Erfassungselemente anlegen und für jedes Element die Ziel-URL, den Zeitplan und das Ausgabeformat festlegen. Vor dem Speichern kann die Erweiterung warten, bis eine Seite fertig aktualisiert ist, auf Schaltflächen oder Links klicken, Formularfelder ausfüllen und auf Änderungen von Elementen oder Attributen warten. Dadurch eignet sie sich für Dashboards, Berichte, Diagramme, Nachrichtenseiten und andere Seiten, die vor dem Archivieren eine kurze Interaktion benötigen.

Hinweis zur Zeitplanung:

Geplante Erfassungen werden nur ausgeführt, solange der Browser läuft und die Erweiterung verfügbar ist.

Wenn der Browser zum geplanten Zeitpunkt vollständig geschlossen ist, wird dieser Lauf übersprungen. Nach dem erneuten Start setzt die Erweiterung beim nächsten geplanten Zeitpunkt fort und holt verpasste Ausführungen nicht automatisch nach.

Unterstützte Formate:

- MHTML
- HTML-Schnappschuss
- PDF
- PNG
- JPEG
- WebP

Wichtige Funktionen:

- Mehrere Elemente mit unabhängigen Zeitplänen
- Manuelle Ausführung über das Popup
- Optionale Aktionen vor dem Speichern wie Warten, Klicken, Werte setzen und auf Statusänderungen warten
- Letzter Verlauf im Popup
- Detaillierte Protokolle auf der Einstellungsseite
- Protokollexport als JSON oder CSV
- Websitebezogene Berechtigungen direkt in den Einstellungen erlauben oder entziehen
- Wechsel der UI-Sprache

Datenschutz:

Erfasste Seiten werden nur im lokalen Downloads-Ordner gespeichert. Die Erweiterung lädt keine erfassten Seitendaten auf externe Server oder Cloud-Dienste hoch.

## 3. Suggested search terms

Use only the ones that genuinely match the listing. Do not stuff every term into the store metadata.

### 3.1 English (`en`)

- scheduled page capture
- webpage archive
- page snapshot
- auto screenshot
- pdf capture
- dashboard capture

### 3.2 Japanese (`ja`)

- ページ自動保存
- 定期保存
- Webアーカイブ
- スクリーンショット保存
- PDF保存
- ダッシュボード保存

### 3.3 Simplified Chinese (`zh-CN`)

- 定时网页保存
- 网页归档
- 页面快照
- 自动截图
- PDF 保存
- 仪表板抓取

### 3.4 Traditional Chinese (`zh-TW`)

- 定時網頁儲存
- 網頁封存
- 頁面快照
- 自動截圖
- PDF 儲存
- 儀表板擷取

### 3.5 Korean (`ko`)

- 웹페이지 자동 저장
- 예약 캡처
- 웹 아카이브
- 전체 페이지 스크린샷
- PDF 저장
- 대시보드 캡처

### 3.6 Spanish (`es`)

- guardado programado de páginas
- archivo web
- captura de página
- captura automática
- guardar en PDF
- captura de paneles

### 3.7 French (`fr`)

- capture planifiée de page
- archivage web
- instantané de page
- capture automatique
- enregistrement PDF
- capture de tableau de bord

### 3.8 German (`de`)

- geplante Seitenerfassung
- Webarchiv
- Seitenschnappschuss
- automatische Bildschirmaufnahme
- PDF speichern
- Dashboard-Erfassung

## 4. Submission notes

### 4.1 Edge Add-ons

- The package already exposes multiple locales, so store listing work should be planned with localization in mind.
- Keep the detailed description clear and concrete. Avoid marketing language that promises behavior the extension does not implement.
- Use the same logo and screenshots across languages if needed, then localize the description text first.

### 4.2 Notes for certification (`Edge Add-ons`)

Use this as the private certification note for testers. It is intentionally written in English for the review workflow and stays under the 2,000-character limit.

```text
No test account, username, password, paid subscription, or external service dependency is required.

Main UI:
- Options page: create and edit capture items, schedules, pre-save actions, permissions, logs, and settings
- Popup: run items manually and review recent history

Basic test flow:
1. Open the extension's Options page.
2. Create or edit an item and enter any public http/https URL.
3. Choose a save format.
4. Save the configuration.
5. Grant site access for that origin when prompted, either from the settings page or from the popup.
6. Open the popup and click Run to test a manual capture.
7. Confirm the result in Recent history in the popup and in Logs on the Options page.

Important notes:
- Scheduled runs work only while the browser is running and the extension is available.
- If the browser is fully closed at a scheduled time, that run is skipped and is not replayed automatically after startup.
- Captured files are saved to the local Downloads folder.
- PDF and image capture use the debugger permission and may fail if DevTools is attached to the same tab.
- The extension does not upload captured page data to any external server or cloud service.
```

### 4.3 Chrome Web Store

- Do not repeat the short description word-for-word at the start of the long description.
- Keep the first paragraph focused on what the extension does and when it is useful.
- Use screenshots that clearly show the popup and settings workflow.

## 5. Recommended first submission strategy

If you want to keep the first submission manageable:

1. Finalize the English and Japanese text first.
2. Reuse the same screenshots and logo across languages.
3. Add other listing languages only when you are ready to maintain them.
4. Keep every localized description aligned with the actual shipped behavior.
