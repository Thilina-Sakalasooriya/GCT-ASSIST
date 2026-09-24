// State tracking
let activeTab = 'lesson1';
let userQuizAnswers = {};
let quizDifficulty = 'easy';

// DOM Elements
document.addEventListener("DOMContentLoaded", () => {
    calculateUserDataset();
    renderQuiz();
    updateProgress();
});

// Tab Navigation Switcher
function switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-brand-50', 'text-brand-700', 'shadow-sm');
        btn.classList.add('text-slate-600');
    });

    const currentTab = document.getElementById(tabId);
    const currentNav = document.getElementById(`nav-${tabId}`);

    if (currentTab) currentTab.classList.remove('hidden');
    if (currentNav) {
        currentNav.classList.add('bg-brand-50', 'text-brand-700', 'shadow-sm');
        currentNav.classList.remove('text-slate-600');
    }

    // Close mobile sidebar if open
    closeMobileSidebar();

    updateProgress();
}

// Toggle Solution Helper
function toggleAnswer(id) {
    const el = document.getElementById(id);
    const icon = document.getElementById(`icon-${id}`);
    if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
        if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
        el.classList.add('hidden');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
}

// Mobile Sidebar Toggle
function openMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    sidebar.classList.remove('-translate-x-full');
    sidebar.classList.add('translate-x-0');
    backdrop.classList.add('visible');
    document.body.classList.add('sidebar-open');
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (window.innerWidth >= 768) return;
    sidebar.classList.remove('translate-x-0');
    sidebar.classList.add('-translate-x-full');
    backdrop.classList.remove('visible');
    document.body.classList.remove('sidebar-open');
}

document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('-translate-x-full')) {
        openMobileSidebar();
    } else {
        closeMobileSidebar();
    }
});

document.getElementById('sidebarBackdrop').addEventListener('click', closeMobileSidebar);

window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
        document.getElementById('sidebarBackdrop').classList.remove('visible');
        document.body.classList.remove('sidebar-open');
    }
});

function calculateUserDataset() {
    const rawInput = document.getElementById('userDataset').value;
    const numbers = rawInput.split(',')
                            .map(n => parseFloat(n.trim()))
                            .filter(n => !isNaN(n));

    if (numbers.length === 0) {
        return;
    }

    // Sorted Data Array
    const sorted = [...numbers].sort((a, b) => a - b);
    const N = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / N;

    // Median
    let median = 0;
    if (N % 2 === 0) {
        median = (sorted[N/2 - 1] + sorted[N/2]) / 2;
    } else {
        median = sorted[Math.floor(N/2)];
    }

    // Mode
    const freq = {};
    let maxFreq = 0;
    sorted.forEach(num => {
        freq[num] = (freq[num] || 0) + 1;
        if (freq[num] > maxFreq) maxFreq = freq[num];
    });

    let modes = [];
    if (maxFreq > 1) {
        for (let key in freq) {
            if (freq[key] === maxFreq) modes.push(key);
        }
    } else {
        modes = ["No Mode"];
    }

    // Range
    const min = sorted[0];
    const max = sorted[N - 1];
    const range = max - min;

    // Variance & Standard Deviation (Sample)
    const sumSqDiff = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
    const variance = N > 1 ? sumSqDiff / (N - 1) : 0;
    const sd = Math.sqrt(variance);
    const cv = mean !== 0 ? (sd / mean) * 100 : 0;

    // Render Output Elements
    document.getElementById('calcMean').innerText = mean.toFixed(2);
    document.getElementById('calcMedian').innerText = median.toFixed(2);
    document.getElementById('calcMode').innerText = modes.join(', ');
    document.getElementById('calcRange').innerText = range;
    document.getElementById('calcSD').innerText = sd.toFixed(2);
    document.getElementById('calcVar').innerText = variance.toFixed(2);
    document.getElementById('calcCV').innerText = cv.toFixed(2) + "%";
    document.getElementById('calcCount').innerText = N;
    document.getElementById('calcSortedArray').innerText = sorted.join(', ');

    // Build Stem-and-Leaf
    const stems = {};
    sorted.forEach(num => {
        const stem = Math.floor(num / 10);
        const leaf = Math.abs(Math.floor(num % 10));
        if (!stems[stem]) stems[stem] = [];
        stems[stem].push(leaf);
    });

    let stemHTML = '';
    for (let stem in stems) {
        stemHTML += `<div class="flex"><span class="w-12 text-right font-bold border-r border-slate-300 pr-2 text-brand-600">${stem} |</span><span class="pl-2 tracking-widest">${stems[stem].join(' ')}</span></div>`;
    }
    document.getElementById('calcStemPlot').innerHTML = stemHTML || "Invalid for single numbers";
}

