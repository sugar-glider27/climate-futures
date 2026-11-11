
const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const names = {
  ssp126: "SSP1-2.6 (Low)",
  ssp245: "SSP2-4.5 (Intermediate)",
  ssp585: "SSP5-8.5 (Very High)"
};

const palette = [
  "#ffe5d9", "#ffc9b5", "#f5a28c",
  "#e77a68", "#cd554d", "#a93d43"
];

const colors = d3.scaleSequential()
  .domain([10, 23])
  .interpolator(d3.interpolateRgbBasis(palette));

const heightScale = d3.scaleLinear()
  .domain([10, 23])
  .range([255, 35])
  .clamp(true);

const svg = d3.select("#chart");

const positions = d3.scalePoint()
  .domain(d3.range(1, 13))
  .range([60, 940]);

const groups = svg.selectAll(".thermometer")
  .data(d3.range(1, 13))
  .join("g")
  .attr("class", "thermometer")
  .attr("transform", d =>
    `translate(${positions(d)}, 0)`
  );

// Outer tubes
groups.append("rect")
  .attr("x", -13)
  .attr("y", 35)
  .attr("width", 26)
  .attr("height", 220)
  .attr("rx", 13)
  .attr("fill", "#f8f8f8")
  .attr("stroke", "#aaa")
  .attr("stroke-width", 2);

// Colored liquid
groups.append("rect")
  .attr("class", "liquid")
  .attr("x", -9)
  .attr("width", 18)
  .attr("rx", 5);

// Bulbs
groups.append("circle")
  .attr("class", "bulb")
  .attr("cy", 265)
  .attr("r", 20)
  .attr("stroke", "#aaa")
  .attr("stroke-width", 2);

// Temperature numbers
groups.append("text")
  .attr("class", "temperature-label")
  .attr("y", 22)
  .attr("text-anchor", "middle")
  .attr("font-size", 15)
  .attr("font-weight", "bold");

// Month labels
groups.append("text")
  .attr("y", 310)
  .attr("text-anchor", "middle")
  .attr("font-size", 14)
  .text(d => months[d - 1]);

// Load data once
d3.csv("temperature_data.csv", d3.autoType)
  .then(data => {

    const scenarioSelect =
      document.querySelector("#scenario");

    const yearSlider =
      document.querySelector("#year-slider");

    function update() {
      const scenario = scenarioSelect.value;
      const year = +yearSlider.value;

      document.querySelector("#year-label")
        .textContent = year;

      document.querySelector("#chart-title")
        .textContent =
        `${names[scenario]} — ${year}`;

      const selected = data.filter(d =>
        d.scenario === scenario &&
        d.year === year
      );

      const byMonth = new Map(
        selected.map(d => [d.month, d])
      );

      groups.each(function(month) {
        const row = byMonth.get(month);
        const group = d3.select(this);

        if (!row) return;

        const temp = row.temperature;
        const color = colors(temp);
        const top = heightScale(temp);

        group.select(".liquid")
          .transition()
          .duration(250)
          .attr("y", top)
          .attr("height", 255 - top)
          .attr("fill", color);

        group.select(".bulb")
          .transition()
          .duration(250)
          .attr("fill", color);

        group.select(".temperature-label")
          .text(`${temp.toFixed(1)}°C`)
          .attr("fill", "#663b40");

        group.select("title").remove();

        group.append("title")
          .text(
            `${months[month - 1]} ${year}: ` +
            `${temp.toFixed(2)}°C`
          );
      });
    }

    scenarioSelect.addEventListener("change", update);
    yearSlider.addEventListener("input", update);

    update();
  })
  .catch(error => {
    console.error(error);
    document.querySelector("#chart-title")
      .textContent = "Unable to load temperature data.";
  });
