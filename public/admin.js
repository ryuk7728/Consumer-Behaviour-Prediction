const refreshBtn = document.querySelector("#refreshBtn");
const engagementRows = document.querySelector("#engagementRows");
const engagementChart = document.querySelector("#engagementChart");
const userSelect = document.querySelector("#userSelect");
const likelihoodRows = document.querySelector("#likelihoodRows");
const likelihoodChart = document.querySelector("#likelihoodChart");

refreshBtn.addEventListener("click", loadAll);
userSelect.addEventListener("change", loadUserLikelihood);

loadAll();

async function loadAll() {
  await Promise.all([loadEngagement(), loadUsers()]);
}

async function loadEngagement() {
  const response = await fetch("/api/admin/engagement-summary");
  const data = await response.json();
  const products = data.products || [];
  const maxScore = Math.max(1, ...products.map((item) => item.engagement_score));

  engagementRows.innerHTML = "";
  engagementChart.innerHTML = "";

  for (const item of products) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.product_name}</td>
      <td>${item.views}</td>
      <td>${item.add_to_cart}</td>
      <td>${item.purchases}</td>
      <td>${item.engagement_score}</td>
    `;
    engagementRows.appendChild(tr);

    const width = (item.engagement_score / maxScore) * 100;
    const bar = document.createElement("div");
    bar.className = "metric-row";
    bar.innerHTML = `
      <span>${item.product_name}</span>
      <div class="metric-track"><div class="metric-fill" style="width:${width.toFixed(1)}%"></div></div>
      <strong>${item.engagement_score}</strong>
    `;
    engagementChart.appendChild(bar);
  }
}

async function loadUsers() {
  const response = await fetch("/api/admin/users");
  const data = await response.json();
  const users = data.users || [];

  userSelect.innerHTML = "";
  if (!users.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No users available";
    userSelect.appendChild(option);
    likelihoodRows.innerHTML =
      `<tr><td colspan="5">No user activity yet. Generate activity from storefront.</td></tr>`;
    likelihoodChart.innerHTML = "";
    return;
  }

  for (const userId of users) {
    const option = document.createElement("option");
    option.value = userId;
    option.textContent = userId;
    userSelect.appendChild(option);
  }

  await loadUserLikelihood();
}

async function loadUserLikelihood() {
  const userId = userSelect.value;
  if (!userId) return;

  const response = await fetch(
    `/api/admin/user-likelihood?user_id=${encodeURIComponent(userId)}`
  );
  if (!response.ok) {
    likelihoodRows.innerHTML =
      `<tr><td colspan="5">Unable to fetch user likelihoods for ${userId}.</td></tr>`;
    likelihoodChart.innerHTML = "";
    return;
  }

  const data = await response.json();
  const rows = data.likelihoods || [];

  likelihoodRows.innerHTML = "";
  likelihoodChart.innerHTML = "";

  for (const row of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.product_name}</td>
      <td>${(row.purchase_probability * 100).toFixed(1)}%</td>
      <td>${row.user_views}</td>
      <td>${row.user_add_to_cart}</td>
      <td>${row.user_purchases}</td>
    `;
    likelihoodRows.appendChild(tr);

    const bar = document.createElement("div");
    bar.className = "metric-row";
    bar.innerHTML = `
      <span>${row.product_name}</span>
      <div class="metric-track"><div class="metric-fill alt" style="width:${(row.purchase_probability * 100).toFixed(1)}%"></div></div>
      <strong>${(row.purchase_probability * 100).toFixed(1)}%</strong>
    `;
    likelihoodChart.appendChild(bar);
  }
}

