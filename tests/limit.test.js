import { describe, it, expect } from "vitest";
import {
  todayKST,
  checkAndCount,
  memoryStore,
  readLimits,
} from "../functions/recommend/limit.js";

describe("todayKST", () => {
  it("UTC 15시는 한국 기준 다음 날", () => {
    expect(todayKST(new Date("2026-11-23T15:00:00Z"))).toBe("2026-11-24");
    expect(todayKST(new Date("2026-11-23T14:59:00Z"))).toBe("2026-11-23");
  });
});

describe("checkAndCount", () => {
  const now = new Date("2026-11-23T03:00:00Z");

  it("사용자별 한도를 넘으면 막는다", async () => {
    const store = memoryStore();
    const limits = { daily: 100, perClient: 2 };
    expect((await checkAndCount(store, "1.1.1.1", limits, now)).ok).toBe(true);
    expect((await checkAndCount(store, "1.1.1.1", limits, now)).ok).toBe(true);
    const third = await checkAndCount(store, "1.1.1.1", limits, now);
    expect(third.ok).toBe(false);
    expect(third.message).toContain("하루 2번");
    // 다른 사람은 아직 가능
    expect((await checkAndCount(store, "2.2.2.2", limits, now)).ok).toBe(true);
  });

  it("전체 한도를 넘으면 모두 막는다", async () => {
    const store = memoryStore();
    const limits = { daily: 2, perClient: 5 };
    await checkAndCount(store, "a", limits, now);
    await checkAndCount(store, "b", limits, now);
    expect((await checkAndCount(store, "c", limits, now)).ok).toBe(false);
  });

  it("날짜가 바뀌면 다시 쓸 수 있다", async () => {
    const store = memoryStore();
    const limits = { daily: 1, perClient: 1 };
    await checkAndCount(store, "a", limits, now);
    expect(
      (
        await checkAndCount(
          store,
          "a",
          limits,
          new Date("2026-11-24T03:00:00Z")
        )
      ).ok
    ).toBe(true);
  });

  it("IP를 그대로 저장하지 않는다", async () => {
    const store = memoryStore();
    await checkAndCount(store, "203.0.113.7", { daily: 5, perClient: 5 }, now);
    const saved = JSON.stringify(await store.get("usage-2026-11-23"));
    expect(saved).not.toContain("203.0.113.7");
  });
});

describe("readLimits", () => {
  it("환경변수가 없거나 이상하면 기본값", () => {
    expect(readLimits({})).toEqual({ daily: 100, perClient: 5 });
    expect(
      readLimits({ AI_DAILY_LIMIT: "abc", AI_PER_CLIENT_DAILY_LIMIT: "3" })
    ).toEqual({ daily: 100, perClient: 3 });
  });
});
