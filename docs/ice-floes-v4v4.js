const records = arcticIceData.ice.filter(row => row.month === 9);
const byYear = d3.index(records, d => d.scenario, d => d.year);
const pathways = [
  ["ssp126", "SSP1-2.6 · lower emissions"],
  ["ssp245", "SSP2-4.5 · intermediate"],
  ["ssp585", "SSP5-8.5 · very high emissions"],
];
const yearInput = document.querySelector("#year");
const pathwayChoices = Array.from(document.querySelectorAll(".pathway-choice"));
const pathwaySummary = document.querySelector("#pathway-summary");
const pathwayMenu = document.querySelector(".pathway-menu");
const selectionStatus = document.querySelector("#selection-status");
const visualization = document.querySelector("#visualization");
const differenceLegend = document.querySelector("#ice-difference");
const differenceText = document.querySelector("#ice-difference-text");
let selectedScenarios = [];
let started = false;

function syncPathwayPicker() {
  const chosen = pathwayChoices.filter(choice => choice.checked);
  pathwayChoices.forEach(choice => {
    choice.disabled = !choice.checked && chosen.length >= 2;
  });
  if (chosen.length === 2) {
    selectedScenarios = chosen.map(choice => choice.value)
      .sort((a, b) => pathways.findIndex(path => path[0] === a) - pathways.findIndex(path => path[0] === b));
    pathwaySummary.textContent = selectedScenarios.map(id => pathways.find(path => path[0] === id)[1]).join(" + ");
    selectionStatus.textContent = "Two pathways selected.";
    pathwayMenu.open = false;
    started = true;
    yearInput.disabled = false;
  } else {
    pathwaySummary.textContent = chosen.length ? `${chosen.length} of 2 pathways selected` : "Choose two pathways";
    selectionStatus.textContent = `Select ${2 - chosen.length} more pathway${chosen.length === 1 ? "" : "s"}.`;
    selectedScenarios = [];
    started = false;
    yearInput.disabled = true;
  }
  update();
}
pathwayChoices.forEach(choice => choice.addEventListener("change", syncPathwayPicker));
const tileArea = 0.05; // million km²
const radius = 12;
const width = Math.sqrt(3) * radius;
const cells = [];
for (let row = 0; row < 11; row++) {
  for (let col = 0; col < 17; col++) {
    const x = 18 + width * (col + 0.5 * (row % 2));
    const y = 20 + row * radius * 1.5;
    const anchor = row === 5 && (col === 5 || col === 10);
    // Remove the outer ice first, with an uneven but repeatable shoreline
    const edge = Math.hypot((x - 186) / 174, (y - 109) / 94)
      + 0.12 * Math.sin(col * 2 + row * 0.8);
    cells.push({x, y, anchor, edge});
  }
}
const anchors = cells.filter(d => d.anchor);
const floe = cells.sort((a, b) => a.edge - b.edge);
const hexVertices = d3.range(6).map(i => {
  const angle = Math.PI * (i / 3 - 0.5);
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
});
const hex = hexVertices.map(point => point.join(",")).join(" ");
const sideMark = (x1, y1, x2, y2) => `M${x1},${y1} L${x2},${y2}`;
const sideMarksPath = [
  sideMark(radius * 0.57, -radius * 0.22, radius * 0.8, -radius * 0.42),
  sideMark(radius * 0.57, radius * 0.25, radius * 0.8, radius * 0.05),
].join(" ");

const iceColor = d3.interpolateRgb("#d5ecee", "#f1f8f7");      // darker blue tiles -> light blue
const extraIceStroke = "#58cbd8";
const tileShade = d => 0.5 + 0.45 * Math.sin(d.x + d.y);

d3.select("#ice-difference svg").append("path")
  .attr("d", sideMarksPath).attr("fill", "none")
  .attr("stroke", extraIceStroke).attr("stroke-width", 1.2)
  .attr("stroke-linecap", "round");

