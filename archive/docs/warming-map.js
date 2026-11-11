
const svg = d3.select("#map");
const tooltip = d3.select("#tooltip");

const scenarioSelect = document.querySelector("#scenario");
const yearSlider = document.querySelector("#year-slider");

const scenarioNames = {
  ssp126: "SSP1-2.6 (Low)",
  ssp245: "SSP2-4.5 (Intermediate)",
  ssp585: "SSP5-8.5 (Very High)"
};

const width = 960;
const height = 480;

// Geographic projection
const projection = d3.geoEquirectangular()
  .scale(width / (2 * Math.PI))
  .translate([width / 2, height / 2]);

const path = d3.geoPath(projection);

// Background and grid lines
svg.append("rect")
  .attr("width", width)
  .attr("height", height)
  .attr("fill", "#eaf2f6");

const cellsLayer = svg.append("g");

const graticule = d3.geoGraticule().step([30, 30]);

svg.append("path")
  .datum(graticule())
  .attr("d", path)
  .attr("fill", "none")
  .attr("stroke", "#555")
  .attr("stroke-opacity", 0.16)
  .attr("pointer-events", "none");


// Add country borders on top of the climate grid
const bordersLayer = svg.append("g")
  .attr("class", "country-borders")
  .attr("pointer-events", "none");

d3.json(
  "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
).then(world => {
  bordersLayer.selectAll("path")
    .data(world.features)
    .join("path")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#4b5563")
    .attr("stroke-width", 0.8)
    .attr("stroke-opacity", 0.65);
});


// Load geographic warming measurements
d3.csv("warming_map_data.csv", d3.autoType)
  .then(data => {

    // Fixed color scale for comparisons across years
    const maxWarming = Math.max(
      1,
      d3.max(data, d => Math.max(0, d.warming))
    );

    const color = d3.scaleLinear()
  .domain([-1, 0, 1.5, 3, 4.5, 6])
  .range([
    "#8ec5f3",  // soft blue
    "#fffaf3",  // near zero
    "#ffe5d9",  // light peach
    "#f5a28c",  // peach
    "#e77a68",  // coral
    "#b42c3a"   // deep red
  ])
  .interpolate(d3.interpolateRgb)
  .clamp(true);


    // Find geographic grid spacing
    const lats = [...new Set(data.map(d => d.lat))]
      .sort((a, b) => a - b);

    const lons = [...new Set(data.map(d => d.lon))]
      .sort((a, b) => a - b);

    const latStep = d3.median(
      lats.slice(1).map((v, i) => v - lats[i])
    );

    const lonStep = d3.median(
      lons.slice(1).map((v, i) => v - lons[i])
    );

    // Prepare each cell's position
    const locations = new Map();

    for (const d of data) {
      const key = `${d.lat},${d.lon}`;

      if (locations.has(key)) continue;

      const left = Math.max(-180, d.lon - lonStep / 2);
      const right = Math.min(180, d.lon + lonStep / 2);
      const top = Math.min(90, d.lat + latStep / 2);
      const bottom = Math.max(-90, d.lat - latStep / 2);

      const p1 = projection([left, top]);
      const p2 = projection([right, bottom]);

      locations.set(key, {
        lat: d.lat,
        lon: d.lon,
        x: p1[0],
        y: p1[1],
        width: p2[0] - p1[0],
        height: p2[1] - p1[1]
      });
    }

    // Index data for faster updates
    const bySelection = d3.group(
      data,
      d => d.scenario,
      d => d.year
    );

    function updateMap() {
      const scenario = scenarioSelect.value;
      const year = +yearSlider.value;

      document.querySelector("#year-label")
        .textContent = year;

      document.querySelector("#map-title")
        .textContent =
          `${scenarioNames[scenario]} — ${year}`;

      const selected =
        bySelection.get(scenario)?.get(year) || [];

      cellsLayer.selectAll("rect")
        .data(selected, d => `${d.lat},${d.lon}`)
        .join("rect")
        .attr("x", d => locations.get(
          `${d.lat},${d.lon}`
        ).x)
        .attr("y", d => locations.get(
          `${d.lat},${d.lon}`
        ).y)
        .attr("width", d => locations.get(
          `${d.lat},${d.lon}`
        ).width + 0.15)
        .attr("height", d => locations.get(
          `${d.lat},${d.lon}`
        ).height + 0.15)
        .attr("stroke", "none")
        .attr("fill", d => color(d.warming))
        .on("mousemove", (event, d) => {
          tooltip
            .style("display", "block")
            .style("left", `${event.pageX + 15}px`)
            .style("top", `${event.pageY + 15}px`)
            .html(`
              <b>Projected Warming</b><br>
              Year: ${year}<br>
              Latitude: ${d.lat.toFixed(1)}°<br>
              Longitude: ${d.lon.toFixed(1)}°<br>
              Change: ${d.warming.toFixed(2)}°C
            `);
        })
        .on("mouseleave", () => {
          tooltip.style("display", "none");
        });
    }

    scenarioSelect.addEventListener("change", updateMap);
    yearSlider.addEventListener("input", updateMap);

    updateMap();
  })
  .catch(error => {
    console.error("Failed to load map:", error);
    document.querySelector("#map-title")
      .textContent = "Unable to load map data";
  });
