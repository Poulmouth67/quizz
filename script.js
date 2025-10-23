// Variables globales
let vocabulary = [];
let score = 0;
let total = 0;
let usedWords = [];
let results = [];
let current = null;
let reviewingMistakes = false;
let awaitingContinue = false;

// DOM
const menuEl = document.getElementById("menu");
const configEl = document.getElementById("config");
const quizEl = document.getElementById("quiz");
const nbWordsEl = document.getElementById("nbWords");
const configTitleEl = document.getElementById("config-title");
const themeLabelEl = document.getElementById("themeLabel");
const progressEl = document.getElementById("progress");
const questionEl = document.getElementById("question");
const answerEl = document.getElementById("answer");
const feedbackEl = document.getElementById("feedback");
const scoreEl = document.getElementById("score");
const validateBtn = document.getElementById("validate");
const skipBtn = document.getElementById("skip");
const startBtn = document.getElementById("startSession");
const backBtn = document.getElementById("backToMenu");
const speedEl = document.getElementById("speed");

let speedSetting = "normal";

// ----- initialisation -----
document.querySelectorAll(".theme-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    const theme = btn.dataset.theme;
    await loadVocabulary(theme);
    menuEl.classList.add("hidden");
    configTitleEl.textContent = `Thème : ${theme}`;
    configEl.classList.remove("hidden");
    nbWordsEl.max = vocabulary.length;
    nbWordsEl.value = Math.min(10, vocabulary.length);
  });
});

backBtn.addEventListener("click", () => {
  configEl.classList.add("hidden");
  menuEl.classList.remove("hidden");
});

startBtn.addEventListener("click", () => {
  total = Math.min(Math.max(1, parseInt(nbWordsEl.value, 10) || 10), vocabulary.length);
  speedSetting = speedEl.value;
  startQuiz();
});

validateBtn.addEventListener("click", () => {
  if (!awaitingContinue) checkAnswer();
});

skipBtn.addEventListener("click", () => {
  if (!awaitingContinue) {
    recordResult("", false);
    scoreEl.textContent = `Score : ${score} / ${usedWords.length}`;
    nextQuestion();
  }
});

answerEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    if (awaitingContinue) {
      const cont = document.getElementById("continueBtn");
      if (cont) cont.click();
    } else {
      validateBtn.click();
    }
  }
});

// ----- fonctions -----
async function loadVocabulary(theme) {
  try {
    if (theme === "general") {
      const allFiles = ["maison","sport","sante","ecole"];
      vocabulary = [];
      for (const f of allFiles) {
        const resp = await fetch(`vocab/${f}.json`);
        const data = await resp.json();
        vocabulary = vocabulary.concat(data.map(e => ({...e,_src:f})));
      }
    } else {
      const resp = await fetch(`vocab/${theme}.json`);
      vocabulary = await resp.json();
    }
  } catch(e){ console.error(e); alert("Erreur chargement vocabulaire"); }
}

function startQuiz(fromMistakes = false){
  reviewingMistakes = fromMistakes;
  usedWords = [];
  results = [];
  score = 0;
  awaitingContinue = false;
  quizEl.classList.remove("hidden");
  configEl.classList.add("hidden");
  themeLabelEl.textContent = reviewingMistakes ? "Révision des erreurs" : `Thème : ${selectedTheme}`;
  scoreEl.textContent = `Score : 0 / 0`;
  nextQuestion();
}