// ===== Lesson-wise Knowledge Quiz with Difficulty Selection =====
const lessonTitles = {
    1: 'Lesson 1 · Data Basics & Scales',
    2: 'Lesson 2 · Data Organization',
    3: 'Lesson 3 · Central Tendency',
    4: 'Lesson 4 · Measures of Dispersion',
    5: 'Lesson 5 · Permutations & Combinations'
};

const quizBank = {
    easy: [
        { id: 1, lesson: 1, question: "Which scale of measurement is used for labels or categories that have no mathematical order?", options: ["Nominal", "Ordinal", "Interval", "Ratio"], correct: 0, explanation: "The Nominal scale is purely categorical - labels like gender or eye color carry no order or numerical meaning." },
        { id: 2, lesson: 1, question: "Which measurement scale has a true absolute zero point?", options: ["Nominal", "Ordinal", "Interval", "Ratio"], correct: 3, explanation: "Only the Ratio scale has a true absolute zero (e.g., height = 0 cm means no height)." },
        { id: 3, lesson: 2, question: "What does the Range of a dataset equal?", options: ["Highest value - Lowest value", "Highest value + Lowest value", "Mean - Median", "Sum of values ÷ N"], correct: 0, explanation: "Range = H - L, the difference between the largest and smallest observation." },
        { id: 4, lesson: 2, question: "In a stem-and-leaf plot, which part holds the leading digit(s)?", options: ["Leaf", "Stem", "Key", "Frequency"], correct: 1, explanation: "The stem stores the leading digits and the leaf stores the final digit of each value." },
        { id: 5, lesson: 3, question: "Which measure of central tendency is the most frequently occurring value?", options: ["Mean", "Median", "Mode", "Range"], correct: 2, explanation: "The Mode is the value that appears most often in a dataset." },
        { id: 6, lesson: 3, question: "Which measure is the middle value after arranging data in order?", options: ["Mean", "Median", "Mode", "Standard Deviation"], correct: 1, explanation: "The Median is the middle observation of an ordered dataset." },
        { id: 7, lesson: 4, question: "Standard Deviation is a measure of ...", options: ["Central tendency", "Spread or variability", "Ratio scaling", "Data skew"], correct: 1, explanation: "Standard deviation quantifies how far values spread around the mean." },
        { id: 8, lesson: 4, question: "A lower Coefficient of Variation (CV) means ...", options: ["Lower consistency", "Higher consistency", "No change in consistency", "Infinite dispersion"], correct: 1, explanation: "A smaller CV means less relative variability, i.e., more reliable/consistent performance." },
        { id: 9, lesson: 5, question: "Which counting method is used when the ORDER of selection matters?", options: ["Combination", "Permutation", "Range", "Median"], correct: 1, explanation: "Permutations count arrangements where sequence matters, such as rankings or codes." },
        { id: 10, lesson: 5, question: "In how many ways can 3 distinct books be arranged on a shelf?", options: ["3", "6", "9", "12"], correct: 1, explanation: "Arranging 3 distinct books = 3! = 3 × 2 × 1 = 6 ways." }
    ],
    medium: [
        { id: 11, lesson: 1, question: "Temperature measured in Celsius (°C) belongs to which scale of measurement?", options: ["Nominal", "Ordinal", "Interval", "Ratio"], correct: 2, explanation: "Celsius has equal intervals but an arbitrary zero point, so 0°C does not mean 'no heat' - it is an Interval scale." },
        { id: 12, lesson: 1, question: "A customer satisfaction rating of 'Poor', 'Fair', or 'Good' uses which scale?", options: ["Nominal", "Ordinal", "Interval", "Ratio"], correct: 1, explanation: "Ordinal scales rank categories in order, but the gaps between ranks are not equal or quantifiable." },
        { id: 13, lesson: 2, question: "Given the dataset [45, 12, 70, 30, 55, 20, 65, 15], what is the Range?", options: ["30", "55", "58", "70"], correct: 2, explanation: "Range = Highest - Lowest = 70 - 12 = 58." },
        { id: 14, lesson: 2, question: "In a back-to-back stem-and-leaf plot, what two things are being compared?", options: ["Two distributions", "Two formulas", "Two medians only", "Two colors of data"], correct: 0, explanation: "Back-to-back plots place two distributions on opposite sides of a shared stem for direct comparison." },
        { id: 15, lesson: 3, question: "Find the Median of the dataset [40, 15, 60, 35].", options: ["37.5", "35", "40", "47.5"], correct: 0, explanation: "Sorted: [15, 35, 40, 60]. With 4 values (even), median = (35 + 40) / 2 = 37.5." },
        { id: 16, lesson: 3, question: "In the dataset [5, 5, 8, 9, 10, 10, 10, 20], which measure is MOST affected by the outlier 20?", options: ["Median", "Mean", "Mode", "None of them"], correct: 1, explanation: "The Mean uses every value, so a single extreme outlier pulls it significantly. The median is robust." },
        { id: 17, lesson: 4, question: "Machine A has mean 200 and SD = 10. Machine B has mean 500 and SD = 20. Which machine is more consistent?", options: ["Machine A", "Machine B", "Both equal", "Cannot be determined"], correct: 1, explanation: "CV of A = 10/200 = 5.0%, CV of B = 20/500 = 4.0%. Lower CV = more consistent, so Machine B wins." },
        { id: 18, lesson: 4, question: "When computing the SAMPLE variance, the sum of squared deviations is divided by ...", options: ["N", "N - 1", "N + 1", "N²"], correct: 1, explanation: "Sample variance uses (N - 1) in the denominator - Bessel's correction - to better estimate the population variance." },
        { id: 19, lesson: 5, question: "How many different 4-letter codes can be formed from the letters A, B, C, D, E, F without repeating a letter?", options: ["60", "120", "360", "720"], correct: 2, explanation: "P(6, 4) = 6! / 2! = 720 / 2 = 360 possible codes." },
        { id: 20, lesson: 5, question: "A committee of 3 members is chosen from 7 students. How many different committees are possible?", options: ["21", "35", "70", "210"], correct: 1, explanation: "Order does not matter: C(7, 3) = 7! / (3! × 4!) = 35 committees." }
    ],
    hard: [
        { id: 21, lesson: 1, question: "Salaries of ₱200,000 vs ₱100,000: 'twice as much' can ONLY be said when the scale has ...", options: ["Nominal order", "Ordinal ranking", "Equal intervals", "A true absolute zero"], correct: 3, explanation: "Meaningful ratios (twice as much) require a Ratio scale with an absolute zero, like salary, height, or weight." },
        { id: 22, lesson: 1, question: "Zip codes are numeric but are best classified as which scale of measurement?", options: ["Ratio", "Interval", "Nominal", "Ordinal"], correct: 2, explanation: "Numbers in zip codes carry no arithmetic meaning - they are just category labels, hence Nominal." },
        { id: 23, lesson: 2, question: "A dataset has H = 89 and L = 12. If the smallest value changes to 5, how does the Range change?", options: ["Stays at 77", "Increases to 84", "Decreases to 70", "It doubles"], correct: 1, explanation: "New Range = 89 - 5 = 84, so the range increases from 77 to 84." },
        { id: 24, lesson: 2, question: "In a stem-and-leaf plot, the key '1 | 2 = 12' means the number 12 is represented as ...", options: ["Stem 1, leaf 2", "Stem 2, leaf 1", "Stem 12, leaf 0", "Stem 0, leaf 12"], correct: 0, explanation: "The key tells you how to read stems and leaves: stem value 1 with leaf 2 forms the value 12." },
        { id: 25, lesson: 3, question: "A dataset has 15 ordered values. The Median is located at which position?", options: ["7", "8", "15", "7.5"], correct: 1, explanation: "Position = (N + 1) / 2 = (15 + 1) / 2 = 8th term." },
        { id: 26, lesson: 3, question: "What is the Mode of the dataset [20, 30, 20, 40, 30, 20]?", options: ["20", "30", "Bimodal (20 and 30)", "No mode"], correct: 0, explanation: "20 appears 3 times (the most frequent), 30 appears twice, so the mode is 20 - it is unimodal." },
        { id: 27, lesson: 4, question: "Every value in a dataset is increased by 5 points. What happens to the Standard Deviation?", options: ["Increases by 5", "Decreases by 5", "Remains unchanged", "It is squared"], correct: 2, explanation: "Shifting all values by a constant does not change their spread - the standard deviation stays identical." },
        { id: 28, lesson: 4, question: "The Variance of a dataset is 49. What is its Standard Deviation?", options: ["7", "49", "24.5", "14"], correct: 0, explanation: "Standard deviation is the square root of variance: √49 = 7." },
        { id: 29, lesson: 5, question: "How many distinct arrangements can be formed from all the letters of the word MISSISSIPPI?", options: ["34,650", "39,916,800", "1,152", "34"], correct: 0, explanation: "11! / (1! × 4! × 4! × 2!) = 39,916,800 / 1,152 = 34,650 arrangements." },
        { id: 30, lesson: 5, question: "In how many ways can 5 people be seated in 3 chairs?", options: ["10", "20", "60", "120"], correct: 2, explanation: "Selecting and ordering 3 people out of 5: P(5, 3) = 5 × 4 × 3 = 60 ways." }
    ]
};

