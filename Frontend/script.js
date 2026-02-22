const dropZone = document.getElementById('drop-zone');
const pdfInput = document.getElementById('pdf-input');
const analyzeBtn = document.getElementById('analyze-btn');
const fileNameDiv = document.getElementById('file-name-display');
const fileNameTxt = document.getElementById('file-name-text');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');
const errorBox = document.getElementById('error-box');
const errorText = document.getElementById('error-text');
const dashboard = document.getElementById('dashboard');
const resetBtn = document.getElementById('reset-btn');

let radarChart = null;
let barChart = null;

// ── File selection ──────────────────────────────────────────
pdfInput.addEventListener('change', () => {
    if (pdfInput.files.length) {
        const name = pdfInput.files[0].name;
        fileNameTxt.textContent = name;
        fileNameDiv.style.display = 'block';
        analyzeBtn.disabled = false;
    }
});

// ── Drag & drop ──────────────────────────────────────────
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        const dt = new DataTransfer();
        dt.items.add(file);
        pdfInput.files = dt.files;
        fileNameTxt.textContent = file.name;
        fileNameDiv.style.display = 'block';
        analyzeBtn.disabled = false;
    }
});

// ── Analyze ──────────────────────────────────────────────
analyzeBtn.addEventListener('click', async () => {
    if (!pdfInput.files.length) return;

    // Reset UI
    hideError();
    hideDashboard();
    showLoader('Extracting PDF text…');
    analyzeBtn.disabled = true;

    const formData = new FormData();
    formData.append('pdf', pdfInput.files[0]);

    setTimeout(() => { loaderText.textContent = 'Analyzing with Gemini AI…'; }, 1800);

    try {
        const res = await fetch('/analyze', { method: 'POST', body: formData });
        const data = await res.json();

        hideLoader();
        analyzeBtn.disabled = false;

        if (!res.ok) {
            showError(data.error || 'Unknown error occurred.');
            return;
        }

        renderDashboard(data);

    } catch (err) {
        hideLoader();
        analyzeBtn.disabled = false;
        showError('Network error: ' + err.message);
    }
});

// ── Reset ────────────────────────────────────────────────
resetBtn.addEventListener('click', () => {
    hideDashboard();
    pdfInput.value = '';
    fileNameDiv.style.display = 'none';
    analyzeBtn.disabled = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Render Dashboard ──────────────────────────────────────
function renderDashboard(data) {
    const strong = data.strong_points || [];
    const weak = data.weak_points || [];
    const suggestions = data.smart_suggestions || [];
    const moves = data.next_strategic_moves || [];
    const situation = data.current_business_situation || 'No summary available.';

    // KPIs
    animateCount('kpi-strong', strong.length);
    animateCount('kpi-weak', weak.length);
    animateCount('kpi-suggestions', suggestions.length);
    animateCount('kpi-moves', moves.length);

    // Situation
    document.getElementById('situation-text').textContent = situation;

    // Lists
    fillList('strong-list', strong);
    fillList('weak-list', weak);
    fillList('suggestions-list', suggestions);
    fillList('moves-list', moves);

    // Charts
    renderRadar(strong, weak);
    renderBar(strong.length, weak.length, suggestions.length, moves.length);

    // Show
    dashboard.style.display = 'block';
    dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function fillList(id, items) {
    const ul = document.getElementById(id);
    ul.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="dot"></span><span>${item}</span>`;
        ul.appendChild(li);
    });
}

function animateCount(id, target) {
    const el = document.getElementById(id);
    let current = 0;
    const step = Math.ceil(target / 20);
    const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current;
        if (current >= target) clearInterval(timer);
    }, 50);
}

function renderRadar(strong, weak) {
    if (radarChart) radarChart.destroy();
    const max = Math.max(strong.length, weak.length, 1);
    const ctx = document.getElementById('radar-chart').getContext('2d');
    const labels = [];
    const sData = [];
    const wData = [];
    const len = Math.max(strong.length, weak.length);
    for (let i = 0; i < len; i++) {
        labels.push(`#${i + 1}`);
        sData.push(strong[i] ? 1 : 0);
        wData.push(weak[i] ? 1 : 0);
    }
    if (labels.length === 0) { labels.push('N/A'); sData.push(0); wData.push(0); }

    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels,
            datasets: [
                { label: 'Strengths', data: sData, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.15)', pointBackgroundColor: '#22c55e', borderWidth: 2 },
                { label: 'Weaknesses', data: wData, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.15)', pointBackgroundColor: '#ef4444', borderWidth: 2 },
            ]
        },
        options: {
            responsive: true,
            scales: { r: { ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.08)' }, pointLabels: { color: '#94a3b8', font: { size: 11 } }, angleLines: { color: 'rgba(255,255,255,0.06)' } } },
            plugins: { legend: { labels: { color: '#94a3b8', font: { size: 12 } } } }
        }
    });
}

function renderBar(s, w, sg, m) {
    if (barChart) barChart.destroy();
    const ctx = document.getElementById('bar-chart').getContext('2d');
    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Strong Points', 'Weak Points', 'Suggestions', 'Moves'],
            datasets: [{
                label: 'Count',
                data: [s, w, sg, m],
                backgroundColor: ['rgba(34,197,94,0.7)', 'rgba(239,68,68,0.7)', 'rgba(59,130,246,0.7)', 'rgba(168,85,247,0.7)'],
                borderColor: ['#22c55e', '#ef4444', '#3b82f6', '#a855f7'],
                borderWidth: 2, borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, ticks: { color: '#64748b', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.06)' } },
                x: { ticks: { color: '#64748b' }, grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// ── Helpers ──────────────────────────────────────────────
function showLoader(msg) { loaderText.textContent = msg; loader.style.display = 'block'; }
function hideLoader() { loader.style.display = 'none'; }
function showError(msg) { errorText.textContent = msg; errorBox.style.display = 'block'; }
function hideError() { errorBox.style.display = 'none'; }
function hideDashboard() { dashboard.style.display = 'none'; }
