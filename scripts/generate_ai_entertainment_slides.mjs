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
const [membershipQrBytes, coverImageBytes] = await Promise.all([
  fs.readFile(membershipQrPath),
  fs.readFile(coverImagePath),
]);

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

// Each theme section owns one slide; keep its actual argument and evidence.
// Reject underspecified articles instead of filling slides with generic copy.
if (article.themeSlides.length !== 6) {
  throw new Error("第2部を6章に整理してください。各章の冒頭3段落をスライドに反映します。");
}
if (args.diagrams) {
  const { buildDiagrams } = await import('./ai_entertainment_ip_diagrams.mjs');
  buildDiagrams({ presentation, article, fontFamily, addText, addRule, COLORS, membershipUrl, membershipQrBytes, coverImageBytes });
} else for (const [index, section] of article.themeSlides.entries()) {
  const slide = newSlide(presentation, COLORS.paper);
  addHeader(slide, `AIチャット×既存IP ｜ ${index + 1} / 6`, fontFamily);
  addText(slide, section.heading, 82, 157, 1110, 92, fontFamily, 36, COLORS.ink, true);
  // Keep full prose; citations stay in the section's speaker notes.
  const paragraphs = section.body.split(/\n\s*\n/)
    .map(p => clean(p.replace(/\[([^\]]+)\]\([^)]+\)/g, "")))
    .filter(p => p && !/^[／｜|\s]+$/.test(p))
    .slice(0, 3);
  if (paragraphs.length !== 3 || paragraphs.some(p => p.length > 170 || /[|\[\]]/.test(p))) {
    throw new Error(`章「${section.heading}」の冒頭を、出典・表を除く短い3段落に整理してください。`);
  }
  paragraphs.forEach((paragraph, i) => {
    addText(slide, String(i + 1).padStart(2, "0"), 82, 267 + i * 140, 50, 40, fontFamily, 24, COLORS.accent, true);
    addText(slide, paragraph, 153, 260 + i * 140, 1045, 130, fontFamily, 24, COLORS.ink);
  });
  slide.speakerNotes.textFrame.setText(`確定本文: ${inputPath}\n第2部 / ${section.heading}\n\n${section.body}`);
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
  explicitTotalSlideCount: args.diagrams ? 9 : 6,
  requiredNativeTableOwnerSlides: args.diagrams ? [4, 6, 7, 8] : [],
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
    ...(args.diagrams ? ["--cover-role", "cover"] : []),
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
  slideCount: args.diagrams ? 9 : 6,
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
  const themeSlides = themeMatches.map((match, index) => ({
    heading: clean(match[1]),
    body: themeSection.body.slice(match.index + match[0].length, themeMatches[index + 1]?.index ?? themeSection.body.length).trim(),
  }));
  return { slug, date: dateValue, title, lead, themeHeading: themeSection?.heading ?? title, themeLead: themeSection ? firstParagraph(themeSection.body) : lead, sections: contentSections, focusPoints, themeSubheadings, subheadings, urls, themeSlides };
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
  addText(slide, truncate(article.themeLead, 150), 82, 280, 1040, 78, fontFamilyValue, 22, COLORS.accent, true);
  addRule(slide, 82, 390, 1180, COLORS.rule);
  addText(slide, "本文で確認すること", 82, 425, 540, 38, fontFamilyValue, 22, COLORS.ink, true);
  addBullets(slide, [
    "記事では何が起きたと整理したか",
    "人間の判断と運用責任がどこに残るか",
    "他社が応用するときに確認すべき条件",
  ], 82, 480, 1020, 150, fontFamilyValue, 22);
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
