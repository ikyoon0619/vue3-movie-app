// 환각 걸러내기: Claude가 준 후보가 OMDb에 실제로 있는지 하나씩 확인한다.
// LLM은 그럴듯한 가짜 제목이나 틀린 연도를 만들 수 있으므로,
// 화면에는 "실제 데이터로 확인된 영화"만 보여 준다.

const OMDB_URL = "https://www.omdbapi.com/";

// 연도는 나라별 개봉일 차이로 1년 정도 어긋날 수 있어 ±1년까지 인정한다
const YEAR_TOLERANCE = 1;

// 비교용으로 제목을 단순하게: 소문자, 기호 제거, 앞의 관사(the/a/an) 제거
function normalizeTitle(title) {
  return String(title)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9가-힣\s]/g, " ")
    .replace(/^\s*(the|a|an)\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

// OMDb 결과가 후보와 같은 영화인지 판단
function isSameMovie(candidate, omdb) {
  if (!omdb || omdb.Response !== "True" || omdb.Type !== "movie") return false;
  const omdbYear = parseInt(omdb.Year, 10); // "2019" 또는 "2019–" 형태
  if (Number.isNaN(omdbYear)) return false;
  if (Math.abs(omdbYear - candidate.year) > YEAR_TOLERANCE) return false;
  return normalizeTitle(omdb.Title) === normalizeTitle(candidate.title);
}

// 후보 한 편을 OMDb에서 찾는다. 연도를 넣어 한 번, 안 되면 연도 없이 한 번 더.
async function lookupCandidate(candidate, apiKey, fetchImpl = fetch) {
  const tries = [
    { t: candidate.title, y: String(candidate.year), type: "movie" },
    { t: candidate.title, type: "movie" },
  ];
  for (const query of tries) {
    const params = new URLSearchParams({ apikey: apiKey, ...query });
    const res = await fetchImpl(`${OMDB_URL}?${params}`);
    if (!res.ok) throw new Error(`OMDb 응답 오류 ${res.status}`);
    const data = await res.json();
    if (isSameMovie(candidate, data)) return data;
  }
  return null;
}

// 모든 후보를 동시에 확인하고, 통과(verified)와 탈락(rejected)으로 나눈다
async function verifyCandidates(candidates, apiKey, fetchImpl = fetch) {
  // 같은 영화가 두 번 나오면 한 번만 확인
  const seen = new Set();
  const unique = candidates.filter((c) => {
    const key = `${normalizeTitle(c.title)}|${c.year}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const results = await Promise.all(
    unique.map(async (candidate) => {
      try {
        const movie = await lookupCandidate(candidate, apiKey, fetchImpl);
        return { candidate, movie, error: null };
      } catch (error) {
        return { candidate, movie: null, error: error.message };
      }
    })
  );

  const verified = [];
  const rejected = [];
  const verifiedIds = new Set();
  for (const { candidate, movie, error } of results) {
    if (movie && !verifiedIds.has(movie.imdbID)) {
      verifiedIds.add(movie.imdbID);
      verified.push({
        imdbID: movie.imdbID,
        Title: movie.Title,
        Year: movie.Year,
        Poster: movie.Poster,
        reason: candidate.reason,
      });
    } else if (!movie) {
      rejected.push({
        title: candidate.title,
        year: candidate.year,
        why: error ? "확인 중 오류" : "OMDb에서 찾을 수 없음",
      });
    }
  }
  return { verified, rejected };
}

module.exports = {
  normalizeTitle,
  isSameMovie,
  lookupCandidate,
  verifyCandidates,
};
