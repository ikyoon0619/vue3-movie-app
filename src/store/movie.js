import axios from "axios";

export default {
  namespaced: true,
  state: () => ({
    movies: [],
    message: "Search for the movie title!",
    loading: false,
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
    },
  },
  actions: {
    async searchMovies({ state, commit }, payload) {
      commit("updateState", {
        message: "",
      });
      const res = await _fetchMovie({
        ...payload,
        page: 1,
      });

      const { Search, totalResults } = res.data;
      commit("updateState", {
        movies: Search,
      });

      const total = parseInt(totalResults, 10);
      const pageLength = Math.ceil(total / 10);

      //
      if (pageLength > 1) {
        for (let page = 2; page <= pageLength; page += 1) {
          if (page > payload.number / 10) break;
          const res = await _fetchMovie({
            ...payload,
            page,
          });
          const { Search } = res.data;
          console.log(Search);
          commit("updateState", {
            movies: [...state.movies, ...Search],
          });
        }
      }
    },
  },
};

function _fetchMovie(payload) {
  const { title, type, year, page } = payload;
  const OMDB_API_KEY = "b7fe54e2";
  const url = `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${title}&type=${type}&year=${year}&page=${page}`;

  return new Promise((resolve, reject) => {
    axios
      .get(url)
      .then((res) => {
        console.log("res", res);
        if (res.data.Error) reject(res.data.Error);
        resolve(res);
      })
      .catch((err) => {
        reject(err.message);
      });
  });
}
