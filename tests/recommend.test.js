import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHandler } from "../functions/recommend/recommend.js";
import { memoryStore } from "../functions/recommend/limit.js";

const OMDB = {
  parasite: {
    Response: "True",
    Type: "movie",
    Title: "Parasite",
    Year: "2019",
    imdbID: "tt6751668",
    Poster: "p1",
  },
};
const fakeFetch = (url) => {
  const t = new URL(url).searchParams.get("t").toLowerCase();
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(OMDB[t] || { Response: "False" }),
  });
};

// 가짜 Claude: parse()가 돌려줄 응답을 정해 둔다
function fakeClient(response) {
  const parse = vi.fn().mockResolvedValue(response);
  return { client: { beta: { messages: { parse } } }, parse };
}
const goodAnswer = {
  stop_reason: "end_turn",
  parsed_output: {
    candidates: [
      { title: "Parasite", year: 2019, reason: "긴장감 있는 하루를 원할 때" },
      { title: "Totally Made Up Movie", year: 2021, reason: "가짜" },
    ],
  },
};
const post = (body, ip = "1.1.1.1") => ({
  httpMethod: "POST",
  headers: { "x-nf-client-connection-ip": ip },
  body: JSON.stringify(body),
});

beforeEach(() => {
  process.env.OMDB_API_KEY = "omdb";
  process.env.ANTHROPIC_API_KEY = "claude";
  delete process.env.AI_PER_CLIENT_DAILY_LIMIT;
});

describe("recommend handler", () => {
  it("검증된 영화만 돌려주고 걸러낸 후보도 알려 준다", async () => {
    const { client, parse } = fakeClient(goodAnswer);
    const handler = createHandler({
      client,
      fetch: fakeFetch,
      store: memoryStore(),
    });
    const res = await handler(post({ mood: "비 오는 날 혼자 보기 좋은 영화" }));
    const body = JSON.parse(res.body);
    expect(res.statusCode).toBe(200);
    expect(body.movies.map((m) => m.Title)).toEqual(["Parasite"]);
    expect(body.rejected[0].title).toBe("Totally Made Up Movie");
    expect(body.candidateCount).toBe(2);
    // Claude에 구조화된 출력과 사용자 글이 전달됐는지
    const params = parse.mock.calls[0][0];
    expect(params.output_config.format.type).toBe("json_schema");
    expect(params.messages[0].content).toBe("비 오는 날 혼자 보기 좋은 영화");
  });

  it("너무 짧거나 긴 입력은 Claude를 부르지 않는다", async () => {
    const { client, parse } = fakeClient(goodAnswer);
    const handler = createHandler({
      client,
      fetch: fakeFetch,
      store: memoryStore(),
    });
    expect((await handler(post({ mood: "a" }))).statusCode).toBe(400);
    expect((await handler(post({ mood: "가".repeat(201) }))).statusCode).toBe(
      400
    );
    expect(parse).not.toHaveBeenCalled();
  });

  it("한도를 넘으면 429이고 Claude를 부르지 않는다", async () => {
    process.env.AI_PER_CLIENT_DAILY_LIMIT = "1";
    const { client, parse } = fakeClient(goodAnswer);
    const handler = createHandler({
      client,
      fetch: fakeFetch,
      store: memoryStore(),
    });
    expect((await handler(post({ mood: "신나는 영화" }))).statusCode).toBe(200);
    const res = await handler(post({ mood: "신나는 영화" }));
    expect(res.statusCode).toBe(429);
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it("Claude가 거절하면 422로 안내한다", async () => {
    const { client } = fakeClient({
      stop_reason: "refusal",
      parsed_output: null,
    });
    const handler = createHandler({
      client,
      fetch: fakeFetch,
      store: memoryStore(),
    });
    const res = await handler(post({ mood: "어떤 요청" }));
    expect(res.statusCode).toBe(422);
  });

  it("Claude 호출이 실패하면 502", async () => {
    const parse = vi.fn().mockRejectedValue(new Error("network"));
    const handler = createHandler({
      client: { beta: { messages: { parse } } },
      fetch: fakeFetch,
      store: memoryStore(),
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await handler(post({ mood: "신나는 영화" }))).statusCode).toBe(502);
  });

  it("키가 없으면 503, GET은 405", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const handler = createHandler({ store: memoryStore() });
    expect((await handler(post({ mood: "신나는 영화" }))).statusCode).toBe(503);
    expect((await handler({ httpMethod: "GET" })).statusCode).toBe(405);
  });
});
