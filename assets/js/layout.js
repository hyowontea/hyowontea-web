/* =========================================================
   assets/js/layout.js — 헤더·드로어·푸터·공지팝업 공통  v4-wide
   <div id="hw-header"></div> / <div id="hw-footer"></div> 만 두면 됩니다.
   <body data-page="index"> 로 현재 메뉴를 표시합니다.

   v4 변경점 (A-2)
   ★ 공지 팝업(popups 테이블) 렌더러를 추가했습니다.
     집행부 화면에는 팝업 등록 UI가 완비되어 있었지만, 실제로 사이트에
     띄우는 코드가 어디에도 없어 등록해도 아무 일이 일어나지 않았습니다.
     layout.js 는 모든 공개 페이지가 로드하므로 여기에 둡니다.
     (admin.html 은 layout.js 를 로드하지 않으므로 영향 없습니다)
   ========================================================= */
(function (global) {
  'use strict';
  const esc = global.HW.esc;
  const A   = global.HW.escAttr || esc;

  const MENU = [
    { key:'about', label:'소개', href:'about.html', children:[
        { label:'동아리 소개',    href:'about.html' },
        { label:'연혁',           href:'about.html#history' },
        { label:'회칙',           href:'about.html#rules' } ] },
    { key:'schedule', label:'일정', href:'schedule.html' },
    { key:'dasho', label:'茶書', sub:'다서', href:'dasho.html', children:[
        { label:'차 도감',     href:'tea.html' },
        { label:'차 지도',     href:'tea-map.html' },
        { label:'다구 사용법', href:'tea-ware.html' } ] },
    { key:'journal', label:'이야기', sub:'茶談', href:'tea-story.html', children:[
        { label:'차마을',       href:'journal.html?series=chamaeul' },
        { label:'다바라기',     href:'journal.html?series=dabaragi' },
        { label:'글 투고하기',  href:'submit.html' },
        { label:'내 투고 확인', href:'my-post.html' } ] },
    { key:'admin', label:'집행부', href:'admin.html', cta:true }
  ];

  function navHtml(cur){
    return MENU.map(m => {
      const act  = m.key === cur ? ' active' : '';
      const sub  = m.sub ? `<span class="sub-hangul">${esc(m.sub)}</span>` : '';
      const drop = m.children
        ? `<ul class="dropdown-menu${m.key === 'journal' ? ' hw-story' : ''}">${m.children.map(c =>
            `<li><a href="${esc(c.href)}">${esc(c.label)}</a></li>`).join('')}</ul>`
        : '';
      return `<li${m.cta ? ' class="nav-cta"' : ''}>`
           + `<a href="${esc(m.href)}" class="${act.trim()}">${esc(m.label)}${sub}</a>`
           + `${drop}</li>`;
    }).join('');
  }

  function drawerHtml(){
    return MENU.map(m => {
      const sub  = m.sub ? `<span class="sub-hangul">${esc(m.sub)}</span>` : '';
      const kids = m.children
        ? `<ul class="drawer-sub${m.key === 'journal' ? ' hw-story' : ''}">${m.children.map(c =>
            `<li><a href="${esc(c.href)}">${esc(c.label)}</a></li>`).join('')}</ul>`
        : '';
      return `<li><a href="${esc(m.href)}">${esc(m.label)}${sub}</a>${kids}</li>`;
    }).join('');
  }

  function brandHtml(){
    return `
      <a href="index.html" class="brand-logo">
        <img src="assets/img/logo-ivory.png" class="brand-mark" alt="" aria-hidden="true"
             onerror="this.remove()">
        <span class="brand-text">
          <b>曉原茶會</b>
          <i>HYOWON TEA SOCIETY</i>
        </span>
      </a>`;
  }

  function render(){
    const cur = document.body.dataset.page || '';

    const h = document.getElementById('hw-header');
    if (h) {
      h.outerHTML = `
      <header class="hw-header">
        ${brandHtml()}
        <nav><ul>${navHtml(cur)}</ul></nav>
        <button class="hamburger-btn" onclick="HW.drawer()" aria-label="메뉴 열기">
          <span></span><span></span><span></span>
        </button>
      </header>
      <div id="drawerOverlay" class="drawer-overlay" onclick="HW.drawer()"></div>
      <aside id="mobileDrawer" class="mobile-drawer">
        <div class="drawer-header">
          <span class="drawer-title">曉原茶會</span>
          <button class="drawer-close-btn" onclick="HW.drawer()" aria-label="메뉴 닫기">&times;</button>
        </div>
        <ul class="drawer-nav">${drawerHtml()}</ul>
        <div class="drawer-foot">
          <span data-sv="club.room">부산대학교</span>
          <span data-sv="contact.email">효원다회</span>
        </div>
      </aside>`;
    }

    const f = document.getElementById('hw-footer');
    if (f) {
      f.outerHTML = `
      <footer class="hw-footer">
        <div class="footer-container">
          <div class="footer-info">
            <h3>曉原茶會</h3>
            <p>차(茶)를 마시는 사람들(茶人)의 모임<br>
               부산대학교 동아리연합회 학술이념분과<br>
               <span data-sv="club.room">동아리방 안내</span></p>
          </div>
          <div class="footer-links">
            <a data-sv-attr="href:contact.insta" href="#" target="_blank" rel="noopener">INSTAGRAM</a>
            <a data-sv-attr="href:contact.email" href="#"><span data-sv="contact.email">E-MAIL</span></a>
            <a href="submit.html">SUBMIT</a>
            <a href="admin.html">EXECUTIVE</a>
          </div>
        </div>
        <div class="footer-bottom">
          &copy; 2026 HYOWON TEA SOCIETY &nbsp;·&nbsp; ALL RIGHTS RESERVED
        </div>
      </footer>`;
    }
  }

  function fixMail(){
    document.querySelectorAll('[data-sv-attr*="contact.email"]').forEach(el => {
      const v = el.getAttribute('href');
      if (!v || v === '#' || /^(mailto:|https?:)/i.test(v)) return;
      el.setAttribute('href', 'mailto:' + v);
    });
  }

  /* =========================================================
     ★★ A-2 : 공지 팝업 ★★
     - popups.is_active = true 인 것 중
       start_at / end_at 범위에 오늘이 들어오는 것만 띄웁니다.
     - '오늘 하루 보지 않기' 는 팝업 1개 단위로 기억합니다.
     - popups 테이블이 없거나 권한이 없으면 조용히 넘어갑니다.
     ========================================================= */
  const POP_KEY = id => 'hw-pop-skip-' + id;
  const dOnly   = v => v ? String(v).slice(0,10) : '';

  function popStyle(){
    if (document.getElementById('hw-pop-style')) return;
    const st = document.createElement('style');
    st.id = 'hw-pop-style';
    st.textContent = `
      #hw-pop-layer{position:fixed;inset:0;z-index:900;pointer-events:none}
      .hw-pop{position:absolute;pointer-events:auto;width:min(360px,calc(100vw - 32px));
        background:var(--cream,#f2eee3);border:1px solid var(--line-2,#c9c2ae);
        border-top:2px solid var(--jade,#1e3028);
        box-shadow:0 18px 44px rgba(22,37,30,.22);
        display:flex;flex-direction:column;max-height:84vh;
        opacity:0;--hw-dx:0px;--hw-dy:0px;
        transform:translate(var(--hw-dx),calc(var(--hw-dy) + 10px));
        transition:opacity .28s,transform .28s,box-shadow .28s}
      .hw-pop.in{opacity:1;transform:translate(var(--hw-dx),var(--hw-dy))}

      /* ★ 뒤에 깔린 공지 — 제목을 흐리게 해 앞뒤를 구분합니다 */
      .hw-pop.behind{cursor:pointer;box-shadow:0 12px 30px rgba(22,37,30,.16)}
      .hw-pop.behind .hw-pop-hd b{color:var(--sumi,#5a6158)}
      .hw-pop.behind:hover{box-shadow:0 16px 38px rgba(22,37,30,.24)}
      .hw-pop-n{flex:none;font-size:.68rem;letter-spacing:.12em;
        color:var(--sumi,#5a6158);white-space:nowrap}
      /* ★ 세 위치 모두 예전 '오른쪽' 과 같은 높이(화면 아래)에 둡니다 */
      .hw-pop-center{left:50%;right:auto;top:auto;bottom:clamp(16px,4vh,48px);
        transform:translate(calc(-50% + var(--hw-dx)),calc(var(--hw-dy) + 10px))}
      .hw-pop-center.in{transform:translate(calc(-50% + var(--hw-dx)),var(--hw-dy))}
      .hw-pop-left{left:clamp(16px,4vw,48px);right:auto;top:auto;
        bottom:clamp(16px,4vh,48px)}
      .hw-pop-right{right:clamp(16px,4vw,48px);left:auto;top:auto;
        bottom:clamp(16px,4vh,48px)}
      .hw-pop-hd{display:flex;justify-content:space-between;align-items:center;gap:10px;
        padding:14px 16px;border-bottom:1px solid var(--line,#ddd7c7)}
              /* ★ 제목줄을 끌어 옮기기 (PC 전용) */
      @media(min-width:769px){
        .hw-pop-hd{cursor:grab;user-select:none;touch-action:none}
        .hw-pop.dragging{transition:none !important;
          box-shadow:0 26px 64px rgba(22,37,30,.36)}
        .hw-pop.dragging .hw-pop-hd{cursor:grabbing}
      }
      .hw-pop-hd b{font-family:var(--serif,serif);font-size:.98rem;font-weight:500;
        color:var(--ink,#1f2622);letter-spacing:.06em;line-height:1.5}
      .hw-pop-x{flex:none;width:30px;height:30px;background:transparent;cursor:pointer;
        border:1px solid var(--line-2,#c9c2ae);color:var(--sumi,#5a6158);
        font-size:1rem;font-family:inherit;line-height:1}
      .hw-pop-x:hover{background:var(--jade,#1e3028);color:var(--ivory,#e9e4d6);
        border-color:var(--jade,#1e3028)}
      .hw-pop-bd{padding:16px;overflow-y:auto}
      .hw-pop-bd img,.hw-pop-bd video{width:100%;display:block;margin-bottom:14px;
        filter:saturate(.88)}
      .hw-pop-bd .hw-embed{margin-bottom:14px}
      .hw-pop-bd p{font-size:.9rem;color:var(--ink-2,#3c443c);line-height:1.95;
        letter-spacing:.02em}
      .hw-pop-go{display:block;margin-top:16px;padding:12px;text-align:center;
        text-decoration:none;font-size:.78rem;letter-spacing:.16em;
        background:var(--jade,#1e3028);color:var(--ivory,#e9e4d6);
        border:1px solid var(--jade,#1e3028);transition:all .25s}
      .hw-pop-go:hover{background:transparent;color:var(--jade,#1e3028)}
      .hw-pop-ft{display:flex;border-top:1px solid var(--line,#ddd7c7)}
      .hw-pop-ft button{flex:1;padding:12px 8px;background:transparent;border:none;
        cursor:pointer;font-family:inherit;font-size:.74rem;letter-spacing:.1em;
        color:var(--sumi,#5a6158);transition:all .2s}
      .hw-pop-ft button+button{border-left:1px solid var(--line,#ddd7c7)}
      .hw-pop-ft button:hover{background:var(--cream-2,#eae5d7);color:var(--ink,#1f2622)}
      @media(max-width:768px){
        .hw-pop,.hw-pop-left,.hw-pop-right,.hw-pop-center{
          left:16px;right:16px;width:auto;top:auto;bottom:16px;
          transform:translate(0,calc(var(--hw-dy) + 10px))}
        .hw-pop.in,.hw-pop-left.in,.hw-pop-right.in,.hw-pop-center.in{
          transform:translate(0,var(--hw-dy))}
      }
      @media (prefers-reduced-motion:reduce){ .hw-pop{transition:none} }`;
    document.head.appendChild(st);
  }

  function popHtml(p){
    const pos = ['center','left','right'].includes(p.position) ? p.position : 'center';
    let media = '';
    if (p.image_url){
      media = global.HW.isEmbeddable(p.image_url)
        ? global.HW.embed(p.image_url, '', '', p.title)
        : global.HW.media(p.image_url, '', '', p.title);
    }
    const link = p.link_url
      ? `<a class="hw-pop-go" href="${A(p.link_url)}"
            ${/^https?:/i.test(p.link_url) ? 'target="_blank" rel="noopener"' : ''}
         >${esc(p.link_label || '자세히 보기')}</a>`
      : '';
    return `<div class="hw-pop hw-pop-${pos}" data-id="${A(p.id)}"
                 role="dialog" aria-label="${A(p.title)}">
      <div class="hw-pop-hd">
        <b>${esc(p.title)}</b>
        <button type="button" class="hw-pop-x" data-act="close" aria-label="닫기">&times;</button>
      </div>
      <div class="hw-pop-bd">
        ${media}
        ${p.body ? `<p>${global.HW.nl2br(p.body)}</p>` : ''}
        ${link}
      </div>
      <div class="hw-pop-ft">
        <button type="button" data-act="today">오늘 하루 보지 않기</button>
        <button type="button" data-act="close">닫기</button>
      </div>
    </div>`;
  }
  /* =========================================================
     ★ 팝업 끌어 옮기기 (PC 전용)
       #hw-pop-layer 가 화면 전체를 덮는 fixed 라서
       안쪽 left/top 값이 곧 화면 좌표가 됩니다.
     ========================================================= */

  const isMobile = () => window.matchMedia('(max-width:768px)').matches;

  /* 화면 밖으로 나가지 않게 가두면서 자리를 고정합니다 */
  function pinPopup(el, left, top){
    const maxL = Math.max(0, window.innerWidth  - el.offsetWidth);
    const maxT = Math.max(0, window.innerHeight - el.offsetHeight);
    el.style.left      = Math.min(Math.max(0, left), maxL) + 'px';
    el.style.top       = Math.min(Math.max(0, top ), maxT) + 'px';
    el.style.right     = 'auto';
    el.style.bottom    = 'auto';
    el.style.margin    = '0';
    el.style.transform = 'none';
  }

  
  function enableDrag(layer){
    if (isMobile()) return;
    let cur = null, dx = 0, dy = 0;

    layer.addEventListener('pointerdown', e => {
      if (e.button) return;                               /* 왼쪽 단추만 */
      const hd = e.target.closest('.hw-pop-hd');
      if (!hd || e.target.closest('button,a')) return;    /* 닫기 단추는 제외 */
      const box = hd.closest('.hw-pop'); if (!box) return;

      const r = box.getBoundingClientRect();
      dx = e.clientX - r.left;
      dy = e.clientY - r.top;
      cur = box;
      box.classList.add('dragging');
      pinPopup(box, r.left, r.top);                       /* 현재 자리를 좌표로 고정 */
      try{ hd.setPointerCapture(e.pointerId); }catch(x){}
      e.preventDefault();
    });

    layer.addEventListener('pointermove', e => {
      if (cur) pinPopup(cur, e.clientX - dx, e.clientY - dy);
    });

    function end(){
      if (!cur) return;
      cur.classList.remove('dragging');
      cur = null;                     /* 자리를 따로 기억해 두지 않습니다 */
    }
    layer.addEventListener('pointerup',     end);
    layer.addEventListener('pointercancel', end);



    /* 창 크기가 줄어도 팝업이 화면 밖에 남지 않게 다시 가둡니다 */
    window.addEventListener('resize', () => {
      layer.querySelectorAll('.hw-pop').forEach(el => {
        if (!el.style.left) return;
        const r = el.getBoundingClientRect();
        pinPopup(el, r.left, r.top);
      });
    });
  }
  /* =========================================================
     ★ 겹친 팝업 계단식 쌓기
       같은 위치에 여러 개면 뒤쪽을 왼쪽 위로 조금씩 물립니다.
     ========================================================= */
  const STACK_STEP = 16;   /* 한 장당 밀어내는 거리(px) — 여기만 고치면 됩니다 */
  const STACK_MAX  = 4;    /* 이 장수까지만 밀고, 그 뒤는 같은 자리에 둡니다 */

  const posOf = el => el.classList.contains('hw-pop-left')  ? 'left'
                    : el.classList.contains('hw-pop-right') ? 'right' : 'center';

  function stackPopups(layer){
    const all    = Array.prototype.slice.call(layer.querySelectorAll('.hw-pop'));
    const narrow = window.matchMedia('(max-width:768px)').matches;

    /* 위치별 전체 장수를 먼저 셉니다 */
    const total = {};
    all.forEach(el => { const p = posOf(el); total[p] = (total[p] || 0) + 1; });

    const seen = {};
    all.forEach(el => {
      const p = posOf(el);
      const i = (seen[p] = (seen[p] || 0) + 1);          /* 1부터 */

      const num = el.querySelector('.hw-pop-n');
      if (num) num.textContent = total[p] > 1 ? `${i} / ${total[p]}` : '';

      if (el.style.transform === 'none') return;         /* 끌어서 옮긴 것은 건드리지 않습니다 */

      const n = Math.min(i - 1, STACK_MAX);
      const d = n * STACK_STEP;
      el.style.setProperty('--hw-dx', narrow ? '0px' : (-d) + 'px');
      el.style.setProperty('--hw-dy', narrow ? (-n * 10) + 'px' : (-d) + 'px');
      el.style.zIndex = String(100 - n);                 /* 앞장이 위로 */
      el.classList.toggle('behind', n > 0);
    });
  }

  async function showPopups(){
    if (!global.HW.sb) return;

    const today = global.HW.ymd(new Date());

    let rows = [];
    try{
      const r = await global.HW.sb.from('popups').select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending:true });
      if (r.error) return;                 /* 테이블·권한 문제면 조용히 종료 */
      rows = r.data || [];
    }catch(e){ return; }

    const list = rows.filter(p => {
      const s = dOnly(p.start_at), e = dOnly(p.end_at);
      if (s && s > today) return false;
      if (e && e < today) return false;
      try{ if (localStorage.getItem(POP_KEY(p.id)) === today) return false; }catch(x){}
      return true;
    });
    if (!list.length) return;

    popStyle();

    const layer = document.createElement('div');
    layer.id = 'hw-pop-layer';
    layer.innerHTML = list.map(popHtml).join('');
    document.body.appendChild(layer);

    /* ★ 겹친 팝업을 계단식으로 쌓습니다 */
    stackPopups(layer);
    layer.querySelectorAll('.hw-pop').forEach(el =>
      requestAnimationFrame(() => el.classList.add('in')));

    /* 창 크기가 바뀌면(가로↔세로 전환 포함) 다시 정렬합니다 */
    window.addEventListener('resize', () => {
      if (document.getElementById('hw-pop-layer')) stackPopups(layer);
    });
    /* ★ 끌기 켜기 (PC 전용) — 뜰 때마다 기본 자리에서 시작합니다 */
    enableDrag(layer);

    layer.addEventListener('click', e => {
            /* ★ 뒤에 깔린 공지를 누르면 맨 앞으로 끌어올립니다 */
      const back = e.target.closest('.hw-pop.behind');
      if (back && !e.target.closest('[data-act],a')){
        layer.insertBefore(back, layer.firstChild);
        stackPopups(layer);
        return;
      }

      const b = e.target.closest('[data-act]'); if (!b) return;
      const box = b.closest('.hw-pop'); if (!box) return;
      if (b.dataset.act === 'today'){
        try{ localStorage.setItem(POP_KEY(box.dataset.id), today); }catch(x){}
      }
      box.classList.remove('in');
      setTimeout(() => {
        box.remove();
        if (!layer.querySelector('.hw-pop')) layer.remove();
      }, 280);
    });

    document.addEventListener('keydown', function onEsc(e){
      if (e.key !== 'Escape') return;
      const l = document.getElementById('hw-pop-layer');
      if (!l){ document.removeEventListener('keydown', onEsc); return; }
      l.remove();
      document.removeEventListener('keydown', onEsc);
    });
  }
  /* =========================================================
     ★ 이야기 메뉴에 (차마을 · 다바라기 …) 를 끼워 넣습니다
       집행부 →이야기 종류 에 등록한 순서 그대로 들어갑니다.
     ========================================================= */
  async function fillSeriesMenu(){
    if (!global.HW.api || !global.HW.api.series) return;

    let rows = [];
    try{ rows = await global.HW.api.series(); }catch(e){ return; }
    if (!rows.length) return;

    const items = rows.map(s =>
      `<li><a href="journal.html?series=${encodeURIComponent(s.slug || s.id)}"
        >${esc(s.name)}</a></li>`).join('');

    document.querySelectorAll('.hw-story').forEach(ul => {
      const a  = ul.querySelector('a[href="tea-story.html"]');
      const li = a ? a.closest('li') : null;
      li ? li.insertAdjacentHTML('afterend', items)
         : ul.insertAdjacentHTML('beforeend', items);
    });
  }

  async function boot(){
    render();
    await global.HW.initValues();
    fixMail();
    /* ★ 공지 팝업은 첫 화면(index)에서만 띄웁니다.
       다서·이야기·소개 등 다른 페이지에서는 뜨지 않습니다. */
    if ((document.body.dataset.page || '') === 'index') showPopups();
  }
  if (document.readyState === 'loading')
       document.addEventListener('DOMContentLoaded', boot);
  else boot();

  global.HW.layout = { render, MENU, showPopups };
})(window);