import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ----------------------------
// 기본 설정
// ----------------------------
const app = express();
const PORT = 3000;

// ESM에서 __dirname 쓰기 위한 처리
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 로그 파일 (프로젝트 루트에 생성됨)
const LOG_FILE = path.join(process.cwd(), "selection-logs.jsonl");

// Mock 모드 (true면 외부 API 없이도 테스트 가능)
const USE_MOCK = false;

// ✅ apifree 문서의 실제 엔드포인트
const APIFREE_ENDPOINT = "https://api.apifree.ai/v1/chat/completions";

// ✅ apifree 문서에서 요구하는 환경변수 이름: API_KEY
// PowerShell: $env:API_KEY="YOUR_API_KEY"
const API_KEY = process.env.API_KEY || "";

// ----------------------------
// 미들웨어
// ----------------------------
app.use(cors());
app.use(express.json());

// index.html을 서버가 같이 서빙 (localhost:3000 으로 접속)
app.use(express.static(__dirname));

// ----------------------------
// 유틸: 키워드 배열 검증
// ----------------------------
function validateKeywords(keywords) {
  if (!Array.isArray(keywords)) return false;
  const cleaned = keywords.map((k) => String(k).trim()).filter(Boolean);
  return cleaned.length >= 3 && cleaned.length <= 5;
}

function normalizeKeywords(keywords) {
  return keywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 5);
}

// ----------------------------
// 프롬프트 템플릿 빌더 (품질 개선 핵심)
// ----------------------------
function buildFirstLinePrompt({ keywords, tone }) {
  const toneGuide = {
    건조: "짧고 사실적으로. 감정 단어 최소화. 군더더기 없이.",
    담담: "차분하고 관조적. 과장 없이 담백하게.",
    감정적: "감각/신체감각을 1개 정도만. 과잉 멜로 금지.",
    서사적: "장면 + 암시(갈등의 씨앗). '무언가 시작된다' 느낌.",
  };

  const guide = toneGuide[tone] || toneGuide["담담"];
  const kw = keywords.join(", ");

  return `
너는 한국어 작가다. 사용자가 준 키워드와 톤으로 "작품의 첫 문장" 후보 3개를 만든다.

[입력]
- 키워드: ${kw}
- 톤: ${tone} (${guide})

[작성 규칙]
- 각 후보는 "한 문장"만. (너무 길면 호흡을 끊지 말고 한 문장으로 유지)
- 세 후보는 서로 다른 접근(장면/독백/대상화 등)으로 변주할 것
- 키워드는 1~2개만 자연스럽게 녹여라(억지 나열 금지). 대신 키워드의 분위기는 반영.
- 흔한 문구/클리셰 금지: "그날", "문득", "어쩐지", "마치", "왠지"로 시작 금지
- 인물 이름/고유명사 남발 금지(필요하면 1개까지만)
- 따옴표, 괄호, 이모지, 해설/제목/부연설명/빈 줄 금지

[출력 형식] (아래 형식만, 정확히 3줄)
1. ...
2. ...
3. ...
`.trim();
}

// ----------------------------
// (Mock) 톤별 문장 템플릿
// ----------------------------
function mockCandidates(keywords, tone) {
  const k = keywords;
  const a = k[0] || "키워드";
  const b = k[1] || "장면";
  const c = k[2] || "인물";
  const d = k[3] || "장소";
  const e = k[4] || "상태";

  const templates = {
    건조: [
      `${d}에 앉았다. ${b} 불빛이 켜져 있었다.`,
      `${c}에게 연락하지 않았다. ${e}로 걸어갔다.`,
      `${a}이 남았다. 이유는 정리하지 않았다.`,
    ],
    담담: [
      `${b} 아래에서 ${a}이라는 생각이 조용히 남았다.`,
      `${d}에 앉아 ${c}를 떠올렸지만, 딱히 할 말은 없었다.`,
      `${e}로 가는 길은 늘 같았고, 오늘도 그렇다는 걸 확인했다.`,
    ],
    감정적: [
      `${b} 아래에서 ${a}이 목에 걸렸다.`,
      `${c}를 떠올리자 더 조용해졌다, ${d}에 앉은 채로.`,
      `${e}로 가는 길인데도, 오늘은 유난히 멀게 느껴졌다.`,
    ],
    서사적: [
      `${b}이 켜질 무렵, 나는 ${d}로 향했다.`,
      `${c}와의 마지막 대화 이후, ${a}은 종종 이 시간에 찾아왔다.`,
      `${e}로 돌아가는 길에서, 나는 한 번도 하지 못한 말을 골랐다.`,
    ],
  };

  const picked = templates[tone] || templates["담담"];
  return `첫 문장 후보:
1. ${picked[0]}
2. ${picked[1]}
3. ${picked[2]}`;
}