function normalize(str){
  return (str||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[’'"\-\u2010-\u2015]/g,"").replace(/[.,;:!?()]/g,"").replace(/\s+/g," ").trim().toLowerCase();
}

function getRandomWord(){
  let idx;
  do {
    idx = Math.floor(Math.random()*vocabulary.length);
  } while (usedWords.includes(idx));
  return idx;
}

function nextQuestion(){
  if(usedWords.length>=total) return endSession();
  let idx;
  if(reviewingMistakes){
    // mots à revoir : prendre dans l'ordre
    idx = usedWords.length;
  } else {
    idx = getRandomWord();
  }
  usedWords.push(idx);
  current = {...vocabulary[idx]};
  if(!current.direction){
    current.direction = Math.random()<0.5?"de-to-fr":"fr-to-de";
  }
  questionEl.textContent = current.direction==="de-to-fr"?`Traduire en français : "${current.de}"`:`Traduire en allemand : "${current.fr}"`;
  answerEl.value = "";
  answerEl.focus();
  feedbackEl.textContent = "";
  feedbackEl.className = "";
  progressEl.textContent = `Mot ${usedWords.length} / ${total}`;
  scoreEl.textContent = `Score : ${score} / ${usedWords.length-1}`;
}

function recordResult(givenRaw,isCorrect){
  results.push({
    de: current.de,
    fr: current.fr,
    direction: current.direction,
    expected: current.direction==="de-to-fr"?current.fr:current.de,
    given: givenRaw,
    isCorrect
  });
}

function checkAnswer(){
  const userRaw = answerEl.value;
  const user = normalize(userRaw);
  const correct = normalize(current.direction==="de-to-fr"?current.fr:current.de);
  const isCorrect = user===correct;
  recordResult(userRaw,isCorrect);
  validateBtn.disabled = true;
  skipBtn.disabled = true;
  if(isCorrect){
    feedbackEl.textContent = "✅ Correct !";
    feedbackEl.className = "correct";
    score++;
    scoreEl.textContent = `Score : ${score} / ${usedWords.length}`;
    setTimeout(nextQuestion,getDelay(true));
  } else {
    awaitingContinue = true;
    const expected = current.direction==="de-to-fr"?current.fr:current.de;
    feedbackEl.innerHTML = `❌ Faux — attendu : <strong>${expected}</strong><br><button id="continueBtn" style="margin-top:8px;">Continuer</button>`;
    feedbackEl.className = "wrong";
    document.getElementById("continueBtn").addEventListener("click",()=>{
      awaitingContinue = false;
      scoreEl.textContent = `Score : ${score} / ${usedWords.length}`;
      nextQuestion();
    });
  }
}

function getDelay(isCorrect){
  const speeds = {fast:isCorrect?500:1500,normal:isCorrect?1000:2500,slow:isCorrect?1500:3000};
  return speeds[speedSetting]||1000;
}

function endSession(){
  const mistakes = results.filter(r=>!r.isCorrect);
  document.body.innerHTML = `<div style="padding:24px;text-align:center;">
    <h1>Session terminée 🎉</h1>
    <p>${reviewingMistakes?"Fin de la révision des erreurs":`Thème : <strong>${selectedTheme}</strong>`}</p>
    <p>Score : <strong>${score} / ${total}</strong></p>
    <h2>Récapitulatif</h2>
    <ul id="recap" style="text-align:left; max-width:800px; margin:12px auto;"></ul>
    <div style="margin-top:16px;">
      <button id="restart" style="margin-right:8px;">Recommencer</button>
      <button id="toMenu" style="margin-right:8px;">Retour au menu</button>
      ${!reviewingMistakes && mistakes.length>0?`<button id="reviewMistakes" style="margin-left:8px;">Revoir mes fautes (${mistakes.length})</button>`:""}
    </div>
  </div>`;
  const recapEl=document.getElementById("recap");
  results.forEach(r=>{
    const li=document.createElement("li");
    const mark=r.isCorrect?"🟢":"🔴";
    li.innerHTML=`${mark} <strong>${r.direction==="de-to-fr"?r.de:r.fr}</strong> — ta réponse : "${r.given||"—"}" — attendu : "${r.expected}"`;
    recapEl.appendChild(li);
  });
  document.getElementById("restart").addEventListener("click",()=>location.reload());
  document.getElementById("toMenu").addEventListener("click",()=>location.href=location.pathname);
  const reviewBtn=document.getElementById("reviewMistakes");
  if(reviewBtn){
    reviewBtn.addEventListener("click",()=>{
      // reconstruire vocabulaire à partir des erreurs
      vocabulary = mistakes.map(m=>({de:m.de,fr:m.fr,direction:m.direction}));
      total = vocabulary.length;
      used
