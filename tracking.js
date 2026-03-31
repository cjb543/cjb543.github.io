const CONFIG = {
  chesscom: "cjb543",
  github: "cjb543",
  lat: 41.9931,
  lon: -88.6862,
};

function setLi(label, value) {
  for (const li of document.querySelectorAll("li")) {
    if (li.textContent.trimStart().toLowerCase().startsWith(label.toLowerCase())) {
      li.textContent = li.textContent.split(":")[0] + ": " + value;
      return;
    }
  }
}

function setPrice(label, price, change) {
  setLi(label, `${price}. ${change}`);
}

async function safe(fn) {
  try { await fn(); } catch (e) { console.warn(e); }
}

async function fetchChesscom() {
  const r = await fetch(`https://api.chess.com/pub/player/${CONFIG.chesscom}/stats`);
  const d = await r.json();
  const elo = d.chess_rapid?.last?.rating ?? d.chess_blitz?.last?.rating ?? d.chess_bullet?.last?.rating ?? "N/A";
  setLi("chess.com elo", elo);
}

async function fetchExchange() {
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const fmt = d => d.toISOString().split("T")[0];
  const [r1, r2] = await Promise.all([
    fetch("https://api.frankfurter.app/latest?from=USD&to=EUR"),
    fetch(`https://api.frankfurter.app/${fmt(yest)}?from=USD&to=EUR`),
  ]);
  const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
  const rate = d1.rates.EUR.toFixed(4);
  const delta = (d1.rates.EUR - d2.rates.EUR).toFixed(4);
  setLi("USD/EUR", `${rate}. ${delta >= 0 ? "+" : ""}${delta}`);
}

async function fetchGasIL() {
  const series = "EMM_EPMR_PTE_YORD_DPG";
  const r = await fetch(
    `https://api.eia.gov/v2/petroleum/pri/gnd/data/?frequency=weekly&data[0]=value&facets[series][]=${series}&sort[0][column]=period&sort[0][direction]=desc&length=2&api_key=rxTWS6udd2XMump4UNp4hgLYWudsAFa7Rzwjvr5E`
  );
  const d = await r.json();
  const [curr, prev] = d.response.data;
  const price = "$" + parseFloat(curr.value).toFixed(2);
  const delta = (parseFloat(curr.value) - parseFloat(prev.value)).toFixed(2);
  const change = (delta >= 0 ? "+$" : "-$") + Math.abs(delta);
  setPrice("IL unleaded", price, change);
}

async function fetchGithub() {
  const r = await fetch(`https://api.github.com/users/${CONFIG.github}`);
  const d = await r.json();
  setLi("github followers", d.followers ?? "N/A");
}

async function fetchWeather() {
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${CONFIG.lat}&longitude=${CONFIG.lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`
  );
  const d = await r.json();
  const temp = d.current?.temperature_2m;
  setLi("weather", temp != null ? `${temp}°F` : "N/A");
}

setLi("chess.com elo", "N/A");
setLi("github followers", "N/A");
setLi("weather", "N/A");

Promise.allSettled([
  safe(fetchChesscom),
  safe(fetchExchange),
  safe(fetchGasIL),
  safe(fetchGithub),
  safe(fetchWeather),
]);
