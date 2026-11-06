const records = climateData.ice.filter(row => row.month === 9);
const byYear = d3.index(records, d => d.scenario, d => d.year);
const pathways = [
  ["ssp126", "SSP1-2.6 · lower emissions"],
  ["ssp245", "SSP2-4.5 · intermediate"],
  ["ssp585", "SSP5-8.5 · very high emissions"],
];
const yearInput = document.querySelector("#year");
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
const hex = d3.range(6).map(i => {
  const angle = Math.PI * (i / 3 - 0.5);
  return [radius * Math.cos(angle), radius * Math.sin(angle)].join(",");
}).join(" ");

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
}

function createPanel(index) {
  const panel = d3.select(".panels").append("article");
  const label = panel.append("header").append("label").text(index ? "Second pathway" : "First pathway");
  const select = label.append("select").on("change", update);
  select.selectAll("option").data(pathways).join("option").attr("value", d => d[0]).text(d => d[1]);
  select.property("value", index ? "ssp585" : "ssp126");
  const svg = panel.append("svg").attr("class", "scene").attr("viewBox", "0 0 380 224")
    .attr("role", "img");
  const tiles = svg.selectAll("polygon").data(floe).join("polygon")
    .attr("points", hex).attr("transform", d => `translate(${d.x},${d.y})`)
    .attr("fill", d => d3.interpolateRgb("#d5ecee", "#f1f8f7")(0.5 + 0.45 * Math.sin(d.x + d.y)))
    .attr("stroke", "#d6e9eb").attr("stroke-width", 0.45);
  anchors.forEach((cell, i) => addBear(svg, cell, i ? 0.58 : 0.78));
  const footer = panel.append("footer");
  const areaLabel = footer.append("b");
  footer.append("span").text(" million km²");
  footer.append("small").text("September sea-ice area");
  return {select, svg, tiles, areaLabel};
}
const panels = [createPanel(0), createPanel(1)];

function update() {
  const year = Number(yearInput.value);
  document.querySelector("output").textContent = year;
  for (const {select, svg, tiles, areaLabel} of panels) {
    const scenario = select.property("value");
    const area = byYear.get(scenario).get(year).area;
    const count = Math.round(area / tileArea);
    tiles.attr("opacity", (d, i) => i < count ? 1 : 0);
    areaLabel.text(d3.format(".3f")(area));
    svg.attr("aria-label", `${scenario}, September ${year}: ${area.toFixed(3)} million square kilometres of sea ice`);
  }
}
yearInput.addEventListener("input", update);
update();
