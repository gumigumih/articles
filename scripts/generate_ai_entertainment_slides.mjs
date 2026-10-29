#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_DIR = path.resolve(SCRIPT_DIR, "..");
const SKILL_DIR = "/Users/meggumi/.codex/plugins/cache/openai-primary-runtime/presentations/26.905.11957/skills/presentations";
const RUNTIME_NODE_MODULES = process.env.CODEX_RUNTIME_NODE_MODULES ?? "/Users/meggumi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";

const COLORS = {
  ink: "#0C1B45",
  muted: "#66718E",
  paper: "#F8F7FC",
  white: "#FFFFFF",
  accent: "#F1779E",
  accentSoft: "#FFE7F0",
  teal: "#007B91",
  gold: "#F8CE67",
  purple: "#7056BA",
  rule: "#D9D7E3",
  dark: "#071337",
};

const args = parseArgs(process.argv.slice(2));
if (!args.article) {
  throw new Error("確定記事を --article で指定してください。候補メモからの直接生成は廃止しました。");
}
if (args.theme !== "ai-entertainment-night") {
  throw new Error("--theme ai-entertainment-night を指定してください。テーマ未指定の汎用生成は禁止です。");
}
const inputPath = path.resolve(WORKSPACE_DIR, args.article);
if (inputPath.includes(`${path.sep}topics${path.sep}`) || path.basename(inputPath).endsWith("-candidates.md")) {
  throw new Error("候補メモはスライド入力にできません。本文確定後のMarkdownを --article で指定してください。");
}
const articleSlug = path.basename(inputPath, path.extname(inputPath));
const date = args.date ?? await readArticleDate(inputPath) ?? formatDate(new Date());
const outputDir = path.resolve(WORKSPACE_DIR, args.outputDir ?? "note/slides");
await fs.mkdir(outputDir, { recursive: true });

const markdown = await fs.readFile(inputPath, "utf8");
const outputPath = await nextAvailablePath(
  path.resolve(args.output ?? path.join(outputDir, `${articleSlug}.pptx`)),
);
const article = parseArticle(markdown, articleSlug, date);
const membershipUrl = "https://note.com/gumigumih/membership";
const membershipQrPath = path.join(WORKSPACE_DIR, "note/images/20260915_ai-entertainment-night-06/membership-qr.png");
const coverImagePath = path.join(WORKSPACE_DIR, "note/images/20260915_ai-entertainment-night-06/slide-theme-cover.png");
const generatedSlidePaths = Array.from({ length: 6 }, (_, index) => path.join(WORKSPACE_DIR, "note/images/20260924_jev-judgment-ai-use-cases/generated", `slide-0${index + 1}.png`));
const [membershipQrBytes, coverImageBytes] = await Promise.all([
  fs.readFile(membershipQrPath),
  fs.readFile(coverImagePath),
]);
const generatedSlideBytes = await Promise.all(generatedSlidePaths.map((filePath) => fs.readFile(filePath)));

