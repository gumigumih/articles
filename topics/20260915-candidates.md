# AIとわたしの深夜エンタメ会議 候補一覧（2026-09-15・2週間分）

調査期間: 2026/9/2〜9/15。9/14の定期調査を取りこぼしたため、9/2以降の候補を既存メモと重複確認しながら再整理した。本文、カバー画像、X投稿、PPTXは作成しない。

## ソース別の調査件数

2週間分の入口調査で確認した範囲。延べ件数とユニークテーマを分け、Xは個別投稿を確定できたものだけを採用候補の根拠として数えた。

| ソース | 延べ確認 | ユニークテーマ | 状況 |
| --- | ---: | ---: | --- |
| 公式ニュース・サービスページ | 16件 | 10テーマ | OpenAI、Adobe、UMG/ElevenLabs、EA、Avid、Amazon、Apple等 |
| 独立報道・業界メディア | 11件 | 9テーマ | Variety、PC Gamer、TV Tech、IBC、Digital Camera World等 |
| PR TIMES・企業リリース | 5件 | 5テーマ | DMM、Defios、KLab、AIgekijo等 |
| X | 2件 | 1テーマ | GPT-Live-1の既確認投稿。今回追加候補の個別status URLは未確定 |
| Reddit等コミュニティ | 8件 | 4テーマ | NHL 27、Premiere、Train Sim World等。仕様の根拠には使わない |

PR TIMESとXは目標件数を満たしきれなかった。企業発表に偏った候補や、X反応を前提にする候補はスコアを下げ、記事化前に再確認する。

## 評価軸と絞り込み

各候補を以下の7軸で0〜5点、合計35点で仮採点した。25点以上を推薦目安、20〜24点を補欠目安とし、一次情報不足・実装状況不明・AI×エンタメの具体的変化が薄い候補は点数にかかわらず推薦から外した。

| 候補 | 判断価値 | 分析 | 根拠 | 鮮度 | 適合 | 具体性 | 差別化 | 合計 | 判定 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| GPT-Live-1 API | 5 | 5 | 4 | 5 | 5 | 4 | 4 | 32 | 推薦 |
| Adobe Premiere Generative Media Tool | 5 | 5 | 5 | 4 | 5 | 5 | 4 | 33 | 推薦 |
| UMG × ElevenLabs | 5 | 5 | 4 | 5 | 5 | 2 | 4 | 30 | 推薦 |
| EA『NHL 27』AI実況 | 5 | 5 | 4 | 5 | 5 | 4 | 5 | 33 | 推薦 |
| Prime Video AIリップシンク吹替 | 5 | 4 | 4 | 4 | 5 | 3 | 4 | 29 | 推薦 |
| DMMキャラトーク | 5 | 4 | 4 | 4 | 5 | 3 | 4 | 29 | 推薦 |
| Avid Content Core / Assist | 4 | 5 | 4 | 4 | 4 | 3 | 5 | 29 | 補欠 |
| Apple Reference Image | 4 | 4 | 4 | 4 | 4 | 3 | 5 | 28 | 補欠 |
| AIgekijo2026 | 3 | 4 | 2 | 4 | 4 | 3 | 4 | 24 | 補助 |
| Train Sim World 7のAI音声 | 4 | 4 | 2 | 5 | 4 | 3 | 5 | 27 | 要確認 |

## 記事化推薦

### 1. GPT-Live-1 API：キャラクターの声をリアルタイム体験へ渡せるか

