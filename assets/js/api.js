/* =========================================================
   assets/js/api.js  —  효원다회 데이터 계층
   사용 전제 : supabase-js@2  →  config.js  →  api.js  순서로 로드
   ========================================================= */
(function (global) {
  'use strict';

  const cfg = global.HW_CONFIG;
  if (!cfg) { console.error('[HW] config.js 가 먼저 로드되어야 합니다.'); return; }
  if (cfg.SUPABASE_URL.includes('여기에')) {
    console.error('[HW] config.js 에 Supabase URL / anon key 를 아직 안 넣으셨습니다.');
  }

  const sb = global.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  const cache = {};

  /* ---------- 내부 헬퍼 ---------- */
  function ok(res) {
    if (res.error) throw new Error(res.error.message || '요청에 실패했습니다');
    return res.data;
  }
  function flattenTea(t) {
    t.cats = (t.tea_categories || []).map(x => x.categories).filter(Boolean);
    t.catNames = t.cats.map(c => c.name);
    delete t.tea_categories;
    return t;
  }

  const api = {
    sb,

    /* =====================================================
       A. 사이트 공통 값 (40년 → 41년 등)
       ===================================================== */
    async values(force) {
      if (cache.sv && !force) return cache.sv;
      const rows = ok(await sb.from('site_values').select('key,value'));
      const map = {};
      rows.forEach(r => { map[r.key] = r.value; });
      cache.sv = map;
      return map;
    },
        // 관리자 화면용 : 그룹·라벨·힌트까지 전부
    async valuesFull() {
      return ok(await sb.from('site_values').select('*')
        .order('group_name', { ascending: true })
        .order('key',        { ascending: true }));
    },
    async setValue(key, value) {
      cache.sv = null;
      const rows = ok(await sb.from('site_values').update({ value }).eq('key', key).select('key'));
      if (!rows.length) throw new Error('저장되지 않았습니다 (권한 또는 없는 키: ' + key + ')');
      return rows;
    },

    /* =====================================================
       B. 소개글 · 연혁 · 회칙 · 집행부 · 일정
       ===================================================== */
    async intro(pageKey, includeHidden) {
      let q = sb.from('intro_sections').select('*').eq('page_key', pageKey);
      if (!includeHidden) q = q.eq('is_visible', true);
      return ok(await q.order('sort_order', { ascending: true }));
    },
    async history() {
      return ok(await sb.from('history').select('*')
        .order('sort_order', { ascending: true })
        .order('year', { ascending: true }));
    },
    async rules() {
      return ok(await sb.from('rules').select('*').order('sort_order', { ascending: true }));
    },

    async schedules(fromDate, toDate) {
      let q = sb.from('schedules').select('*');
      if (fromDate) q = q.gte('date', fromDate);
      if (toDate)   q = q.lte('date', toDate);
      return ok(await q.order('date', { ascending: true })
                       .order('start_time', { ascending: true, nullsFirst: true }));
    },

    /* =====================================================
       C. 茶書 — 차 도감 / 지도 / 다구 / 이야기
       ===================================================== */

    async teas() {
      const rows = ok(await sb.from('teas')
        .select('*, tea_categories( categories ( id, name, display_order ) )')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }));
      return rows.map(flattenTea);
    },
    // 차 저장 : 카테고리까지 한 번에 (RPC)
    async saveTea(tea, catNames) {
      return ok(await sb.rpc('save_tea', { p_tea: tea, p_cats: catNames || [] }));
    },
    async teaMap() {
      return ok(await sb.from('tea_map').select('*')
        .order('sort_order', { ascending: true }));
    },
    async teaWare() {
      return ok(await sb.from('tea_ware').select('*')
        .order('display_order', { ascending: true }));
    },

    /* =====================================================
       D. 학술지
       ===================================================== */
    async series() {
      return ok(await sb.from('journal_series').select('*')
        .eq('is_active', true).order('sort_order', { ascending: true }));
    },
    async issues(seriesId) {
      let q = sb.from('journal_issues').select('*');
      if (seriesId) q = q.eq('series_id', seriesId);
      return ok(await q.order('issue_no', { ascending: false }));
    },
        // 공개된 글 목록. opts = { seriesId, issueId, limit }
    async posts(opts) {
      const o = opts || {};
      let q = sb.from('journal_public').select(
        'id,series_id,issue_id,kind,title,author,image_url,views,sort_order,' +
        'published_at,created_at,series_slug,series_name,issue_no,issue_title');
      if (o.seriesId) q = q.eq('series_id', o.seriesId);
      if (o.issueId)  q = q.eq('issue_id',  o.issueId);
      if (o.kind)     q = q.eq('kind',      o.kind);
      q = q.order('sort_order',   { ascending: true })
           .order('published_at', { ascending: false, nullsFirst: false })
           .order('created_at',   { ascending: false });
      if (o.limit) q = q.limit(o.limit);
      return ok(await q);
    },

    // 집행부 전용 : 심사 대기 / 전체
    async postsByStatus(status) {
      return ok(await sb.from('journal_posts').select('*')
        .eq('status', status).order('created_at', { ascending: false }));
    },

    /* --- 투고 (누구나) --- */
    async submitPost(p) {
      return ok(await sb.rpc('submit_post', {
        p_series: p.seriesId || null, p_kind: p.kind || 'article',
        p_author: p.author, p_contact: p.contact || null,
        p_title: p.title, p_body: p.body,
        p_image: p.imageUrl || null, p_pw: p.pw
      }));
    },
    async myPosts(author, pw) {
      return ok(await sb.rpc('my_posts', { p_author: author, p_pw: pw }));
    },
    async editMyPost(id, pw, title, body) {
      return ok(await sb.rpc('edit_my_post', {
        p_id: id, p_pw: pw, p_title: title, p_body: body }));
    },
    async withdrawMyPost(id, pw) {
      return ok(await sb.rpc('withdraw_my_post', { p_id: id, p_pw: pw }));
    },
    /* --- 집행부 심사 --- */
    async publishPost(id)        { return ok(await sb.rpc('publish_post', { p_id: id })); },
    async assignIssue(ids, isId) { return ok(await sb.rpc('assign_issue', { p_ids: ids, p_issue: isId })); },
    async rejectPost(id, memo) {
      let r = await sb.from('journal_posts')
        .update({ status: 'rejected', reject_memo: memo }).eq('id', id).select();
      if (r.error && /reject_memo/i.test(r.error.message || '')) {
        r = await sb.from('journal_posts')
          .update({ status: 'rejected' }).eq('id', id).select();
      }
      return ok(r);
    },
    /* --- 댓글 --- */

    async addComment(postId, nick, body, pw) {
      return ok(await sb.rpc('add_comment', {
        p_post: postId, p_nick: nick || '', p_body: body, p_pw: pw || '' }));
    },
    async deleteComment(id, pw) {
      return ok(await sb.rpc('delete_comment', { p_id: id, p_pw: pw || '' }));
    },
    async hideComment(id, hide) {
      return ok(await sb.from('journal_comments')
        .update({ is_hidden: !!hide }).eq('id', id).select());
    },
    /* =====================================================
       E. 집행부 공통 CRUD
       ===================================================== */
    async save(table, payload) {
      const row = Object.assign({}, payload);
      let rows;
      if (row.id) {
        const id = row.id; delete row.id;
        rows = ok(await sb.from(table).update(row).eq('id', id).select());
      } else {
        delete row.id;
        rows = ok(await sb.from(table).insert(row).select());
      }
      if (!rows.length) throw new Error('저장되지 않았습니다. 집행부 권한을 확인해 주세요.');
      return rows;
    },
    async remove(table, id) {
      const rows = ok(await sb.from(table).delete().eq('id', id).select('id'));
      if (!rows.length) throw new Error('삭제되지 않았습니다. 집행부 권한을 확인해 주세요.');
      return rows;
    },

    /* =====================================================
       F. 인증 · 파일 업로드 · 복원
       ===================================================== */
    async session()  { return (await sb.auth.getSession()).data.session; },
    async isAdmin()  {
      const r = await sb.rpc('is_admin');
      return !r.error && r.data === true;
    },
    async login(idOrEmail, pw) {
      // 계정이 하나뿐이므로 config 값을 우선 사용합니다
      const email = cfg.ADMIN_EMAIL
        || (idOrEmail.includes('@') ? idOrEmail.trim()
                                    : idOrEmail.trim() + '@' + cfg.ADMIN_DOMAIN);
      const res = await sb.auth.signInWithPassword({ email, password: pw });
      if (res.error) throw new Error('비밀번호를 확인해 주세요');
      if (!(await api.isAdmin())) {
        await sb.auth.signOut();
        throw new Error('집행부 계정이 아닙니다');
      }
      return res.data;
    },
    
    async logout() { await sb.auth.signOut(); },

    async upload(file, folder) {
      if (!file) throw new Error('파일이 없습니다');
      if (file.size > 20 * 1024 * 1024) throw new Error('20MB 이하 파일만 올릴 수 있습니다');
      const ext  = (file.name.split('.').pop() || 'bin').toLowerCase();
      const path = (folder || 'uploads') + '/' +
                   Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext;
      const up = await sb.storage.from(cfg.BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (up.error) throw new Error('업로드 실패: ' + up.error.message);
      return sb.storage.from(cfg.BUCKET).getPublicUrl(path).data.publicUrl;
    },

    async auditLog(limit) {
      return ok(await sb.from('audit_log').select('*')
        .order('created_at', { ascending: false }).limit(limit || 100));
    },

    async restore(logId) { return ok(await sb.rpc('restore_row', { p_log_id: logId })); }
  };

  global.HW = global.HW || {};
  global.HW.api = api;
  global.HW.sb  = sb;
})(window);