function currentQuizQuestions() {
    return quizBank[quizDifficulty] || [];
}

function renderQuiz() {
    const container = document.getElementById('quizContainer');
    if (!container) return;
    const questions = currentQuizQuestions();

    const diffs = [
        { key: 'easy', label: 'Easy', activeCls: 'bg-emerald-100 text-emerald-700', icon: 'fa-seedling' },
        { key: 'medium', label: 'Medium', activeCls: 'bg-amber-100 text-amber-700', icon: 'fa-book-open' },
        { key: 'hard', label: 'Hard', activeCls: 'bg-red-100 text-red-700', icon: 'fa-bolt' }
    ];

    let html = '<div class="space-y-6">';

    // Difficulty selector
    html += `
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
            <div>
                <h3 class="font-bold text-slate-900 text-lg">Choose Difficulty Level</h3>
                <p class="text-xs text-slate-500 mt-0.5">Pick how challenging the questions should be - they stay grouped by lesson.</p>
            </div>
            <div class="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 gap-1 self-start sm:self-auto">
    `;

    diffs.forEach(d => {
        const active = quizDifficulty === d.key;
        html += `
            <button onclick="setQuizDifficulty('${d.key}')" id="diff-${d.key}" class="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${active ? d.activeCls : 'text-slate-500 hover:text-slate-700'}">
                <i class="fa-solid ${d.icon}"></i> ${d.label}
            </button>
        `;
    });

    html += '</div></div>';

    html += `
        <div class="text-xs text-slate-500 pb-2">
            Showing <strong class="text-brand-700">${questions.length}</strong> question${questions.length !== 1 ? 's' : ''} at <strong class="text-brand-700">${quizDifficulty.toUpperCase()}</strong> level across all lessons.
        </div>
    `;

    // Group questions by lesson
    const byLesson = {};
    questions.forEach(q => {
        if (!byLesson[q.lesson]) byLesson[q.lesson] = [];
        byLesson[q.lesson].push(q);
    });

    Object.keys(byLesson).forEach(lessonKey => {
        const lessonQs = byLesson[lessonKey];
        html += `
            <div>
                <div class="flex items-center gap-2 pt-3 pb-2">
                    <span class="w-8 h-8 rounded-lg bg-brand-600/10 text-brand-700 flex items-center justify-center text-sm font-bold">${lessonKey}</span>
                    <h4 class="font-bold text-sm text-slate-800">${lessonTitles[lessonKey] || 'Lesson ' + lessonKey}</h4>
                    <span class="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500">${lessonQs.length} Q</span>
                </div>
        `;

        lessonQs.forEach(q => {
            html += `
                <div class="border border-slate-200 p-5 rounded-2xl bg-slate-50/50 space-y-3">
                    <p class="font-bold text-sm text-slate-900">${q.question}</p>
                    <div class="space-y-2">
            `;

            q.options.forEach((opt, optIdx) => {
                html += `
                    <label class="flex items-center space-x-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all text-xs font-medium text-slate-700">
                        <input type="radio" name="q_${q.id}" value="${optIdx}" onclick="selectQuizOption(${q.id}, ${optIdx})" class="text-brand-600 focus:ring-brand-500">
                        <span>${opt}</span>
                    </label>
                `;
            });

            html += `
                    </div>
                    <div id="quiz-feedback-${q.id}" class="hidden p-3 rounded-lg text-xs font-medium"></div>
                </div>
            `;
        });

        html += '</div>';
    });

    html += `
        <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <button onclick="submitQuiz()" class="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                <i class="fa-solid fa-check-double"></i> Submit Quiz Answers
            </button>
            <button onclick="resetQuiz()" class="py-3 px-6 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                <i class="fa-solid fa-rotate-left"></i> Reset
            </button>
        </div>
    </div>`;

    container.innerHTML = html;
    updateQuizBadge();
}

