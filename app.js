const devices = [
  { id: "proxy-server-1", name: "Proxy server 1" },
  { id: "device-b", name: "Device B" },
  { id: "device-c", name: "Device C" }
];

const refreshButton = document.querySelector("#refresh-button");
const summary = document.querySelector("#summary");
const summaryTitle = document.querySelector("#summary-title");
const summaryDetail = document.querySelector("#summary-detail");
const lastChecked = document.querySelector("#last-checked");
const cardById = new Map(
  [...document.querySelectorAll("[data-device]")].map((card) => [card.dataset.device, card])
);

let isRefreshing = false;

function formatUptime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function setCardStatus(card, status, label) {
  const pill = card.querySelector(".status-pill");
  pill.className = `status-pill status-${status}`;
  pill.querySelector(".status-label").textContent = label;
  card.classList.toggle("is-loading", status === "loading");
}

function setMetrics(card, report) {
  const cpu = Number(report.total_cpu_usage_percent);
  card.querySelector(".cpu-value").textContent = Number.isFinite(cpu)
    ? `${Math.round(cpu * 10) / 10}%`
    : "—";
  card.querySelector(".uptime-value").textContent = formatUptime(Number(report.uptime_seconds));
}

async function fetchDevice(device) {
  const card = cardById.get(device.id);
  try {
    const response = await fetch(`/api/devices/${device.id}/status`, {
      cache: "no-store",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error(`Status request failed (${response.status})`);

    const report = await response.json();
    if (!Number.isFinite(Number(report.total_cpu_usage_percent)) ||
        !Number.isFinite(Number(report.uptime_seconds))) {
      throw new Error("Status response is incomplete");
    }

    setMetrics(card, report);
    setCardStatus(card, "online", "Operational");
    return { id: device.id, state: "online", report };
  } catch {
    card.querySelector(".cpu-value").textContent = "—";
    card.querySelector(".uptime-value").textContent = "—";
    setCardStatus(card, "offline", "Unavailable");
    return { id: device.id, state: "offline" };
  }
}

function updateSummary(results) {
  const online = results.filter((result) => result.state === "online").length;
  const offline = results.filter((result) => result.state === "offline").length;

  summary.className = "summary";
  if (offline === 0) {
    summary.classList.add("summary-operational");
    summaryTitle.textContent = "All active systems operational";
    summaryDetail.textContent = `${online} monitored devices online`;
  } else if (online > 0) {
    summary.classList.add("summary-degraded");
    summaryTitle.textContent = "Some systems are unavailable";
    summaryDetail.textContent = `${online} online · ${offline} unavailable`;
  } else {
    summary.classList.add("summary-outage");
    summaryTitle.textContent = "Systems are unavailable";
    summaryDetail.textContent = "No active devices are responding right now.";
  }
}

async function refreshStatuses() {
  if (isRefreshing) return;
  isRefreshing = true;
  refreshButton.disabled = true;
  refreshButton.classList.add("is-refreshing");

  const results = await Promise.all(devices.map(fetchDevice));
  updateSummary(results);
  lastChecked.textContent = `Last checked ${new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date())}`;

  refreshButton.disabled = false;
  refreshButton.classList.remove("is-refreshing");
  isRefreshing = false;
}

refreshButton.addEventListener("click", refreshStatuses);
refreshStatuses();
window.setInterval(refreshStatuses, 30_000);
