const SKILLS = [
  { name: "Aqua Wudhu Flow", tags: ["khushu", "tazkiyah"] },
  { name: "Ego Disintegration Field", tags: ["ikhlas", "ego"] },
  { name: "Truth Awakening Pulse", tags: ["sidq", "muhasabah"] },
  { name: "Nafs Suppression Protocol", tags: ["wara", "mujahadah"] },
  { name: "Sabr Fortress Array", tags: ["sabr"] },
  { name: "Gratitude Resonance", tags: ["syukur"] },
  { name: "Tawakkal Anchor", tags: ["tawakkal"] },
  { name: "Istighfar Rain", tags: ["istighfar", "taubah"] },
  { name: "Silence of Mirrors", tags: ["muhasabah"] },
  { name: "Humility Gravity Well", tags: ["ikhlas", "tawadhu"] },
  { name: "Gaze Lowering Veil", tags: ["wara"] },
  { name: "Intention Recalibration", tags: ["ikhlas", "niyyah"] },
  { name: "Breath of Dhikr", tags: ["khushu"] },
  { name: "Mercy Expansion Wave", tags: ["hilm"] },
  { name: "Doubt Clarification Beacon", tags: ["sidq", "yaqin"] },
  { name: "Presence Lock Sigil", tags: ["khushu"] },
  { name: "Attachment Severance Step", tags: ["tawakkal", "zuhd"] },
  { name: "Heart Audit Drone", tags: ["muhasabah"] },
  { name: "Soft Tongue Protocol", tags: ["hilm"] }
];

const EVENTS = [
  { text: "Kamu dipuji karena amal kecilmu. Ada dorongan halus untuk menceritakannya lagi agar dianggap konsisten.", correctTag: "ikhlas" },
  { text: "Rencana yang kamu susun rapi runtuh mendadak. Dadamu sesak karena merasa semua harus sesuai maumu.", correctTag: "tawakkal" },
  { text: "Dalam shalat, pikiranmu terus kembali ke notifikasi dan urusan kerja yang belum selesai.", correctTag: "khushu" },
  { text: "Kamu terpancing membalas komentar sinis. Lidah terasa ingin menang, bukan ingin menenangkan.", correctTag: "hilm" },
  { text: "Setelah lalai beberapa hari, kamu merasa terlalu kotor untuk kembali berdoa malam ini.", correctTag: "istighfar" },
  { text: "Ada rezeki kecil tak terduga datang. Hatimu justru sibuk membandingkan dengan milik orang lain.", correctTag: "syukur" },
  { text: "Kamu menunda memperbaiki kesalahan karena takut melihat sisi dirimu sendiri.", correctTag: "muhasabah" },
  { text: "Di tempat sepi, layar ponsel menampilkan hal syubhat. Nafs berkata: hanya sebentar, tidak masalah.", correctTag: "wara" },
  { text: "Saat gagal, kamu mulai membangun narasi palsu agar tetap terlihat kuat di depan orang lain.", correctTag: "sidq" },
  { text: "Proses panjang terasa lambat. Kamu ingin hasil sekarang dan hampir menyerah di tengah jalan.", correctTag: "sabr" }
];

const state = {
  tasawuf: 50,
  turn: 1,
  currentEvent: null,
  choices: [],
  gameOver: false
};

const tasawufValue = document.getElementById("tasawuf-value");
const turnValue = document.getElementById("turn-value");
const meterFill = document.getElementById("meter-fill");
const eventText = document.getElementById("event-text");
const skillsGrid = document.getElementById("skills-grid");
const feedbackText = document.getElementById("feedback-text");
const restartBtn = document.getElementById("restart-btn");

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickEvent() {
  return EVENTS[Math.floor(Math.random() * EVENTS.length)];
}

function pickChoices(correctTag) {
  const correctCandidates = SKILLS.filter((skill) => skill.tags.includes(correctTag));
  const correct = correctCandidates[Math.floor(Math.random() * correctCandidates.length)];

  const decoys = shuffle(SKILLS.filter((skill) => !skill.tags.includes(correctTag))).slice(0, 3);
  return shuffle([
    { ...correct, isCorrect: true },
    ...decoys.map((d) => ({ ...d, isCorrect: false }))
  ]);
}

function updateHUD() {
  tasawufValue.textContent = state.tasawuf;
  turnValue.textContent = state.turn;
  meterFill.style.width = `${Math.max(0, Math.min(100, state.tasawuf))}%`;
}

function renderChoices() {
  skillsGrid.innerHTML = "";
  state.choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.className = "skill-btn";
    btn.type = "button";
    btn.textContent = choice.name;
    btn.disabled = state.gameOver;
    btn.addEventListener("click", () => resolveTurn(choice));
    skillsGrid.appendChild(btn);
  });
}

function nextTurn() {
  state.currentEvent = pickEvent();
  state.choices = pickChoices(state.currentEvent.correctTag);
  eventText.textContent = state.currentEvent.text;
  updateHUD();
  renderChoices();
}

function setFeedback(message, tone) {
  feedbackText.classList.remove("good", "bad");
  if (tone) {
    feedbackText.classList.add(tone);
  }
  feedbackText.textContent = message;
}

function endGame(win) {
  state.gameOver = true;
  skillsGrid.querySelectorAll("button").forEach((btn) => {
    btn.disabled = true;
  });

  if (win) {
    setFeedback("Ma'rifat state achieved. Hatimu tenang, pandanganmu jernih.", "good");
  } else {
    setFeedback("Kamu kembali ke nafs state. Tarik nafas, ulangi perjalananmu.", "bad");
  }

  restartBtn.classList.remove("hidden");
}

function resolveTurn(choice) {
  if (state.gameOver) return;

  if (choice.isCorrect) {
    state.tasawuf += 20;
    setFeedback("Niatmu kembali lurus; simpul batin mulai terurai.", "good");
  } else {
    state.tasawuf -= 10;
    setFeedback("Responsmu belum menyentuh akar gejolak yang sebenarnya.", "bad");
  }

  updateHUD();

  if (state.tasawuf >= 100) {
    endGame(true);
    return;
  }

  if (state.tasawuf <= 0) {
    endGame(false);
    return;
  }

  state.turn += 1;
  setTimeout(() => {
    if (!state.gameOver) {
      nextTurn();
    }
  }, 700);
}

function resetGame() {
  state.tasawuf = 50;
  state.turn = 1;
  state.gameOver = false;
  restartBtn.classList.add("hidden");
  setFeedback("Baca keadaan hatimu, lalu pilih kemampuan yang paling selaras.");
  nextTurn();
}

restartBtn.addEventListener("click", resetGame);
resetGame();
