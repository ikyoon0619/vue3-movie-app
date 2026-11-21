import axios from "axios";

const _defaultMessage = "Search for the movie title!";

export default {
  namespaced: true,
  state: () => ({
    movies: [],
    message: _defaultMessage,
    loading: false,
    theMovie: {},
  }),
  getters: {},
  mutations: {
    updateState(state, payload) {
      Object.keys(payload).forEach((key) => {
        state[key] = payload[key];
      });
    },
    resetMovies(state) {
      state.movies = [];
      state.message = _defaultMessage;
      state.loading = false;
    },
  },
  actions: {
    async searchMovies({ state, commit }, payload) {
      if (state.loading) return;

      commit("updateState", {
        message: "",
        loading: true,
      });

      try {
        // 1페이지를 먼저 받아 전체 결과 수를 확인
        const res = await _fetchMovie({ ...payload, page: 1 });
        const { Search, totalResults } = res.data;

        // 더 받을 페이지 수: 전체 페이지 수와 선택한 개수(10/20/30) 중 작은 쪽
        const total = parseInt(totalResults, 10);
        const pageLength = Math.min(Math.ceil(total / 10), payload.number / 10);

        // 2페이지부터는 한 번에 동시에 요청 (하나씩 기다리지 않음)
        const requests = [];
        for (let page = 2; page <= pageLength; page += 1) {
          requests.push(_fetchMovie({ ...payload, page }));
        }
        const rest = await Promise.all(requests);

        commit("updateState", {
          movies: [...Search, ...rest.flatMap((r) => r.data.Search || [])],
        });
      } catch (message) {
        // _fetchMovie가 reject한 에러 문구를 그대로 화면에 보여 준다
        commit("updateState", {
          movies: [],
          message,
        });
      } finally {
        commit("updateState", { loading: false });
      }
    },
    async searchMovieWithId({ state, commit }, payload) {
      if (state.loading) return;
      commit("updateState", {
        theMovie: {},
        loading: true,
      });
      try {
        const res = await _fetchMovie(payload);
        commit("updateState", {
          theMovie: res.data,
        });
      } catch (error) {
        commit("updateState", {
          theMovie: {},
        });
      } finally {
        commit("updateState", {
          loading: false,
        });
      }
    },
  },
};

function _fetchMovie(payload) {
  const { title, type, year, page, id } = payload;

  // API 키 없이 우리 Netlify Function을 부른다
  const params = id
    ? { i: id, plot: "full" }
    : { s: title, type, y: year, page };

  return new Promise((resolve, reject) => {
    axios
      .get("/.netlify/functions/movie", { params })
      .then((res) => {
        if (res.data.Error) return reject(res.data.Error);
        resolve(res);
      })
      .catch((err) => {
        // Function이 400/500을 보내면 그 안의 Error 문구를 우선 사용
        reject(err.response?.data?.Error || err.message);
      });
  });
}
