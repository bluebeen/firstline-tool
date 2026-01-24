# firstline-tool

키워드와 톤을 입력하면, 글의 첫 문장 후보를 생성하고 선택·기록하는 실험용 도구

이 프로젝트는  
첫 문장은 어떻게 만들어지는가,  
사람은 어떤 문장을 첫 문장으로 선택하는가  
라는 질문에서 출발했다.

---

## ✨Features

- 키워드 3~5개 입력 (쉼표 구분)
- 톤 선택: 담담 / 건조 / 감정적 / 서사적
- 첫 문장 후보 3개 생성
- 후보 클릭으로 선택 문장 확정
- 선택 결과 로컬 + 서버 로그 저장
- 같은 입력으로 다시 생성 가능
- Mock 모드 기반 (OpenAI 미연결 상태에서도 동작)

---

## 🧭 Project Motivation

글을 쓰는 과정에서 가장 멈칫하게 되는 순간은 첫 문장을 정하는 순간이다.  
이 도구는 “잘 쓴 문장”을 자동으로 만들어주는 도구가 아니다.

대신 다음을 관찰하기 위한 실험에 가깝다.

- 어떤 키워드 조합이
- 어떤 톤에서
- 어떤 문장을 사람이 선택하는지

결과보다 선택 과정과 그 기록에 초점을 둔다.

---

## 🖥️ Usage Flow

1. 키워드 3~5개를 쉼표로 입력
2. 톤 선택
3. 첫 문장 후보 3개 생성
4. 하나를 클릭해 선택
5. 선택 로그 자동 저장

---

## ⚙️ Tech Stack

- Frontend: Vanilla HTML / CSS / JavaScript
- Backend: Node.js, Express
- Utilities
  - CORS
  - LocalStorage
  - JSON Lines 로그 파일

---

## 📂 Project Structure

```text
.
├─ index.html              # 프론트엔드 UI
├─ server.js               # Express 서버
├─ selection-logs.jsonl    # 선택 로그 (자동 생성)
├─ package.json
└─ package-lock.json
```

---

## 🔌 API Design

### POST /api/first-lines

첫 문장 후보 생성 API

Request

```json
{
  "keywords": ["외로움", "가로등", "친구", "벤치"],
  "tone": "담담"
}
```

Response

```json
{
  "result": "첫 문장 후보:\n1. ...\n2. ...\n3. ..."
}
```

현재는 Mock 모드로 동작하며, 서버 응답 포맷은 프론트엔드 파서에 맞춰 설계되어 있다.

---

### POST /api/logs

선택한 문장 로그 저장 API

```json
{
  "timestamp": "2026-01-25T12:34:56.000Z",
  "keywords": ["외로움", "가로등", "친구"],
  "tone": "담담",
  "selectedLine": "가로등 아래에서 외로움이라는 생각이 조용히 남았다."
}
```

선택 로그는 JSON Lines 형식으로 서버에 append 저장된다.

---
## 🧪 Logging Strategy
### 로컬로그
- localStorage에 저장
- 최근 5개 선택 로그 UI에 표시
- 개발자용 콘솔 출력 기능 제공
### 서버로그
- JSONL 파일로 append 저장
- 분석/실험용 데이터로 활용 가능
---
## 🧱 Mock Mode
```js
const USE_MOCK = true;
```
- OpenAI API 키 없이도 실행 가능
- 톤별 문장 템플릿 기반 후보 생성
- UI / 선택 흐름 / 로그 설계 검증 목적
## 📌 Current Status

- [x] 기본 UI 구현
- [x] 톤별 문장 구조 분리
- [x] 선택 강조 UI
- [x] 로컬 + 서버 로그 저장
- [ ] OpenAI 연동
- [ ] 로그 분석 스크립트
- [ ] 문장 변형 실험

---

## 📖 Open Questions

- 사람은 어떤 기준으로 첫 문장을 선택하는가
- 키워드보다 톤이 더 큰 영향을 미치는가
- 가장 많이 선택되는 문장은 정말 좋은 문장일까

이 프로젝트는 그 질문을 기록하기 위한 도구다.