function addBear(svg, cell, scale) {
  const bear = svg.append("g").attr("aria-hidden", "true")
    .attr("transform", `translate(${cell.x},${cell.y}) scale(${scale})`);
  bear.append("ellipse").attr("rx", 12).attr("ry", 2.5).attr("fill", "#b0cdd3"); // shadow
  bear.append("path").attr("fill", "#fffefa").attr("stroke", "#76919b").attr("stroke-width", 0.7)
    .attr("d", [
      "M-12,-8 Q-13,-15 -5,-16 Q0,-17 4,-13",  // back and shoulder
      "L8,-12 Q9,-16 11,-14",  // neck and ear
      "L12,-12 L16,-10 L18,-8 Q17,-6 13,-7 L9,-7",  // shout and chin
      "L8,-1 L5,-1 L5,-6 L3,-1 L1,-1 L1,-6",  // front legs
      "L-5,-6 L-6,0 L-9,0 L-9,-6 L-11,-1 L-13,-1",  // belly and hind legs
      "Z",  // done
    ].join(" "));
  bear.append("circle").attr("cx", 13).attr("cy", -10).attr("r", 0.75).attr("fill", "#203e49"); // eyes
  bear.append("circle").attr("cx", 17.4).attr("cy", -8.5).attr("r", 1).attr("fill", "#203e49"); // nose

  return bear;
}

function addGhostBear(svg, cell, scale) {
  const bear = svg.append("g").attr("aria-hidden", "true")
    .attr("transform", `translate(${cell.x},${cell.y}) scale(${scale})`)
    .attr("opacity", 0);
  bear.append("path") .attr("fill", "#e8f8fa") .attr("fill-opacity", 0.75) .attr("stroke", "#8bbcc5") .attr("stroke-width", 0.9) .attr("stroke-dasharray", "2 1") .attr("d", [ "M-12,-8 Q-13,-15 -5,-16 Q0,-17 4,-13", "L8,-12 Q9,-16 11,-14", "L12,-12 L16,-10 L18,-8 Q17,-6 13,-7 L9,-7", "L8,-1 L5,-1 L5,-6 L3,-1 L1,-1 L1,-6", "L-5,-6 L-6,0 L-9,0 L-9,-6 L-11,-1 L-13,-1", "Z", ].join(" "));
  bear.append("circle") .attr("cx", 13).attr("cy", -10).attr("r", 0.75) .attr("fill", "#8bbcc5");
  bear.append("circle") .attr("cx", 17.4).attr("cy", -8.5).attr("r", 1) .attr("fill", "#8bbcc5");
  return bear;
}

function createPanel() {
  const panel = d3.select(".panels").append("article");
  const header = panel.append("header").attr("class", "panel-heading");
  const label = header.append("strong").text("Choose a pathway");
  const areaLabel = header.append("span").attr("class", "area-label");
  const areaValue = areaLabel.append("b").text("—");
  areaLabel.append("span").text(" million km²");
  const svg = panel.append("svg").attr("class", "scene").attr("viewBox", "0 0 380 224")
    .attr("role", "img").attr("aria-label", "Choose a pathway to show the September sea-ice scene");
  return {header, label, svg, tiles: null, areaValue, initialized: false};
}
const panels = [createPanel(), createPanel()];

function matchPanelHeaderHeights() {
  const headers = panels.map(panel => panel.header.node());
  headers.forEach(header => { header.style.minHeight = ""; });
  const sharedHeight = Math.max(...headers.map(header => header.getBoundingClientRect().height));
  headers.forEach(header => { header.style.minHeight = `${sharedHeight}px`; });
}
window.addEventListener("resize", matchPanelHeaderHeights);