- 発表日: 2026/9/10。
- 中心仮説: 音声合成ではなく、割り込み・応答テンポ・表現制御まで含む会話体験が、AITuber、ゲーム、ライブ配信の支払い理由になるか。
- 一次情報: [OpenAI公式発表](https://openai.com/index/introducing-gpt-live-1-in-the-api/)。Xは[OpenAI Developersの公式デモ](https://x.com/OpenAIDevs/status/2098099269551149398)と前回確認済みの開発者利用報告を候補として保持する。
- 未確認事項: API単価、長時間会話の安定性、声の権利、ログ保存、商用導入の実績。
- 見送る条件: 公式デモ以外の利用実態が再確認できず、音声UXではなくAPI仕様の要約に留まる場合。
- スライド化適性: 高。

### 2. Adobe Premiere Generative Media Tool：生成AIをタイムラインの内側へ置く

- 発表日: 2026/9/8〜9。
- 中心仮説: 生成品質より、編集アプリを離れずに動画・効果音を生成できることが、手戻りと制作コストを変えるか。
- 一次情報: [Adobe公式ブログ](https://blog.adobe.com/en/publish/2026/09/08/generate-create-directly-in-your-timeline-with-new-ai-powered-innovations-in-premiere-after-effects)、[公式ヘルプ](https://helpx.adobe.com/premiere/desktop/edit-projects/edit-with-generative-ai/generative-media-tool-overview.html)、[FAQ](https://helpx.adobe.com/premiere/desktop/edit-projects/edit-with-generative-ai/generative-media-tool-faq.html)。独立確認: [TV Tech](https://www.tvtechnology.com/production/adobe-to-feature-new-ai-powered-features-for-premiere-after-effects-at-ibc2026)。
- 未確認事項: プラン別の実質コスト、法人向けモデル制限、人物・ロゴ保持、Content Credentialsの実運用。
- X状況: 今回、記事に使える個別status URLは未確定。記事化前に公式デモまたは実利用者の投稿を再取得する。
- 見送る条件: Runway Pluginsとの差別化が説明できず、機能紹介だけになる場合。
- スライド化適性: 高。

### 3. UMG × ElevenLabs：ファンが公式にリミックスできる音楽権利設計

- 発表日: 2026/9/10。
- 中心仮説: AI音楽の争点が「無断学習」から、許諾済みカタログを使ったファン創作と価値分配へ移るか。
- 一次情報: [UMG公式](https://www.universalmusic.com/universal-music-group-and-elevenlabs-announce-multi-year-strategic-agreement-beginning-with-a-new-licensed-ai-music-creation-platform/)、[ElevenLabs公式](https://elevenlabs.io/blog/category/company)。独立確認: [Variety](https://au.variety.com/2026/music/news/umg-elevenlabs-ai-powered-music-platform-licensing-40165/)。
- 未確認事項: 公開日、参加アーティスト、料金、分配率、生成物の商用利用、削除申請。
- X状況: UMG/ElevenLabsの公式プロフィールは確認したが、個別status URLは未確定。公式発表だけで安全性や成功を断定しない。
- 見送る条件: 具体的な公開条件が発表されず、契約発表の紹介で終わる場合。
- スライド化適性: 高。

### 4. EA『NHL 27』：同意した実況者の声をAIで増やす

- 発表・報道日: 2026/9/10〜11。50回以上の収録を基礎に、John BuccigrossとDarren Pangの同意・協力のもとAI音声で実況のバリエーションを増やすとEAが説明。
- 中心仮説: 同意、報酬、監修、品質修正が揃えば、スポーツゲームの実況量と更新速度を増やせるか。
- 一次情報: [EA公式更新](https://www.ea.com/games/nhl/nhl-27/news)。独立確認: [PC Gamer](https://www.pcgamer.com/software/ai/electronic-arts-admits-to-using-ai-voices-in-nhl-27-this-process-allows-us-to-bring-more-variety-to-the-game/)。反応: [Reddit](https://www.reddit.com/r/EA_NHL/comments/1wcnpag/the_nhl_27_update_1_blog_is_live/)。
- 未確認事項: 契約範囲、報酬、AI生成箇所の表示、本人の監修範囲、他言語展開。
- X状況: NHL公式・関係者プロフィールは確認したが、記事に使える個別status URLは未確定。Xなしでも同意設計と品質問題で成立させる。
- 見送る条件: 実際の品質問題や監修範囲が確認できず、AI音声利用の事実紹介だけになる場合。
- スライド化適性: 高。

### 5. Prime VideoのAIリップシンク吹替：声を残して口元を合わせる

- 発表日: 2026/9/9。
- 中心仮説: 声優の吹替を残し、口元だけを合わせるAIが、ローカライズの速度と俳優の同意範囲をどう変えるか。
- 一次情報: [Amazon公式](https://www.aboutamazon.com/news/entertainment/prime-video-lip-sync-technology)。独立確認: [Neowin](https://www.neowin.net/news/amazon-prime-video-is-getting-ai-powered-dubbing-that-syncs-actors-lips-with-human-dubbed-audio/)。
- 未確認事項: 対応地域、追加料金、俳優契約、自然さの測定、作品ごとの表示。
- X状況: 視聴者の具体的な比較投稿は未確定。再取得できなければ公式・独立報道のみで扱う。
- 見送る条件: 実際の視聴比較がなく、生成映像一般の話に広がる場合。
- スライド化適性: 高。

### 6. DMMキャラトーク：既存IPを会話型体験へ広げる

- 発表日: 2026/9/10〜15。
- 中心仮説: 既存キャラクターを「見る・遊ぶ」から「会話しながら物語を進める」へ広げたとき、IP価値と課金は成立するか。
- 一次情報: [PR TIMES](https://prtimes.jp/main/html/rd/p/000005121.000002581.html)、[DMMキャラトーク](https://chara-talk.dmm.com/)。
- 未確認事項: 個別シナリオ価格、無料範囲、ログ利用、設定逸脱、利用者数・継続率。
- X状況: 公式発表以外の利用報告は未確認。企業発表を利用者評価に置き換えない。
- 見送る条件: 実際の会話体験・課金導線を確認できず、IP活用の告知だけになる場合。
- スライド化適性: 高。

## 補欠・確認不能候補

- **Avid Content Core / Avid Assist**: 制作コスト、素材、権利、エージェントを既存の制作統制下でつなぐB2B候補。[Avid公式](https://www.avid.com/press-room/2026/09/avid-content-core-expands-with-insights-and-intelligent-media-management-at-ibc2026)。分析は厚いが、一般読者には距離があり、実顧客の導入実績も未確認。
- **Apple Reference Image**: 撮影時のセンサーデータを参照画像として残し、生成画像時代の出所確認を支える候補。[Apple公式](https://images.apple.com/newsroom/2026/09/apple-debuts-iphone-18-pro-and-iphone-18-pro-max/)。X反応と地域条件の再確認が必要。
- **AIgekijo2026**: 2026/9/20に映画館で開催されるAI映像フェス。映画館上映と15秒作品の審査を組み合わせる点は面白いが、PR TIMES中心で独立報道・参加者反応が不足。[PR TIMES](https://prtimes.jp/main/html/rd/p/000000003.000163719.html)。
- **Train Sim World 7のElevenLabs音声**: スクリプトはDovetail Gamesが作成し、一部音声をElevenLabsで生成したとコミュニティ反応で確認。一次情報でAI音声の範囲を確定できていないため要確認。[公式発売情報](https://live.trainsimworld.com/news/play-tsw7-now-early-access)、[反応](https://www.reddit.com/r/TrailerWorldsGames/comments/1vz1323/train_sim_world_7_announce_trailer/)。
- **Defios『Do I Know You?』**: 生成AIをゲームの違和感判定へ組み込むTGS候補。発売後評価がなく、今回は補助事例へ。[PR TIMES](https://prtimes.jp/main/html/rd/p/000000003.000163457.html)。

## 2週間の掲載順案

### 案A: ファンが触るところから制作へ

GPT-Live-1 → DMMキャラトーク → NHL 27 → Prime Video → UMG × ElevenLabs → Adobe Premiere

個人の会話体験からIP、ゲーム音声、吹替、音楽権利、制作工程へ広げる。一般読者の入りやすさを優先する案。

### 案B: 権利と同意を軸にする

UMG × ElevenLabs → NHL 27 → Prime Video → DMMキャラトーク → GPT-Live-1 → Adobe Premiere

音楽・声・映像・IPの許諾と監修を並べ、AIエンタメの「使ってよい条件」を中心に読む案。

### 案C: 制作工程の変化を一直線にする

Adobe Premiere → Prime Video → UMG × ElevenLabs → NHL 27 → GPT-Live-1 → DMMキャラトーク

編集、ローカライズ、音楽、実況、音声会話、IP体験の順に、制作からファン接点へ進む案。

## 最終判断

- 最有力は **UMG × ElevenLabs**。権利許諾、ファン創作、収益分配という一つの問いにまとめやすい。ただし、公開条件が出なければAdobeまたはNHL 27へ繰り上げる。
- 速報性と検証可能性を優先するなら **Adobe Premiere**。公式ヘルプ・FAQまであり、利用条件を具体的に書ける。
- **NHL 27**は同意付きAI音声の具体例として強いが、契約・報酬・監修の確認が不足。
- Xの個別投稿が必要な切り口は、記事化前に公開状態と内容を再確認する。見つからない場合は、Xを使わない公式・独立報道ベースへ縮小する。
- noteダッシュボードは前回同様、今回のキャッチアップでも新しい実数値を取得できていない。候補の評価とPV・スキの因果関係は判断しない。

## 追加の構成案: DMMキャラトーク × 『ライザ』で見るAIチャット×IP

DMMキャラトーク単体の新サービス紹介にせず、既存記事で扱った『ライザのアトリエ』／RyzaChat:AIと組み合わせ、**AIチャット×IPの事例比較と方向性**として整理する案を追加する。

- **RyzaChat:AI**: 既存の強いIP名とキャラクターとの会話を入口にした先行事例。公開時の実績として、#1は『ライザのアトリエ』『RyzaChat:AI』をタイトル・冒頭で扱い、37ビュー・4スキだった。ただし2号比較であり、IP名がPVを増やした因果関係は断定しない。[月次分析](../topics/20260903-monthly-analysis.md)
- **DMMキャラトーク**: 彩京IPの『ガンバード』『戦国ブレード』を使い、キャラクターと会話しながら物語を進める。複数IP・多数シナリオ・ポイント課金・ユーザー作成キャラクターを組み合わせ、単発のIPチャットからプラットフォーム化へ進む事例として読める。[DMMキャラトーク候補メモ](20260914-candidates.md#9-dmmキャラトーク彩京ipのストーリーチャット既存ipを会話型体験へ)

### 比較する評価軸

| 比較軸 | RyzaChat:AI | DMMキャラトーク | 読者が判断すること |
| --- | --- | --- | --- |
| IPとの関係 | 強い単一IPのファン入口 | 複数IP・シナリオを束ねる場 | IPの強さとサービス規模のどちらが入口になるか |
| 会話の単位 | キャラクターとの継続会話 | ストーリーチャット・シナリオ進行 | 自由会話と物語設計のUX差 |
| 事業モデル | IP起点の話題化・利用導線を観察 | DMMポイント、複数作品、UGC導線 | 何に課金するのか、継続理由は何か |
| 品質管理 | キャラクターらしさ・原作設定 | 複数IPの設定・シナリオ・公開キャラ | canon逸脱、監修、ログ・二次利用をどう管理するか |
| 拡張性 | IPごとの個別展開 | プラットフォームとして横展開 | 作品追加が体験価値を増やすか、薄めるか |

### 記事の中心仮説

「AIチャット×IP」は、キャラクターをしゃべらせるだけでは継続課金にならない。IPの認知、会話の自然さ、原作らしさ、シナリオの更新、課金単位、権利者の監修を一つの運用として成立させられるかが勝負になる。RyzaChat:AIを“IPが会話の入口になる”事例、DMMキャラトークを“IP会話を複数作品へ商品化する基盤”として並べる。

### この構成を採る場合の注意

- RyzaChat:AIの現在の提供状況・料金・公式仕様は記事化前に再確認する。過去記事のPV・スキを成功事例や市場性の証拠にしない。
- DMMキャラトークの利用者数、継続率、売上、会話品質は未確認。企業発表を導入効果へ拡張しない。
- 新規ニュース6件をすべて並べる通常回より、AIチャット×IPに絞った特集または短めの通常回の方が論点がぶれにくい。
- タイトル案は仮に「AIチャット×IPは、キャラクターとの会話を商品にできるか」。確定タイトルではなく、候補選択後に再設計する。

## 追加リサーチ: AIチャット×既存IPの比較を深掘りする

今回のテーマでは、サービスを「AIでキャラクターが話す」と一括りにせず、**IPを会話商品に変える運用の型**で比較する。現時点で確認できる事例は、次の5類型に分かれる。

| 事例 | 型 | 確認できたこと | 現時点の評価 |
| --- | --- | --- | --- |
| RyzaChat:AI | 単一IPのファン接点 | 『ライザのアトリエ』のキャラクターとの会話を、月額・トーク消費と組み合わせる先行事例 | 日本のファン向け会話商品の具体例。ただし現行料金・継続率は再確認が必要 |
| DMMキャラトーク | 複数IPのストーリーチャット基盤 | 彩京IPのシナリオチャット、ポイント、ユーザー作成・公開キャラクターを同一サービスに置く | 単一IP商品からIP横断プラットフォームへ進む例。会話品質・利用実績は未確認 |
| Hasbro / Sixth Wall | 行動・人格のライセンス | Hasbroが「Behavioral Licensing」を掲げ、キャラクターの人格・設定・声・安全ガードレールを動的体験向けに管理。13歳以上向けを初期対象とする | 「見た目のライセンス」から「振る舞いのライセンス」への拡張として重要。ただし個別サービスの利用規模は未確認 |
| Hey Peppa Pig | 子ども向け安全設計 | HasbroとPersonality AIが、Fire Kids／Amazon Kids+でゲームや活動を通じてPeppa Pigと会話する体験を提供。WildBrainの発表ではCOPPA Safe Harbor認証にも言及 | 会話そのものより、対象年齢・安全審査・配信面を含む商品設計を考える事例 |
| Character.AIとDisney | 無許諾UGCの反面教師 | Disneyが無許諾キャラクター利用と子どもへの有害会話・ブランド毀損を問題視し、Character.AIがDisneyキャラクターを削除したと報道 | 公式IPチャットではないが、権利者が許容できる境界を示す負の比較対象 |

### ソースごとの追加確認件数

| ソース種別 | 件数 | 主な対象 | 判定 |
| --- | ---: | --- | --- |
| 権利者・提供企業の公式発表 | 5 | DMM、RyzaChat:AI、Hasbro/Sixth Wall、WildBrain/Peppa | 採用の中心。仕様・対象年齢・ライセンス表現を確認 |
| 独立報道 | 2 | Character.AIとDisney、Hypnosis MicのGenies提携報道 | 反応・背景の補助。Hypnosis Micは公式裏取り不足で保留 |
| コミュニティ反応 | 3 | Hypnosis Micのファン反応、Character.AIの削除反応 | 受容・反発の観測のみ。品質や売上の証拠にはしない |
| X個別投稿 | 0 | 今回のテーマでは未採用 | 検索結果だけで個別URLを確定できないため、無理に数えない |

### 追加の評価軸

候補を次の7軸で0〜5点評価すると、「知名度のあるキャラクターを会話させた」だけの候補が上位に残りにくくなる。

1. **IP固有性**: 原作を知らない汎用チャットとの差があるか
2. **会話商品性**: 会話、物語、ゲーム、音声など課金単位が見えるか
3. **canon忠実度**: キャラクターの設定・口調・関係性を維持する設計があるか
4. **更新性**: イベント、シナリオ、季節、作品追加で継続利用を作れるか
5. **権利・声の設計**: 許諾、出演者への還元、監修、削除・停止の仕組みが見えるか
6. **安全・対象年齢**: 未成年を含む場合のガードレール、データ、配信面が確認できるか
7. **検証可能性**: 公式仕様と独立情報があり、体験・料金・効果を確認できるか

### テーマ内の仮採点

| 候補 | IP固有性 | 会話商品性 | canon | 更新性 | 権利・声 | 安全 | 検証可能性 | 合計 | 判定 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| RyzaChat:AI | 5 | 4 | 4 | 3 | 4 | 3 | 3 | 26 | 採用候補 |
| DMMキャラトーク | 4 | 5 | 3 | 5 | 3 | 3 | 4 | 27 | 採用候補 |
| Hasbro / Sixth Wall | 5 | 4 | 5 | 4 | 5 | 5 | 4 | 32 | 強い比較候補 |
| Hey Peppa Pig | 5 | 4 | 4 | 4 | 5 | 5 | 4 | 31 | 強い比較候補 |
| Hypnosis Mic × Genies | 5 | 4 | 4 | 4 | 4 | 3 | 1 | 25 | 情報不足で保留 |
| Character.AIとDisney | 5 | 4 | 1 | 3 | 0 | 1 | 4 | 18 | 反面教師 |

### 現時点の方向性

特集の中心は、**RyzaChat:AI（単一IPの商品化）→DMMキャラトーク（複数IPの基盤化）→Hasbro/Sixth Wall（人格・行動のライセンス化）→Hey Peppa Pig（安全設計込みの商品化）**の4段階にするのがよい。

結論は「キャラクターが話せるか」ではなく、**誰に、何を話させ、どの範囲まで原作らしさを守り、どの頻度で更新し、誰が責任を持つか**が、AIチャット×既存IPの事業設計になる、という仮説でまとめる。

Hypnosis Micは話題性が高い一方、今回確認できたのは業界側の紹介とファン反応が中心で、King RecordsまたはGeniesによる一次発表を確定できていない。記事の主事例にはせず、公式発表が見つかった場合のみ「大規模IP横断展開」の補助事例に繰り上げる。

### 参照した追加ソース

- [Hasbro: Sixth WallとBehavioral Licensingの発表](https://investor.hasbro.com/news-releases/news-release-details/hasbro-launches-sixth-wall-new-ai-studio-building-next)
- [WildBrain: Personality AI買収とHey Peppa Pig](https://investors.wildbrain.com/news/news-details/2026/WildBrain-Acquires-Personality-AI-a-Trusted-Partner-for-Bringing-Beloved-Characters-to-Life/default.aspx)
- [Axios: DisneyがCharacter.AIに無許諾キャラクターの停止を要求したとの報道](https://www.axios.com/2025/09/30/disney-characterai-cease-desist)
- [Atlas: 企業キャラクターをAIキャラクター化する市場整理](https://www.atlas-tech.co.jp/en/ai-character)（Hypnosis Micの記述は企業側の紹介としてのみ参照）
