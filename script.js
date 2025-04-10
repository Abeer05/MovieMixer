const box = document.getElementById("popup");
const bg = document.getElementById("bg");
const search = document.getElementById("search");
const results = document.getElementById("results");

// TODO: MAKE CSS FOR LIST
// FIXME: DISPLAYRESULTS IS SO UGLY BUT THATS A PROBLEM FOR LATER
// FIXME: POSTERS NOT SHOWING UP? ALT ??
// TODO: ADD FONT

API_KEY = "970dced38f09a675c2ccc41b15fcdcb3";

let strip;
function popup(movie) {
  box.style.display = "inline";
  bg.style.display = "inline";
  bg.style.opacity = "50%";
  strip = movie == "strip1" ? "strip1" : "strip2";
}

function closePopup() {
  box.style.display = "none";
  bg.style.display = "none";
}

const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization:
      "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5NzBkY2VkMzhmMDlhNjc1YzJjY2M0MWIxNWZjZGNiMyIsIm5iZiI6MTcyNTY3MDY0MC43MjQ1NzgsInN1YiI6IjY2ZGJhMTcwZWRmMTVmNzI1ZWVlMGQyYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.RCuV2Afx8ZdosTh89Ibxjuyh8LP00QahLcWZDZf7tsY",
  },
};

fetch("https://api.themoviedb.org/3/authentication", options)
  .then((response) => response.json())
  .then((response) => console.log(response))
  .catch((err) => console.error(err));

search.addEventListener("input", () => {
  let query;
  query = search.value;
  searchMovies(query);
});

function searchMovies(query) {
  let timeout;
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    fetch(
      `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
        query
      )}&api_key=${API_KEY}`
    )
      .then((response) => response.json())
      .then((data) => {
        const sortedResults = data.results.sort(
          (a, b) => b.popularity - a.popularity
        );
        displayResults(sortedResults);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, 300);
}

let movie1 = "";
let movie2 = "";
async function fetchMovieData(movie, strip) {
  const credits = await fetch(
    `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${API_KEY}`
  );
  const creditsData = await credits.json();
  const cast = creditsData.cast || [];
  const crew = creditsData.crew || [];

  const element = document.getElementById(`${strip}`);
  element.children[0].src =
    movie.poster_path == null
      ? "img/strip.png"
      : `https://image.tmdb.org/t/p/w154${movie.poster_path}`;
  element.children[1].textContent =
    movie.poster_path == null ? movie.title : "";

  element.children[2].textContent =
    strip == "strip1" ? "Change First Movie" : "Change Second Movie";

  const selectedMovie = {
    title: movie.title,
    genre: movie.genre_ids
      .map((id) => genreIds.find((genre) => genre.id === id)?.name)
      .join(", "),
    overview: movie.overview,
    release_date: movie.release_date.split("-")[0],
    director: crew
      .filter((person) => person.known_for_department === "Directing")
      .map((person) => person.name)
      .join(", "),
    actors: cast
      .filter((person) => person.known_for_department === "Acting")
      .map((person) => person.name)
      .join(", "),
  };
  strip === "strip1" ? (movie1 = selectedMovie) : (movie2 = selectedMovie);

  if (movie1 && movie2) {
    document.querySelector(".fa-arrows-rotate").classList.add("fa-spin");
    await generateDatabase();
    sendData(database, movie1, movie2);
  }
}

function displayResults(movies) {
  if (results.innerHTML != "") {
    results.innerHTML = "";
  }
  if (movies.length != 0) {
    for (let i = 0; i < 10; i++) {
      const li = document.createElement("li");
      const container = document.createElement("div");
      const poster = document.createElement("img");
      const textContainer = document.createElement("div");
      const text = document.createElement("div");
      const year = document.createElement("div");

      container.style.display = "flex";
      container.style.alignItems = "center";
      container.style.gap = "10px";
      textContainer.style.display = "flex";
      textContainer.style.flexDirection = "column";
      textContainer.style.gap = "10px";
      poster.src =
        movies[i].poster_path == null
          ? "img/strip.png"
          : `https://image.tmdb.org/t/p/w92${movies[i].poster_path}`;
      poster.style.width = "50px";
      poster.style.height = "auto";
      text.textContent = movies[i].title;
      year.textContent = movies[i].release_date
        ? movies[i].release_date.split("-")[0]
        : "";

      results.appendChild(li);
      li.appendChild(container);
      container.appendChild(poster);
      container.appendChild(textContainer);
      textContainer.appendChild(text);
      textContainer.appendChild(year);

      li.addEventListener("click", () => {
        closePopup();
        fetchMovieData(movies[i], strip);
      });
    }
  } else if (query != "") {
    const h3 = document.createElement("h3");
    h3.textContent = "No Movies Found";
    results.appendChild(h3);
  }
}

const genreIds = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

const database = [];
async function generateDatabase() {
  const endpoints = ["popular", "top_rated", "now_playing", "upcoming"];

  for (endpoint of endpoints) {
    for (let i = 1; i <= 8; i++) {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${endpoint}?api_key=${API_KEY}&page=${i}`
      );
      const data = await response.json();
      const movies = data.results || [];

      for (const movie of movies) {
        if (
          database.some(
            (name) => name.title.toLowerCase() === movie.title.toLowerCase()
          ) ||
          movie.title.toLowerCase() === movie1.title.toLowerCase() ||
          movie.title.toLowerCase() === movie2.title.toLowerCase()
        ) {
          continue; // Skip adding the movie
        }

        let genres = [];

        const credits = await fetch(
          `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${API_KEY}`
        );
        const creditsData = await credits.json();
        const cast = creditsData.cast || [];
        const crew = creditsData.crew || [];

        const directors = crew
          .filter((person) => person.known_for_department === "Directing")
          .map((person) => person.name);
        const actors = cast
          .filter((person) => person.known_for_department === "Acting")
          .map((person) => person.name);
        movie.genre_ids.forEach((id) => {
          const genre = genreIds.find((genre) => genre.id === id);
          genres.push(genre.name);
        });

        database.push({
          title: movie.title,
          genre: genres.join(", "),
          overview: movie.overview,
          release_date: movie.release_date.split("-")[0],
          director: directors.join(", "),
          actors: actors.join(", "),
          poster: movie.poster_path,
        });
      }
    }
  }
}

function sendData(database, movie1, movie2) {
  const dataToSend = {
    database: database,
    movies: [movie1, movie2],
  };

  fetch("https://moviemixer.onrender.com/recommend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dataToSend),
  })
    .then((response) => response.json())
    .then((result) => {
      console.log("Success:", result);
      displayFinalResult(result);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function displayFinalResult(results) {
  const img = document.getElementById("image");
  const strip = document.getElementById("strip3");

  strip.classList.add("show");
  // for (let i = 0; i < results.length; i++) {
  img.src = `https://image.tmdb.org/t/p/w154${results[0].poster}`;
  // img.style.width = "50px";
  // img.style.height = "auto";
  // }
  img.src =
    results[0].poster == null
      ? "img/strip.png"
      : `https://image.tmdb.org/t/p/w154${results[0].poster}`;
  strip.children[1].textContent =
    results[0].poster == null ? results[0].title : "";
  console.log(results[0].poster);
  console.log(results[0].title);

  document.querySelector(".fa-arrows-rotate").classList.remove("fa-spin");
}
