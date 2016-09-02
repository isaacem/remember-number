/* 
    Constants 
*/

var c = {
    blank: '_',
    hide: false,
    display: true,

    restart: 'R',

    digits: {
        decr: 'D-',
        incr: 'D+'
    },

    group: {
        decr: 'G-',
        incr: 'G+'
    },

    fontSize: {
        decr: 'F-',
        default: 'F=',
        incr: 'F+'
    },

    timing: {
        decr: 'T-',
        default: 'T=',
        incr: 'T+',
        fastest: 'TF'
    },

    command: {
        show: 'SH',
        hide: 'HI',
        guess: 'GU',
        replay: 'RE',
        nextlevel: 'NE',
        faster: 'FA',
        slower: 'SL'
    },

    inputNo: {
        desc: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 'DEL', 'CLR'],
        tags: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 10, 11],
        del: 10,
        clr: 11
    },

    speedDefault: [0, 100, 200, 300, 600, 900, 1200, 1800, 2800, 4200, 6000, 8200, 10800, 13800,
        17200, 21000, 25200, 29800, 34800, 40200, 46000, 52200, 58800, 65800, 73200, 81000, 89200,
        97800, 106800, 116200, 126000],

    correct: 1,
    wrong: 0,

    boxBlank: '&#9744;',
    boxTick: '&#9745;',
    boxCross: '&#9746;'
}

var msg = {
    clickShow: 'Click <b>SHOW</b> to display number',
    clickHide: 'Click <b>HIDE</b> when done memorizing',
    clickGuess: 'Input number and click <b>GUESS</b> when ready',
    endGame: 'Play again?',
    gameInProgress: 'Game in progress. Start new game?',
    startNewGame: 'New game started: ',

    correct: 'CORRECT',
    wrong: 'WRONG',
    perfect: 'PERFECT SCORE!',
    gameOver: 'Game Over.'
}

var skey = {
    digits: 'digits',
    groupCount: 'groupCount',
    fontSize: 'fontSize',
    speedFastest: 'speedFastest'
}

/*
    Parms
*/

