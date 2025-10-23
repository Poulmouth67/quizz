let vocabulary = [];
let score = 0;
let total = 0;
let usedWords = [];
let results = [];
let current = null;
let direction = "de-to-fr";
let selectedTheme = "";
let speedSetting = "normal";
let reviewingMistakes = false;
let awaitingContinue = false;

// Sections DOM
const menuEl = document.getElementById("menu");
const configEl = document.getElementById("config");
const quizEl = document.getElementById("quiz");
const recapEl = document.getElementById("recapSection");

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

const restartBtn = document.getElementById("restart");
const toMenuBtn = document.getElementById("toMenu");
const reviewBtn = document.getElementById("reviewMistakes");
const speedEl = document.getElementById("speed");

// ---- listeners ----
document.querySelectorAll(".theme-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    selectedTheme = btn.dataset.theme;
    await loadVocabulary(selectedTheme);
    menuEl.classList.add("hidden");
    configTitleEl.textContent = `Thème : ${selectedTheme}`;
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
  const requested = parseInt(nbWordsEl.value, 10) || 10;
  total = Math.min(Math.max(1, requested), vocabulary.length);
  speedSetting = speedEl ? speedEl.value : "normal";
  startQuiz();
});

validateBtn.addEventListener("click", () => { if(!awaitingContinue) checkAnswer(); });
skipBtn.addEventListener("click", () => { if(!awaitingContinue){ recordResult("",false); scoreEl.textContent=`Score: ${score}/${usedWords.length}`; nextQuestionWithDirection(); }});
answerEl.addEventListener("keydown", e => { if(e.key==="Enter"){ if(awaitingContinue){ const cont=document.getElementById("continueBtn"); if(cont) cont.click(); }else validateBtn.click(); }});
restartBtn.addEventListener("click",()=>location.reload());
toMenuBtn.addEventListener("click",()=>location.href=location.pathname);

// ---- chargement vocabulaire ----
async function loadVocabulary(theme){
  try{
    if(theme==="general"){
      const files=["maison","sport","sante","ecole"];
      vocabulary=[];
      for(const f of files){
        const res=await fetch(`vocab/${f}.json`);
        if(!res.ok) throw new Error(`Impossible de charger vocab/${f}.json`);
        const data=await res.json();
        data.forEach(e=>{e._src=f});
        vocabulary=vocabulary.concat(data);
      }
    } else {
      const res=await fetch(`vocab/${theme}.json`);
      if(!res.ok) throw new Error(`Impossible de charger vocab/${theme}.json`);
      vocabulary=await res.json();
      vocabulary.forEach(e=>e._src=theme);
    }
    vocabulary.forEach((e,i)=>e._idx=i);
  }catch(err){alert("Erreur de chargement du vocabulaire");console.error(err);}
}

// ---- démarrage quiz ----
function startQuiz(fromMistakes=false){
  configEl.classList.add("hidden");
  quizEl.classList.remove("hidden");
  recapEl.classList.add("hidden");
  score=0;
  usedWords=[];
  results=[];
  reviewingMistakes=fromMistakes;
  awaitingContinue=false;
  themeLabelEl.textContent=reviewingMistakes?"Révision des erreurs":`Thème : ${selectedTheme}`;
  scoreEl.textContent=`Score: 0 / 0`;
  nextQuestionWithDirection();
}

// ---- question suivante ----
function nextQuestionWithDirection(){
  awaitingContinue=false;
  validateBtn.disabled=false;
  skipBtn.disabled=false;
  if(usedWords.length>=total) return endSession();
  let idx;
  do{ idx=Math.floor(Math.random()*vocabulary.length); }while(usedWords.includes(idx));
  usedWords.push(idx);
  current=vocabulary[idx];
  if(current.direction) direction=current.direction;
  else direction=Math.random()<0.5?"de-to-fr":"fr-to-de";
  questionEl.textContent=direction==="de-to-fr"?`Traduire en français : "${current.de}"`:`Traduire en allemand : "${current.fr}"`;
  answerEl.value="";
  answerEl.focus();
  feedbackEl.textContent="";
  feedbackEl.className="";
  progressEl.textContent=`Mot ${usedWords.length} / ${total}`;
  scoreEl.textContent=`Score : ${score} / ${Math.max(usedWords.length-1,0)}`;
}

// ---- normalisation tolérante ----
function normalize(str){return String(str||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[’'"\-\u2010-\u2015]/g,"").replace(/[.,;:!?()]/g,"").replace(/\s+/g," ").trim().toLowerCase();}

// ---- enregistrement résultat ----
function recordResult(givenRaw,isCorrect){
  results.push({de:current.de,fr:current.fr,direction,expected:direction==="de-to-fr"?current.fr:current.de,given:givenRaw,isCorrect});
}

// ---- vérification réponse ----
function checkAnswer(){
  if(awaitingContinue) return;
  const userRaw=answerEl.value;
  const user=normalize(userRaw);
  const correct=normalize(direction==="de-to-fr"?current.fr:current.de);
  const isCorrect=user===correct;
  recordResult(userRaw,isCorrect);
  validateBtn.disabled=true; skipBtn.disabled=true;
  if(isCorrect){
    f
