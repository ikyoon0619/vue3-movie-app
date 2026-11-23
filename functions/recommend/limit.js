// 공개 데모용 하루 사용 한도
// Netlify Function은 요청마다 새로 뜰 수 있어 메모리 변수로는 횟수를 셀 수 없다.
// 그래서 Netlify Blobs(키-값 저장소)에 "날짜별 횟수"를 저장한다.

const crypto = require("crypto");

const DEFAULT_DAILY_LIMIT = 100; // 전체 하루 한도
const DEFAULT_PER_CLIENT_LIMIT = 5; // 한 사용자(IP) 하루 한도

// 한국 시간 기준 날짜 (자정에 초기화)
function todayKST(now = new Date()) {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

// IP를 그대로 저장하지 않고, 날짜를 섞어 해시한 값만 저장한다 (개인정보 보호)
function clientKey(ip, day) {
  return crypto
    .createHash("sha256")
    .update(`${day}:${ip}`)
    .digest("hex")
    .slice(0, 16);
}

function readLimits(env = process.env) {
  const num = (value, fallback) => {
    const n = parseInt(value, 10);
    return Number.isNaN(n) || n < 0 ? fallback : n;
  };
  return {
    daily: num(env.AI_DAILY_LIMIT, DEFAULT_DAILY_LIMIT),
    perClient: num(env.AI_PER_CLIENT_DAILY_LIMIT, DEFAULT_PER_CLIENT_LIMIT),
  };
}

// store: get(key, {type:"json"}) / setJSON(key, value) 를 가진 객체 (Netlify Blobs 또는 테스트용 가짜)
// 반환: { ok: true } 또는 { ok: false, message }
// 주의: Blobs에는 "원자적 증가"가 없어 동시에 들어온 요청은 한두 번 더 통과할 수 있다. 데모 비용 보호용으로는 충분하다.
async function checkAndCount(store, ip, limits, now = new Date()) {
  const day = todayKST(now);
  const key = `usage-${day}`;
  const usage = (await store.get(key, { type: "json" })) || {
    total: 0,
    clients: {},
  };
  const ck = clientKey(ip || "unknown", day);
  const mine = usage.clients[ck] || 0;

  if (usage.total >= limits.daily) {
    return {
      ok: false,
      message: "오늘 데모 사용량이 모두 찼어요. 내일 다시 시도해 주세요.",
    };
  }
  if (mine >= limits.perClient) {
    return {
      ok: false,
      message: `한 사람당 하루 ${limits.perClient}번까지 쓸 수 있어요. 내일 다시 시도해 주세요.`,
    };
  }

  usage.total += 1;
  usage.clients[ck] = mine + 1;
  await store.setJSON(key, usage);
  return { ok: true, remaining: limits.perClient - usage.clients[ck] };
}

// Blobs를 쓸 수 없는 환경(일부 로컬 실행)을 위한 메모리 저장소
function memoryStore() {
  const map = new Map();
  return {
    async get(key) {
      return map.has(key) ? JSON.parse(map.get(key)) : null;
    },
    async setJSON(key, value) {
      map.set(key, JSON.stringify(value));
    },
  };
}

module.exports = {
  todayKST,
  clientKey,
  readLimits,
  checkAndCount,
  memoryStore,
};