function setQuizDifficulty(diff) {
    quizDifficulty = diff;
    userQuizAnswers = {};
    renderQuiz();
}

function selectQuizOption(qId, optionIdx) {
    userQuizAnswers[qId] = optionIdx;
}

function resetQuiz() {
    userQuizAnswers = {};
    renderQuiz();
}

function submitQuiz() {
    const questions = currentQuizQuestions();
    let score = 0;

    questions.forEach(q => {
        const feedbackEl = document.getElementById(`quiz-feedback-${q.id}`);
        const selected = userQuizAnswers[q.id];

        if (feedbackEl) {
            feedbackEl.classList.remove('hidden', 'bg-emerald-100', 'text-emerald-800', 'bg-red-100', 'text-red-800');
            if (selected === q.correct) {
                score++;
                feedbackEl.classList.add('bg-emerald-100', 'text-emerald-800');
                feedbackEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> <strong>Correct!</strong> ${q.explanation}`;
            } else {
                feedbackEl.classList.add('bg-red-100', 'text-red-800');
                feedbackEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> <strong>Incorrect.</strong> ${q.explanation}`;
            }
        }
    });

    updateQuizBadge(score);
    updateProgress();

    if (questions.length > 0 && score === questions.length) {
        setTimeout(launchFireworks, 250);
    }
}

