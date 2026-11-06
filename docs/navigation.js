// Add a page here to give it a tab on every visualization.
const pages = [
  ["index.html", "Ice calendar"],
  ["ice-floes.html", "September ice floes"],
];
const nav = document.querySelector("nav");
const current = location.pathname.split("/").pop() || "index.html";
for (const [href, label] of pages) {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  if (href === current) link.setAttribute("aria-current", "page");
  nav.append(link);
}
