// Issue-specific, editable analytical diagrams based on the confirmed article.
export function buildDiagrams({ presentation, article, fontFamily, addText, addRule, COLORS: C, membershipUrl, membershipQrBytes, coverImageBytes }) {
  if (article.slug !== '20260915_ai-entertainment-night-06') throw new Error('この図解構成はAIチャット×既存IPの第06回専用です。');
  const blue = C.teal;
  // Speaker notes are distributed with the deck: include sources, not research logs.
  const sourceNotes = body => [...new Set([...body.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)].map(m => `${m[1]}: ${m[2]}`))].join('\n');
  const t = (s, v, x, y, w, h = 60, size = 26, color = C.ink, bold = false) => addText(s, v, x, y, w, h, fontFamily, size, color, bold);
  const line = (s, x, y, w, h = 0, color = C.rule) => s.shapes.add({geometry:'line',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:color,width:2}});
  const arrow = (s,x,y,w,color=C.muted) => {
    line(s,x,y,w,0,color);
    s.shapes.add({geometry:'chevron',position:{left:x+w-10,top:y-7,width:12,height:14},fill:color,line:{fill:'none',width:0}});
  };
  const node = (s,label,x,y,w,detail='',color=blue) => {
    s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:88},fill:'none',line:{fill:color,width:2}});
    t(s,label,x+14,y+18,w-28,60,25,color,true);
    if(detail) t(s,detail,x,y+109,w,100,24);
  };
  const base = (title,section,kind='分析') => {
    const s=presentation.slides.add();s.background.fill=C.paper;
    const n=presentation.slides.items.length;
    t(s,`AIチャット×既存IP   ${n} / 9`,72,30,900,35,18,C.muted);
    t(s,title,72,94,1140,105,38,C.ink,true);
    t(s,kind,1050,32,160,35,18,C.accent,true);
    const body=(Array.isArray(section)?section:[section]).map(i=>article.themeSlides[i].body).join('\n\n');
    const sourceBody = [2,3,4,5,8].includes(n) ? article.themeSlides[1].body : n === 6 ? article.themeSlides[3].body : body;
    const sources = sourceNotes(sourceBody).split('\n').filter(v => n !== 6 || v.includes('investor.hasbro.com')).join('\n');
    s.speakerNotes.textFrame.setText(`${title}\n${sources}`);
    return s;
  };
  const footer=(s,text)=>{addRule(s,72,636,1208,C.rule);t(s,text,72,650,1136,55,18,C.muted);};
  const table=(s,values,widths,y=224,height=350)=>{
    const tb=s.tables.add({rows:values.length,columns:values[0].length,left:72,top:y,width:1136,height,columnWidths:widths,values});
    tb.borders.assign({fill:C.rule,width:1,style:'solid'});
    for(let r=0;r<values.length;r++)for(let c=0;c<values[0].length;c++){
      const cell=tb.getCell(r,c);cell.fill=r===0?C.dark:(c===0?'#EEF9FA':C.paper);
      cell.text.style={typeface:fontFamily,fontSize:24,color:r===0?C.white:C.ink,bold:r===0||c===0,autoFit:'none'};
    }
    return tb;
  };

  {
    const s=presentation.slides.add();s.background.fill=C.dark;
    t(s,'AIとわたしの深夜エンタメ会議 #06',80,60,1120,50,23,'#D7EEFF');
    t(s,'AIチャット×既存IPの\n体験設計',80,185,1120,190,64,C.white,true);
    t(s,'キャラクターと物語を進めるDMMキャラトークと、\n会話で冒険するRyzaChat:AIの比較',80,405,1120,110,30,'#D7EEFF');
    t(s,'遊び続ける理由と、それを支える運営を考える',80,544,1120,55,27,C.white);
    t(s,'2026年9月15日  /  ぐみ',80,631,1080,42,21,'#D7EEFF');
    s.speakerNotes.textFrame.setText(sourceNotes(article.themeSlides[1].body));
  }
  {
    const s=base('既存ゲームのキャラクターと話せる、二つのサービス',1,'公式情報');
    t(s,'既存IPとは、すでにある作品やキャラクターのこと。ここでは、ゲーム作品を使ったAIチャットを比べます。',72,200,1136,85,25);
    t(s,'DMMキャラトークの彩京作品',72,304,540,55,30,blue,true);
    t(s,'『ガンバード』『戦国ブレード』の\nキャラクターと会話し、物語に参加する\nストーリーチャット。',72,376,540,130,27);
    t(s,'RyzaChat:AI（ライザ）',686,304,522,55,30,C.accent,true);
    t(s,'『ライザのアトリエ』の世界を、\n会話で冒険するゲームです。\n探索・採集・調合・戦闘を進め、\n持ち物や通貨も管理します。',686,376,522,150,27);
    t(s,'共通点は「好きなキャラと話せること」。違いは、会話を通じて何を遊べるか。',72,552,1136,65,27,C.ink,true);
    footer(s,'出典：DMM公式発表、RyzaChat:AI公式サイト。比較対象はDMM全体ではなく、今回紹介された彩京作品です。');
  }
  {
    const s=base('DMMは物語への参加、ライザは冒険の操作にも会話を使う',1,'機能と模式例');
    t(s,'下図は公表機能をもとにした遊び方の模式例です。実際の操作手順や会話ログではありません。',72,195,1136,72,24,C.muted);
    t(s,'DMMの彩京作品',72,282,260,55,28,blue,true);
    node(s,'キャラと話す',354,274,250);arrow(s,616,318,38);
    node(s,'返答を受け取る',666,274,230);arrow(s,908,318,38);
    node(s,'物語を進める',958,274,250);
    t(s,'ライザ',72,423,260,50,28,C.accent,true);
    node(s,'素材を採集する',354,414,250,'',C.accent);arrow(s,616,458,38);
    node(s,'持ち物に残す',666,414,230,'',C.accent);arrow(s,908,458,38);
    node(s,'調合などに使う',958,414,250,'',C.accent);
    t(s,'ライザでは話の続きに加え、手に入れた物を使って遊びを進める楽しみがある。',72,552,1136,65,27,C.ink,true);
    footer(s,'出典：両サービスの公式情報。DMMの今回の発表には、ライザのような持ち物管理や戦闘の説明はありません。');
  }
  {
    const s=base('探索や収集は、物語の続き以外の再訪理由になり得る',2,'分析・仮説');
    t(s,'一度話して満足した人にも、未完了の目標が残れば、また開くきっかけになると考えられます。',72,200,1136,75,26);
    table(s,[['用意された楽しみ','利用者に残る気持ちの例','再訪したときの行動'],['物語・会話\n両サービスに共通','キャラクターの返答や\n物語の続きを知りたい','会話や物語を続ける'],['探索・収集・達成\nライザに加わる','足りない素材を集めたい\n次の場所へ行きたい','採集や探索を再開する']], [320,416,400],300,230);
    t(s,'物語を知りたい気持ちに、自分で進めたい目標も加わる。再訪のきっかけが広がり得る。',72,558,1136,65,26,C.accent,true);
    footer(s,'遊び方に基づく仮説です。継続率の向上を実証した結果ではありません。');
  }
  {
    const s=base('冒険を続けてもらうには、持ち物と会話の整合が要る',[2,5],'分析・架空の例');
    t(s,'例えば、素材を集めた後に「その素材で調合したい」と入力する場面を考えます。',72,205,1136,75,27);
    node(s,'採集で素材を入手',72,297,312);arrow(s,396,341,66);
    node(s,'持ち物に素材がある',474,297,328);arrow(s,814,341,66);
    node(s,'その素材で調合したい',892,297,316,'',C.accent);
    t(s,'会話と持ち物が合っていれば',72,433,540,55,28,blue,true);
    t(s,'集めた成果を使って、次の遊びへ進める。',72,493,540,90,27);
    t(s,'会話が「素材はない」と扱うと',688,433,520,55,28,C.accent,true);
    t(s,'それまでの行動が無駄に感じられ、\n続きを遊ぶ気持ちを損ねかねない。',688,493,520,100,27);
    footer(s,'実際の不具合報告ではなく説明用の架空例。運営には、口調や物語に加え、持ち物・進行と返答の確認が必要になります。');
  }
  {
    const s=base('ゲーム要素を加えると、監修・修正の対象も増える',[3,4,5],'運営上の分析');
    table(s,[['確認する範囲','物語・会話を中心にする場合','ゲーム要素も組み込む場合'],['両方に必要','原作らしい口調・設定\n物語のつながり、年齢への配慮','左と同じ確認が必要'],['運営が担うこと','問題のある返答を\n止めて直す体制を用意','左に加え、持ち物・進行と返答の\n食い違いも確認・修正']], [260,438,438],213,250);
    t(s,'参考：Hasbroの「Behavioral Licensing」は、\nキャラクターの人格・設定・声と、安全のための制限まで管理対象に含めます。\n会話を公開した後も、原作らしい振る舞いを保つことが運営の課題になります。',72,493,1136,110,25);
    footer(s,'出典：Hasbro公式。表は本文から整理した運営上の論点で、DMMやライザの実際の社内体制を示すものではありません。');
  }
  {
    const s=base('採算には、会話の生成だけでなく監修・更新の費用も関わる',5,'公表料金と分析');
    table(s,[['公表料金','RyzaChat:AI','DMMの彩京作品（PinxAI提供）'],['支払いの仕組み','月額980円 / 年額6,000円\n年額は割引表記、会話トークン別売','ストーリーチャットの料金表は\n10〜50ポイント']], [270,433,433],213,180);
    t(s,'遊び続けてもらう間は、会話を生成する費用に加え、\n原作らしさやゲームの整合性を保つための監修・修正・更新も続きます。',72,436,1136,100,27);
    t(s,'楽しみを増やす設計と、その体験を支え続けられる料金・運営を一緒に考える。',72,567,1136,65,27,C.ink,true);
    footer(s,'2026/9/15時点。年額割引の適用条件・商品ごとの会話量は未確認のため、総額の安さは比較していません。\n出典：日本向けApp Store、DMM料金案内、PinxAI規約第22条（PINX-CHAT-STORY）。');
  }
  {
    const s=base('遊びの幅を広げるなら、その続きを守る運営も必要になる',[1,2,5],'結論');
    t(s,'DMMの彩京作品とライザの違いは、キャラと話した後に何を楽しめるかにあります。',72,202,1136,75,27);
    table(s,[['比較から見えること','DMMの彩京作品','ライザ'],['用意された体験','会話を通じて物語に参加する','物語に加え、探索・収集・調合を遊ぶ'],['再訪の理由（仮説）','物語やキャラの返答が気になる','冒険で達成したい目標も残る'],['体験を守る条件','原作らしさと物語のつながり','左に加え、持ち物・進行との整合']], [285,421,430],292,257);
    t(s,'ゲーム要素には再訪理由を増やす可能性がある一方、会話とゲームをつなぐ運営が要る。',72,570,1136,60,26,C.accent,true);
    footer(s,'体験設計の違いを整理した比較です。継続率や収益性の優劣を示すものではありません。');
  }
  {
    const s=presentation.slides.add();
    s.background.fill=C.dark;
    s.images.add({blob:coverImageBytes,contentType:'image/png',alt:'AIとわたしの深夜エンタメ会議のカバー画像',fit:'cover',position:{left:0,top:0,width:1280,height:720}});
    s.shapes.add({geometry:'rect',position:{left:0,top:0,width:760,height:720},fill:C.dark,line:{fill:'none',width:0}});
    t(s,'AIとわたしの深夜エンタメ会議',72,68,710,48,26,C.white,true);
    t(s,'読んでくださって\nありがとうございました',72,164,650,142,48,C.white,true);
    t(s,'ぐみ',72,348,410,44,27,C.gold,true);
    t(s,'メンバーシップで、毎回の深掘りと\n会社ですぐ使える分析スライドをお届けします。',72,424,625,84,24,'#D7EEFF');
    t(s,membershipUrl,72,558,650,36,20,C.gold,true);
    s.shapes.add({geometry:'roundRect',position:{left:906,top:214,width:252,height:350},fill:C.white,line:{fill:C.gold,width:4},borderRadius:18});
    s.images.add({blob:membershipQrBytes,contentType:'image/png',alt:'ぐみのnoteメンバーシップへのQRコード',fit:'contain',position:{left:928,top:236,width:208,height:208}});
    t(s,'メンバーシップ\nはこちら',925,462,214,54,17,C.ink,true);
    t(s,'QRを読み取るか、\nURLからご覧ください',925,516,214,48,16,C.muted);
    s.speakerNotes.textFrame.setText(`メンバーシップ: ${membershipUrl}`);
  }
}
