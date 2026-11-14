const pages = [
  ["ice-floes.html", "September ice floes"],
  ["ice-floes-copy.html", "September ice floes · version 2"],
  ["ice-floes-v3.html", "September ice floes · version 3"],
  ["ice-floes-v4.html", "September ice floes · version 4"],
  ["ice-floes-v5.html", "September ice floes · version 5"],
  ["ice-floes-v4v2.html", "September ice floes · version 4.2"],
  ["ice-floes-v4v3.html", "September ice floes · version 4.3"],
  ["../docs/ice-floes-v4v4.html", "September ice floes · version 4.4"],
];

const nav = document.querySelector("nav");
const current = location.pathname.split("/").pop() || "index.html";
for (const [href, label] of pages) {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  if (href.split("/").pop() === current) {
    link.setAttribute("aria-current", "page");
  }
  nav.append(link);
}
