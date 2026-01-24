firstline-tool

키워드와 문장 톤을 입력하면
글의 ‘첫 문장’ 후보를 생성하고 선택·기록할 수 있는 웹 도구입니다.

글을 쓰기 시작할 때 가장 어려운 첫 문장에 대한 부담을 줄이기 위해 만든 개인 프로젝트입니다.

✨ What it does

키워드 3~5개와 문장 톤을 입력

첫 문장 후보 3개 생성

클릭으로 하나를 선택

선택한 문장을 복사하거나 로그로 기록

글을 “대신 써주는 도구”가 아니라,
👉 시작을 도와주는 보조 도구를 목표로 설계했습니다.

🧠 Key Features

키워드 기반 첫 문장 후보 생성

톤 선택

담담 / 건조 / 감정적 / 서사적

후보 문장 카드 UI

클릭 시 선택 상태 강조

선택 문장 복사 기능

선택 이력 기록

브라우저 로컬 저장

서버(JSONL 파일) 로그 저장

Mock 모드 지원

OpenAI 연동 없이도 테스트 가능

🛠 Tech Stack
Frontend

HTML / CSS / Vanilla JavaScript

Fetch API 기반 서버 통신

Backend

Node.js

Express

CORS

파일 기반 로그 저장 (JSON Lines)

🧩 Architecture Overview

Client

키워드 / 톤 입력

후보 문장 렌더링

선택 로그 로컬 저장(localStorage)

Server

첫 문장 후보 생성 API

선택 로그 수집 API

JSONL 파일로 로그 누적 저장

Mock 모드를 기본으로 두어
👉 외부 API 의존 없이도 UI/UX 테스트가 가능하도록 구성했습니다.

📁 Logging Strategy

선택 결과는 두 곳에 저장됩니다:

브라우저(localStorage)

최근 선택 로그 즉시 확인용

서버(JSONL 파일)

이후 분석/확장 가능성을 고려한 구조

{
  "timestamp": "...",
  "keywords": ["외로움", "가로등", "벤치"],
  "tone": "담담",
  "selectedLine": "..."
}

🎯 Why this project?

글쓰기에서 가장 막히는 지점은 ‘첫 줄’

자동 생성보다는 선택과 판단의 주도권을 사용자에게 남기고 싶었음

UX 실험 + 서버 로그 설계를 함께 다뤄보고자 함

🔮 Future Ideas

OpenAI API 실제 연동

로그 기반 문장 패턴 분석

사용자별 세션 분리

결과 저장/내보내기 기능

📝 Notes

이 프로젝트는 글쓰기 보조 도구 실험을 목적으로 하며,
완성형 서비스보다는 아이디어·UX·구조 설계에 초점을 둔 개인 프로젝트입니다.

🔹 한 줄 요약 (포트폴리오용)

키워드와 톤을 기반으로 글의 첫 문장 후보를 생성·선택·기록하는 웹 도구
