// OMDb API를 대신 불러 주는 Netlify Function (서버에서 실행됨)
// 브라우저는 /.netlify/functions/movie 만 부르고, API 키는 서버 환경변수에만 있다.

const OMDB_URL = "https://www.omdbapi.com/";

// 브라우저가 보낼 수 있는 파라미터만 허용 (apikey 같은 값은 받지 않는다)
const ALLOWED = ["s", "type", "y", "page", "i", "plot"];

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});

const handler = async (event) => {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) {
    // 키 설정을 잊었을 때 원인을 바로 알 수 있게
    return json(500, { Error: "서버에 OMDB_API_KEY가 설정되지 않았습니다." });
  }

  const query = event.queryStringParameters || {};
  if (!query.s && !query.i) {
    return json(400, { Error: "검색어(s) 또는 영화 ID(i)가 필요합니다." });
  }

  const params = new URLSearchParams({ apikey: apiKey });
  for (const key of ALLOWED) {
    if (query[key]) params.set(key, query[key]);
  }

  try {
    // Node 18 이상은 fetch가 내장되어 있어 axios 없이 호출할 수 있다
    const res = await fetch(`${OMDB_URL}?${params}`);
    const data = await res.json();
    return json(res.ok ? 200 : 502, data);
  } catch (error) {
    return json(502, { Error: "OMDb 서버에 연결하지 못했습니다." });
  }
};

module.exports = { handler };