const temperatureSvg = d3.select("#temperature-chart");
const chartWidth = 1000;
const chartHeight = 350;
const margin = {top: 42, right: 110, bottom: 64, left: 110};
const plotLeft = margin.left;
const plotRight = chartWidth - margin.right;
const plotTop = margin.top;
const plotBottom = chartHeight - margin.bottom;
const xScale = d3.scaleLinear().domain([2015.5, 2100.5]).range([plotLeft, plotRight]);
const xAxisGroup = temperatureSvg.append("g").attr("class", "axis x-axis");
const yAxisGroup = temperatureSvg.append("g").attr("class", "axis y-axis");
const gridGroup = temperatureSvg.append("g").attr("class", "grid");
const selectedPeriod = temperatureSvg.append("g").attr("class", "selected-period")
  .attr("display", "none").attr("pointer-events", "none");
const periodShade = selectedPeriod.append("rect")
  .attr("fill", "#f2ce82").attr("fill-opacity", 0.32);
const periodEdges = selectedPeriod.selectAll("line").data([0, 1]).join("line")
  .attr("stroke", "#ac7c2c").attr("stroke-width", 1.2)
  .attr("stroke-dasharray", "4 3");
const band = temperatureSvg.append("path").attr("class", "scenario-band")
  .attr("fill", "#d7ecea").attr("opacity", 0.78);
const seriesLayer = temperatureSvg.append("g");
const periodLabel = temperatureSvg.append("text").attr("class", "period-label")
  .attr("y", 22).attr("display", "none");
const pointsLayer = temperatureSvg.append("g");
const labelsLayer = temperatureSvg.append("g");
const callout = temperatureSvg.append("g");
const chartColors = ["#137985", "#ed7056"];
const scenarioNames = {
  ssp126: "SSP1-2.6",
  ssp245: "SSP2-4.5",
  ssp585: "SSP5-8.5",
};
let temperatureRows = null;
let temperatureByScenario = null;