var app = {
    minDigits: 1,
    maxDigits: 30,
    maxTries: 2,

    groupCountMinDigits: 6,     // min digits to enable grouping

    timerStep: 10,              // 10 ms
    delayStep: 10,              // change by percent ie 10% floored by 10
    pauseStep: 200,             // pause before showing question

    default: {
        digits: 1,
        fontSize: 100,
        fontSizeDelta: 10,
        groupCount: 1,

        speed: [0, 100, 200, 300, 600, 900, 1200, 1800, 2800, 4200, 6000, 8200, 10800, 13800,
            17200, 21000, 25200, 29800, 34800, 40200, 46000, 52200, 58800, 65800, 73200, 81000, 89200,
            97800, 106800, 116200, 126000],

        speedFastest: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
};

var gameParms = {
    fontSize: app.default.fontSize,

    changeFontSize: function (change) {
        if (change === c.fontSize.decr) { this.decrFontSize(); }
        else if (change === c.fontSize.default) { this.defaultFontSize(); }
        else if (change === c.fontSize.incr) { this.incrFontSize(); }
    },
    decrFontSize: function () {
        this.fontSize -= (this.fontSize > 50) ? app.default.fontSizeDelta : 0;
    },
    defaultFontSize: function () {
        this.fontSize = app.default.fontSize;
    },
    incrFontSize: function () {
        this.fontSize += (this.fontSize < 300) ? app.default.fontSizeDelta : 0;
    }
}

/* 
    Game vars
*/

var game = {
    digits: app.default.digits,     // current number of didgits
    groupCount: 1,

    inProgress: false,              // is a game in progress
    tryCount: 0,
    perfectGame: false,

    delay: 0,                    // current delay
    delayDefault: 1000,             // default delay
    delayFastest: 99999,            // shortest delay
    score: 0,                       // total score
    scoreDetails: [],               // detailed score
    speedFastest: [],

    changeDigits: function (change) {
        var temp = this.digits + (change === c.digits.decr ? -1 : 1);
        if (temp >= app.minDigits && temp <= app.maxDigits) {
            this.digits = temp;
            return true;                    // return true if changed
        }
        return false;
    },

    changeToDigits: function(newDigits) {
        if (newDigits === this.digits) {
            return false;
        }
        this.digits = newDigits;
        return true;
    },

    changeGroupCount: function (change) {
        this.groupCount += change === c.group.incr ? 1 : -1;
        if (this.groupCount < 1) {
            this.groupCount = 1;
        } else if (game.groupCount > ~~(game.digits / 2)) {
            game.groupCount = ~~(game.digits / 2);
        }
    },

    changeDelay: function (change) {
        var newDelay;
        switch (change) {
            case c.timing.incr:
                newDelay = this.delay * (1 + app.delayStep / 100);
                break;
            case c.timing.decr:
                newDelay = this.delay * (100 / (100 + app.delayStep));
                break;
            case c.timing.default:
                newDelay = c.speedDefault[game.digits];
                break;
            case c.timing.fastest:
                newDelay = game.speedFastest[game.digits];
                //TODO get from local storage
                break;
        }
        newDelay = newDelay === 0 ? c.speedDefault[game.digits] :  newDelay;
        newDelay = newDelay < 10 ? 10 : newDelay;
        this.delay = Math.round(newDelay);
    }
}

var currentTry = {
    question: '',
    guess: '',
    result: ''
}

var elHelp;
var elProgressDigits, elProgressDigitTops;
var elDigits, elGroupSection, elGroupCount;
var elTimeRemain, elTimeDelay;
var elScore;
var elQuestion, elGuess;
var elInstruction, elResults;
var elPlaySection, elNewGameSection;
var elShowBtn, elHideBtn, elGuessBtn, elSlowerBtn;
var elPlayFontSize;         // class

/*
    Classes
*/

var gameStep = {
    initGame: function () { initGame(); },
    startNewGame: function () { startNewGame(); },
    startNewTry: function () { startNewTry(); },
    showClicked: function () { showClicked(); },
    hideClicked: function () { hideClicked(); },
    guessClicked: function () { guessClicked(); },
    endGame: function () { endGame(); }
}

/* *********
    Program starts here
   ********* */

$(document).ready(function () {
    main();
});

function main() {
    initProgressDisplay();
    initOnClick();
    initNumberInput();
    initElements();

    loadFromStorage();
    gameStep.initGame();
}

function initProgressDisplay() {
    var progress = $('#progress');
    // var progressDigit =
    //     '<div id="progress-3" class="progress-digit">' +
    //     '<div class="progress-digit-top">12345</div>' +
    //     '<div class="progress-digit-bottom">3</div>' +
    //     '</div>';

    var digits = '';
    for (i = app.minDigits; i <= app.maxDigits; i++) {
        digits = digits +
            '<div id="progress-' + i + '" class="progress-digit">' +
            '<div class="progress-digit-top" value="' + i + '">-</div>' +
            '<div class="progress-digit-bottom" value="' + i + '">' + i + '</div>' +
            '</div>';
        if (i == 15) {
            digits += '<br />';
        }
    }
    progress.append(digits);
}

function initOnClick() {
    $('.progress-details').on('click', onProgressClicked);
    $('.ctrl-section').on('click', onControlClicked);
    $('.input-section').on('click', onInputClicked);
    $('.command-section').on('click', onCommandClicked);
}

function initNumberInput() {
    var desc;
    var tag;
    var inputStr = '';
    var inputSection = $('#input-section');

    for (i = 0; i < c.inputNo.tags.length; i++) {
        desc = c.inputNo.desc[i];
        tag = c.inputNo.tags[i];
        inputStr = inputStr + '<button id="input-no-' + tag + 
            '" class="btn input-no-btn" value="' +
            tag + '">' + desc + '</button>';
    }
    inputSection.append(inputStr);
}

function initElements() {
    elHelp = $('.help-section');

    elProgressDigitTops = $('.progress-digit-top');
    elProgressDigits = $('.progress-digit');

    elDigits = $('#digits');
    elGroupCount = $('#group-count');
    elGroupSection = $('#group-section');

    elTimeRemain = $('#time-remain');
    elTimeDelay = $('#time-delay');

    elScore = $('#score');

    elPlayFontSize = $('.play-font-size');
    elQuestion = $('#question');
    elGuess = $('#guess');

    elResults = $('#results');
    elInstruction = $('#instruction');

    elPlaySection = $('#play-section');
    elNewGameSection = $('#newgame-section');

    elShowBtn = $('#show-btn');
    elHideBtn = $('#hide-btn');
    elGuessBtn = $('#guess-btn');
    elSlowerBtn = $('#slower-btn');
}

function loadFromStorage() {
    game.speedFastest = loadArray(skey.speedFastest, app.default.speedFastest);
    displayProgress(game.speedFastest);

    game.digits = loadNumber(skey.digits, app.default.digits);
    elDigits.html(game.digits);

    game.groupCount = loadNumber(skey.groupCount, app.default.groupCount);
    displayGroupCount(game.groupCount);

    gameParms.fontSize = loadNumber(skey.fontSize, app.default.fontSize);
    updatePlayFontSize(gameParms.fontSize);
}

function loadNumber(key, sdefault) {
    var temp = localStorage.getItem(key);
    if (temp === null) {
        localStorage.setItem(key, sdefault);
        return parseInt(localStorage.getItem(key));
    } else {
        return parseInt(temp);
    }
}

function saveNumber(key, value) {
    localStorage.setItem(key, value);
}

function loadArray(key, sdefault) {
    var temp = localStorage.getItem(key);
    if (temp === null) {
        localStorage.setItem(key, JSON.stringify(sdefault));
        return JSON.parse(localStorage.getItem(key));
    } else {
        return JSON.parse(temp);
    }
}

function saveArray(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

/*
    Functions that handles the clicks
*/
function onProgressClicked(event) {
    if (event.target.attributes.value === undefined) {
        return;
    }
    var changed = game.changeToDigits(parseInt(event.target.attributes.value.value));
    if (changed) {
        elDigits.html(game.digits);
        saveNumber(skey.digits, game.digits);
        gameStep.initGame();
    }

}

function onControlClicked(event) {
    if (game.inProgress) {
        var rc = confirm(msg.gameInProgress);
        if (rc != true) {
            return;
        }
    }
    game.inProgress = false;

    if (event.target.attributes.value === undefined) {
        return;
    }
    var ctrl = event.target.attributes.value.value;

    switch (ctrl) {
        case c.restart:
            gameStep.startNewGame();
            break;
        case c.digits.decr:
        case c.digits.incr:
            playChangeDigits(ctrl);
            break;
        case c.group.decr:
        case c.group.incr:
            game.changeGroupCount(ctrl);
            saveNumber(skey.groupCount, game.groupCount);
            displayGroupCount(game.groupCount);
            break;
        case c.fontSize.decr:
        case c.fontSize.default:
        case c.fontSize.incr:
            gameParms.changeFontSize(ctrl);
            saveNumber(skey.fontSize, gameParms.fontSize);
            updatePlayFontSize(gameParms.fontSize);
            break;
        case c.timing.decr:
        case c.timing.incr:
        case c.timing.default:
        case c.timing.fastest:
            game.changeDelay(ctrl);
            gameStep.startNewGame();
            break;
    }
}

function onInputClicked(event) {
    if (event.target.attributes.value === undefined) {
        return;
    }
    var num = event.target.attributes.value.value;
    var inputNo = parseInt(num);

    if (inputNo >= 0 && inputNo <= 9) {
        currentTry.guess += num;
    } else if (inputNo === c.inputNo.del) {
        currentTry.guess = currentTry.guess.substr(0, currentTry.guess.length - 1);
    } else if (inputNo === c.inputNo.clr) {
        currentTry.guess = '';
    }
    displayGuess(currentTry.guess, true);
}

function onCommandClicked(event) {
    if (event.target.attributes.value === undefined) {
        return;
    }
    var cmd = event.target.attributes.value.value;

    switch (cmd) {
        case c.command.show:
            gameStep.showClicked();
            break;
        case c.command.hide:
            gameStep.hideClicked();
            break;
        case c.command.guess:
            gameStep.guessClicked();
            break;
        case c.command.faster:
            game.changeDelay(c.timing.decr);
            gameStep.startNewGame();
            break;
        case c.command.slower:
            game.changeDelay(c.timing.incr);
            gameStep.startNewGame();
            break;
        case c.command.replay:
            gameStep.startNewGame();
            break;
        case c.command.nextlevel:
            playChangeDigits(c.digits.incr);
            break;
    }
}

/* 
    Init game
*/
function initGame() {
    game.delay = game.speedFastest[game.digits];
    game.delayFastest = game.delay;
    if (game.delay === 0) {
        game.delay = app.default.speed[game.digits];
        game.delayFastest = game.delay;
    }

    if (game.groupCount > ~~(game.digits / 2) + 1) {
        game.groupCount = ~~(game.digits / 2) + 1;
    }

    if (game.digits < app.groupCountMinDigits) {
        game.groupCount = 1;
    }

    initGameUI();
    gameStep.startNewGame();
}

/* 
    Start new game
*/
function startNewGame() {
    if (game.inProgress) {
        var rc = confirm(msg.gameInProgress);
        if (rc != true) {
            return;
        }
    }
    startNewGameUI();

    // init score, time remain
    game.inProgress = false;
    game.score = 0;
    game.scoreDetails = [];
    game.currentTry = 0;
    game.perfectGame = false;
    game.tryCount = 0;

    displayTimeDelay(game.delay);
    displayQuestion(null, c.hide);
    displayGuess(null, c.hide);
    displayScore(game.scoreDetails);
    displayResults(msg.startNewGame + ' ' + game.digits +
        (game.digits === 1 ? ' digit' : ' digits'));
    gameStep.startNewTry();
}

/* 
    Start new try
*/
function startNewTry() {
    game.tryCount++;
    currentTry.question = getQuestion(game.digits);
    currentTry.guess = '';
    currentTry.result = '';

    displayTimeRemain(game.delay);
    displayInstuction(msg.clickShow, (game.currentTry === 1));
    startNewTryUI();
}

/* 
    Show clicked
*/
function showClicked() {
    game.inProgress = true;
    showClickedUI();
    timing.start(game.delay);
}

var timing = {
    timerDelay: 0,
    timerHandle: 0,
    elapsedTime: 0,
    currentDate: 0,
    startTime: 0,
    remainTime: 0,

    start: function (timerDelay) {
        displayInstuction(msg.clickHide);
        displayGuess(null, c.hide);
        displayQuestion(null, c.hide);
        this.timerHandle = setTimeout(function () { timing.pause(timerDelay) }, app.pauseStep);
    },

    pause: function (timerDelay) {
        this.timerDelay = timerDelay;
        this.elapsedTime = 0;
        this.currentDate = new Date();
        this.startTime = this.currentDate.getTime();
        displayQuestion(currentTry.question, c.display);
        this.timerHandle = setTimeout(function () { timing.update() }, app.timerStep);
    },

    update: function () {
        this.calcTimeRemain();
        if (this.remainTime > 0) {
            displayTimeRemain(this.remainTime);
            this.timerHandle = setTimeout(function () { timing.update() }, app.timerStep);
        } else {
            this.stop();
        }
    },

    stop: function () {
        this.calcTimeRemain();
        displayQuestion(null, c.hide);
        displayTimeRemain(this.remainTime);
        displayInstuction(msg.clickGuess);
        clearTimeout(this.timerHandle);
        hideClickedUI();
    },

    calcTimeRemain: function () {
        this.currentDate = new Date();
        this.elapsedTime = this.currentDate.getTime() - this.startTime;
        this.remainTime = this.timerDelay - this.elapsedTime;
        if (this.remainTime < 0) {
            this.remainTime = 0;
        }
    }
}

function hideClicked() {
    timing.stop();
}

function guessClicked() {
    var result = '';
    if (currentTry.question === currentTry.guess) {
        game.score++;
        game.scoreDetails.push(c.correct);
        result = msg.correct;
    } else {
        game.scoreDetails.push(c.wrong);
        result = msg.wrong;
    }
    result += '! Score: ' + game.score + '/' + app.maxTries;
    displayQuestion(currentTry.question, c.display);

    if (game.tryCount === app.maxTries) {
        gameStep.endGame();
        result = result + ' ' +
            (game.perfectGame ? msg.perfect + ' ' : '') + msg.gameOver;
    } else {
        gameStep.startNewTry();
    }

    displayScore(game.scoreDetails);
    displayResults(result);

}

function endGame() {
    game.inProgress = false;
    game.perfectGame = (game.score === app.maxTries) ? true : false;

    if (game.perfectGame &&
        (game.speedFastest[game.digits] === 0 ||
            game.delay < game.speedFastest[game.digits])) {
        game.speedFastest[game.digits] = game.delay;
        game.delayFastest = game.delay;
        displayProgress(game.speedFastest);
        animateProgress(game.digits);
        saveArray(skey.speedFastest, game.speedFastest);
    }

    displayInstuction(msg.endGame);
    endGameUI();
}

/*
    Misc Functions
*/
function displayProgress(progress) {
    elProgressDigitTops.each(function (i, el) {
        var speed = progress[i + 1];
        $(el).html(speed === 0 ? '-' : speed);
    });
}

function animateProgress(digits) {
    digits--;
    $(elProgressDigits[digits]).addClass('progress-animate-css');

    // elProgressDigits[digits].css('background', 'green')
    //     .animate('.progress-animate', 5000);
}

function displayGroupCount(groupCount) {
    elGroupCount.html(groupCount);
}

function displayTimeDelay(timeDelay) {
    elTimeDelay.html(timeDelay + 'ms');
}

function displayTimeRemain(timeRemain) {
    elTimeRemain.html(timeRemain + 'ms');
}

function displayScore(scoreDetails) {
    var score = '', indScore;
    for (i = 0; i < app.maxTries; i++) {
        if (scoreDetails[i] === undefined) {
            indScore = c.boxBlank;
        } else if (scoreDetails[i] === c.correct) {
            indScore = c.boxTick;
        } else {
            indScore = c.boxCross;
        }
        score += indScore + '&nbsp;';
    }
    elScore.html(score);
}

function displayQuestion(question, showQuestion) {
    elQuestion.html(showQuestion ? groupNumber(question) : c.blank);
}

function displayGuess(guess, showGuess) {
    elGuess.html(showGuess && guess !== '' ? groupNumber(guess) : c.blank);
}

function groupNumber(num) {
    if (game.groupCount === 1) {
        return num;
    }

    var len = num.length;
    var formatted = '';
    var j;
    for (i = 0; i < len; i ++) {
        formatted += num.substr(i, 1);
        j = i + 1;
        if (j % game.groupCount === 0 && j != len) {
            formatted += ' ';
        }
    }
    return formatted;
}

function displayResults(results) {
    elResults.html(results);
}

function displayInstuction(message, newGame) {
    if (newGame) {
        message = msg.newGame + game.digits +
            ((game.digits === 1) ? ' digit. ' : ' digits. ') + message;
    }
    elInstruction.html(message);
}

function getQuestion(digits) {
    var question = '';
    for (i = 0; i < digits; i++) {
        question += '' + Math.floor(Math.random() * 10);
    }
    return question;
}

function playChangeDigits(change) {
    var changed = game.changeDigits(change);
    if (changed) {
        elDigits.html(game.digits);
        saveNumber(skey.digits, game.digits);
        gameStep.initGame();
    }
}

function updatePlayFontSize(fontSizePercent) {
    elPlayFontSize.css('font-size', fontSizePercent + '%');
}

function showHelp() {
    elHelp.css('visibility', (elHelp.css('visibility') === 'visible') ? 'hidden' : 'visible');
}

/*
    Controls the UI ie enable/disable elements
*/
function initGameUI() {
    displayTimeDelay(game.delay);
    elGroupSection.css('display', (game.digits > 5 ? 'inline-block' : 'none'));
    displayGroupCount(game.groupCount);
}

function startNewGameUI() {
    disableInputNumber(true);
    displayPlaySection(true);
}

function startNewTryUI() {
    disableInputNumber(true);
    disablePlayButtons(false, true, true);
}

function showClickedUI() {
    disablePlayButtons(true, false, true);
    displayResults(c.blank);
}

function hideClickedUI() {
    disablePlayButtons(true, true, false);
    disableInputNumber(false);
}

function endGameUI() {
    elSlowerBtn.css('display', game.perfectGame ? 'none' : 'inline');
    displayPlaySection(false);
}

function disableInputNumber(isDisable) {
    $('.input-no-btn').css('pointerEvents', (isDisable) ? 'none' : 'auto');
}

function displayPlaySection(isDisplay) {
    elPlaySection.css('display', isDisplay ? 'block' : 'none');
    elNewGameSection.css('display', !isDisplay ? 'block' : 'none');
}

function disablePlayButtons(disableShow, disableHide, disableGuess) {
    elShowBtn.prop('disabled', disableShow);
    elHideBtn.prop('disabled', disableHide);
    elGuessBtn.prop('disabled', disableGuess);
}
