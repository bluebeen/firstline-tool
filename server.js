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

// Mock 모드 (true면 OpenAI 없이도 테스트 가능)
const USE_MOCK = true;

// ----------------------------
// 미들웨어
// ----------------------------
app.use(cors());
app.use(express.json());

// (선택) index.html을 "서버로" 열고 싶다면 사용
// - http://localhost:3000 로 접속하면 index.html을 서빙
// - file://로 여는 것보다 안정적 (clipboard 등)
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
// (Mock) 톤별 문장 템플릿
// - 너가 실험한 개선 버전 기반
// ----------------------------
function mockCandidates(keywords, tone) {
    const k = keywords; // ["외로움","가로등","친구","벤치","집"]
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

    // 서버 결과 포맷을 기존 extractLines()가 파싱하는 형태로 맞춤
    return `첫 문장 후보:
1. ${picked[0]}
2. ${picked[1]}
3. ${picked[2]}`;
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

        // ✅ 1) Mock 모드
        if (USE_MOCK) {
            const result = mockCandidates(cleanedKeywords, cleanedTone);
            return res.json({ result });
        }

        // ✅ 2) (옵션) OpenAI 연결 모드
        // USE_MOCK=false 로 바꾸고 아래를 연결해서 쓰면 됨.
        // 주의: openai SDK 버전/사용법이 바뀔 수 있어 공식 문서 기반으로 수정 필요.
        return res.status(501).json({
            error: "not implemented",
            details:
                "USE_MOCK=false 설정 후 OpenAI 연동 코드를 추가하세요. (현재는 Mock 모드만 제공)",
        });
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

        // 최소 검증
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
    console.log(`로그 파일: ${LOG_FILE}`);
});
