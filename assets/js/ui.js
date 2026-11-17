/* =========================================================
   assets/js/ui.js  —  효원다회 화면 공통 도구  v2
   변경점
   ① loading()/empty() 의 하드코딩 #94a3b8 제거 → 디자인 토큰 사용
   ② escAttr() 추가 (HTML 속성 안에 값을 넣을 때 사용)
   ③ pickFile() 의 대상 input 누락 방어
   ④ korDate() / hm() 안전성 보강
   ========================================================= */
(function (global) {
  'use strict';

  /* ---------- 기본 ---------- */
  const qs  = (s, r) => (r || document).querySelector(s);
  const qsa = (s, r) => Array.from((r || document).querySelectorAll(s));

  // XSS 방지 : DB에서 온 글자는 반드시 이걸 거쳐 화면에 넣습니다
  function esc(v) {
    if (v === null || v === undefined) return '';
    return String(v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  // ★ 속성(placeholder, title 등) 전용 — 줄바꿈까지 제거합니다
  function escAttr(v) {
    return esc(v).replace(/\r?\n/g, ' ');
  }
  function nl2br(v) { return esc(v).replace(/\n/g, '<br>'); }

  /* ---------- 미디어 ---------- */
  const VIDEO_EXT = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
  function isVideo(url) {
    if (!url) return false;
    const clean = String(url).split('?')[0].split('#')[0].toLowerCase();
    return VIDEO_EXT.some(e => clean.endsWith(e));
  }
  // 이미지든 영상이든 알아서 올바른 태그로
  function media(url, cls, style, alt) {
    if (!url) return '';
    const c = escAttr(cls || ''), s = escAttr(style || ''), u = escAttr(url);
    return isVideo(url)
      ? `<video src="${u}" class="${c}" style="${s}" autoplay muted loop playsinline></video>`
      : `<img src="${u}" class="${c}" style="${s}" alt="${escAttr(alt || '')}" loading="lazy">`;
  }

  /* ---------- 날짜 ---------- */
  function ymd(d) {
    const x = (d instanceof Date) ? d : new Date(d);
    if (isNaN(x)) return '';
    const p = n => String(n).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
  }
  function korDate(s) {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d)) return esc(s);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  }
  function hm(t) {
    if (!t) return '';
    const s = String(t);
    return /^\d{2}:\d{2}/.test(s) ? s.slice(0, 5) : esc(s);
  }

  /* ---------- site_values 자동 치환 ----------
     <span data-sv="club.years">40</span>
     <a data-sv-attr="href:contact.insta">인스타</a>
     <a data-sv-if="recruit.link">신청하기</a>   ← 값 비면 숨김
  --------------------------------------------- */
  function applyValues(map) {
    if (!map) return;
    qsa('[data-sv]').forEach(el => {
      const v = map[el.dataset.sv];
      if (v !== undefined && v !== null && v !== '') el.textContent = v;
    });
    qsa('[data-sv-attr]').forEach(el => {
      el.dataset.svAttr.split(';').forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s.trim());
        const v = map[key];
        if (attr && v) el.setAttribute(attr, v);
      });
    });
    qsa('[data-sv-if]').forEach(el => {
      if (!map[el.dataset.svIf]) el.style.display = 'none';
    });
  }
  async function initValues() {
    try { applyValues(await global.HW.api.values()); }
    catch (e) { console.warn('[HW] site_values 로드 실패', e); }
  }

  /* ---------- 모바일 드로어 ---------- */
  function drawer() {
    const d = qs('#mobileDrawer'), o = qs('#drawerOverlay');
    if (!d || !o) return;
    d.classList.toggle('open');
    o.classList.toggle('open');
    document.body.style.overflow = d.classList.contains('open') ? 'hidden' : '';
  }

  /* ---------- 토스트 (alert 대체) ---------- */
  let toastBox;
  function toast(msg, type) {
    if (!toastBox) {
      toastBox = document.createElement('div');
      toastBox.id = 'hw-toast-box';
      toastBox.setAttribute('role', 'status');
      toastBox.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastBox);
      const st = document.createElement('style');
      st.textContent = `
        #hw-toast-box{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);
          z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center;}
        .hw-toast{background:#1e3028;color:#f2eee3;padding:13px 24px;border-radius:0;
          border:1px solid rgba(233,228,214,.35);
          font-size:.9rem;font-weight:500;letter-spacing:.04em;
          box-shadow:0 10px 30px rgba(22,37,30,.28);
          opacity:0;transform:translateY(10px);transition:all .25s;max-width:90vw;}
        .hw-toast.show{opacity:1;transform:translateY(0);}
        .hw-toast.err{background:#6e2320;border-color:rgba(255,224,220,.35);color:#fff3f1;}
        .hw-toast.warn{background:#6b4a16;border-color:rgba(255,240,214,.35);color:#fff6e6;}`;
      document.head.appendChild(st);
    }
    const el = document.createElement('div');
    el.className = 'hw-toast ' + (type || '');
    el.textContent = msg;
    toastBox.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, type === 'err' ? 3800 : 2400);
  }
  const okMsg  = m => toast(m, '');
  const errMsg = e => toast((e && e.message) ? e.message : String(e), 'err');

  /* ---------- 로딩 / 빈 상태 ----------
     ★ 하드코딩 #94a3b8 제거 : 밝은 면·어두운 면 어디서나 읽히도록
       common.css 의 --sumi 토큰을 씁니다. */
  const MSG_STYLE = 'padding:40px;text-align:center;font-size:.88rem;' +
                    'letter-spacing:.04em;color:var(--sumi,#5a6158);grid-column:1/-1;';
  function loading(el, text) {
    if (el) el.innerHTML = `<p style="${MSG_STYLE}">${esc(text || '불러오는 중…')}</p>`;
  }
  function empty(el, text) {
    if (el) el.innerHTML = `<p style="${MSG_STYLE}">${esc(text || '등록된 내용이 없습니다.')}</p>`;
  }

  /* ---------- 파일 업로드 input 연결 ----------
     <input type="file" onchange="HW.pickFile(this,'tea-img','tea')">
  --------------------------------------------- */
  async function pickFile(input, targetId, folder) {
    const f = input && input.files && input.files[0];
    if (!f) return;
    const url = document.getElementById(targetId);
    if (!url) { errMsg(new Error('입력칸을 찾지 못했습니다 (' + targetId + ')')); return; }
    toast('업로드 중입니다…');
    try {
      url.value = await global.HW.api.upload(f, folder);
      okMsg('업로드 완료 — 저장을 눌러주세요');
    } catch (e) { errMsg(e); }
    input.value = '';
  }

  /* ---------- 영상 임베드 (YouTube · Vimeo · 직접 파일) ---------- */
  function ytId(url){
    const s = String(url || '');
    const m = s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
    return m ? m[1] : null;
  }
  function vimeoId(url){
    const m = String(url || '').match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m ? m[1] : null;
  }
  /* 어떤 주소든 알맞은 태그로 돌려줍니다 */
  function embed(url, cls, style, alt){
    if (!url) return '';
    const c = escAttr(cls || ''), s = escAttr(style || '');
    const y = ytId(url);
    if (y) return `<div class="hw-embed ${c}" style="${s}"><iframe
        src="https://www.youtube-nocookie.com/embed/${escAttr(y)}?rel=0"
        title="${escAttr(alt || '영상')}" loading="lazy" allowfullscreen
        allow="accelerometer;autoplay;clipboard-write;encrypted-media;picture-in-picture"
        referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
    const v = vimeoId(url);
    if (v) return `<div class="hw-embed ${c}" style="${s}"><iframe
        src="https://player.vimeo.com/video/${escAttr(v)}" title="${escAttr(alt || '영상')}"
        loading="lazy" allowfullscreen allow="autoplay;picture-in-picture"></iframe></div>`;
    if (isVideo(url)) return `<video src="${escAttr(url)}" class="${c}" style="${s}"
        controls playsinline preload="metadata"></video>`;
    return media(url, cls, style, alt);
  }
  function isEmbeddable(url){ return !!(ytId(url) || vimeoId(url) || isVideo(url)); }

  global.HW = global.HW || {};
  Object.assign(global.HW, {
    qs, qsa, esc, escAttr, nl2br, isVideo, media, embed, isEmbeddable, ytId,
    ymd, korDate, hm,
    applyValues, initValues, drawer,
    toast, okMsg, errMsg, loading, empty, pickFile
  });
})(window);