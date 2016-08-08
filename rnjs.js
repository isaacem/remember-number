var dfParms = {
    maxTries: 3,
    minDigits: 4,
    maxDigits: 25,

    WRONG: 0,
    CORRECT: 1,

    NOTPLAYED: '0',
    PLAYED: '1',
    PERFECT: '2',

    NORMAL: 'N',
    SUPER: 'S',

    SEP: '-',

    normalSpeed: [0, 0, 0, 0, 600, 900, 1200, 1800, 2800, 4200, 6000, 8200, 10800, 13800,
        17200, 21000, 25200, 29800, 34800, 40200, 46000, 52200, 58800, 65800, 73200, 81000, 89200,
        97800, 106800, 116200, 126000],
    superSpeed: [],     // init to be half of normal speed
}

var cookieName = {
    previousPlayedDigits: 'digits',
    currentGameType: 'gametype',
    fontSizePercent: 'fontsizepercent',

    game: 'game',
    normalGame: 'gameN',
    superGame: 'gameS',
}

var gameDefault = {
    digits: 4,
    currentTry: 0,
    score: 0,
    scoreDetails: [-1, -1, -1, -1, -1],
    gameType: 'N', 
    progress: '00000000000000000000000000'    
}

var game = {
    digits: gameDefault.digits,
    gameType: gameDefault.gameType,
    progress: gameDefault.progress,

    previousDigits: 0,
    currentTry: 0,
    score: 0,
    scoreDetails: [-1, -1, -1, -1, -1],
    isInProgress: false,
    currentSpeed: 0,
}

var msg = {
    ShowQuestion: 'Click "SHOW" to display number',
    HideQuestion: 'Click "HIDE" when done remembering',
    InputGuess: 'Input number and click "GUESS"',
    StartNewGame: 'Click "New Game" to play again.',
    GameInProgress: 'Game in progress. Start new game?'
}
var blankGuess = '_';

var fontSizePercent = 100;
var perviousGameType = gameDefault.gameType;

var tryQuestion = blankGuess;
var tryGuess = blankGuess;

var timerHandle;
var currentDate;
var elapsedTime;
var startTime;
var remainTime;
var timerDelay = 1000;

var steps = {
    NEWTRY: 0,
    AFTERSHOW: 1,
    AFTERHIDE: 2,
    AFTERGUESS: 3,
    NEWGAME: 4,
    STARTNEWGAME: 5
}

var elTryDispQn, elTryCommGs, elTryDispQn, elTryDispGs;
var elHelp, elGameTypeSelect, elTimerBar, elTimerTime, elInstruction;
var elBtnShow, elBtnHide, elBtnGuess;


function main() {
    initElements();
    initParms();

    var previousGameType = getCookie(cookieName.currentGameType);
    if (previousGameType == "undefined" || previousGameType == '') {
        previousGameType = gameDefault.gameType; 
        saveGame(previousGameType);
    }
    loadGame(previousGameType);
    elGameTypeSelect.value = previousGameType;

    updateFontSize();
    startNewGame(game.digits);
}

function initElements() {
    elTryDispQn = document.getElementById('try-display-question');
    elTryDispGs = document.getElementById('try-display-guess');
    elTryCommQn = document.getElementById('try-comment-question');
    elTryCommGs = document.getElementById('try-comment-guess');

    elHelp = document.getElementById('help-section');
    elGameTypeSelect = document.getElementById('game-type-select');
    elTimerTime = document.getElementById('timer-time');
    elTimerBar = document.getElementById('timer-bar');
    elInstruction = document.getElementById('instruction-detail');

    elBtnShow = document.getElementById('btn-show');
    elBtnHide = document.getElementById('btn-hide');
    elBtnGuess = document.getElementById('btn-guess');
}

function initParms() {
    dfParms.superSpeed = new Array(31);
    for (i = 0; i < dfParms.normalSpeed.length; i++) {
        dfParms.superSpeed[i] = dfParms.normalSpeed[i] / 2;
    }
}

function startNewGame(digits) {
    if (digits === undefined) {
        digits = game.digits;
    }

    if (game.isInProgress) {
        // show alert box
        var rc = confirm(msg.GameInProgress);
        if (rc != true) {
            return;
        }
    }

    setupDigits(digits);
    updateDigitsDisplay(digits);
    newGame();
}

