// "기분으로 영화 추천" Netlify Function
// 흐름: 사용 한도 확인 → Claude가 JSON으로 후보 추천 → OMDb로 실제 있는 영화인지 검증 → 통과한 영화만 응답
//
// 브라우저 ──POST /.netlify/functions/recommend──▶ 이 Function ──▶ Claude (후보 JSON)
//                                                         └──▶ OMDb (후보마다 존재 확인)

const Anthropic = require("@anthropic-ai/sdk");
const { betaZodOutputFormat } = require("@anthropic-ai/sdk/helpers/beta/zod");
const { RecommendSchema, SYSTEM_PROMPT } = require("./prompt");
const { verifyCandidates } = require("./verify");
const { readLimits, checkAndCount, memoryStore } = require("./limit");

const DEFAULT_MODEL = "claude-opus-5-5";
const MIN_LENGTH = 2;
const MAX_LENGTH = 200;
const MAX_RESULTS = 6; // 화면에 보여 줄 최대 편수

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});

// Claude에게 후보를 받는다. parse()가 스키마에 맞는 JSON을 객체로 바꿔 준다.
async function askClaude(client, mood, model) {
  const response = await client.beta.messages.parse({
    model,
    max_tokens: 4000,
    // 추천은 깊은 추론이 필요 없어 effort를 낮춰 빠르고 싸게
    output_config: {
      effort: "low",
      format: betaZodOutputFormat(RecommendSchema),
    },
    // 안전 분류기가 거절하면 서버가 다른 모델로 한 번 더 시도 (거절 대비)
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: mood }],
  });

  if (response.stop_reason === "refusal") {
    return {
      candidates: null,
      message: "이 요청에는 추천을 드리기 어려워요. 다른 표현으로 적어 주세요.",
    };
  }
  if (!response.parsed_output) {
    return {
      candidates: null,
      message: "추천 결과를 읽지 못했어요. 다시 시도해 주세요.",
    };
  }
  return { candidates: response.parsed_output.candidates, message: null };
}

// Netlify Blobs 저장소를 연다. 쓸 수 없으면 메모리 저장소로 대신한다.
let fallbackStore = null;
function openUsageStore(event) {
  try {
    const { connectLambda, getStore } = require("@netlify/blobs");
    connectLambda(event); // v1(Lambda 방식) Function에서 Blobs를 쓰려면 먼저 연결
    return getStore("ai-usage");
  } catch (error) {
    if (!fallbackStore) fallbackStore = memoryStore();
    return fallbackStore;
  }
}

function clientIp(event) {
  const h = event.headers || {};
  return (
    h["x-nf-client-connection-ip"] ||
    (h["x-forwarded-for"] || "").split(",")[0].trim() ||
    "unknown"
  );
}

// deps는 테스트에서 가짜 Claude/OMDb/저장소를 넣기 위한 자리
function createHandler(deps = {}) {
  return async (event) => {
    if (event.httpMethod !== "POST") {
      return json(405, { Error: "POST로 요청해 주세요." });
    }

    const omdbKey = process.env.OMDB_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!omdbKey || !anthropicKey) {
      return json(503, {
        Error: "AI 추천이 아직 설정되지 않았어요. (서버 환경변수 확인 필요)",
      });
    }

    let mood;
    try {
      mood = String(JSON.parse(event.body || "{}").mood || "").trim();
    } catch {
      return json(400, { Error: "요청 형식이 올바르지 않아요." });
    }
    if (mood.length < MIN_LENGTH || mood.length > MAX_LENGTH) {
      return json(400, {
        Error: `기분이나 상황을 ${MIN_LENGTH}~${MAX_LENGTH}자로 적어 주세요.`,
      });
    }

    // 1) 사용 한도: Claude를 부르기 전에 확인해야 비용이 나가지 않는다
    const store = deps.store || openUsageStore(event);
    let quota;
    try {
      quota = await checkAndCount(store, clientIp(event), readLimits());
    } catch (error) {
      console.error("사용량 저장소 오류", error);
      return json(503, { Error: "잠시 후 다시 시도해 주세요." });
    }
    if (!quota.ok) return json(429, { Error: quota.message });

    // 2) Claude에게 후보 받기
    const client = deps.client || new Anthropic({ apiKey: anthropicKey });
    const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
    let answer;
    try {
      answer = await askClaude(client, mood, model);
    } catch (error) {
      console.error("Claude 호출 오류", error);
      return json(502, {
        Error: "AI 추천 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
      });
    }
    if (!answer.candidates) return json(422, { Error: answer.message });

    // 3) OMDb로 검증: 실제 있는 영화만 남긴다
    const { verified, rejected } = await verifyCandidates(
      answer.candidates,
      omdbKey,
      deps.fetch || fetch
    );

    return json(200, {
      mood,
      movies: verified.slice(0, MAX_RESULTS),
      rejected, // 검증에서 걸러진 후보 (화면에 "걸러낸 후보"로 보여 줌)
      candidateCount: answer.candidates.length,
      remaining: quota.remaining,
    });
  };
}

const handler = createHandler();

module.exports = { handler, createHandler, askClaude };
