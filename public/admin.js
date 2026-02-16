const rowsNode = document.querySelector("#predictionRows");
const refreshBtn = document.querySelector("#refreshBtn");
const kpiTotal = document.querySelector("#kpiTotal");
const kpiHigh = document.querySelector("#kpiHigh");
const kpiMedium = document.querySelector("#kpiMedium");
const kpiLow = document.querySelector("#kpiLow");

refreshBtn.addEventListener("click", loadPredictions);
loadPredictions();

async function loadPredictions() {
  const response = await fetch("/api/admin/predictions?limit=20");
  const data = await response.json();
  const predictions = data.predictions || [];

  const counts = { High: 0, Medium: 0, Low: 0 };
  rowsNode.innerHTML = "";

  for (const row of predictions) {
    counts[row.label] = (counts[row.label] || 0) + 1;
    const tr = document.createElement("tr");
    const labelClass = String(row.label || "").toLowerCase();
    tr.innerHTML = `
      <td>${row.session_id}</td>
      <td>${row.user_id}</td>
      <td>${Number(row.purchase_likelihood || 0).toFixed(4)}</td>
      <td><span class="badge ${labelClass}">${row.label}</span></td>
      <td>views ${row.features?.product_views ?? 0}, cart ${row.features?.cart_adds ?? 0}, secs ${row.features?.session_seconds ?? 0}</td>
      <td>${new Date(row.predicted_at).toLocaleString()}</td>
    `;
    rowsNode.appendChild(tr);
  }

  if (!predictions.length) {
    rowsNode.innerHTML = `<tr><td colspan="6">No predictions yet. Trigger one from the storefront.</td></tr>`;
  }

  kpiTotal.textContent = String(predictions.length);
  kpiHigh.textContent = String(counts.High || 0);
  kpiMedium.textContent = String(counts.Medium || 0);
  kpiLow.textContent = String(counts.Low || 0);
}

