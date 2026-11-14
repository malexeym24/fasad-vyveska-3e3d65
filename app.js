(function () {
  var D = window.DATA, $ = function (s) { return document.querySelector(s); };
  var GROUPS = D.groups.map(function (g) { return g.id; });
  var state = { bg: 'nikolay', box: 'box_santeh', nm: 'nm_black_k', line: 'cat4_red', guides: false };
  var offsets = {};
  // есть ли такой вариант в группе (убранные варианты из старых ссылок и версий не ломают страницу)
  var ok = function (g, id) { var L = g === 'bg' ? D.bgs : D.groups.filter(function (x) { return x.id === g; })[0].options; return L.some(function (o) { return o.id === id; }); };
  ['bg'].concat(GROUPS).forEach(function (g) { if (!ok(g, state[g])) state[g] = (g === 'bg' ? D.bgs : D.groups.filter(function (x) { return x.id === g; })[0].options)[0].id; });

  // ---- tabs
  function tab(t) {
    document.querySelectorAll('.tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === t); });
    $('#versions').hidden = t !== 'versions'; $('#builder').hidden = t !== 'builder'; writeHash();
  }
  document.querySelectorAll('.tabs button').forEach(function (b) { b.onclick = function () { tab(b.dataset.tab); writeHash(); }; });

  // ---- versions grid
  var grid = $('#grid');
  D.versions.forEach(function (v) {
    var wrap = document.createElement('div');
    wrap.innerHTML = '<figure><img loading="lazy" src="img/' + v.id + '_s.jpg" data-full="img/' + v.id + '.jpg" alt="' + v.id + '">' +
      '<figcaption><b>' + v.id + '. ' + v.title + '</b><span>' + v.desc + '</span></figcaption></figure>' +
      '<div class="cardbar"><button>В конструктор</button></div>';
    var fig = wrap.querySelector('figure'); fig.appendChild(wrap.querySelector('.cardbar'));
    fig.querySelector('.cardbar button').onclick = function () { load(v); tab('builder'); window.scrollTo(0, 0); };
    grid.appendChild(fig);
  });

  // ---- stage
  var stage = $('#stage'), imgs = {};
  var bg = document.createElement('img'); bg.className = 'bgimg'; bg.alt = ''; stage.appendChild(bg);
  ['komfort'].concat(GROUPS).forEach(function (g) { var im = document.createElement('img'); im.alt = ''; stage.appendChild(im); imgs[g] = im; });
  var guides = [];
  [['cx', ''], ['xl', 'half'], ['xr', 'half'], ['fl', 'blk'], ['fr', 'blk']].forEach(function (p) {
    var d = document.createElement('div'); d.className = 'guide ' + p[1]; d.style.left = (D.guides[p[0]] / D.W * 100) + '%'; stage.appendChild(d); guides.push(d);
  });
  function place(im, id) {
    var L = D.layers[id], o = offsets[id] || [0, 0];
    im.src = L.src; im.style.left = ((L.x + o[0]) / D.W * 100) + '%'; im.style.top = ((L.y + o[1]) / D.H * 100) + '%';
    im.style.width = (L.w / D.W * 100) + '%'; im.hidden = false;
  }
  // preload everything so switching is instant
  Object.keys(D.layers).forEach(function (k) { new Image().src = D.layers[k].src; });
  D.bgs.forEach(function (b) { new Image().src = b.src; });

  // ---- controls
  var ctl = $('#ctl'), buttons = {};
  function row(id, label, opts) {
    var r = document.createElement('div'); r.className = 'row';
    r.innerHTML = '<div class="lab">' + label + '</div><div class="opts"></div>';
    opts.forEach(function (o) {
      var b = document.createElement('button'); b.textContent = o.label;
      b.onclick = function () { state[id] = o.id; render(); };
      r.querySelector('.opts').appendChild(b); (buttons[id] = buttons[id] || []).push([o.id, b]);
    });
    ctl.appendChild(r);
  }
  if (D.bgs.length > 1) row('bg', 'Фон', D.bgs);  // один фон - строки выбора нет
  D.groups.forEach(function (g) { if (g.options.length > 1) row(g.id, g.label, g.options); });  // группа с одним вариантом (КОМФОРТ) - без строки выбора
  row('guides', 'Проверка симметрии', [{ id: false, label: 'Без линий' }, { id: true, label: 'Показать центр фасада и центры половин' }]);

  function render() {
    var b = D.bgs.filter(function (x) { return x.id === state.bg; })[0] || D.bgs[0]; bg.src = b.src;
    place(imgs.komfort, 'komfort');
    var covered = D.covers.indexOf(state.nm) >= 0;
    GROUPS.forEach(function (g) {
      var id = state[g];
      if (!id || id === 'none' || (g === 'line' && covered)) { imgs[g].hidden = true; return; }
      place(imgs[g], id);
    });
    $('#covernote').hidden = !covered;
    guides.forEach(function (d) { d.hidden = !state.guides; });
    Object.keys(buttons).forEach(function (k) {
      buttons[k].forEach(function (p) { p[1].classList.toggle('on', p[0] === state[k]); if (k === 'line') p[1].disabled = covered; });
    });
    $('#code').textContent = code();
    writeHash();
  }
  function label(g, id) {
    var grp = g === 'bg' ? D.bgs : D.groups.filter(function (x) { return x.id === g; })[0].options;
    var o = grp.filter(function (x) { return x.id === id; })[0]; return o ? o.label : id;
  }
  function code() {
    return (D.bgs.length > 1 ? 'фон: ' + label('bg', state.bg) + ' | ' : '') + D.groups.filter(function (g) { return g.options.length > 1; }).map(function (g) { return g.label + ': ' + label(g.id, state[g.id]); }).join(' | ') +
      '  [' + [state.bg, state.box, state.nm, state.line].join('.') + ']';
  }
  function load(v) { ['bg', 'box', 'nm', 'line'].forEach(function (g) { if (ok(g, v[g])) state[g] = v[g]; }); offsets = v.offsets || {}; render(); }
  function writeHash() {
    var t = $('#builder').hidden ? 'versions' : 'builder';
    try { history.replaceState(null, '', '#' + t + (t === 'builder' ? '=' + [state.bg, state.box, state.nm, state.line].join('.') : '')); } catch (e) {}
  }
  $('#copy').onclick = function () {
    var t = $('#code').textContent;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { $('#copy').textContent = 'Скопировано'; },
      function () { var r = document.createRange(); r.selectNodeContents($('#code')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); $('#copy').textContent = 'Выделено, нажмите Cmd+C'; });
    setTimeout(function () { $('#copy').textContent = 'Скопировать'; }, 2500);
  };
  $('#upd').textContent = D.updated;

  // ---- start from hash
  var h = decodeURIComponent(location.hash.slice(1));
  if (h.indexOf('builder') === 0) {
    var p = (h.split('=')[1] || '').split('.');
    if (p.length === 4) { ['bg', 'box', 'nm', 'line'].forEach(function (g, i) { if (ok(g, p[i])) state[g] = p[i]; }); }
    render(); tab('builder');
  } else { render(); tab('versions'); }
})();