// ----------------------------
// ✅ apifree Chat Completions 호출 (문서 스펙 그대로)
// ----------------------------
async function callApiFreeChatCompletion(prompt) {
  if (!API_KEY) {
    throw new Error("missing API_KEY (PowerShell: $env:API_KEY=\"YOUR_API_KEY\")");
  }

  const payload = {
    model: "openai/gpt-5.2",
    stream: false,
    max_tokens: 220, // 첫 문장 3개면 이 정도면 충분
    messages: [{ role: "user", content: prompt }],
  };

  const resp = await fetch(APIFREE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await resp.json().catch(() => null);

  // 문서에 따르면 에러가 OpenAI 호환 형식으로 올 수 있음(심지어 200일 수도)
  if (!resp.ok) {
    const msg = data?.error?.message || `apifree http ${resp.status}`;
    throw new Error(msg);
  }
  if (data?.error?.message) {
    throw new Error(data.error.message);
  }

  const text = (data?.choices?.[0]?.message?.content || "").trim();
  if (!text) {
    throw new Error("apifree returned empty content (choices[0].message.content missing)");
  }
  return text;
}

// ----------------------------
// API: 첫 문장 후보 생성
// ----------------------------
app.post("/api/first-lines", async (req, res) => {
  try {
    const { keywords, tone } = req.body;

    if (!validateKeywords(keywords)) {
      return res.status(400).json({
        error: "invalid request",
        details: "keywords must be an array of 3~5 items",
      });
    }

    const cleanedKeywords = normalizeKeywords(keywords);
    const cleanedTone = String(tone || "담담");

    // 1) Mock
    if (USE_MOCK) {
      const result = mockCandidates(cleanedKeywords, cleanedTone);
      return res.json({ result });
    }

    // 2) apifree
    const prompt = buildFirstLinePrompt({
      keywords: cleanedKeywords,
      tone: cleanedTone,
    });

    const text = await callApiFreeChatCompletion(prompt);
    return res.json({ result: text });
  } catch (e) {
    console.error("first-lines error:", e);
    return res.status(500).json({
      error: "서버 오류 발생",
      details: e?.message || String(e),
    });
  }
});

// ----------------------------
// API: 선택 로그 저장 (jsonl 파일)
// ----------------------------
app.post("/api/logs", (req, res) => {
  try {
    const { timestamp, keywords, tone, selectedLine } = req.body;

    if (
      !timestamp ||
      !Array.isArray(keywords) ||
      !tone ||
      !selectedLine ||
      String(selectedLine).trim().length === 0
    ) {
      return res.status(400).json({ error: "invalid log payload" });
    }

    const record = {
      timestamp: String(timestamp),
      keywords: keywords.map((k) => String(k).trim()).filter(Boolean),
      tone: String(tone),
      selectedLine: String(selectedLine),
    };

    fs.appendFileSync(LOG_FILE, JSON.stringify(record) + "\n", "utf8");
    return res.json({ ok: true });
  } catch (e) {
    console.error("log save error:", e);
    return res.status(500).json({ error: "failed to save log" });
  }
});

// ----------------------------
// 서버 실행
// ----------------------------
app.listen(PORT, () => {
  console.log(`서버 실행 중 👉 http://localhost:${PORT}`);
  console.log(`Mock 모드: ${USE_MOCK ? "ON" : "OFF"}`);
  console.log(`apifree endpoint: ${APIFREE_ENDPOINT}`);
  console.log(`API_KEY: ${API_KEY ? "(set)" : "(not set)"}`);
  console.log(`로그 파일: ${LOG_FILE}`);
});
