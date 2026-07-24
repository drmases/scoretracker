(function () {
  'use strict';

  var SESSION_KEY = 'scoretracker.currentSession';
  var HISTORY_KEY = 'scoretracker.history';

  var PLAYER_COLORS = [
    '#e8352f', '#f2c41e', '#3fa64c', '#1f6fb2',
    '#7c3fc4', '#d13c8e', '#1fa898', '#c7a419'
  ];

  function defaultSession() {
    return {
      gameName: '',
      roundsEnabled: true,
      roundsCreated: 1,
      activeRound: 0,
      players: []
    };
  }

  function loadSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return defaultSession();
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.players)) return defaultSession();
      return parsed;
    } catch (e) {
      return defaultSession();
    }
  }

  function loadHistory() {
    try {
      var raw = localStorage.getItem(HISTORY_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  var state = loadSession();
  var history = loadHistory();

  function saveSession() {
    localStorage.setItem(SESSION_KEY, JSON.stringify(state));
  }

  function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function playerTotal(player) {
    return player.rounds.reduce(function (sum, v) { return sum + v; }, 0);
  }

  function displayTotal(player) {
    return state.roundsEnabled ? playerTotal(player) : (player.rounds[0] || 0);
  }

  function nextColor() {
    return PLAYER_COLORS[state.players.length % PLAYER_COLORS.length];
  }

  function nameFontSize(count) {
    if (count <= 5) return 2.5;
    return Math.max(2.5 - (count - 5) * 0.25, 1.3);
  }

  // ---------- DOM refs ----------
  var appEl = document.getElementById('app');
  var gameNameInput = document.getElementById('gameNameInput');
  var roundNumberEl = document.getElementById('roundNumber');
  var roundMinusBtn = document.getElementById('roundMinus');
  var roundPlusBtn = document.getElementById('roundPlus');
  var playerRowsEl = document.getElementById('playerRows');
  var addPlayerBtn = document.getElementById('addPlayerBtn');

  var drawerTab = document.getElementById('drawerTab');
  var drawer = document.getElementById('drawer');
  var drawerOverlay = document.getElementById('drawerOverlay');
  var clearBtn = document.getElementById('clearBtn');
  var saveBtn = document.getElementById('saveBtn');
  var historyBtn = document.getElementById('historyBtn');
  var viewBtn = document.getElementById('viewBtn');

  var historyOverlay = document.getElementById('historyOverlay');
  var historyPanel = document.getElementById('historyPanel');
  var historyCloseBtn = document.getElementById('historyCloseBtn');
  var historyListEl = document.getElementById('historyList');

  var confirmOverlay = document.getElementById('confirmOverlay');
  var confirmModal = document.getElementById('confirmModal');
  var confirmMessage = document.getElementById('confirmMessage');
  var confirmYesBtn = document.getElementById('confirmYes');
  var confirmNoBtn = document.getElementById('confirmNo');

  // ---------- rendering ----------
  function render() {
    gameNameInput.value = state.gameName;
    appEl.classList.toggle('rounds-off', !state.roundsEnabled);
    viewBtn.textContent = 'View: Rounds ' + (state.roundsEnabled ? 'ON' : 'OFF');

    var displayRound = state.roundsEnabled ? state.activeRound : 0;
    roundNumberEl.textContent = String(displayRound + 1);
    roundMinusBtn.disabled = state.roundsCreated <= 1;

    appEl.style.setProperty('--player-name-size', nameFontSize(state.players.length) + 'rem');

    playerRowsEl.innerHTML = '';
    state.players.forEach(function (player, idx) {
      playerRowsEl.appendChild(renderPlayerRow(player, idx));
    });

    saveSession();
  }

  function renderPlayerRow(player, idx) {
    var row = document.createElement('div');
    row.className = 'row player-row';
    row.style.background = player.color;

    // Game/player-name column
    var gameCol = document.createElement('div');
    gameCol.className = 'col col-game';

    var wrap = document.createElement('div');
    wrap.className = 'player-name-wrap';

    var labelRow = document.createElement('div');
    labelRow.className = 'player-label-row';

    var label = document.createElement('span');
    label.className = 'player-index';
    label.textContent = 'Player ' + (idx + 1);
    labelRow.appendChild(label);

    var removeBtn = document.createElement('button');
    removeBtn.className = 'remove-player-btn';
    removeBtn.type = 'button';
    removeBtn.textContent = '×';
    removeBtn.setAttribute('aria-label', 'Remove player');
    removeBtn.addEventListener('click', function () {
      state.players.splice(idx, 1);
      render();
    });
    labelRow.appendChild(removeBtn);

    var nameInput = document.createElement('input');
    nameInput.className = 'player-name-input';
    nameInput.type = 'text';
    nameInput.placeholder = 'Player ' + (idx + 1);
    nameInput.value = player.name;
    nameInput.addEventListener('input', function () {
      player.name = nameInput.value;
      saveSession();
    });

    wrap.appendChild(labelRow);
    wrap.appendChild(nameInput);
    gameCol.appendChild(wrap);

    row.appendChild(gameCol);

    // Round history chips column
    var roundCol = document.createElement('div');
    roundCol.className = 'col col-round';
    var historyWrap = document.createElement('div');
    historyWrap.className = 'round-history';
    var activeRound = state.roundsEnabled ? state.activeRound : 0;
    for (var r = 0; r < player.rounds.length; r++) {
      var chip = document.createElement('span');
      chip.className = 'round-chip' + (r === activeRound ? ' active' : '');
      chip.textContent = String(player.rounds[r]);
      historyWrap.appendChild(chip);
    }
    roundCol.appendChild(historyWrap);
    row.appendChild(roundCol);

    // Active-round score stepper column
    var scoreCol = document.createElement('div');
    scoreCol.className = 'col col-score';
    var stepper = document.createElement('div');
    stepper.className = 'score-stepper';

    var minus = document.createElement('button');
    minus.className = 'score-step-btn';
    minus.type = 'button';
    minus.textContent = '−';
    minus.addEventListener('click', function () {
      player.rounds[activeRound] -= 1;
      render();
    });

    var valueEl = document.createElement('span');
    valueEl.className = 'score-value';
    valueEl.textContent = String(player.rounds[activeRound] || 0);

    var plus = document.createElement('button');
    plus.className = 'score-step-btn';
    plus.type = 'button';
    plus.textContent = '+';
    plus.addEventListener('click', function () {
      player.rounds[activeRound] += 1;
      render();
    });

    stepper.appendChild(minus);
    stepper.appendChild(valueEl);
    stepper.appendChild(plus);
    scoreCol.appendChild(stepper);
    row.appendChild(scoreCol);

    // Total column
    var totalCol = document.createElement('div');
    totalCol.className = 'col col-total total-col';
    var totalEl = document.createElement('div');
    totalEl.className = 'total-value';
    totalEl.textContent = String(displayTotal(player));
    totalCol.appendChild(totalEl);
    row.appendChild(totalCol);

    return row;
  }

  // ---------- player management ----------
  function addPlayer() {
    var roundCount = state.roundsEnabled ? state.roundsCreated : 1;
    var rounds = [];
    for (var i = 0; i < roundCount; i++) rounds.push(0);
    state.players.push({
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      name: '',
      color: nextColor(),
      rounds: rounds
    });
    render();
  }

  // ---------- round navigation ----------
  function roundPlus() {
    if (!state.roundsEnabled) return;
    if (state.activeRound === state.roundsCreated - 1) {
      state.roundsCreated += 1;
      state.players.forEach(function (p) { p.rounds.push(0); });
    }
    state.activeRound += 1;
    render();
  }

  function roundMinus() {
    if (!state.roundsEnabled) return;
    if (state.roundsCreated <= 1) return;
    showConfirm('Delete Round?', function () {
      state.roundsCreated -= 1;
      state.players.forEach(function (p) { p.rounds.pop(); });
      if (state.activeRound > state.roundsCreated - 1) {
        state.activeRound = state.roundsCreated - 1;
      }
      render();
    }, function () {
      if (state.activeRound > 0) {
        state.activeRound -= 1;
        render();
      }
    });
  }

  // ---------- drawer ----------
  function openDrawer() {
    drawer.classList.add('open');
    drawerOverlay.classList.add('open');
    drawerTab.classList.add('open');
    drawerTab.setAttribute('aria-label', 'Close menu');
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
    drawerTab.classList.remove('open');
    drawerTab.setAttribute('aria-label', 'Open menu');
  }

  function openHistoryPanel() {
    closeDrawer();
    renderHistory();
    historyPanel.classList.add('open');
    historyOverlay.classList.add('open');
  }
  function closeHistoryPanel() {
    historyPanel.classList.remove('open');
    historyOverlay.classList.remove('open');
  }

  // ---------- confirm modal ----------
  var confirmYesHandler = null;
  var confirmNoHandler = null;

  function showConfirm(message, onYes, onNo) {
    confirmMessage.textContent = message;
    confirmYesHandler = onYes;
    confirmNoHandler = onNo || null;
    confirmModal.classList.add('open');
    confirmOverlay.classList.add('open');
  }

  function closeConfirm() {
    confirmModal.classList.remove('open');
    confirmOverlay.classList.remove('open');
    confirmYesHandler = null;
    confirmNoHandler = null;
  }

  confirmYesBtn.addEventListener('click', function () {
    var handler = confirmYesHandler;
    closeConfirm();
    if (handler) handler();
  });
  confirmNoBtn.addEventListener('click', function () {
    var handler = confirmNoHandler;
    closeConfirm();
    if (handler) handler();
  });
  confirmOverlay.addEventListener('click', closeConfirm);

  // ---------- actions ----------
  function doClear() {
    if (!confirm('Clear the current board? This cannot be undone.')) return;
    state = defaultSession();
    render();
    closeDrawer();
  }

  function doSave() {
    var entry = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      savedAt: new Date().toISOString(),
      gameName: state.gameName.trim() || 'Untitled game',
      players: state.players.map(function (p, idx) {
        return {
          name: p.name.trim() || ('Player ' + (idx + 1)),
          color: p.color,
          total: displayTotal(p)
        };
      })
    };
    history.unshift(entry);
    saveHistory();
    closeDrawer();
    openHistoryPanel();
  }

  function doToggleView() {
    state.roundsEnabled = !state.roundsEnabled;
    render();
  }

  function formatDate(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  function renderHistory() {
    historyListEl.innerHTML = '';
    if (history.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'history-empty';
      empty.textContent = 'No saved games yet.';
      historyListEl.appendChild(empty);
      return;
    }

    history.forEach(function (entry) {
      var card = document.createElement('div');
      card.className = 'history-entry';

      var title = document.createElement('div');
      title.className = 'history-entry-title';
      title.textContent = entry.gameName;
      card.appendChild(title);

      var date = document.createElement('div');
      date.className = 'history-entry-date';
      date.textContent = formatDate(entry.savedAt);
      card.appendChild(date);

      var playersWrap = document.createElement('div');
      playersWrap.className = 'history-entry-players';
      var maxTotal = entry.players.reduce(function (m, p) { return Math.max(m, p.total); }, -Infinity);
      entry.players.forEach(function (p) {
        var pRow = document.createElement('div');
        pRow.className = 'history-player-row' + (p.total === maxTotal ? ' winner' : '');
        pRow.style.background = p.color;
        var nameSpan = document.createElement('span');
        nameSpan.textContent = p.name;
        var totalSpan = document.createElement('span');
        totalSpan.textContent = p.total;
        pRow.appendChild(nameSpan);
        pRow.appendChild(totalSpan);
        playersWrap.appendChild(pRow);
      });
      card.appendChild(playersWrap);

      var delBtn = document.createElement('button');
      delBtn.className = 'history-delete-btn';
      delBtn.type = 'button';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', function () {
        if (!confirm('Delete this saved game?')) return;
        history = history.filter(function (h) { return h.id !== entry.id; });
        saveHistory();
        renderHistory();
      });
      card.appendChild(delBtn);

      historyListEl.appendChild(card);
    });
  }

  // ---------- event wiring ----------
  gameNameInput.addEventListener('input', function () {
    state.gameName = gameNameInput.value;
    saveSession();
  });

  addPlayerBtn.addEventListener('click', addPlayer);
  roundPlusBtn.addEventListener('click', roundPlus);
  roundMinusBtn.addEventListener('click', roundMinus);

  drawerTab.addEventListener('click', function () {
    if (drawer.classList.contains('open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });
  drawerOverlay.addEventListener('click', closeDrawer);
  clearBtn.addEventListener('click', doClear);
  saveBtn.addEventListener('click', doSave);
  historyBtn.addEventListener('click', openHistoryPanel);
  viewBtn.addEventListener('click', doToggleView);

  historyOverlay.addEventListener('click', closeHistoryPanel);
  historyCloseBtn.addEventListener('click', closeHistoryPanel);

  render();
})();
