import { describe, it, expect, vi } from "vitest";
import {
  normalizeTitle,
  isSameMovie,
  verifyCandidates,
} from "../functions/recommend/verify.js";

// 가짜 OMDb: 제목(t)으로 찾아서 돌려준다
const DB = {
  parasite: {
    Response: "True",
    Type: "movie",
    Title: "Parasite",
    Year: "2019",
    imdbID: "tt6751668",
    Poster: "p1",
  },
  "the shawshank redemption": {
    Response: "True",
    Type: "movie",
    Title: "The Shawshank Redemption",
    Year: "1994",
    imdbID: "tt0111161",
    Poster: "p2",
  },
  "before sunrise": {
    Response: "True",
    Type: "movie",
    Title: "Before Sunrise",
    Year: "1995",
    imdbID: "tt0112471",
    Poster: "p3",
  },
};
function fakeFetch(url) {
  const t = new URL(url).searchParams.get("t").toLowerCase();
  const body = DB[t] || { Response: "False", Error: "Movie not found!" };
  return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
}

describe("normalizeTitle", () => {
  it("관사, 대소문자, 기호를 무시한다", () => {
    expect(normalizeTitle("The Shawshank Redemption")).toBe(
      "shawshank redemption"
    );
    expect(normalizeTitle("Amélie")).toBe(normalizeTitle("Amélie"));
    expect(normalizeTitle("Crouching Tiger, Hidden Dragon")).toBe(
      "crouching tiger hidden dragon"
    );
  });
});

describe("isSameMovie", () => {
  const omdb = DB.parasite;
  it("제목과 연도가 맞으면 통과", () => {
    expect(isSameMovie({ title: "Parasite", year: 2019 }, omdb)).toBe(true);
  });
  it("연도가 1년 차이는 허용", () => {
    expect(isSameMovie({ title: "Parasite", year: 2020 }, omdb)).toBe(true);
  });
  it("연도가 2년 이상 다르면 다른 영화", () => {
    expect(isSameMovie({ title: "Parasite", year: 2015 }, omdb)).toBe(false);
  });
  it("OMDb가 못 찾으면 탈락", () => {
    expect(isSameMovie({ title: "X", year: 2019 }, { Response: "False" })).toBe(
      false
    );
  });
  it("영화가 아닌 시리즈는 탈락", () => {
    expect(
      isSameMovie(
        { title: "Parasite", year: 2019 },
        { ...omdb, Type: "series" }
      )
    ).toBe(false);
  });
});

describe("verifyCandidates", () => {
  it("실제 있는 영화만 남기고 지어낸 제목은 걸러낸다", async () => {
    const candidates = [
      { title: "Parasite", year: 2019, reason: "a" },
      { title: "The Moonlight Bakery of Seoul", year: 2017, reason: "가짜" },
      { title: "Before Sunrise", year: 1995, reason: "b" },
    ];
    const { verified, rejected } = await verifyCandidates(
      candidates,
      "key",
      fakeFetch
    );
    expect(verified.map((m) => m.imdbID)).toEqual(["tt6751668", "tt0112471"]);
    expect(verified[0].reason).toBe("a");
    expect(rejected).toEqual([
      {
        title: "The Moonlight Bakery of Seoul",
        year: 2017,
        why: "OMDb에서 찾을 수 없음",
      },
    ]);
  });

  it("연도가 틀리면 연도 없이 다시 찾아도 걸러진다", async () => {
    const { verified, rejected } = await verifyCandidates(
      [{ title: "Parasite", year: 2005, reason: "x" }],
      "key",
      fakeFetch
    );
    expect(verified).toHaveLength(0);
    expect(rejected).toHaveLength(1);
  });

  it("같은 영화가 두 번 나오면 한 번만 보여 준다", async () => {
    const fetchSpy = vi.fn(fakeFetch);
    const { verified } = await verifyCandidates(
      [
        { title: "Parasite", year: 2019, reason: "a" },
        { title: "parasite", year: 2019, reason: "b" },
      ],
      "key",
      fetchSpy
    );
    expect(verified).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("OMDb 오류는 탈락으로 처리하고 전체가 멈추지 않는다", async () => {
    const broken = () => Promise.resolve({ ok: false, status: 500 });
    const { verified, rejected } = await verifyCandidates(
      [{ title: "Parasite", year: 2019, reason: "a" }],
      "key",
      broken
    );
    expect(verified).toHaveLength(0);
    expect(rejected[0].why).toBe("확인 중 오류");
  });
});