function setupDigits(newDigits) {
    if (newDigits >= dfParms.minDigits && newDigits <= dfParms.maxDigits) {
        game.digits = newDigits;
        timerDelay = getTimerDelay(game.gameType, newDigits);
    }
}

function getTimerDelay(gametype, digits) {
    switch (gametype) {
        case dfParms.NORMAL:
        default:
            return dfParms.normalSpeed[digits];
        case dfParms.SUPER:
            return dfParms.superSpeed[digits];
    }
}

function updateDigitsDisplay(digits) {
    var playStatus;

    if (digits != game.previousDigits || game.gameType != previousGameType) {
        game.currentSpeed = getSpeed(game.gameType);
        saveGame(game.gameType);
    }

    for (i = dfParms.minDigits; i <= dfParms.maxDigits; i++) {
        if (game.progress.substring(i, i + 1) === dfParms.PLAYED) {
            document.getElementById('digits-' + i).className = 'btn digits-number played';
            playStatus = 'Played';
        } else if (game.progress.substring(i, i + 1) === dfParms.PERFECT) {
            document.getElementById('digits-' + i).className = 'btn digits-number perfect';
            playStatus = 'Perfect Game';
        } else {
            document.getElementById('digits-' + i).className = 'btn digits-number';
            playStatus = 'Not Started';
        }

        //        if (digits != game.previousDigits) {
        document.getElementById('digits-tooltip-' + i).innerHTML = playStatus + '. ' + game.currentSpeed[i] + 'ms';
        //        }

        if (i === game.digits) {
            document.getElementById('digits-' + i).className = 'btn digits-number active';
        }
    }
    game.previousDigits = digits;
    previousGameType = game.gameType;
    updateFontSize();
}

function getSpeed(gametype) {
    switch (gametype) {
        case dfParms.NORMAL:
        default:
            return dfParms.normalSpeed;
        case dfParms.SUPER:
            return dfParms.superSpeed;
    }
}

function newTry() {
    game.currentTry++;
    setupStep(steps.NEWTRY);
}

function updateTimerbar(percent, remainTime) {
    displayTiming(remainTime, timerDelay);
    elTimerBar.setAttribute('style', 'width:' + percent + '%');
}

function showQuestion() {
    game.isInProgress = true;
    setupStep(steps.AFTERSHOW);
    tryQuestion = getQuestion();
    updateTrySection(tryQuestion, null, null, null);
    runTimer(timerDelay);
}

function runTimer(totDelay) {
    //    document.getElementById('timer-time').innerHTML = totDelay + ' / ' + totDelay;
    displayTiming(totDelay, totDelay);
    //    totalDelay = totDelay;
    elapsedTime = 0;
    currentDate = new Date();
    startTime = currentDate.getTime();
    timerHandle = setTimeout(function () { updateTimer() }, 100);
}

function displayTiming(remainTime, totalTime) {
    elTimerTime.innerHTML = remainTime + ' / ' + totalTime;
}

function updateTimer() {
    currentDate = new Date();
    elapsedTime = currentDate.getTime() - startTime;
    remainTime = timerDelay - elapsedTime;
    //    console.log(remainTime);
    percent = remainTime / timerDelay * 100;
    if (remainTime < 0) {
        remainTime = 0;
        percent = 0;
    }

    if (remainTime > 0) {
        updateTimerbar(percent, remainTime);
        timerHandle = setTimeout(function () { updateTimer() }, 100);
    } else {
        updateTimerbar(0, 0);
        hideQuestion();
    }
}

function hideQuestion() {
    tryGuess = blankGuess;
    setupStep(steps.AFTERHIDE);
    clearTimeout(timerHandle);
}

function guessQuestion() {
    setupStep(steps.AFTERGUESS);

    isCorrectResult = (tryGuess === tryQuestion);
    if (isCorrectResult) {
        updateTrySection(tryQuestion, null, null, 'CORRECT');
        game.score++;
        game.scoreDetails[game.currentTry] = dfParms.CORRECT;
        document.getElementById('score-' + game.currentTry).classList = 'label label-success score-number';
    } else {
        updateTrySection(tryQuestion, null, null, 'WRONG');
        game.scoreDetails[game.currentTry] = dfParms.WRONG;
        document.getElementById('score-' + game.currentTry).classList = 'label label-danger score-number';
    }

    if (game.currentTry < dfParms.maxTries) {
        newTry();
    } else {
        game.isInProgress = false;
        if (game.score === dfParms.maxTries) {
            updateGameProgress(dfParms.PERFECT);
        } else {
            updateGameProgress(dfParms.PLAYED);
        }
        setupStep(steps.STARTNEWGAME);
    }

}

