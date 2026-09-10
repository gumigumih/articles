# AIとわたしの深夜エンタメ会議 候補一覧（2026-09-07）

9月1〜6日に確認できた発表を中心に、AIが「何を生成するか」だけでなく、制作工程・遊び方・ファンとの接点・権利と収益の流れを変える候補として整理した。発表元の主張と、記事での評価材料を分けている。価格や無料枠が公開されていないものは、未確認のまま補わない。

## 推奨（5件）

### 1. Visko「Orbis」――動画を納品物から、介入できる世界へ

- 分類: AIエンタメサービス／AI基盤・LLM（Live Model）
- 発表日: 2026-09-01
- 開発元: Visko。SunnyvaleのAI研究会社。Llama Ventures主導の1,000万ドルのpre-seed調達と、Orbisの一般公開を同時発表した。
- ニュース概要: テキスト・画像・動画から、固定尺のクリップではなく、生成中に指示を変えられる長時間の動画世界を作ると説明。技術報告では4K・24fps、持続メモリ、物理ダイナミクスを掲げる。
- 価格・提供形態・無料枠・デモ: 公式サイトで研究資料とデモを案内。公開アクセスの存在は確認できるが、料金、無料枠、API提供条件は今回確認した一次情報だけでは不明。
- 事業性・UX・技術の材料: 「作って待つ」から「世界に入り、途中で介入する」へUXが変わる。ゲーム、ライブ演出、インタラクティブ映像、訓練用シミュレーションに接続しやすい一方、4K/24fpsを誰がどのコストで継続提供できるか、長時間の一貫性を第三者が再現できるかが核心。
- なぜ今か／誰の行動・支払いが変わるか: 9月1日の一般公開と調達で、研究デモから試せるプロダクトへ移った。映像制作者は再生成の待ち時間より演出操作に支払い、視聴者は受け身の再生から介入に時間を使う可能性がある。
- 話題性: 公式発表に加え、PR Newswire、TestingCatalog、The Threshold Reportが同時期に報道。固有名詞の同時言及が確認でき、今週の流入候補として強い。
- 直近号との重複: #2のGoogle動画生成、#4のAstraとは「映像」でも、Orbisは完成クリップではなく状態を持つライブ生成。企業・UX論点は重複しない。
- 参照URL: [Visko公式](https://www.visko.ai/)、[技術報告（arXiv）](https://arxiv.org/abs/2607.26694)、[発表資料](https://en.prnasia.com/releases/global/ai-startup-visko-closes-10-million-pre-seed-round-and-launches-orbis-its-first-live-model-546064.shtml)

### 2. Nura Showcraft――生成モデルではなく、制作パイプラインを売る

- 分類: AIエンタメサービス（映像・アニメ制作）
- 発表日: 2026-09-01
- 開発元: Nura Studios。Unity、Adobe、Canva、Softimage、Roblox、Apple出身者が創業した、プロ向けAI制作技術・サービス会社。
- ニュース概要: script、shot list、conceptからstoryboard、animatic、animation、final editまでを一つの環境でつなぎ、複数の画像・動画モデルを協調させるShowcraftをPublic Early Accessで公開。
- 価格・提供形態・無料枠・デモ: サブスクではなく、生成前にコストを表示する一回購入のcredit package。購入クレジットは6か月有効。サブスクと追加プランは10月6日開始予定。無料枠・具体的な価格は未確認。APIとオンプレ提供も案内。
- 事業性・UX・技術の材料: 「画像を作れる」競争から、版管理・色管理・工程接続・納品までの摩擦を取る競争へ移る。導入事例はアニメシリーズ、縦型短編、長編映画だが、コスト半減は制作者側の発言であり、一般的成果とは分けて扱う。
- なぜ今か／誰の行動・支払いが変わるか: 9月1日の公開アクセスで、制作会社が試験導入できる段階に入った。個人制作者は単発クレジットで試し、企業はAPI・オンプレと既存パイプラインの接続に支払う構造。
- 話題性: Nura自身の発表がPR Newswireで9月1日に配信され、9月2日にも別言語版・媒体転載が確認できる。
- 直近号との重複: #4のAstraは制作ソフトを操作する相棒、Showcraftは制作工程を統合する環境。Astraの利用報告を再利用せず、プロ向け導入・課金・工程設計に絞る。
- 参照URL: [Nura発表](https://www.prnewswire.com/news-releases/ai-can-make-the-shot-nura-showcraft-makes-the-production-302866435.html)、[Nura Studios](https://nurastudios.com/)

### 3. Utopai Studios×DeNA――日本のアニメ制作でAIを評価工程に入れる

- 分類: AIエンタメサービス（アニメ制作）／権利・流通・ファン体験
- 発表日: 2026-09-03（米国発表時刻は9月2日）
- 開発元・企業: Utopai Studiosの長編向けAIシステムPAIと、ゲーム・ライブコミュニティなどを展開するDeNAのエンターテインメント開発部門。
- ニュース概要: PAIを日本のアニメ制作ワークフローで評価。visual development、キャラクター・背景、scene planning、production iterationを対象にし、クリエイターが方向性と最終承認を持つと説明。
- 価格・提供形態・無料枠・デモ: 企業間の評価協業であり、一般ユーザー向け価格、無料枠、公開デモは確認できない。
- 事業性・UX・技術の材料: 実運用導入ではなく評価段階だからこそ、どの工程をAIに切り出せるか、素材・IP・セキュリティのルールを先に設計できる。日本の制作現場で「作画を自動化する」話に短絡せず、企画・試作・反復の速度と責任分界を読む材料になる。
- なぜ今か／誰の行動・支払いが変わるか: 9月3日の発表で、日本の大手デジタル企業とAIネイティブなスタジオが具体的な検証に入った。支払い主体は個人ではなく制作会社で、制作スタッフの仕事は生成より選別・監督・権利確認へ寄る可能性がある。
- 話題性: Business Wire系転載、Yahoo Finance、StreetInsider、Utopai公式ニュースで同時期に確認できる。日本のDeNAが入るため国内読者との接続も強い。
- 直近号との重複: #4のAstraの個人試作とは異なり、企業間の管理された評価工程。#3のローカルAIとも、実行場所・顧客・責任が異なる。
- 参照URL: [Utopai公式ニュース](https://www.utopaistudios.com/news)、[発表転載（StreetInsider）](https://www.streetinsider.com/Business%2BWire/Utopai+Studios+and+Dena+Launch+Ai-assisted+Animation+Production+Collaboration+in+Japan/27020811.html)

### 4. Hasbro「Sixth Wall」――キャラクターの見た目ではなく、振る舞いをライセンスする

- 分類: 権利・流通・ファン体験／AIエンタメサービス
- 発表日: 2026-06-03（今週の新発表ではないため、優先度は上記3件より一段下げる）
- 開発元: HasbroのAIスタジオSixth Wall。ElevenLabsと提携し、CharacterOSと「Behavioral Licensing」を掲げる。Hasbroは玩具、ゲーム、映画、テレビなどを持つIP企業で、発表では年間10億人超のファンに触れている。
- ニュース概要: キャラクターの声だけでなく、人格、canon、会話、安全ガードレールを認可済み素材と人間の声の演技から構成し、会話ゲーム、デジタルコンパニオン、ロボット、位置情報型体験などへ提供する。
- 価格・提供形態・無料枠・デモ: ElevenLabs Iconic MarketplaceとSixth Wallでアクセス申請を受け付けるB2B・期間限定pilot。一般消費者向け価格や無料枠は未確認。
- 事業性・UX・技術の材料: これまでのIPライセンスに「どう考え、話し、反応するか」を加え、ファン体験を認可済みの継続接点に変える。価値は音声合成の品質だけでなく、canon逸脱、年齢対象、収益分配、声優参加を運用できるかにある。
- なぜ今か／誰の行動・支払いが変わるか: 非認可キャラクターのAI利用が広がる中、権利者が公式の会話面を売り始めた。ファンは作品を買うだけでなくキャラクターとの継続的な対話に時間・課金を振り向け、企業は安心材料込みのライセンスに支払う。
- 話題性: 6月発表だが、Hasbroの四半期説明でCharacterOSとライセンスpilotが再言及され、9月17日のVariety Entertainment & Technology SummitでもSixth Wall CEOが登壇予定。継続話題として扱える。
- 直近号との重複: #1のRyzaChat:AI、#2のキャラクター系サービスと隣接するが、非公式チャットではなく、権利者・声優・企業向けの認可モデルが中心。
- 参照URL: [Hasbro発表](https://investor.hasbro.com/news-releases/news-release-details/hasbro-launches-sixth-wall-new-ai-studio-building-next)、[Sixth Wall](https://sixthwallstudio.com/)、[Variety登壇情報](https://events.variety.com/enttech26/session/4303785/entertainment-and-media-in-the-age-of-ai)

### 5. CD Projekt Red――大作ゲームは「AIで作る」より、使わない範囲を説明する

- 分類: 権利・流通・ファン体験／AIエンタメサービス
- 発表日: 2026-09-02（決算説明会、報道は9月3日）
- 開発元: CD Projekt Red。The Witcher 4などを開発するゲーム会社。
- ニュース概要: 共同CEOが、AIはゲーム開発で使われているが、今後も人間を中心にゲームを作る方針だと説明。報道では、AI利用は雑務・補助的用途が中心と整理されている。
- 価格・提供形態・無料枠・デモ: 製品発表ではなく開発方針の説明。対象ゲームの価格・AI機能の無料枠・デモは今回の情報からは該当しない。
- 事業性・UX・技術の材料: AI利用の有無そのものより、ファンが購入前に制作姿勢を判断できるかが論点。生成AIを使った箇所、使わない箇所、外部素材・声の扱いを説明できれば、品質期待とブランド信頼の設計になる。
- なぜ今か／誰の行動・支払いが変わるか: Gamescom後もゲーム業界のAI利用が話題になり、決算説明会で大作側の立場が再び報じられた。プレイヤーは機能だけでなく制作ポリシーを購買判断に入れ、開発会社はAI導入の説明責任を負う。
- 話題性: PC Gamer、GamesRadarなど複数ゲーム媒体が9月3〜4日に同時報道。AIを使ったゲームへの反発・関心と結びつく。
- 直近号との重複: #2のAI利用ゲーム開示（TASMON）と近いが、インディーの細かな開示モデルではなく、大手が「人間中心」を方針として示した点が異なる。
- 参照URL: [PC Gamer](https://www.pcgamer.com/gaming-industry/game-development/cd-projekt-red-isnt-planning-to-rely-on-ai-making-complete-games-and-will-still-be-predominantly-using-people-for-the-witcher-4-and-beyond/)、[GamesRadar](https://www.gamesradar.com/games/the-witcher/the-witcher-4-dev-is-still-predominantly-using-people-over-ai-in-development-says-ceo-but-everybody-has-to-make-those-judgments-on-their-own/)

## 追加候補・見送り寄り

### 6. Apple MLXのMacローカルエージェント構成

- 分類: ローカルAI・個人創作／AI基盤
- 発表日: WWDC26公開、今回の再確認日: 2026-09-07
- 概要: AppleがMLX、MLX-LM、MLX-LM Server、エージェント層を組み合わせ、APIキーなしでMac上のローカルエージェントを動かす構成を解説。複数Macへの分散推論や、OpenCodeでSwiftUIアプリを作るデモもある。
- 価格・提供形態・無料枠・デモ: OSSと公式WWDC動画。ソフトウェア利用料・API料金は不要だが、Mac本体、メモリ、電力、モデルのライセンスは別。無料枠というより自己ホスト型。
- 評価材料: #3で既にローカルAIの中心として扱ったため、今回は単独推奨しない。個人創作、プライバシー、表現制約を避ける需要との接続は強いが、新規ニュース性が弱い。
- 参照URL: [Apple Developer WWDC26](https://developer.apple.com/videos/play/wwdc2026/232/)

### 7. BMG×Suno、認可済み音楽モデルと配布制限

- 分類: 権利・流通・ファン体験／AI音楽
- 発表日: 2026-08-12、関連するSunoの原則・制限は8月6日以降
- 概要: BMGの楽曲・出版カタログを対象に、Sunoが音楽業界と共同開発するモデルの枠組みを発表。Sunoは生成物の識別、watermarking、ストリーミングへの大量配布抑制も掲げる。
- 価格・提供形態・無料枠・デモ: Sunoの既存プラン・ダウンロード条件は更新中だが、今回確認した一次情報では新モデルの価格や無料枠は未確定。
- 評価材料: #1でSunoを扱ったため、企業重複が大きい。権利と収益分配の続報としては強いが、単独採用より他候補の権利パートに短く接続する方がよい。
- 参照URL: [BMG公式](https://www.bmg.com/news/bmg-and-suno-announce-global-strategic-alliance-advancing-ai-music-opportunities-and-revenue-streams)、[Warner-Suno発表資料](https://s206.q4cdn.com/940328283/files/doc_news/WARNER-MUSIC-GROUP-AND-SUNO-FORGE-GROUNDBREAKING-PARTNERSHIP-2025.pdf)

### 8. Snail Games/Egofold「AI Ranch・NHP」

- 分類: AIエンタメサービス（ゲーム内外のAI仲間）
- 発表日: 2026-08-04
- 概要: NPCやスクリプト型botではなく、プレイ経験から学習・適応する長期的なAI仲間「Non-Human Players」を発表。Ai4 2026で実演した。
- 価格・提供形態・無料枠・デモ: 会場デモと仮想デモの案内はあるが、一般向け製品価格・提供時期・無料枠は未確認。
- 評価材料: プレイヤーの継続利用や仲間意識に接続できる一方、学習データ、記憶のリセット、サーバー費用、ゲームバランスの設計が未公開。候補として残すが、今回の新規性は9月発表組に劣る。
- 参照URL: [Snail発表](https://investor.snail.com/news-releases/news-release-details/snail-inc-subsidiary-egofold-introduces-ai-ranch-and-nhpstm-new)、[Snail決算説明](https://investor.snail.com/news-releases/news-release-details/snail-inc-reports-second-quarter-2026-financial-results)

### 9. OpenAIの研究開発でcoding agent利用が急増

- 分類: AI基盤・LLM
- 発表日: 2026-09-06
- 概要: OpenAIが、研究者のcoding agent利用、同時実行、推論費用、実験数の変化を公開。8月半ばの中央値で1日600ドル超の推論を使う研究者がいると説明し、最終判断は人間が担うとする。
- 価格・提供形態・無料枠・デモ: OpenAIの社内利用データであり、一般ユーザー向け新プランや無料枠の発表ではない。API価格の具体的な比較は別途必要。
- 評価材料: AI研究・ゲーム開発ツールの作り方が変わる可能性はあるが、エンタメ読者が今すぐ試せるニュースではない。開発会社の組織設計や高額推論コストの話として、他候補の背景に短く使うのが妥当。
- 参照URL: [OpenAI公式](https://openai.com/index/research-acceleration-view-inside-openai/)

## 分類バランスと判断

- AI基盤・LLM: 2件（Apple MLX、OpenAI研究利用）。今週の新規ニュースとしては、エンタメへの直接接続が弱い。無理にLLM新発表を増やさない。
- ローカルAI・個人創作: Apple MLXの1件。前号と重複するため、今週は新規候補不足と明記する。ローカルモデルの新リリースは、一次情報と実行条件・ライセンスを同時に確認できるものが見つかり次第、次回以降に回す。
- AIエンタメサービス: Visko、Nura、Utopai×DeNA、Snailを配置。
- 権利・流通・ファン体験: Hasbro、CD Projekt Red、Sunoを配置。

### 記事化を推奨する3〜5件

1. Visko Orbis：ライブ生成と介入型視聴の変化を、技術・料金・継続コストまで評価できる。
2. Nura Showcraft：生成モデルではなく制作工程を売る構造が、#4のAstraと明確に差別化できる。
3. Utopai Studios×DeNA：日本のアニメ制作、IP管理、評価工程を具体的に掘れる。
4. Hasbro Sixth Wall：認可済みキャラクター、声優参加、ファン課金を権利面から扱える。
5. CD Projekt Red：AI導入の有無ではなく、購入前の開示とブランド信頼を考察できる。3〜4件構成にする場合は、HasbroまたはCDPRを選ぶ。

価格・無料枠が未公開の候補は、記事で数字を推測しない。企業発表の「使われている」「コスト半減」「4K/24fps」なども、第三者検証・一般化された成果とは分けて書く。
