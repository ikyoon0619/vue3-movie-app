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

## 구조: API 키는 서버에만

```
브라우저 (Vue) ──▶ /.netlify/functions/movie ──▶ OMDb API
                   (Netlify Function, 키는 환경변수)
```

- 브라우저 코드에는 API 키가 없습니다. OMDb 호출은 Netlify Function(`functions/movie/movie.js`)이 대신 합니다.
- 키는 Netlify 환경변수 `OMDB_API_KEY`에 저장합니다.

## 로컬 실행

```sh
npm install
npm install -g netlify-cli   # 처음 한 번
cp .env.example .env         # .env에 OMDb 키 입력
netlify dev                  # http://localhost:8888 (Vue + Function 함께 실행)
```

`npm run dev`만 실행하면 Function이 없어서 검색이 되지 않습니다.
