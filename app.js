function showTab(tabId) {
  document.querySelectorAll('.tab').forEach(tab => tab.style.display = 'none');
  document.getElementById(tabId).style.display = 'block';
}

// License activation (KeyAuth)
document.getElementById("licenseForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const key = document.getElementById("licenseKey").value;
  const user = localStorage.getItem("username") || "blanco";

  const res = await fetch("https://keyauth.win/api/seller/?sellerid=YOUR_SELLER_ID&type=activate&key=" + key + "&user=" + user);
  const data = await res.json();

  document.getElementById("licenseStatus").innerText = data.success ? "License activated!" : "Error: " + data.message;
});

// Load news from JSON
async function loadNews() {
  const res = await fetch("news.json");
  const newsItems = await res.json();
  const container = document.getElementById("newsContainer");
  container.innerHTML = "";
  newsItems.forEach(item => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<h3>${item.title}</h3><p>${item.date} — ${item.author}</p><p>${item.text}</p>`;
    container.appendChild(div);
  });
}
document.getElementById("news")?.addEventListener("click", loadNews);