function updateQuizBadge(score) {
    const badge = document.getElementById('quizBadge');
    if (badge) {
        badge.innerText = (typeof score === 'number')
            ? `Score: ${score}/${currentQuizQuestions().length}`
            : `Test · ${quizDifficulty.charAt(0).toUpperCase() + quizDifficulty.slice(1)}`;
    }
}

// ===== Cute minimal fireworks (triggered on a perfect score) =====
function launchFireworks() {
    const stage = document.getElementById('fireworks');
    if (!stage) return;

    const palette = ['#f472b6', '#a78bfa', '#818cf8', '#38bdf8', '#34d399', '#fbbf24', '#fb7185'];
    let bursts = 0;
    const maxBursts = 12;

    function burst() {
        const x = Math.random() * window.innerWidth;
        const y = window.innerHeight * (0.12 + Math.random() * 0.55);
        const count = 18;

        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'fw-particle';
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
            const dist = 45 + Math.random() * 75;
            const color = Math.random() > 0.4
                ? palette[Math.floor(Math.random() * palette.length)]
                : palette[Math.floor(Math.random() * palette.length)];

            p.style.left = x + 'px';
            p.style.top = y + 'px';
            p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
            p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
            p.style.setProperty('--c', color);
            stage.appendChild(p);
            setTimeout(() => p.remove(), 1000);
        }
    }

    burst();
    const timer = setInterval(() => {
        bursts++;
        burst();
        if (bursts >= maxBursts) clearInterval(timer);
    }, 360);
}

function updateProgress() {
    const navs = ['lesson1', 'lesson2', 'lesson3', 'lesson4', 'lesson5'];
    const currentIndex = navs.indexOf(activeTab);
    let pct = 20;
    if (currentIndex !== -1) {
        pct = (currentIndex + 1) * 20;
    } else if (activeTab === 'calculators' || activeTab === 'quiz') {
        pct = 100;
    }
    document.getElementById('progressPercentage').innerText = `${pct}% Progress`;
}

// GCT ASSIST Loading Page - hide once page is ready
(function () {
    var start = Date.now();
    var done = false;
    function hide() {
        if (done) return;
        done = true;
        var el = document.getElementById('loadingPage');
        if (el) el.classList.add('loaded');
    }
    window.addEventListener('load', function () {
        setTimeout(hide, Math.max(0, 700 - (Date.now() - start)));
    });
    setTimeout(hide, 5000);
})();