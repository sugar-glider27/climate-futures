const { ice, emissions } = JSON.parse(document.querySelector("#climate-data").textContent);

const pathways = [
  { id: "ssp126", label: "SSP1-2.6", color: "#007a60" },
  { id: "ssp245", label: "SSP2-4.5", color: "#7752a1" },
  { id: "ssp585", label: "SSP5-8.5", color: "#ac491d" },
];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const windowYears = 20;
const lowIceThreshold = 1; // million km²

// Keep the same area-to-color mapping for every pathway and time window.
const iceColor = d3.scaleLinear()
  .domain([0, 4, 12, 16])
  .range(["#c32424", "#e56c60", "#74bcff", "#449bec"])
  .clamp(true);

function drawEmissionsChart() {
  const svg = d3.select("#emissions");
  const yearScale = d3.scaleLinear([2015, 2100], [45, 640]);
  const emissionsScale = d3.scaleLinear([-15, 135], [172, 12]);
  const band = svg.append("rect").attr("y", 10).attr("height", 162).attr("fill", "#e3edf3");

  svg.append("g")
    .attr("transform", "translate(0,172)")
    .call(d3.axisBottom(yearScale).ticks(7).tickFormat(d3.format("d")));
  svg.append("g")
    .attr("transform", "translate(45,0)")
    .call(d3.axisLeft(emissionsScale).ticks(5));
  svg.append("line")
    .attr("x1", 45).attr("x2", 640)
    .attr("y1", emissionsScale(0)).attr("y2", emissionsScale(0))
    .attr("stroke", "#999");

  const line = d3.line()
    .x(row => yearScale(row.year))
    .y(row => emissionsScale(row.gt_co2));

  for (const pathway of pathways) {
    const rows = emissions.filter(row => row.scenario === pathway.id);
    svg.append("path")
      .datum(rows).attr("d", line)
      .attr("stroke", pathway.color).attr("stroke-width", 3).attr("fill", "none");
    svg.append("text")
      .attr("x", 646).attr("y", emissionsScale(rows.at(-1).gt_co2) + 4)
      .attr("fill", pathway.color).text(pathway.label);
  }
  return { band, yearScale };
}

function drawIceCalendar(start, end) {
  const selected = ice.filter(row => row.year >= start && row.year <= end);
  const averages = d3.rollup(selected, rows => d3.mean(rows, row => row.area),
    row => row.scenario, row => row.month);

  const body = d3.select("#calendar tbody");
  body.selectAll("tr").remove();
  for (const pathway of pathways) {
    const row = body.append("tr");
    row.append("th").attr("scope", "row").style("color", pathway.color).text(pathway.label);

    const areas = months.map((_, index) => averages.get(pathway.id).get(index + 1));
    row.selectAll("td").data(areas).join("td")
      .style("background", area => iceColor(area))
      .style("color", area => area < 1.7 ? "white" : "black")
      .attr("title", area => area.toFixed(3) + " million km²")
      .text(area => area.toFixed(1) + (area < lowIceThreshold ? " ●" : ""));
    row.append("td").text(areas.filter(area => area < lowIceThreshold).length);
  }
}

const { band, yearScale } = drawEmissionsChart();
d3.select("#calendar thead tr").selectAll("th")
  .data(["Pathway", ...months, "Below 1"]).join("th").text(label => label);

const slider = document.querySelector("#start-year");
function updatePeriod() {
  const start = Number(slider.value);
  const end = start + windowYears - 1;
  document.querySelector("#period").textContent = start + "-" + end;
  band.attr("x", yearScale(start)).attr("width", yearScale(end) - yearScale(start));
  drawIceCalendar(start, end);
}

slider.addEventListener("input", updatePeriod);
updatePeriod();