function getQuestion() {
    var newQuestion = '';
    for (i = 0; i < game.digits; i++) {
        newQuestion += '' + Math.floor(Math.random() * 10);
    }
    return newQuestion;
}

function updateGameProgress(playStatus) {
    if (playStatus > game.progress.substring(game.digits, game.digits + 1)) {
        game.progress = game.progress.substring(0, game.digits) + playStatus +
            game.progress.substring(game.digits + 1, game.progress.length);
    }
    saveGame(game.gameType);
}

function changeFontSize(changeParm) {
    percentDelta = 10;
    switch (changeParm) {
        case -1:
            fontSizePercent -= percentDelta;
            break;
        case 0:
            fontSizePercent = 100;
            break;
        case 1:
            fontSizePercent += percentDelta;
            break;
        default: // should not have this ie. do nothing
    }
    saveGame(game.gameType);
    updateFontSize();
}

function updateFontSize() {
    elTryDispQn.style.fontSize = fontSizePercent + '%';
    elTryDispGs.style.fontSize = fontSizePercent + '%';
    elTryDispQn.style.width = (game.digits + 2) + 'em';
    elTryDispGs.style.width = (game.digits + 2) + 'em';
}

function addNumber(inputNumber) {
    if (tryGuess === blankGuess || tryGuess == null) {
        tryGuess = '';
    }
    if (inputNumber <= 9) {
        // number clicked
        tryGuess = '' + tryGuess + inputNumber;
    } else if (inputNumber == 10) {
        // DEL clicked
        if (tryGuess.length <= 1) {
            tryGuess = blankGuess;
        } else {
            tryGuess = tryGuess.substring(0, tryGuess.length - 1);
        }
    } else {
        // CLR clicked
        tryGuess = blankGuess;
    }
    //    document.getElementById('try-display-guess').innerHTML = tryGuess;
    updateTrySection(null, tryGuess, null, null);
}

function disableOnClickNumber(isDisable) {
    for (i = 0; i <= 11; i++) {
        if (isDisable) {
            document.getElementById('input-' + i).style.pointerEvents = 'none';
        } else {
            document.getElementById('input-' + i).style.pointerEvents = 'auto';
        }
    }
}

// enable/disable elements after clicking on Show, Hide and Guess buttons
function setupStep(currentStep) {
    switch (currentStep) {
        case steps.NEWTRY:
            setupNewTry();
            break;
        case steps.AFTERSHOW:
            setupShowStep();
            break;
        case steps.AFTERHIDE:
            setupHideStep();
            break;
        case steps.AFTERGUESS:
            setupGuessStep();
            break;
        case steps.NEWGAME:
            setupNewGame();
            break;
        case steps.STARTNEWGAME:
            setupStartNewGame();
            break;
    }
}

function setupNewTry() {
    disableOnClickNumber(true);
    disableButtons(false, true, true);

    elInstruction.classList.remove('label');
    elInstruction.classList.remove('label-warning');
    elInstruction.innerHTML = msg.ShowQuestion;

    displayTiming(timerDelay, timerDelay);
    document.getElementById('score-' + game.currentTry).classList = 'label label-warning score-number';
}

function setupShowStep() {
    disableOnClickNumber(true);
    disableButtons(true, false, true);

    elInstruction.innerHTML = msg.HideQuestion;
    updateTrySection(null, blankGuess, null, '')
}

function setupHideStep() {
    disableOnClickNumber(false);
    disableButtons(true, true, false);

    document.getElementById('new-game').style.display = 'none';

    elInstruction.innerHTML = msg.InputGuess;
    updateTrySection(blankGuess, blankGuess, null, null);
}

function setupGuessStep() {
    disableOnClickNumber(true);
    disableButtons(false, true, true);

    elInstruction.innerHTML = msg.ShowQuestion;
}

function setupNewGame() {
    for (i = 1; i <= dfParms.maxTries; i++) {
        document.getElementById('score-' + i).classList = 'label label-default score-number';
    }
    document.getElementById('final-score').style.display = 'none';
    document.getElementById('play-again').style.display = 'none';
    document.getElementById('buttons').style.display = 'block';
    elInstruction.style.display = 'inline';

    document.getElementById('new-game').innerHTML = 'New game started (' + game.digits + ' digits). ';
    document.getElementById('new-game').style.display = 'inline';

    updateTrySection(blankGuess, blankGuess, null, '');
}