function updateTemperatureChart() {
  if (!temperatureRows || !temperatureByScenario) return;
  const [minimum, maximum] = d3.extent(temperatureRows, d => d.anomaly_c);
  const yScale = d3.scaleLinear()
    .domain([Math.min(0, minimum), maximum])
    .nice(5)
    .range([plotBottom, plotTop]);
  const years = [2016, 2030, 2040, 2050, 2060, 2070, 2080, 2090, 2100];

  xAxisGroup.attr("transform", `translate(0,${plotBottom})`)
    .call(d3.axisBottom(xScale).tickValues(years).tickFormat(d3.format("d")));
  yAxisGroup
    .attr("transform", `translate(${plotLeft},0)`)
    .call(
      d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => `${d > 0 ? "+" : ""}${d.toFixed(0)}°`)
    );

  gridGroup.attr("transform", `translate(${plotLeft},0)`)
    .call(d3.axisLeft(yScale).ticks(5).tickSize(-(plotRight - plotLeft)).tickFormat(""));

  temperatureSvg.selectAll("text.axis-title").remove();
  temperatureSvg.append("text").attr("class", "axis-title")
    .attr("x", (plotLeft + plotRight) / 2).attr("y", chartHeight - 14)
    .attr("text-anchor", "middle").text("Year");
  temperatureSvg.append("text").attr("class", "axis-title")
    .attr("transform", `translate(35,${(plotTop + plotBottom) / 2}) rotate(-90)`)
    .attr("text-anchor", "middle").text("Arctic temperature change (°C)");

  if (!started || selectedScenarios.length !== 2) {
    band.attr("d", null);
    periodLabel.attr("display", "none");
    temperatureSvg.attr("aria-label", "Choose two pathways to compare Arctic temperature from 2016 to 2100");
    selectedPeriod.attr("display", "none");
    seriesLayer.selectAll("path.series").remove();
    pointsLayer.selectAll("circle").remove();
    labelsLayer.selectAll("text.series-label").remove();
    callout.selectAll("*").remove();
    return;
  }
  const year = Number(yearInput.value);
  const endYear = year + 4;
  const periodMiddle = year + 2;
  const series = selectedScenarios.map((scenario, index) => ({
    scenario,
    index,
    rows: temperatureByScenario.get(scenario) || [],
  }));
  if (series.some(item => item.rows.length === 0)) return;

  const pairedRows = series[0].rows.map((row, i) => ({
    year: row.year,
    first: row.anomaly_c,
    second: series[1].rows[i].anomaly_c,
  }));
  const area = d3.area()
    .x(d => xScale(d.year))
    .y0(d => yScale(d.first))
    .y1(d => yScale(d.second))
    .curve(d3.curveMonotoneX);
  band.attr("d", area(pairedRows));

  const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.anomaly_c))
    .curve(d3.curveMonotoneX);
  seriesLayer.selectAll("path.series")
    .data(series, d => `${d.index}-${d.scenario}`)
    .join("path")
    .attr("class", "series")
    .attr("fill", "none")
    .attr("stroke", d => chartColors[d.index])
    .attr("stroke-width", 3)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr("d", d => line(d.rows));

  const current = series.map(item => ({
    ...item,
    periodRows: item.rows.filter(d => d.year >= year && d.year <= endYear),
    value: {anomaly_c: d3.mean(item.rows.filter(d => d.year >= year && d.year <= endYear), d => d.anomaly_c)},
  }));
  const periodLeft = xScale(year - 0.5);
  const periodRight = xScale(endYear + 0.5);
  selectedPeriod.attr("display", null);
  periodShade.attr("x", periodLeft).attr("y", plotTop)
    .attr("width", periodRight - periodLeft).attr("height", plotBottom - plotTop);
  periodEdges.attr("x1", d => d === 0 ? periodLeft : periodRight)
    .attr("x2", d => d === 0 ? periodLeft : periodRight)
    .attr("y1", plotTop).attr("y2", plotBottom);
  pointsLayer.selectAll("circle")
    .data(current.flatMap(item => item.periodRows.filter(row => row.year === year || row.year === endYear).map(row => ({
      index: item.index, scenario: item.scenario, value: row,
    }))), d => `${d.index}-${d.value.year}`)
    .join("circle")
    .attr("cx", d => xScale(d.value.year))
    .attr("cy", d => yScale(d.value.anomaly_c))
    .attr("r", 3.5)
    .attr("fill", d => chartColors[d.index])
    .attr("stroke", "white")
    .attr("stroke-width", 2);

  periodLabel.attr("display", null)
    .attr("x", Math.max(plotLeft + 42, Math.min(xScale(periodMiddle), plotRight - 42)))
    .attr("text-anchor", "middle").text(`${year}–${endYear}`);

  labelsLayer.selectAll("text.series-label")
    .data(series, d => d.index)
    .join("text")
    .attr("class", "series-label")
    .attr("x", plotRight + 10)
    .attr("y", d => yScale(d.rows[d.rows.length - 1].anomaly_c) + 4)
    .attr("fill", d => chartColors[d.index])
    .style("fill", d => chartColors[d.index])
    .text(d => scenarioNames[d.scenario]);

  const values = current.map(d => d.value && d.value.anomaly_c);
  if (values.every(Number.isFinite)) {
    const warmer = values[0] >= values[1] ? 0 : 1;
    const gap = Math.abs(values[0] - values[1]);
    const label = `${gap.toFixed(1)}°C warmer than ${scenarioNames[current[warmer].scenario]}`;
    const calloutWidth = 218;
    const markerX = xScale(periodMiddle);
    const chartMidpoint = (2016 + 2100) / 2;
    const preferredX = periodMiddle <= chartMidpoint
      ? markerX + 13
      : markerX - calloutWidth - 13;
    const calloutX = Math.max(plotLeft + 8, Math.min(preferredX, plotRight - calloutWidth));
    const calloutLineYs = series.flatMap(item => item.rows
      .filter(row => xScale(row.year) >= calloutX - 10 && xScale(row.year) <= calloutX + calloutWidth + 10)
      .map(row => yScale(row.anomaly_c)));
    const highestLineY = Math.min(...calloutLineYs);
    const lowestLineY = Math.max(...calloutLineYs);
    const aboveLinesY = highestLineY - 56;
    const belowLinesY = lowestLineY + 8;
    const fallbackY = Math.max(plotTop + 6, Math.min((yScale(values[0]) + yScale(values[1])) / 2 - 78, plotBottom - 54));
    const calloutY = aboveLinesY >= plotTop + 6
      ? aboveLinesY
      : belowLinesY <= plotBottom - 54
        ? belowLinesY
        : fallbackY;
    callout.selectAll("*").remove();
    callout.append("rect").attr("x", calloutX).attr("y", calloutY)
      .attr("width", calloutWidth).attr("height", 48).attr("rx", 12)
      .attr("fill", "#fff8f5").attr("stroke", "#ed7056").attr("stroke-width", 1.5);
    callout.append("text").attr("class", "gap-label")
      .attr("x", calloutX + calloutWidth / 2).attr("y", calloutY + 20)
      .attr("text-anchor", "middle").text(label);
    callout.append("text").attr("class", "gap-period")
      .attr("x", calloutX + calloutWidth / 2).attr("y", calloutY + 37)
      .attr("text-anchor", "middle").text(`${year}–${endYear} average`);
  }
  temperatureSvg.attr("aria-label", `Annual Arctic temperature pathways with ${year} to ${endYear} highlighted. Five-year mean anomalies: ${scenarioNames[series[0].scenario]} ${values[0].toFixed(1)} degrees Celsius and ${scenarioNames[series[1].scenario]} ${values[1].toFixed(1)} degrees Celsius relative to each pathway's 2015 to 2024 average`);
}

