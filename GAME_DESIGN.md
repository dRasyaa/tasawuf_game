# Tasawuf Battle Loop — Game Design & System Architecture

## 1) High Concept
**Tasawuf Battle Loop** adalah web turn-based spiritual roguelike berbasis keputusan naratif.
Pemain tidak menjawab “soal benar/salah”, tapi membaca **kondisi batin** lalu memilih **ability** paling selaras untuk merespon kondisi tersebut.

Tone utama:
- mystical
- calm
- introspective
- RPG-like
- sedikit abstrak namun tetap playable

---

## 2) Core Loop (Per Turn)
1. **Narrative Event Trigger**
   - Sistem mengambil 1 event naratif (1–3 kalimat) dari event generator.
   - Event menggambarkan situasi emosi, godaan, ibadah, konflik niat, keraguan, dll.
   - Event tidak pernah menyebut “jawaban”.

2. **Skill Choice System**
   - Sistem menampilkan 4 skill acak dari skill pool.
   - Tepat 1 skill adalah counter paling efektif terhadap event.
   - 3 skill lain adalah decoy yang tampak masuk akal namun kurang tepat konteks.

3. **Resolution**
   - Jika benar: `Tasawuf Level +20`
   - Jika salah: `Tasawuf Level -10`
   - Tampilkan feedback in-universe (naratif pendek), bukan label “salah/benar” kaku.

4. **Loop Continue**
   - Cek win/lose.
   - Jika belum selesai, generate turn baru.

---

## 3) State & Win/Lose
- `Tasawuf Level`: integer 0–100
- Start: `50`
- **WIN**: `Tasawuf Level >= 100` → *Ma’rifat state achieved*
- **LOSE**: `Tasawuf Level <= 0` → *Return to nafs state*

### Implikasi matematis progression
- Rata-rata 3 jawaban benar beruntun dari start bisa menang (`50 + 20 + 20 + 20 = 110`).
- 5 jawaban salah beruntun bisa kalah (`50 - 10*5 = 0`).
- Ini menciptakan tension: reward benar besar, tapi salah tetap berbahaya.

---

## 4) Data Model (Web-ready)

## 4.1 Event Schema
```json
{
  "id": "evt_001",
  "theme": "ego",
  "text": "Setelah dipuji banyak orang, hatimu terasa ringan tapi diam-diam ingin dipuji lagi di kesempatan berikutnya.",
  "difficulty": 1,
  "correct_skill_tag": "ikhlas",
  "hint_vector": ["pujian", "riya_halush", "niat"]
}
```

## 4.2 Skill Schema
```json
{
  "id": "sk_013",
  "name": "Ego Disintegration Field",
  "tags": ["ikhlas", "ego_cleansing"],
  "tier": 1,
  "flavor": "Meleburkan tuntutan pengakuan diri hingga niat kembali jernih."
}
```

## 4.3 Turn Payload Schema
```json
{
  "turn": 12,
  "tasawuf_level": 60,
  "event": {"id": "evt_042", "text": "..."},
  "choices": [
    {"skill_id": "sk_013", "name": "Ego Disintegration Field"},
    {"skill_id": "sk_024", "name": "Aqua Wudhu Flow"},
    {"skill_id": "sk_031", "name": "Silence of Mirrors"},
    {"skill_id": "sk_002", "name": "Nafs Suppression Protocol"}
  ]
}
```

---

## 5) Skill Pool Design & Balancing

Gunakan dua lapisan:
1. **Mechanical Tag** (fungsi gameplay)
2. **Flavor Name** (fantasy-RPG mystic)

### 5.1 Core Tag Domain
- `ikhlas`
- `sabr`
- `syukur`
- `tawakkal`
- `muhasabah`
- `istighfar`
- `hilm` (kelembutan saat marah)
- `wara` (menjaga diri dari syubhat)
- `khushu`
- `sidq` (jujur pada diri)

### 5.2 Contoh Skill Pool (24 skill)
- Aqua Wudhu Flow (`tazkiyah`, `khushu`)
- Ego Disintegration Field (`ikhlas`, `ego_cleansing`)
- Truth Awakening Pulse (`sidq`, `muhasabah`)
- Nafs Suppression Protocol (`mujahadah`, `wara`)
- Sabr Fortress Array (`sabr`)
- Gratitude Resonance (`syukur`)
- Tawakkal Anchor (`tawakkal`)
- Istighfar Rain (`istighfar`)
- Silence of Mirrors (`muhasabah`)
- Humility Gravity Well (`ikhlas`, `tawadhu`)
- Gaze Lowering Veil (`wara`)
- Intention Recalibration (`niyyah`, `ikhlas`)
- Breath of Dhikr (`khushu`, `tuma'ninah`)
- Mercy Expansion Wave (`rahmah`, `hilm`)
- Patience Loop Stabilizer (`sabr`)
- Doubt Clarification Beacon (`yaqin`, `sidq`)
- Generosity Ignition (`itsar`, `syukur`)
- Silence Before Speech (`hilm`, `wara`)
- Presence Lock Sigil (`khushu`)
- Attachment Severance Step (`zuhd`, `tawakkal`)
- Shame-to-Repent Converter (`taubah`, `istighfar`)
- Hidden Deed Cloak (`ikhlas`)
- Heart Audit Drone (`muhasabah`)
- Soft Tongue Protocol (`hilm`)

