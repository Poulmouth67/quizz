// Variables
let vocabulary = [];       // mots restants à tester
let toReview = [];         // mots mal répondus
let current = null;
let total = 0;
let score = 0;
let awaitingContinue = false;

// DOM
const questionEl = document.getElementById("question");
const answerEl = document.getElementById("answer");
const feedbackEl = document.getElementById("feedback");
const scoreEl = document.getElementById("score");
const validateBtn = document.getElementById("validate");
const skipBtn = document.getElementById("skip");
const startBtn = document.getElementById("startSession");

// ----- helpers -----
function normalize(str){
  return (str||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[’'"\-\u2010-\u2015]/g,"").replace(/[.,;:!?()]/g,"").replace(/\s+/g," ").trim().toLowerCase();
}

// ----- démarrer quiz -----
function startQuiz(words){
  vocabulary = [...words];  // copier les mots
  toReview = [];
  score = 0;
  total = vocabulary.length;
  nextQuestion();
}

// ----- choisir mot aléatoire -----
function pickWord(){
  const idx = Math.floor(Math.random()*vocabulary.length);
  return vocabulary.splice(idx,1)[0]; // enlève et retourne le mot
}

// ----- question suivante -----
function nextQuestion(){
  awaitingContinue = false;
  answerEl.value = "";
  feedbackEl.textContent = "";
  scoreEl.textContent = `Score : ${score} / ${total}`;

  if(vocabulary.length===0 && toReview.length===0){
    endSession();
    return;
  }

  // priorité aux mots restants
  if(vocabulary.length>0){
    current = pickWord();
  } else {
    // prendre mot à revoir
    current = toReview.shift();
  }

  // direction aléatoire
  current.direction = Math.random()<0.5?"de-to-fr":"fr-to-de";

  questionEl.textContent = current.direction==="de-to-fr"
    ? `Traduire en français : "${current.de}"`
    : `Traduire en allemand : "${current.fr}"`;

  answerEl.focus();
}

// ----- vérifier réponse -----
function checkAnswer(){
  if(awaitingContinue) return;

  const user = normalize(answerEl.value);
  const correct = normalize(current.direction==="de-to-fr"?current.fr:current.de);

  if(user===correct){
    feedbackEl.textContent = "✅ Correct !";
    feedbackEl.className = "correct";
    score++;
    setTimeout(nextQuestion,500);
  } else {
    feedbackEl.innerHTML = `❌ Faux — attendu : <strong>${current.direction==="de-to-fr"?current.fr:current.de}</strong><br><button id="continueBtn">Continuer</button>`;
    feedbackEl.className = "wrong";
    toReview.push(current);  // remet le mot à revoir
    awaitingContinue = true;

    document.getElementById("continueBtn").addEventListener("click",()=>{
      awaitingContinue = false;
      nextQuestion();
    });
  }
}

// ----- fin de session -----
function endSession(){
  questionEl.textContent = "🎉 Session terminée !";
  answerEl.style.display = "none";
  validateBtn.style.display = "none";
  skipBtn.style.display = "none";
  feedbackEl.textContent = `Score final : ${score} / ${total}`;
}

// ----- listeners -----
validateBtn.addEventListener("click", checkAnswer);
skipBtn.addEventListener("click", ()=>{
  if(!awaitingContinue){
    toReview.push(current);
    nextQuestion();
  }
});
answerEl.addEventListener("keydown",e=>{
  if(e.key==="Enter") checkAnswer();
});

// ----- exemple de lancement -----
// startQuiz([{de:"Haus",fr:"maison"},{de:"Hund",fr:"chien"},{de:"Apfel",fr:"pomme"}]);
