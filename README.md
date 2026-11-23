# Vue3-OMDb-Project 소개

Vue3와 OMDb API를 사용하는 영화 검색 애플리케이션입니다.

## 개발 기간

- 23.04 ~ 23.06

## 📖 Docs

- Vue3
- Bootstrap
- Vuex
- Vue Router

## 💡 Specs

- Vue3
- Vuex
- Vue-Router
- Webpack
- OMDb API
- Axios
- Lodash

## 주요 기능

- 영화 검색
- **AI 기분 추천**: 기분이나 상황을 한국어로 적으면 Claude가 영화를 고르고, OMDb에서 실제로 있는 영화인지 확인한 뒤 통과한 영화만 보여 줍니다.

## AI 기분 추천: 구조화된 출력 + 환각 걸러내기

```
브라우저 ──POST /.netlify/functions/recommend──▶ Netlify Function
                                                  ├─ 1. 하루 사용 한도 확인 (Netlify Blobs)
                                                  ├─ 2. Claude: JSON 스키마로 후보 8편 {title, year, reason}
                                                  └─ 3. OMDb: 후보마다 제목+연도 확인 → 통과한 영화만 응답
```

- **구조화된 출력**: zod 스키마를 `output_config.format`으로 넘겨, Claude의 답이 항상 정해진 JSON 모양으로 옵니다. 문자열을 잘라 파싱할 필요가 없습니다.
- **환각 검증**: LLM은 그럴듯한 가짜 제목이나 틀린 연도를 만들 수 있습니다. 후보마다 OMDb에서 제목(관사, 대소문자 무시)과 연도(±1년)가 맞는지 확인하고, 맞지 않은 후보는 "걸러낸 후보"로 따로 보여 줍니다.
- **비용 보호**: 공개 데모라 전체 하루 100번, 한 사람(IP) 하루 5번으로 제한합니다. IP는 해시로만 저장합니다. 환경변수 `AI_DAILY_LIMIT`, `AI_PER_CLIENT_DAILY_LIMIT`로 바꿀 수 있습니다.
- **거절 대비**: Claude가 요청을 거절하면 서버가 다른 모델로 한 번 더 시도합니다(server-side fallback).

## 구조: API 키는 서버에만

```
브라우저 (Vue) ──▶ /.netlify/functions/movie ──▶ OMDb API
                   (Netlify Function, 키는 환경변수)
```

- 브라우저 코드에는 API 키가 없습니다. OMDb 호출은 Netlify Function(`functions/movie/movie.js`)이 대신 합니다.
- 키는 Netlify 환경변수 `OMDB_API_KEY`에 저장합니다.
- AI 추천은 `ANTHROPIC_API_KEY`도 필요합니다. 없으면 AI 추천만 꺼지고 검색은 그대로 동작합니다.

## 로컬 실행

```sh
npm install
npm install -g netlify-cli   # 처음 한 번
cp .env.example .env         # .env에 OMDb 키 입력
netlify dev                  # http://localhost:8888 (Vue + Function 함께 실행)
```

`npm run dev`만 실행하면 Function이 없어서 검색이 되지 않습니다.

```sh
npm test                     # Function 테스트 (Claude, OMDb는 가짜로 대신해서 키 없이 실행)
```
