async function loadSeaLevelData() {
  const response = await fetch("sea-level-data.json");
  const { sea_levels } = await response.json();

const scenarios = [
  { id: "ssp126", label: "SSP1-2.6" },
  { id: "ssp245", label: "SSP2-4.5" },
  { id: "ssp585", label: "SSP5-8.5" },
];
const bandColors = ["#082b52", "#104b7a", "#176d9e", "#278fbd", "#55b4d6", "#a1d9eb"];
const tickYears = [2030, 2045, 2060, 2075, 2090];
const baseline = -5.8;
const innerW = 725;
const innerH = 468;
const axisX = innerW / 2;
const bandH = innerH / bandColors.length;
const labelW = 172;
const labelH = 46;

const rowsByScenario = d3.group(
  sea_levels
    .filter(row => row.year >= 2015 && row.year <= 2100)
    .sort((a, b) => a.year - b.year || a.month - b.month),
  row => row.scenario,
);
const y = d3.scaleLinear().range([innerH, 0]);
let scenario, rows, level, labelX = innerW / 2;

const svg = d3.select("#chart").append("svg")
  .attr("viewBox", "0 0 900 500")
  .attr("role", "img")
  .attr("aria-label", "Interactive projected sea level line chart");
const plot = svg.append("g").attr("transform", "translate(155,16)");

const grid = plot.append("g").attr("stroke", "rgba(98, 112, 124, 0.18)");
const clipRect = plot.append("clipPath").attr("id", "water-clip").append("rect").attr("width", innerW);
const bands = plot.append("g").attr("clip-path", "url(#water-clip)")
  .selectAll("rect").data(bandColors).join("rect")
  .attr("width", innerW)
  .attr("height", bandH)
  .attr("y", (_, i) => innerH - (i + 1) * bandH);

plot.append("text")
  .attr("class", "axis-title")
  .attr("transform", "rotate(-90)")
  .attr("x", -innerH / 2).attr("y", -115)
  .attr("text-anchor", "middle")
  .text("Sea Level Changes (in m)");
  
const yAxis = plot.append("g").attr("transform", `translate(${axisX},0)`);
const axisLine = color => plot.append("line").attr("x1", axisX).attr("x2", axisX).attr("stroke", color);
const axisTop = axisLine("#000");
const axisBottom = axisLine("#fff").attr("y2", innerH);

const levelLine = plot.append("g");
levelLine.append("rect")
  .attr("width", innerW).attr("y", -30).attr("height", 60)
  .attr("fill", "transparent").attr("cursor", "ns-resize");
levelLine.append("line").attr("x2", innerW).attr("stroke", "#d42424").attr("stroke-width", 4.5);

const label = plot.append("g").attr("pointer-events", "none");
label.append("rect")
  .attr("width", labelW).attr("height", labelH).attr("rx", 6)
  .attr("fill", "#fff").attr("stroke", "#000").attr("stroke-width", 1.5);
const labelYear = label.append("text").attr("x", 10).attr("y", 20)
  .attr("font-size", 15).attr("font-weight", 650).attr("fill", "#1d2b36");
const labelLevel = label.append("text").attr("x", 10).attr("y", 36)
  .attr("font-size", 11.5).attr("fill", "#62707c");

function drawAxis() {
  const marks = [
    { year: 2015, level: baseline },
    ...tickYears.map(year => ({ year, level: rows.find(row => row.year === year).sea_level })),
  ].sort((a, b) => a.level - b.level);
  const yearAt = new Map(marks.map(mark => [mark.level, mark.year]));
  y.domain([baseline, d3.max(rows.filter(row => row.year === 2100), row => row.sea_level)]);

  grid.selectAll("line").data(marks).join("line")
    .attr("x2", innerW)
    .attr("y1", mark => y(mark.level))
    .attr("y2", mark => y(mark.level));

  yAxis.selectAll("*").remove();
  yAxis.call(d3.axisLeft(y)
    .tickValues(marks.map(mark => mark.level))
    .tickSize(12)
    .tickPadding(10)
    .tickFormat(value => `+ ${d3.format(".2f")(value - baseline)} m`));

  const ticks = yAxis.selectAll(".tick").on("click", (event, value) => {
    level = value;
    labelX = innerW / 2;
    update();
  });
  ticks.select("text").attr("x", -axisX - 12);

  const tip = ticks.append("g").attr("class", "tip");
  tip.append("circle").attr("r", 13);
  tip.append("rect").attr("x", 19).attr("y", -29).attr("width", 90).attr("height", 28).attr("rx", 14);
  tip.append("text").attr("x", 64).attr("y", -10).text(value => `Year ${yearAt.get(value)}`);
  ticks.append("circle").attr("r", 19).attr("fill", "transparent");
}

function update() {
  const [low, high] = y.domain();
  level = Math.max(low, Math.min(high, level));
  const py = y(level);
  const passed = Math.min(bandColors.length, Math.floor(py / bandH));
  const year = rows.find(row => row.sea_level >= level)?.year ?? 2100;

  clipRect.attr("y", py).attr("height", innerH - py);
  bands.attr("fill", (_, i) => bandColors[i + passed]);
  levelLine.attr("transform", `translate(0,${py})`);
  axisTop.attr("y2", py);
  axisBottom.attr("y1", py);
  yAxis.selectAll(".tick").select("line")
    .attr("stroke", value => y(value) >= py ? "#fff" : "#45515c")
    .attr("stroke-width", 2);

  labelYear.text(`Year ${year}`);
  labelLevel.text(`Sea level: ${d3.format(".3f")(level)} m`);
  label.attr("transform", `translate(${Math.max(0, Math.min(innerW - labelW, labelX + 16))},` +
    `${py < labelH + 12 ? py + 14 : py - labelH - 10})`);
  buttons.classed("active", s => s.id === scenario);
}

function selectScenario(id) {
  scenario = id;
  rows = rowsByScenario.get(id);
  level = d3.median(rows, row => row.sea_level);
  drawAxis();
  update();
}

const buttons = d3.select("#scenarios").selectAll("button")
  .data(scenarios.filter(s => rowsByScenario.has(s.id)))
  .join("button")
  .text(s => s.label)
  .on("click", (event, s) => selectScenario(s.id));

levelLine.call(d3.drag().on("start drag", event => {
  level = y.invert(event.y);
  labelX = event.x;
  update();
}));

svg.on("pointermove", event => {
  labelX = d3.pointer(event, plot.node())[0];
  update();
});

selectScenario("ssp585");
}

loadSeaLevelData();