function setupStartNewGame() {
    msgScore = (game.score === dfParms.maxTries) ? 'Congrats! PERFECT Score: ' : 'Final Score: ';
    msgScore += game.score + '/' + dfParms.maxTries;
    document.getElementById('final-score').innerHTML = msgScore;
    document.getElementById('final-score').style.display = 'inline';

    document.getElementById('play-again').style.display = 'block';
    document.getElementById('buttons').style.display = 'none';

    elInstruction.style.display = 'none';
    if (game.digits === dfParms.maxDigits) {
        document.getElementById('btn-next-level').style.display = 'none';
    } else {
        document.getElementById('btn-next-level').style.display = 'inline';
    }
}

function updateTrySection(question, guess, qnComment, gsComment) {
    if (question != null) {
        elTryDispQn.innerHTML = question;
    }
    if (guess != null) {
        elTryDispGs.innerHTML = guess;
    }
    if (qnComment != null) {
        elTryCommQn.innerHTML = qnComment;
    }
    if (gsComment != null) {
        elTryCommGs.innerHTML = gsComment;
    }
}

function disableButtons(disableShow, disableHide, disableGuess) {
    elBtnShow.disabled = disableShow;
    elBtnHide.disabled = disableHide;
    elBtnGuess.disabled = disableGuess;
}

function newGame() {
    resetGame();
    setupStep(steps.NEWGAME);
    newTry();
}

function resetGame() {
    game.currentTry = gameDefault.currentTry;
    game.score = gameDefault.score;
    game.scoreDetails = gameDefault.scoreDetails;
    game.isInProgress = false;
}

function playNextLevel() {
    if (game.digits < dfParms.maxDigits) {
        game.digits++;
        saveGame(game.gameType);
    }
    startNewGame(game.digits);
}

function showHelp() {
    elHelp.style.visibility = (elHelp.style.visibility == 'visible') ? 'hidden' : 'visible';
}

function loadGame(gameType) {
    var fontsize = getCookie(cookieName.fontSizePercent);
    if (fontsize != '') {
        fontSizePercent = parseInt(fontsize);
    }

    var gameStr = getCookie(cookieName.game + gameType);
    if (gameStr !== '') {
        strToGame(gameStr);
    } else {
        game.digits = gameDefault.digits;
        game.gameType = gameType;
        game.progress = gameDefault.progress,

        game.previousDigits = 0;
        game.currentTry = 0;
        game.score = 0;
        game.scoreDetails = [-1, -1, -1, -1, -1];
        game.isInProgress = false;
        game.currentSpeed = getSpeed(game.gameType);
    }
}

function getCookie(cookieName) {
    var searchName = cookieName + '=';
    var allCookies = document.cookie.split(';');
    for (var i = 0; i < allCookies.length; i++) {
        var currentCookie = allCookies[i];
        while (currentCookie.charAt(0) == ' ') {
            currentCookie = currentCookie.substring(1);
        }
        if (currentCookie.indexOf(searchName) == 0) {
            return currentCookie.substring(searchName.length, currentCookie.length);
        }
    }
    return '';
}

function strToGame(gameStr) {
    var gameVars = gameStr.split(dfParms.SEP);
    game.digits = parseInt(gameVars[0]);
    game.gameType = gameVars[1];
    game.progress = gameVars[2];

    game.previousDigits = 0;
    game.currentTry = 0;
    game.score = 0;
    game.scoreDetails = [-1, -1, -1, -1, -1];
    game.isInProgress = false;
    game.currentSpeed = getSpeed(game.gameType);
}

function saveGame(newGameType) {
    document.cookie = cookieName.currentGameType + '=' + newGameType;
    document.cookie = cookieName.fontSizePercent + '=' + fontSizePercent;

    var cookieGameName = cookieName.game + game.gameType;
    document.cookie = cookieGameName + '=' + gameToStr();
}

function gameToStr() {
    var gameStr =
        game.digits + dfParms.SEP +
        game.gameType + dfParms.SEP +
        game.progress + dfParms.SEP;

    return gameStr;
}

function changeGameType() {
    saveGame(elGameTypeSelect.value);
    loadGame(elGameTypeSelect.value);
    startNewGame();
}