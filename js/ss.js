/*

   :::       ::: :::       ::: :::    
  :+:       :+:  :+:       :+:  :+:   
 +:+       +:+   +:+       +:+   +:+  
+#+       +#+    +#+  +:+  +#+    +#+ 
 +#+     +#+     +#+ +#+#+ +#+   +#+  
  #+#   #+#       #+#+# #+#+#   #+#   
   ### ###         ###   ###  ###     
                                                        
          Wicorn29 Networks
          
          github/wicorn29
        https://wicorn29.net

*/




// ===== DOM elements =====
const statusBody = document.getElementById("statusBody");
const infoButton = document.getElementById("infoButton");
const infoBox = document.getElementById("infoBox");
const advButton = document.getElementById("advButton");
const advOverlay = document.getElementById("advOverlay");
const advBackdrop = document.getElementById("advBackdrop");
const advClose = document.getElementById("advClose");
const advText = document.getElementById("advText");
const refreshBtn = document.getElementById("refreshBtn");

let servers = [];
let advancedLogs = [];
let cooldown = false;

// ===== Toggle info box =====
infoButton.addEventListener("click", () => {
    infoBox.style.display = infoBox.style.display === "block" ? "none" : "block";
});

// ===== Advanced Mode =====
advButton.addEventListener("click", () => {
    advBackdrop.style.display = "block";
    advOverlay.style.display = "block";
    advText.innerHTML = advancedLogs.length ? formatLogsTable(advancedLogs) : "No data yet.";
    refreshBtn.classList.add("disabled");
});

// Close advanced mode
advClose.addEventListener("click", () => {
    advBackdrop.style.display = "none";
    advOverlay.style.display = "none";
    refreshBtn.classList.remove("disabled");
});

// ===== Refresh button with cooldown =====
refreshBtn.addEventListener("click", () => {
    if (refreshBtn.classList.contains("disabled") || cooldown) return;
    runChecks();
    cooldown = true;
    refreshBtn.classList.add("disabled");
    setTimeout(() => {
        cooldown = false;
        refreshBtn.classList.remove("disabled");
    }, 3000);
});

// ===== Format logs for advanced mode table =====
function formatLogsTable(logs) {
    return logs.map(log => `<div>${log}</div>`).join("<br>");
}

// ===== Create a table row =====
function createRow(name, statusClass, statusText, isSub = false) {
    const tr = document.createElement("tr");
    if (isSub) tr.classList.add("subdomain");

    const domainCell = document.createElement("td");
    domainCell.textContent = name;
    domainCell.className = statusClass;

    const statusCell = document.createElement("td");
    statusCell.textContent = statusText;
    statusCell.className = statusClass;

    tr.appendChild(domainCell);
    tr.appendChild(statusCell);
    return tr;
}

// ===== Check individual server =====
async function checkServer(name, url, isSub = false) {
    const row = createRow(name, "checking", "Checking...", isSub);
    statusBody.appendChild(row);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const startTime = performance.now();

    try {
        await fetch(url, { method: "HEAD", mode: "no-cors", signal: controller.signal });
        clearTimeout(timeout);
        const ms = Math.round(performance.now() - startTime);
        row.children[0].className = row.children[1].className = "online";
        row.children[1].textContent = `Online (${ms}ms)`;
        advancedLogs.push(`${name}: Online — ${ms}ms`);
    } catch (err) {
        clearTimeout(timeout);
        let reason = "Could not reach server (network/DNS/CORS issue)";
        if (err.name === "AbortError") reason = "Connection timed out (7s)";
        row.children[0].className = row.children[1].className = "offline";
        row.children[1].textContent = "Offline";
        advancedLogs.push(`${name}: Offline — ${reason}`);
    }
}

// ===== Fetch server list and run checks =====
async function loadServers() {
    try {
        const response = await fetch('https://wicorn29.net/ddat/services.json');
        servers = await response.json();
        runChecks();
    } catch (err) {
        console.error("Failed to load server list:", err);
        statusBody.innerHTML = "<tr><td colspan='2'>Failed to load server list.</td></tr>";
    }
}

// ===== Run all checks =====
async function runChecks() {
    statusBody.innerHTML = "";
    advancedLogs = [];
    for (const domain of servers) {
        await checkServer(domain.name, domain.url);
        if (domain.subs) {
            for (const sub of domain.subs) {
                await checkServer(`${sub.name} → ${sub.url}`, sub.url, true);
            }
        }
    }
}

// ===== Initial load =====
loadServers();