const artifactTool = await import(
  pathToFileURL(path.join(RUNTIME_NODE_MODULES, "@oai/artifact-tool/dist/artifact_tool.mjs")).href,
);
process.env.RUNTIME_NODE_MODULES = process.env.RUNTIME_NODE_MODULES ?? RUNTIME_NODE_MODULES;
const utils = await import(
  pathToFileURL(path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs")).href,
);
const { Presentation, PresentationFile } = artifactTool;
const { finalizePresentation, makeNativeBulletParagraphs, resolvePresentationFont } = utils;
const fontFamily = resolvePresentationFont({ fontFamily: "M PLUS 1p" });

const presentation = Presentation.create({
  slideSize: { width: 1280, height: 720 },
});

// The magazine theme owns the full deck: cover, question, six approved theme
// sections, and the membership closing page. Never fall back to a generic deck.
if (article.themeSlides.length !== 6) {
  throw new Error("第2部を6章に整理してください。各章の冒頭3段落をスライドに反映します。");
}
addCover(presentation, article, fontFamily);
addThemeSlide(presentation, article, fontFamily);
for (const [index, section] of article.themeSlides.entries()) {
  const slide = newSlide(presentation, COLORS.paper);
  slide.images.add({ blob: generatedSlideBytes[index], contentType: "image/png", alt: `${section.heading}の図解スライド`, fit: "cover", position: { left: 0, top: 0, width: 1280, height: 720 } });
  addHeader(slide, "", fontFamily);
  addText(slide, section.heading, 82, 105, 1110, 64, fontFamily, 32, COLORS.ink, true);
  addGeneratedSlideLabels(slide, index, fontFamily);
  slide.speakerNotes.textFrame.setText(`確定本文: ${inputPath}\n第2部 / ${section.heading}\n\n${section.body}`);
}
addMembershipSlide(presentation, article, fontFamily, membershipUrl, membershipQrBytes, coverImageBytes);

const articleImageDir = path.join(WORKSPACE_DIR, "note/images", articleSlug);
await fs.mkdir(articleImageDir, { recursive: true });
for (const [index, slide] of presentation.slides.items.entries()) {
  const preview = await presentation.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(path.join(articleImageDir, `slide-${String(index + 1).padStart(2, "0")}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const buildDir = path.join(WORKSPACE_DIR, "temp", `ai-entertainment-slides-${date}-${process.pid}`);
const stagingDir = path.join(buildDir, "staging");
const receiptDir = path.join(WORKSPACE_DIR, "temp", "ai-entertainment-slide-validation");
await fs.mkdir(stagingDir, { recursive: true });
await fs.mkdir(receiptDir, { recursive: true });
const candidatePath = path.join(stagingDir, "candidate.pptx");
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);

const expectedSlideSizeEmu = "12192000,6858000";
const requirements = {
  explicitTotalSlideCount: 9,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
};
const fontPolicy = { basis: "user_request", families: [fontFamily] };
const validationPath = path.join(receiptDir, `${path.basename(outputPath)}-${process.pid}.validation.json`);

await finalizePresentation({
  ...requirements,
  workspaceDir: WORKSPACE_DIR,
  candidatePath,
  finalPath: outputPath,
  pythonExecutable: "/Users/meggumi/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3",
  integrityValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: [
    "--expected-slide-size-emu", expectedSlideSizeEmu,
    "--validate-bullet-geometry",
    "--validate-heading-fit",
    "--cover-role", "cover",
    ...requirements.requiredNativeTableOwnerSlides.flatMap(n => ["--require-native-table-slide", String(n)]),
  ],
  requiredNativeTableOwnerSlides: requirements.requiredNativeTableOwnerSlides,
  fontPolicy,
  verifyArtifactToolImport: true,
  receiptPath: validationPath,
});

console.log(JSON.stringify({
  input: inputPath,
  output: outputPath,
  article: article.title,
  slideCount: 9,
  validation: validationPath,
}, null, 2));

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    result[key] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
  }
  return result;
}

async function readArticleDate(articlePath) {
  const text = await fs.readFile(articlePath, "utf8");
  return text.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*$/m)?.[1]?.replaceAll("-", "");
}

function formatDate(dateValue) {
  return dateValue.toISOString().slice(0, 10).replaceAll("-", "");
}

async function nextAvailablePath(requestedPath) {
  const extension = path.extname(requestedPath);
  const stem = requestedPath.slice(0, -extension.length);
  let candidate = requestedPath;
  let version = 2;
  while (await exists(candidate)) {
    candidate = `${stem}-v${version}${extension}`;
    version += 1;
  }
  return candidate;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseArticle(markdownText, slug, dateValue) {
  const frontmatter = markdownText.match(/^---\n([\s\S]*?)\n---/);
  const frontmatterText = frontmatter?.[1] ?? "";
  const title = frontmatterText.match(/^title:\s*(?:["'](.+?)["']|(.+?))\s*$/m)?.slice(1).find(Boolean)
    ?? markdownText.match(/^#\s+(.+)$/m)?.[1]
    ?? slug;
  const bodyStart = frontmatter ? frontmatter.index + frontmatter[0].length : 0;
  const body = markdownText
    .slice(bodyStart)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^\s*!\[[^\]]*\]\([^\n]+\)\s*/m, "");
  const articleBody = body.replace(/^#\s+.+\n+/m, "").trim();
  const headings = [...articleBody.matchAll(/^##\s+(.+)$/gm)];
  const sections = headings.map((match, index) => ({
    heading: clean(match[1]),
    body: articleBody.slice(match.index + match[0].length, headings[index + 1]?.index ?? articleBody.length).trim(),
  }));
  const lead = clean(articleBody.slice(0, headings[0]?.index ?? articleBody.length)) || title;
  const preview = sections.find(({ heading }) => heading === "この先、深掘りするのは");
  const focusPoints = (preview?.body ?? "").split("\n")
    .filter((line) => /^-\s+/.test(line))
    .map((line) => clean(line.replace(/^-\s+/, "").replaceAll(/\*\*/g, "")))
    .filter(Boolean)
    .slice(0, 4);
  const contentSections = sections.filter(({ heading }) => ![
    "この先、深掘りするのは",
    "今夜はこのへんで",
  ].includes(heading));
  const themeSection = sections.find(({ heading }) => heading.startsWith("第2部")) ?? sections.find(({ heading }) => /テーマ/.test(heading));
  const themeSubheadings = themeSection
    ? [...themeSection.body.matchAll(/^###\s+(.+)$/gm)].map((match) => clean(match[1])).slice(0, 4)
    : [];
  const subheadings = [...articleBody.matchAll(/^###\s+(.+)$/gm)].map((match) => clean(match[1])).slice(0, 4);
  const urls = [...markdownText.matchAll(/https?:\/\/[^\s)]+/g)].map((match) => match[0]);
  const themeMatches = [...(themeSection?.body ?? "").matchAll(/^###\s+(.+)$/gm)];
  const rawThemeSlides = themeMatches.map((match, index) => ({
    heading: clean(match[1]),
    body: themeSection.body.slice(match.index + match[0].length, themeMatches[index + 1]?.index ?? themeSection.body.length).trim(),
  }));
  const themeIntro = rawThemeSlides.find(({ heading }) => heading.startsWith("Jevは何を入力"));
  const themeSlides = rawThemeSlides.filter(({ heading }) => !heading.startsWith("Jevは何を入力"));
  return { slug, date: dateValue, title, lead, themeHeading: themeSection?.heading ?? title, themeLead: themeSection ? firstParagraph(themeSection.body) : lead, themeIntro, sections: contentSections, focusPoints, themeSubheadings, subheadings, urls, themeSlides };
}

function firstParagraph(value) {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => clean(paragraph.replace(/^#{1,6}\s+/gm, "").replace(/^[-*]\s+/, "")))
    .find(Boolean) ?? "本文を参照";
}

function clean(value) {
  return value.replaceAll(/\s+/g, " ").trim();
}

function truncate(value, max = 240) {
  const text = clean(value || "記載なし");
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function addCover(deck, article, fontFamilyValue) {
  const slide = newSlide(deck, COLORS.dark);
  addText(slide, "AIとわたしの深夜エンタメ会議", 78, 110, 920, 48, fontFamilyValue, 28, "#D9E2EA", true);
  addText(slide, truncate(article.title, 58), 78, 205, 1120, 120, fontFamilyValue, 42, COLORS.white, true);
  addText(slide, `${article.date.slice(0, 4)}.${article.date.slice(4, 6)}.${article.date.slice(6, 8)}`, 82, 390, 420, 36, fontFamilyValue, 22, "#D9E2EA");
  addText(slide, "記事のおまけ｜社内共有用ミニスライド", 82, 560, 720, 34, fontFamilyValue, 22, "#D9E2EA");
  slide.speakerNotes.textFrame.setText(article.urls.join("\n"));
}

function addThemeSlide(deck, article, fontFamilyValue) {
  const slide = newSlide(deck, COLORS.paper);
  addHeader(slide, "この記事の問い", fontFamilyValue);
  addText(slide, truncate(article.themeHeading, 52), 78, 155, 1120, 100, fontFamilyValue, 30, COLORS.ink, true);
  addText(slide, truncate(article.themeLead, 150), 82, 270, 1040, 72, fontFamilyValue, 22, COLORS.accent, true);
  addText(slide, truncate(firstParagraph(article.themeIntro?.body ?? ""), 170), 82, 365, 1060, 70, fontFamilyValue, 19, COLORS.ink);
  addQuestionDiagram(slide, fontFamilyValue);
  slide.speakerNotes.textFrame.setText(article.urls.join("\n"));
}

function addArticleMapSlide(deck, article, fontFamilyValue) {
  const slide = newSlide(deck, COLORS.white);
  addHeader(slide, "記事の流れ", fontFamilyValue);
  const sections = article.sections.slice(0, 3);
  if (sections.length === 0) {
    addText(slide, truncate(article.lead, 360), 82, 170, 1100, 180, fontFamilyValue, 25, COLORS.ink);
  } else {
    sections.forEach((section, index) => {
      const top = 150 + index * 170;
      addText(slide, `${String(index + 1).padStart(2, "0")}  ${truncate(section.heading, 42)}`, 82, top, 1050, 34, fontFamilyValue, 24, COLORS.accent, true);
      addText(slide, truncate(firstParagraph(section.body), 170), 122, top + 48, 1000, 80, fontFamilyValue, 20, COLORS.ink);
      if (index < sections.length - 1) addRule(slide, 122, top + 145, 1180, COLORS.rule);
    });
  }
  slide.speakerNotes.textFrame.setText(article.urls.join("\n"));
}

function addFocusSlide(deck, article, fontFamilyValue) {
  const slide = newSlide(deck, COLORS.paper);
  addHeader(slide, "記事で確認した判断材料", fontFamilyValue);
  const points = article.themeSubheadings.length > 0
    ? article.themeSubheadings
    : article.focusPoints.length > 0
      ? article.focusPoints
      : article.subheadings.length > 0
        ? article.subheadings
        : article.sections.map(({ heading }) => heading);
  addBullets(slide, points.slice(0, 4), 92, 170, 1070, 360, fontFamilyValue, 25);
  addText(slide, "本文に書かれた範囲を、判断材料として持ち帰る", 92, 610, 1000, 32, fontFamilyValue, 17, COLORS.muted);
  slide.speakerNotes.textFrame.setText(article.urls.join("\n"));
}

function addTakeawaySlide(deck, article, fontFamilyValue) {
  const slide = newSlide(deck, COLORS.white);
  addHeader(slide, "持ち帰り用チェック", fontFamilyValue);
  addText(slide, "導入の可否より、最初に任せる範囲を決める", 82, 145, 1080, 48, fontFamilyValue, 30, COLORS.ink, true);
  addBullets(slide, [
    "記事の事実と、自社での仮説を分けて話す",
    "権利、品質確認、利用ログ、費用の上限を先に確認する",
    "応用条件が未確認なら、未確認のまま保留する",
    `本文のテーマ論点：${truncate(article.themeSubheadings[0] ?? article.focusPoints[0] ?? article.subheadings[0] ?? "記事本文を参照", 100)}`,
  ], 92, 260, 1070, 300, fontFamilyValue, 22);
  addText(slide, "確定した記事本文からの要約", 92, 635, 900, 26, fontFamilyValue, 15, COLORS.muted);
  slide.speakerNotes.textFrame.setText(article.urls.join("\n"));
}

function addSourcesSlide(deck, article, fontFamilyValue) {
  const slide = newSlide(deck, COLORS.dark);
  addHeader(slide, "出典と読み方", fontFamilyValue, COLORS.white);
  addText(slide, "企業発表・独立報道・利用報告を分けて読む", 82, 145, 1080, 45, fontFamilyValue, 30, COLORS.white, true);
  addBullets(slide, [
    "PR TIMESや公式発表：企業が発表した内容",
    "独立報道：発表の背景や第三者の確認",
    "利用報告：個別の試行であり、一般的な効果の証明ではない",
    "この資料の判断：確定した記事本文の範囲に限定する",
  ], 92, 250, 1070, 220, fontFamilyValue, 21, "#E8EEF3");
  const uniqueUrls = [...new Set(article.urls)];
  const sourceLabels = uniqueUrls.slice(0, 6).map((url) => shortSource(url));
  addText(slide, sourceLabels.join("\n"), 92, 515, 1080, 120, fontFamilyValue, 15, "#C9D4DD");
  slide.speakerNotes.textFrame.setText(uniqueUrls.join("\n"));
}

function addMembershipSlide(deck, article, fontFamilyValue, membershipUrl, membershipQrBytes, coverImageBytes) {
  const slide = newSlide(deck, COLORS.dark);
  slide.images.add({
    blob: coverImageBytes,
    contentType: "image/png",
    alt: "AIとわたしの深夜エンタメ会議のカバー画像",
    fit: "cover",
    position: { left: 0, top: 0, width: 1280, height: 720 },
  });
  slide.shapes.add({
    geometry: "rect",
    position: { left: 0, top: 0, width: 760, height: 720 },
    fill: COLORS.dark,
    line: { fill: "none", width: 0 },
  });
  addText(slide, "AIとわたしの深夜エンタメ会議", 72, 68, 710, 48, fontFamilyValue, 26, COLORS.white, true);
  addText(slide, "読んでくださって\nありがとうございました", 72, 164, 650, 142, fontFamilyValue, 48, COLORS.white, true);
  addText(slide, "ぐみ", 72, 348, 410, 44, fontFamilyValue, 27, COLORS.gold, true);
  addText(slide, "メンバーシップで、毎回の深掘りと\n会社ですぐ使える分析スライドをお届けします。", 72, 424, 625, 84, fontFamilyValue, 24, "#D7EEFF");
  addText(slide, membershipUrl, 72, 558, 650, 36, fontFamilyValue, 20, COLORS.gold, true);
  slide.shapes.add({
    geometry: "roundRect",
    position: { left: 906, top: 214, width: 252, height: 350 },
    fill: COLORS.white,
    line: { fill: COLORS.gold, width: 4 },
    borderRadius: 18,
  });
  slide.images.add({
    blob: membershipQrBytes,
    contentType: "image/png",
    alt: "ぐみのnoteメンバーシップへのQRコード",
    fit: "contain",
    position: { left: 928, top: 236, width: 208, height: 208 },
  });
  addText(slide, "メンバーシップ\nはこちら", 925, 462, 214, 54, fontFamilyValue, 17, COLORS.ink, true);
  addText(slide, "QRを読み取るか、\nURLからご覧ください", 925, 516, 214, 48, fontFamilyValue, 16, COLORS.muted);
  slide.speakerNotes.textFrame.setText(`メンバーシップ: ${membershipUrl}\n記事: ${article.title}`);
}

function addQuestionDiagram(slide, fontFamilyValue) {
  const box = (x, y, w, h, label, color = COLORS.teal, fill = COLORS.white, size = 18) => {
    slide.shapes.add({ geometry: "rect", position: { left: x, top: y, width: w, height: h }, fill, line: { fill: color, width: 3 } });
    addText(slide, label, x + 12, y + 14, w - 24, h - 20, fontFamilyValue, size, COLORS.ink, true);
  };
  const arrow = (x, y, color = COLORS.muted) => slide.shapes.add({ geometry: "chevron", position: { left: x, top: y, width: 28, height: 20 }, fill: color, line: { fill: "none", width: 0 } });

  addText(slide, "入力されたセリフ", 92, 445, 250, 28, fontFamilyValue, 17, COLORS.muted, true);
  box(92, 480, 240, 64, "今日はうれしい", COLORS.teal, "#E2F3F2", 19);
  arrow(360, 502, COLORS.teal);
  box(405, 480, 280, 64, "Jev：喜びと判定", COLORS.accent, COLORS.accentSoft, 19);
  arrow(713, 502, COLORS.accent);
  box(758, 480, 340, 64, "ゲーム側が返事・分岐を選ぶ", COLORS.purple, "#EEE8FF", 18);
  addText(slide, "既存LLMは返事の文章を作る。Jevは返事や分岐を選ぶ材料を返す。", 92, 575, 1060, 32, fontFamilyValue, 17, COLORS.ink);
}

function addThemeDiagram(slide, index, fontFamilyValue) {
  const box = (x, y, w, h, label, color = COLORS.teal, fill = COLORS.white, size = 18) => {
    slide.shapes.add({ geometry: "rect", position: { left: x, top: y, width: w, height: h }, fill, line: { fill: color, width: 3 } });
    addText(slide, label, x + 12, y + 14, w - 24, h - 20, fontFamilyValue, size, COLORS.ink, true);
  };
  const arrow = (x, y, color = COLORS.muted) => slide.shapes.add({ geometry: "chevron", position: { left: x, top: y, width: 28, height: 20 }, fill: color, line: { fill: "none", width: 0 } });
  const line = (x, y, w, h, color = COLORS.rule) => slide.shapes.add({ geometry: "line", position: { left: x, top: y, width: w, height: h }, fill: "none", line: { fill: color, width: 2 } });
  const table = (values, widths, y, height) => {
    const tableShape = slide.tables.add({ rows: values.length, columns: values[0].length, left: 82, top: y, width: 1116, height, columnWidths: widths, values });
    tableShape.borders.assign({ fill: COLORS.rule, width: 1, style: "solid" });
    for (let row = 0; row < values.length; row += 1) {
      for (let col = 0; col < values[0].length; col += 1) {
        const cell = tableShape.getCell(row, col);
        cell.fill = row === 0 ? COLORS.dark : (col === 0 ? "#EEF9FA" : COLORS.paper);
        cell.text.style = {
          typeface: fontFamilyValue,
          fontSize: 16,
          color: row === 0 ? COLORS.white : COLORS.ink,
          bold: row === 0 || col === 0,
          autoFit: "none",
        };
      }
    }
  };

  if (index === 0) {
    addText(slide, "既存LLM", 120, 245, 330, 32, fontFamilyValue, 24, COLORS.teal, true);
    addText(slide, "Jev", 730, 245, 330, 32, fontFamilyValue, 24, COLORS.accent, true);
    box(110, 290, 470, 112, "返事の文章・説明を作る\n会話の内容を生成する", COLORS.teal, "#E2F3F2", 20);
    box(700, 290, 470, 112, "分類・確率・評価を返す\nゲームが選べる材料にする", COLORS.accent, COLORS.accentSoft, 20);
    line(640, 260, 0, 170, COLORS.rule);
    addText(slide, "文章を作るAIと、処理を選ぶAIは役割が違う", 240, 430, 800, 32, fontFamilyValue, 19, COLORS.ink, true);
  } else if (index === 1) {
    box(115, 270, 250, 66, "文章・データ", COLORS.teal, "#E2F3F2");
    arrow(395, 293, COLORS.teal);
    box(440, 270, 250, 66, "Jevで判定", COLORS.accent, COLORS.accentSoft, 19);
    arrow(720, 293, COLORS.accent);
    box(765, 235, 280, 58, "AかBかを判定", COLORS.purple, "#EEE8FF", 17);
    box(765, 315, 280, 58, "営業・請求・サポートへ振り分け", COLORS.purple, "#EEE8FF", 16);
    addText(slide, "判定結果を、次の処理へ渡す", 300, 410, 700, 32, fontFamilyValue, 19, COLORS.ink, true);
  } else if (index === 2) {
    box(440, 240, 400, 66, "プレイヤーの発言", COLORS.teal, "#E2F3F2", 19);
    line(640, 306, 0, 50, COLORS.teal);
    line(350, 356, 580, 0, COLORS.teal);
    line(350, 356, 0, 34, COLORS.teal);
    line(930, 356, 0, 34, COLORS.teal);
    box(180, 390, 340, 66, "感情・話題を判定\nキャラクターの返事", COLORS.accent, COLORS.accentSoft, 17);
    box(760, 390, 340, 66, "はい／いいえの確率\n逆アキネイター", COLORS.purple, "#EEE8FF", 17);
  } else if (index === 3) {
    box(110, 270, 260, 66, "映像・素材", COLORS.teal, "#E2F3F2");
    arrow(400, 293, COLORS.teal);
    box(445, 270, 300, 66, "良否・候補・カットを判定", COLORS.accent, COLORS.accentSoft, 17);
    arrow(775, 293, COLORS.accent);
    box(820, 270, 300, 66, "人が編集工程で選ぶ", COLORS.purple, "#EEE8FF", 18);
    addText(slide, "「選ぶ」作業にも、判断の出力を渡せる", 260, 410, 760, 32, fontFamilyValue, 19, COLORS.ink, true);
  } else if (index === 4) {
    addText(slide, "生成する条件", 105, 245, 360, 30, fontFamilyValue, 22, COLORS.teal, true);
    addText(slide, "作品で使う条件", 760, 245, 360, 30, fontFamilyValue, 22, COLORS.accent, true);
    box(105, 290, 390, 58, "キャラクターの声", COLORS.teal, "#E2F3F2", 18);
    box(105, 365, 390, 58, "セリフの間・感情・方言", COLORS.teal, "#E2F3F2", 18);
    box(770, 290, 390, 58, "誰の声を使うか", COLORS.accent, COLORS.accentSoft, 18);
    box(770, 365, 390, 58, "どの範囲で使ってよいか", COLORS.accent, COLORS.accentSoft, 18);
  } else {
    table([
      ["担当", "役割", "出力・受け渡し"],
      ["既存LLM", "返事や説明などの文章・会話を作る", "ゲームやサービスへ文章を渡す"],
      ["Jev", "入力を分類し、分岐や選択肢を判定する", "ゲームやサービスへ判断結果を渡す"],
      ["Gemini TTS", "声・間・感情などの演技を作る", "音声制作やゲームへ声を渡す"],
      ["システム・人", "出力を組み込み、確認・修正する", "利用者や制作工程へ届け、失敗時は戻す"],
    ], [190, 470, 456], 225, 175);
    addText(slide, "AIの種類ではなく、出力をどこへ渡し、誰が確認するかを見る", 180, 416, 920, 32, fontFamilyValue, 19, COLORS.ink, true);
  }
}

function addGeneratedSlideLabels(slide, index, fontFamilyValue) {
  const label = (text, left, top, width, size = 20, color = COLORS.ink, bold = true) => addText(slide, text, left, top, width, 42, fontFamilyValue, size, color, bold);
  const note = (text, left, top, width) => addText(slide, text, left, top, width, 34, fontFamilyValue, 17, COLORS.muted);
  const explain = (text) => addText(slide, text, 100, 620, 1080, 78, fontFamilyValue, 17, COLORS.ink, false);
  if (index === 0) {
    label("入力", 120, 300, 180, 22, COLORS.teal);
    explain("入力された文章やデータを、Jevが分類・評価し、ゲームやサービスが次の処理を選べる形にする。\nJev自身が最終回答の文章を完成させる図ではない。");
  } else if (index === 1) {
    label("文章・説明", 510, 220, 220, 20, COLORS.teal);
    label("既存LLM", 930, 220, 180, 20, COLORS.purple);
    label("入力の分類", 500, 520, 220, 20, COLORS.accent);
    label("Jev", 930, 520, 180, 20, COLORS.accent);
    explain("既存LLMは文章を作り、Jevは分類結果を返す。役割を分けることで、判定結果を次の処理へ接続できる。");
  } else if (index === 2) {
    label("入力", 110, 330, 150, 22, COLORS.teal);
    label("Jevの判断", 560, 235, 180, 22, COLORS.accent);
    label("次の処理", 1010, 620, 180, 22, COLORS.purple);
    explain("判定結果は、ゲームの分岐やサービスの振り分けなど、別の処理へ渡して使う。\n判定だけで終わらず、受け取る側の処理まで設計する。");
  } else if (index === 3) {
    label("プレイヤーの発言", 470, 215, 300, 22, COLORS.teal);
    label("感情・話題", 150, 520, 220, 20, COLORS.accent);
    label("はい／いいえの確率", 820, 600, 260, 20, COLORS.purple);
    explain("プレイヤーの発言を感情や話題へ分類し、その結果をゲームの返事と分岐に使う。\n会話文そのものをJevが書くとは限らない。");
  } else if (index === 4) {
    label("声・間・感情", 175, 610, 280, 22, COLORS.teal);
    label("作品で使う条件", 870, 610, 280, 22, COLORS.accent);
    label("生成する条件", 175, 550, 280, 20, COLORS.teal);
    label("許可と利用範囲", 870, 550, 280, 20, COLORS.accent);
    explain("TTSは声・間・感情を生成する。作品に入れる前に、声の持ち主と利用できる範囲を確認する。");
  } else {
    label("入力", 85, 430, 150, 20, COLORS.teal);
    label("分類・分岐", 315, 245, 180, 20, COLORS.accent);
    label("声", 575, 245, 100, 20, COLORS.accent);
    label("システム", 790, 245, 150, 20, COLORS.teal);
    label("人の確認", 1040, 245, 150, 20, COLORS.purple);
    explain("企画会議では、入力・判定や生成・受け渡し・確認・失敗時の戻り先を一続きで確認する。\nAIの出力を置くだけでは、作品の体験にはつながらない。");
  }
}

function newSlide(deck, background) {
  const slide = deck.slides.add();
  slide.background.fill = background;
  return slide;
}

function addHeader(slide, text, fontFamilyValue, color = COLORS.ink) {
  addText(slide, "AIとわたしの深夜エンタメ会議", 82, 45, 620, 26, fontFamilyValue, 15, color, true);
  addRule(slide, 82, 92, 1180, color === COLORS.white ? "#667887" : COLORS.rule);
  addText(slide, text, 82, 105, 900, 35, fontFamilyValue, 18, color, true);
}

function addText(slide, text, left, top, width, height, fontFamilyValue, fontSize, color, bold = false) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left, top, width, height },
    fill: "none",
    line: { fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    typeface: fontFamilyValue,
    fontSize,
    color,
    bold,
    autoFit: "none",
  };
  return shape;
}

function addBullets(slide, items, left, top, width, height, fontFamilyValue, fontSize, color = COLORS.ink) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left, top, width, height },
    fill: "none",
    line: { fill: "none", width: 0 },
  });
  shape.text = makeNativeBulletParagraphs(items.map((item) => truncate(item, 170)), {
    marginLeftPoints: 18,
    hangingPoints: 9,
    spaceAfterPoints: 8,
  });
  shape.text.style = {
    typeface: fontFamilyValue,
    fontSize,
    color,
    autoFit: "none",
  };
  return shape;
}

function addRule(slide, left, top, right, color) {
  slide.shapes.add({
    geometry: "line",
    position: { left, top, width: right - left, height: 0 },
    fill: "none",
    line: { style: "solid", fill: color, width: 1 },
  });
}

function shortSource(url) {
  try {
    const parsed = new URL(url);
    const pathText = parsed.pathname === "/" ? "" : parsed.pathname;
    return `${parsed.hostname}${pathText}`.slice(0, 92);
  } catch {
    return url.slice(0, 92);
  }
}
