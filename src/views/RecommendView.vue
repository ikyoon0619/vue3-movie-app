<script setup>
// 기분으로 영화 추천 화면
// 기분을 적으면 Netlify Function(recommend)이 Claude에게 후보를 받고,
// OMDb에서 실제로 있는 영화인지 확인한 뒤 통과한 영화만 돌려준다.
import { ref } from "vue";
import axios from "axios";
import Loader from "../components/Loader.vue";

const MAX_LENGTH = 200;
const examples = [
  "비 오는 날 혼자 보기 좋은 잔잔한 영화",
  "퇴근하고 머리 비우고 웃고 싶어",
  "친구들이랑 보기 좋은 반전 있는 스릴러",
  "90년대 감성 로맨스가 보고 싶어",
];

const mood = ref("");
const loading = ref(false);
const error = ref("");
const result = ref(null); // { movies, rejected, candidateCount, remaining }

async function recommend(text = mood.value) {
  const value = text.trim();
  if (loading.value || value.length < 2) return;
  mood.value = value;
  loading.value = true;
  error.value = "";
  result.value = null;
  try {
    const res = await axios.post("/.netlify/functions/recommend", {
      mood: value,
    });
    result.value = res.data;
  } catch (err) {
    // Function이 보낸 안내 문구(Error)를 우선 보여 준다
    error.value =
      err.response?.data?.Error ||
      "추천을 받지 못했어요. 잠시 후 다시 시도해 주세요.";
  } finally {
    loading.value = false;
  }
}

function posterOf(movie) {
  return movie.Poster && movie.Poster !== "N/A" ? movie.Poster : "";
}

function posterStyle(movie) {
  const src = posterOf(movie);
  return { backgroundImage: src ? `url("${src}")` : "none" };
}
</script>

<template>
  <div class="container recommend">
    <h1><span>AI</span> 기분으로 영화 추천</h1>
    <p class="desc">
      지금 기분이나 상황을 적으면 Claude가 영화를 고르고, OMDb에서 실제로 있는
      영화인지 확인한 뒤 보여 드려요.
    </p>

    <form class="ask" @submit.prevent="recommend()">
      <input
        v-model="mood"
        :maxlength="MAX_LENGTH"
        type="text"
        class="form-control"
        placeholder="예: 비 오는 날 혼자 보기 좋은 잔잔한 영화"
      />
      <button
        :disabled="loading || mood.trim().length < 2"
        class="btn btn-primary"
        type="submit"
      >
        추천 받기
      </button>
    </form>

    <div class="chips">
      <button
        v-for="example in examples"
        :key="example"
        :disabled="loading"
        type="button"
        class="chip"
        @click="recommend(example)"
      >
        {{ example }}
      </button>
    </div>

    <div class="result">
      <div v-if="loading" class="state">
        <Loader />
        <div class="state-text">Claude가 고르고, OMDb에서 확인하는 중...</div>
      </div>

      <div v-else-if="error" class="state error">{{ error }}</div>

      <template v-else-if="result">
        <div class="summary">
          후보 {{ result.candidateCount }}편 중
          <strong>{{ result.movies.length }}편</strong>이 OMDb에서 확인됐어요.
          <span v-if="result.remaining !== undefined" class="remaining"
            >오늘 남은 횟수 {{ result.remaining }}번</span
          >
        </div>

        <div v-if="!result.movies.length" class="state">
          확인된 영화가 없어요. 다른 표현으로 적어 보세요.
        </div>

        <div class="cards">
          <RouterLink
            v-for="movie in result.movies"
            :key="movie.imdbID"
            :to="`/movie/${movie.imdbID}`"
            class="card-item"
          >
            <div
              :style="posterStyle(movie)"
              class="poster"
            >
              <span v-if="!posterOf(movie)">No Image</span>
            </div>
            <div class="body">
              <div class="title">{{ movie.Title }}</div>
              <div class="year">
                {{ movie.Year }} · <span class="verified">OMDb 확인됨</span>
              </div>
              <p class="reason">{{ movie.reason }}</p>
            </div>
          </RouterLink>
        </div>

        <details v-if="result.rejected.length" class="rejected">
          <summary>검증에서 걸러낸 후보 {{ result.rejected.length }}편</summary>
          <p class="rejected-desc">
            AI가 추천했지만 OMDb에서 같은 제목과 연도를 찾지 못한 후보예요.
            지어낸 제목이거나 연도가 틀렸을 수 있어 보여 드리지 않았어요.
          </p>
          <ul>
            <li
              v-for="item in result.rejected"
              :key="`${item.title}-${item.year}`"
            >
              {{ item.title }} ({{ item.year }}) · {{ item.why }}
            </li>
          </ul>
        </details>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../scss/main.scss";
.recommend {
  padding-top: 40px;
  padding-bottom: 60px;
}
h1 {
  font-family: "Oswald", sans-serif;
  font-size: 48px;
  span {
    color: $primary;
  }
}
.desc {
  color: $gray-600;
  margin: 16px 0 24px;
}
.ask {
  display: flex;
  gap: 10px;
  .form-control {
    height: 50px;
  }
  .btn {
    width: 120px;
    height: 50px;
    font-weight: 700;
    flex-shrink: 0;
  }
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  .chip {
    border: 1px solid $gray-300;
    background: $white;
    border-radius: 999px;
    padding: 6px 14px;
    font-size: 14px;
    color: $gray-700;
    &:hover:not(:disabled) {
      border-color: $primary;
      color: $black;
    }
  }
}
.result {
  margin-top: 30px;
}
.state {
  background-color: $gray-200;
  border-radius: 4px;
  padding: 60px 20px;
  text-align: center;
  color: $gray-600;
  position: relative;
  .state-text {
    margin-top: 70px;
  }
  &.error {
    color: $danger;
  }
}
.summary {
  margin-bottom: 16px;
  color: $gray-700;
  .remaining {
    margin-left: 10px;
    font-size: 13px;
    color: $gray-500;
  }
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.card-item {
  display: flex;
  gap: 14px;
  padding: 12px;
  border-radius: 6px;
  background-color: $gray-100;
  color: inherit;
  text-decoration: none;
  border: 2px solid transparent;
  &:hover {
    border-color: $primary;
  }
  .poster {
    width: 90px;
    height: 135px;
    flex-shrink: 0;
    border-radius: 4px;
    background-color: $gray-400;
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: $gray-600;
  }
  .title {
    font-weight: 700;
  }
  .year {
    font-size: 13px;
    color: $gray-600;
    margin: 2px 0 8px;
    .verified {
      color: $success;
    }
  }
  .reason {
    font-size: 14px;
    margin: 0;
  }
}
.rejected {
  margin-top: 24px;
  color: $gray-600;
  font-size: 14px;
  summary {
    cursor: pointer;
  }
  .rejected-desc {
    margin: 8px 0;
  }
}
@media (max-width: 576px) {
  h1 {
    font-size: 36px;
  }
  .ask {
    flex-direction: column;
    .btn {
      width: 100%;
    }
  }
}
</style>