### 5.3 Balancing Principles
- Setiap tag utama harus punya minimal 2–3 skill agar variasi tetap tinggi.
- Skill decoy dipilih dari tag “tetangga” semantik (mirip tapi bukan paling tepat).
- Jangan ulang skill yang sama lebih dari 2 turn beruntun.
- Rotasi tier visual (efek/animasi) agar pemain merasa progression meski stat linear.

---

## 6) Correct Skill Mapping Logic

### 6.1 Rule-Based Mapping
- Tiap event punya `correct_skill_tag`.
- Skill dianggap benar jika memiliki tag exact match.
- Jika lebih dari 1 skill match, gunakan weighted random agar replayability tinggi.

### 6.2 Decoy Selection
- Pilih 3 skill dari:
  - tag mirip (70%)
  - tag netral (30%)
- Hindari decoy yang punya exact tag sama.

Pseudo:
```pseudo
correct = random(skill where event.correct_tag in skill.tags)
decoys = sample(skills where event.correct_tag not in skill.tags, 3, weighted_by_semantic_similarity)
choices = shuffle([correct] + decoys)
```

---

## 7) Difficulty Scaling

## 7.1 Phase
- **Phase 1 (Turn 1–5):** event eksplisit, decoy jelas berbeda.
- **Phase 2 (Turn 6–12):** event lebih subtil, decoy makin meyakinkan.
- **Phase 3 (Turn 13+):** event ambiguity tinggi (niat campuran), decoy sangat mirip.

## 7.2 Dynamic Difficulty Adjustment (DDA)
- Jika pemain salah 2x berturut, turunkan kompleksitas event 1 tingkat.
- Jika benar 3x berturut, naikkan kompleksitas + tambah ambiguitas bahasa.

## 7.3 Advanced Modifier
- `Veil Intensity` (0–100): makin tinggi, narasi makin simbolik dan sulit dibaca.
- `Nafs Noise`: memunculkan efek UI gangguan minor (misleading flavor text).

---

## 8) Boss System (Spiritual Trial)

Boss muncul tiap N turn (misalnya tiap 7 turn):
- **Boss: The Whispering Nafs**
- Memiliki 3 lapis ujian niat dalam 1 encounter.

### Boss Mechanics
1. Satu event panjang 3 kalimat + 3 sub-choice berurutan.
2. Player harus memilih 3 skill berturut untuk menyelesaikan chain.
3. Scoring boss:
   - 3 benar: `+40`
   - 2 benar: `+15`
   - ≤1 benar: `-20`

Tujuan boss: validasi apakah pemain memahami pola batin, bukan lucky guess satu turn.

---

## 9) Event Generation Strategy (100+ ready)

Bangun event library per tema:
- Ego & Pujian (15)
- Amarah & Reaksi (15)
- Ibadah & Distraksi (15)
- Syubhat & Pilihan kecil (15)
- Putus asa & harap (10)
- Relasi sosial (10)
- Rezeki & kontrol (10)
- Kesunyian & refleksi (10)

Total minimal: 100 event.

Format penulisan event:
- 1–3 kalimat
- bahasa natural
- satu konflik batin utama
- tanpa kata kunci kemampuan secara gamblang

---

## 10) Web Architecture (Practical)

## 10.1 Frontend
- React/Vue/Svelte + state store ringan
- Komponen:
  - `EventCard`
  - `SkillChoiceGrid`
  - `TasawufMeter`
  - `TurnLog`
  - `OutcomePulse`

## 10.2 Backend
- Endpoint:
  - `POST /game/start`
  - `POST /game/turn`
  - `GET /game/state/:runId`
- Modul service:
  - `EventService`
  - `SkillService`
  - `ResolverService`
  - `DifficultyService`

## 10.3 Persistence
- Simpan run seed untuk reproducibility.
- Simpan history pilihan untuk analytics learning pattern.

---

## 11) Learning Pattern & UX Feedback

Agar terasa progression tanpa jadi quiz:
- Feedback naratif reflektif:
  - Benar: “Niatmu kembali jernih; gejolak mereda.”
  - Salah: “Permukaan tenang, tapi akar gelisah belum disentuh.”
- Setelah beberapa turn, tampilkan **insight pattern**:
  - “Kamu kuat di situasi marah, namun rapuh pada pujian halus.”

Ini membangun meta-learning spiritual playstyle.

---

## 12) Contoh 3 Turn (Playable Feel)

### Turn 1
Event: “Kamu menolong seseorang, lalu terus menunggu pesan terima kasih yang tak kunjung datang.”
Pilihan skill:
- Ego Disintegration Field ✅
- Gratitude Resonance
- Aqua Wudhu Flow
- Doubt Clarification Beacon

Outcome benar: +20

### Turn 2
Event: “Dalam ibadah malam, ponsel bergetar; ada dorongan kuat untuk mengecek notifikasi.”
Pilihan:
- Presence Lock Sigil ✅
- Generosity Ignition
- Tawakkal Anchor
- Soft Tongue Protocol

Outcome benar: +20

### Turn 3
Event: “Rencana yang kamu susun rapi gagal total; hatimu ingin menyalahkan takdir.”
Pilihan:
- Tawakkal Anchor ✅
- Heart Audit Drone
- Sabr Fortress Array
- Istighfar Rain

Outcome benar: +20 → WIN jika start di 50.

---

## 13) Next Production Deliverables
Dokumen ini siap dipecah menjadi:
1. `events.json` (100+ event)
2. `skills.json` (20–40 skill)
3. `mapping_rules.ts` (tag matcher + decoy generator)
4. `difficulty.ts`
5. `boss_trials.json`
6. `game_loop.ts` (orchestrator)