function update() {
  const year = Number(yearInput.value);
  const endYear = year + 4;
  document.querySelector(".year-selected output").textContent = `${year}–${endYear}`;
  if (!started) {
    panels.forEach(panel => {
      panel.svg.selectAll("*").remove();
      panel.initialized = false;
      panel.tiles = null;
      panel.label.text("Choose a pathway");
      panel.areaValue.text("—");
      panel.svg.attr("aria-label", "Choose a pathway to show the September sea-ice scene");
      panel.bears = null;
    });
    differenceLegend.hidden = true;
    matchPanelHeaderHeights();
    updateTemperatureChart();
    return;
  }
  const areas = selectedScenarios.map(scenario => {
    const yearData = byYear.get(scenario);
    return d3.mean(d3.range(year, endYear + 1), y => yearData.get(y)?.area);
  });
  const counts = areas.map(area => Math.round(area / tileArea));
  const extraTiles = Math.abs(counts[0] - counts[1]);
  const sharedTiles = Math.min(...counts);
  const moreIceIndex = extraTiles === 0 ? -1 : counts[0] > counts[1] ? 0 : 1;
  
const pathwayName = moreIceIndex === -1
  ? ""
  : pathways.find(
      p => p[0] === selectedScenarios[moreIceIndex]
    )?.[1];

differenceText.textContent = extraTiles === 0
  ? "Same rounded tile count"
  : `${extraTiles} more tile${extraTiles === 1 ? "" : "s"} in ${pathwayName} (${moreIceIndex === 0 ? "left" : "right"})`;
differenceLegend.querySelector("svg").style.display = extraTiles === 0 ? "none" : "";
  differenceLegend.hidden = false;
  panels.forEach((panel, index) => {
    const {label, svg, areaValue} = panel;
    const scenario = selectedScenarios[index];
    const area = areas[index];
    const count = counts[index];

    if (!panel.initialized) {
      panel.tiles = svg.selectAll("polygon").data(floe).join("polygon")
        .attr("points", hex).attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("fill", d => iceColor(tileShade(d)))
        .attr("stroke", "#d6e9eb").attr("stroke-width", 0.45)
        .attr("stroke-linejoin", "round");
      panel.hatches = svg.append("g").attr("class", "extra-ice-hatches").style("pointer-events", "none");
      // anchors.forEach((cell, i) => addBear(svg, cell, i ? 0.58 : 0.78));
      panel.bears = anchors.map((cell, i) => ({ tileIndex: floe.indexOf(cell), original: addBear(svg, cell, i ? 0.58 : 0.78), ghost: addGhostBear(svg, cell, i ? 0.58 : 0.78), }));
      
      panel.changeOutlines = svg.append("g").attr("class", "change-outlines").style("pointer-events", "none");
      panel.initialized = true;
    }
    label.text(pathways.find(d => d[0] === scenario)[1]);
    const previousCount = panel.previousCount;
    const previousScenario = panel.previousScenario;
    if (previousCount !== undefined && previousScenario === scenario && count !== previousCount) { 
      const disappearing = count < previousCount; const changedTiles = floe.slice(
        Math.min(count, previousCount),
        Math.max(count, previousCount)
      );
      panel.changeOutlines.selectAll("*").remove();
      panel.changeOutlines.selectAll("polygon").data(changedTiles).join("polygon").attr("points", hex).attr("transform", d => `translate(${d.x},${d.y})`).attr("fill", "none").attr("stroke", disappearing ? "red":"green").attr("stroke-width", 2).attr("stroke-opacity", 0.4).transition().duration(1000).attr("stroke-opacity", 0).remove();
    }
    panel.previousCount = count;
    panel.previousScenario = scenario;
    const isExtraTile = i => index === moreIceIndex && i >= sharedTiles && i < count;
    panel.tiles.transition().duration(250)
      .attr("opacity", (d, i) => i < count ? 1 : 0)
      .attr("fill", d => iceColor(tileShade(d)))
      .attr("stroke", (d, i) => isExtraTile(i) ? extraIceStroke : "#d6e9eb")
      .attr("stroke-width", (d, i) => isExtraTile(i) ? 1.7 : 0.45);
    panel.hatches.selectAll("path")
      .data(index === moreIceIndex ? floe.slice(sharedTiles, count) : [], d => floe.indexOf(d))
      .join("path")
      .attr("d", sideMarksPath)
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .attr("fill", "none")
      .attr("stroke", extraIceStroke)
      .attr("stroke-width", 1.2)
      .attr("stroke-linecap", "round")
      .attr("stroke-opacity", 0.9);
    areaValue.text(d3.format(".3f")(area));
    panel.bears.forEach(bear => {
      const tileExists = bear.tileIndex < count;
      bear.original.transition().duration(250).attr("opacity", tileExists ? 1 : 0);
      bear.ghost.transition().duration(250).attr("opacity", tileExists ? 0 : 1);});
    svg.attr("aria-label", `${scenario}, September ${year}–${endYear}: mean sea-ice area of ${area.toFixed(3)} million square kilometres`);
  });
  matchPanelHeaderHeights();
  updateTemperatureChart();
}
yearInput.addEventListener("input", update);
d3.csv("arctic-temperature.csv", d3.autoType)
  .then(rows => {
    temperatureRows = rows.filter(d => d.year >= 2016 && d.year <= 2100);
    temperatureByScenario = d3.group(temperatureRows, d => d.scenario);
    updateTemperatureChart();
  })
  .catch(error => {
    console.error("Could not load Arctic temperature data:", error);
    temperatureSvg.append("text").attr("x", 80).attr("y", 80)
      .attr("class", "axis-title").text("Could not load Arctic temperature data.");
  });
pathwayChoices.find(choice => choice.value === "ssp126").checked = true;
pathwayChoices.find(choice => choice.value === "ssp585").checked = true;
syncPathwayPicker();
