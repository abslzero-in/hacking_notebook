/* Hacking Notebook: static, dependency-free renderer. All knowledge comes from data/library.json. */
(() => {
  'use strict';

  const REPO_URL = 'https://github.com/abslzero-in/hacking_notebook';
  const dom = {
    main: document.getElementById('main'), breadcrumb: document.getElementById('breadcrumb'),
    navLabs: document.getElementById('nav-labs'), navGuides: document.getElementById('nav-guides'),
    topics: document.getElementById('topics-nav'), footer: document.getElementById('footer-status'),
    searchModal: document.getElementById('search-modal'), modalQuery: document.getElementById('modal-query'),
    modalResults: document.getElementById('modal-results'), sidebar: document.getElementById('sidebar'),
    scrim: document.getElementById('mobile-scrim'), theme: document.getElementById('theme-toggle'),
    toast: document.getElementById('toast')
  };
  const state = { labs: [], guides: [], loaded: false, error: null, filters: { query: '', category: 'all', platform: 'all', kind: 'all', sort: 'newest' }, toastTimer: 0 };
  const svg = id => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const esc = val => String(val ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const txt = val => esc(val || '');
  const norm = x => String(x || '').toLocaleLowerCase();
  const unique = values => [...new Set(values.map(v => String(v || '').trim()).filter(Boolean))];
  const niceDate = str => { if (!str) return 'Undated'; const dt = new Date(`${str}T12:00:00`); return Number.isNaN(dt.getTime()) ? str : new Intl.DateTimeFormat('en', {day:'numeric',month:'short',year:'numeric'}).format(dt); };
  const routeTo = (type, id) => `#/${type}/${encodeURIComponent(id)}`;
  const safeLink = url => /^https:\/\//i.test(url || '') ? String(url) : '';
  const entryTitle = e => e.title || e.name || 'Untitled';
  const labPath = e => e.attackPath || e.attack_path || [];
  const reportStatus = e => e.status || 'not specified';
  const guideKind = e => e.kind || 'concept';

  function parseRoute() {
    const raw = (location.hash || '#/overview').replace(/^#\/?/, '');
    const [path, query] = raw.split('?');
    const segments = path.split('/').filter(Boolean);
    return { page: segments[0] || 'overview', id: segments.length > 1 ? decodeURIComponent(segments.slice(1).join('/')) : '', query: new URLSearchParams(query || '') };
  }

  function themeSetup() {
    let preferred;
    try { preferred = localStorage.getItem('notebook-theme'); } catch (_) {}
    const theme = preferred === 'light' || preferred === 'dark' ? preferred : 'dark';
    document.documentElement.dataset.theme = theme;
    dom.theme.innerHTML = svg(theme === 'dark' ? 'sun' : 'moon');
    dom.theme.title = `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;
    dom.theme.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('notebook-theme', next); } catch (_) {}
      dom.theme.innerHTML = svg(next === 'dark' ? 'sun' : 'moon');
      dom.theme.title = `Switch to ${next === 'dark' ? 'light' : 'dark'} theme`;
    });
  }

  function empty(icon, title, subtitle, showRepo = false) {
    return `<div class="empty-state"><span class="empty-symbol">${svg(icon)}</span><h3>${esc(title)}</h3><p>${esc(subtitle)}</p>${showRepo ? `<a class="subtle-link" href="${REPO_URL}" target="_blank" rel="noopener noreferrer">Open repository ${svg('up')}</a>` : ''}</div>`;
  }
  function panelEmpty(icon, title, message) {
    return `<div class="panel-empty"><span class="empty-symbol">${svg(icon)}</span><h3>${esc(title)}</h3><p>${esc(message)}</p></div>`;
  }
  const chip = (label, tone = '') => `<span class="meta-chip ${tone}">${esc(label)}</span>`;
  const list = (arr, cls='line-list') => `<ul class="${cls}">${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const heading = (eyebrow, title, summary) => `<div class="page-heading"><div><span class="eyebrow">${esc(eyebrow)}</span><h1 class="page-title">${esc(title)}</h1><p class="page-subtitle">${esc(summary)}</p></div></div>`;
  const card = (e, type) => {
    const url = routeTo(type === 'lab' ? 'lab' : 'guide', e.id);
    const meta = type === 'lab' ? [e.platform, e.difficulty] : [e.category, guideKind(e)];
    return `<a class="entry-card" href="${url}">${svg('up').replace('<svg ', '<svg class="card-arrow" ')}<div class="entry-top">${meta.filter(Boolean).map((x,i) => chip(x, !i ? 'accent' : '')).join('')}</div><h3>${esc(entryTitle(e))}</h3><p>${esc(e.summary || 'No summary provided.')}</p><div class="entry-bottom"><div class="tag-row">${(e.tags || []).slice(0,3).map(t => `<span class="small-tag">${esc(t)}</span>`).join('')}</div><span class="card-date">${niceDate(e.date)}</span></div></a>`;
  };

  function renderOverview() {
    const labs = state.labs, guides = state.guides;
    const learnedTopics = unique(guides.map(g => g.category));
    const platforms = unique(labs.map(l => l.platform));
    const activity = [...labs.map(l=>({...l,type:'lab'})),...guides.map(g=>({...g,type:'guide'}))].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,5);
    const recentLabs = [...labs].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,3);
    return `<section class="hero"><span class="eyebrow">THE WORKING ARCHIVE / V1.0</span><h1>Document the work.<br><em>Keep the knowledge.</em></h1><p>A personal penetration-testing field manual built from completed labs and explicitly approved learning notes. No filler, no assumed experience.</p><div class="hero-actions"><a href="#/labs" class="primary-link">Lab archive ${svg('arrow')}</a><a href="#/guides" class="subtle-link">Learning guide ${svg('book')}</a></div><span class="hero-meta">STATUS: ${labs.length+guides.length ? 'ACTIVE' : 'AWAITING FIRST ENTRY'}</span></section>
      <section class="stats-grid" aria-label="Notebook statistics"><div class="stat-card">${svg('flask')}<span class="stat-value">${labs.length}</span><span class="stat-name">Documented labs</span></div><div class="stat-card">${svg('book')}<span class="stat-value">${guides.length}</span><span class="stat-name">Guide entries</span></div><div class="stat-card">${svg('layers')}<span class="stat-value">${learnedTopics.length}</span><span class="stat-name">Topics covered</span></div><div class="stat-card">${svg('terminal')}<span class="stat-value">${platforms.length}</span><span class="stat-name">Lab platforms</span></div></section>
      <section class="two-column"><div class="panel"><div class="panel-head"><h3>Recent field reports</h3><a class="section-action" href="#/labs">View all ${svg('arrow')}</a></div>${recentLabs.length ? `<div class="panel-body">${recentLabs.map(e=>`<a href="${routeTo('lab',e.id)}" class="search-result"><span class="search-result-icon">${svg('flask')}</span><span class="search-result-body"><strong>${esc(entryTitle(e))}</strong><small>${esc(e.platform || 'Lab')} · ${niceDate(e.date)}</small></span>${svg('chevron')}</a>`).join('')}</div>` : panelEmpty('file','No reports yet','Lab records will appear only after a report is provided.')}</div>
      <div class="panel"><div class="panel-head"><h3>Learned topics</h3><a class="section-action" href="#/guides">Browse guides ${svg('arrow')}</a></div>${learnedTopics.length ? `<div class="panel-body"><div class="tag-row">${learnedTopics.map(x=>`<a href="#/guides?category=${encodeURIComponent(x)}" class="meta-chip">${esc(x)}</a>`).join('')}</div></div>` : panelEmpty('book','Guide is empty','Categories and techniques appear as you explicitly add them.')}</div></section>
      <div class="section-bar"><h2 class="section-title">Latest additions</h2><span class="section-kicker">LABS & GUIDES</span></div>${activity.length ? `<div class="card-grid">${activity.slice(0,4).map(e=>card(e,e.type)).join('')}</div>` : empty('layers','Ready for the first entry','The structure is in place. No labs, techniques, commands or conclusions have been prefilled.')}`;
  }

  function currentCollection(page) {
    if (page === 'labs') return state.labs;
    if (page === 'tools') return state.guides.filter(g => guideKind(g) === 'tool' || norm(g.category) === 'tools');
    if (page === 'paths') return state.labs.filter(l => labPath(l).length > 0);
    return state.guides;
  }
  function catalogData(page) {
    const isLab = page === 'labs' || page === 'paths';
    const base = currentCollection(page);
    const route = parseRoute();
    if (route.query.has('category') && state.filters.category === 'all') state.filters.category = route.query.get('category') || 'all';
    const categories = unique(base.map(x => x.category)).sort();
    const platforms = unique(base.map(x => x.platform)).sort();
    const kinds = unique(base.map(x => guideKind(x))).sort();
    let items = base.filter(e => {
      const haystack = [entryTitle(e),e.summary,e.platform,e.category,e.kind,e.difficulty,(e.tags||[]).join(' '),e.content,e.report,JSON.stringify(e.attackPath||[]),JSON.stringify(e.findings||[])].join(' ').toLowerCase();
      return (!state.filters.query || haystack.includes(norm(state.filters.query))) &&
        (state.filters.category === 'all' || norm(e.category) === norm(state.filters.category)) &&
        (state.filters.platform === 'all' || norm(e.platform) === norm(state.filters.platform)) &&
        (state.filters.kind === 'all' || norm(guideKind(e)) === norm(state.filters.kind));
    });
    items.sort((a,b) => state.filters.sort === 'az' ? entryTitle(a).localeCompare(entryTitle(b)) : String(b.date||'').localeCompare(String(a.date||'')));
    return {isLab,base,items,categories,platforms,kinds};
  }
  const selectOptions = (opts,selected) => opts.map(o=>`<option value="${esc(o)}" ${o===selected?'selected':''}>${esc(o === 'all' ? 'All' : o)}</option>`).join('');
  function renderCatalog(page) {
    const {isLab,base,items,categories,platforms,kinds} = catalogData(page);
    const titles = {labs:['LAB ARCHIVE','Lab reports','Every completed lab, attack chain and observed finding — recorded from submitted reports.'],guides:['KNOWLEDGE BASE','Learning guide','Concise concepts, tools and workflows added only after they have been learned.'],paths:['ATTACK CHAINS','Attack paths','Multi-step exploitation sequences documented in actual lab reports.'],tools:['TECHNICAL INDEX','Tools & commands','A searchable index of tools and command notes you have explicitly learned.']};
    const [eyebrow,title,description] = titles[page] || titles.guides;
    const filters = `<div class="catalog-tools"><div class="filter-row"><input class="filter-search" data-filter="query" aria-label="Filter entries" value="${esc(state.filters.query)}" placeholder="Filter entries..."><select class="filter-select" data-filter="category" aria-label="Filter category">${selectOptions(['all',...categories],state.filters.category)}</select>${isLab?`<select class="filter-select" data-filter="platform" aria-label="Filter platform">${selectOptions(['all',...platforms],state.filters.platform)}</select>`:`<select class="filter-select" data-filter="kind" aria-label="Filter type">${selectOptions(['all',...kinds],state.filters.kind)}</select>`}<select class="filter-select" data-filter="sort" aria-label="Sort entries"><option value="newest" ${state.filters.sort === 'newest'?'selected':''}>Newest first</option><option value="az" ${state.filters.sort === 'az'?'selected':''}>Name A–Z</option></select></div><span class="filter-count" id="filter-count">${items.length} / ${base.length} ENTRIES</span></div>`;
    const topicCards = !isLab && page === 'guides' && categories.length ? `<div class="section-bar"><h2 class="section-title">Browse by category</h2></div><div class="topics-grid">${categories.map(t=>`<a class="topic-card" href="#/guides?category=${encodeURIComponent(t)}"><span>${esc(t)}</span><b>${base.filter(g=>g.category===t).length}</b></a>`).join('')}</div><div class="section-bar"><h2 class="section-title">All entries</h2></div>` : '';
    return `${heading(eyebrow,title,description)}${base.length ? `${topicCards}${filters}<div id="catalog-results" class="card-grid">${items.map(e=>card(e,isLab?'lab':'guide')).join('') || empty('search','No matching entries','Try a different search or category filter.')}</div>` : empty(isLab?'flask':'book',isLab?'No lab reports yet':'No learning entries yet',isLab?'Submit a lab report when you are ready. Nothing from previous conversations has been imported.':'Only notes explicitly approved for the guide will appear here. No content has been seeded.')}`;
  }

  function renderInline(raw) {
    let s = esc(raw);
    s = s.replace(/`([^`\n]+)`/g,(_m,x)=>`<code>${x}</code>`);
    s = s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
    s = s.replace(/\*([^*\n]+)\*/g,'<em>$1</em>');
    s = s.replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g,(_m,label,url)=>`<a href="${url.replace(/&amp;/g,'&')}" target="_blank" rel="noopener noreferrer">${label}</a>`);
    return s;
  }
  function markdown(md) {
    const lines = String(md || '').replace(/\r\n/g,'\n').split('\n');
    let html='', paragraph=[], activeList='', quote=[];
    const flushPara=()=>{if(paragraph.length){html+=`<p>${renderInline(paragraph.join(' '))}</p>`;paragraph=[];}};
    const flushList=()=>{if(activeList){html+=`</${activeList}>`;activeList='';}};
    const flushQuote=()=>{if(quote.length){html+=`<blockquote>${renderInline(quote.join(' '))}</blockquote>`;quote=[];}};
    for(let i=0;i<lines.length;i++){
      const line=lines[i],trim=line.trim();
      const fence=trim.match(/^```([a-zA-Z0-9_+.-]*)/);
      if(fence){flushPara();flushList();flushQuote();const code=[];while(++i<lines.length&&!lines[i].trim().startsWith('```'))code.push(lines[i]);html+=`<div class="code-wrap"><div class="code-head"><span>${esc(fence[1]||'code')}</span><button class="copy-button" data-copy-code="true" type="button">${svg('copy')} Copy</button></div><pre><code>${esc(code.join('\n'))}</code></pre></div>`;continue;}
      if(!trim){flushPara();flushList();flushQuote();continue;}
      const h=trim.match(/^(#{2,4})\s+(.+)$/);
      if(h){flushPara();flushList();flushQuote();html+=`<h${h[1].length}>${renderInline(h[2])}</h${h[1].length}>`;continue;}
      if(/^---+$/.test(trim)){flushPara();flushList();flushQuote();html+='<hr>';continue;}
      if(/^>\s?/.test(trim)){flushPara();flushList();quote.push(trim.replace(/^>\s?/,''));continue;}
      const bullet=trim.match(/^[-*+]\s+(.+)$/),ordinal=trim.match(/^\d+[.)]\s+(.+)$/);
      if(bullet||ordinal){flushPara();flushQuote();const target=bullet?'ul':'ol';if(activeList!==target){flushList();html+=`<${target}>`;activeList=target;}html+=`<li>${renderInline((bullet||ordinal)[1])}</li>`;continue;}
      flushList();flushQuote();paragraph.push(trim);
    }
    flushPara();flushList();flushQuote();return `<div class="prose">${html}</div>`;
  }

  const section = (id, title, num, content) => content ? `<section class="article-section" id="${id}"><h2><span>${num}</span>${esc(title)}</h2>${content}</section>` : '';
  const labStage = (s,i) => `<li class="path-step"><span class="path-number">${String(i+1).padStart(2,'0')}</span><div><h3>${esc(s.title || s.stage || `Stage ${i+1}`)}</h3><p>${esc(s.detail || s.description || '')}</p></div></li>`;
  const findings = arr => arr.map(f=>`<div class="finding-card"><div class="finding-head"><h3>${esc(f.title || 'Finding')}</h3>${f.severity?chip(f.severity,'warn'):''}</div><dl>${[['Evidence',f.evidence],['Root cause',f.rootCause],['Impact',f.impact],['Remediation',f.remediation],['Validation',f.validation]].filter(([,v])=>v).map(([key,val])=>`<dt>${esc(key)}</dt><dd>${esc(val)}</dd>`).join('')}</dl></div>`).join('');
  function renderLabDetail(e) {
    const sections=[];
    const path=labPath(e);
    if(path.length) sections.push(['attack-path','Attack path',`<ol class="path-steps">${path.map(labStage).join('')}</ol>`]);
    if(e.methodology) sections.push(['methodology','Methodology',markdown(e.methodology)]);
    if(e.recon && e.recon.length) sections.push(['enumeration','Enumeration',e.recon.map(r=>`<div class="finding-card"><div class="finding-head"><h3>${esc(r.title||r.label||'Observation')}</h3></div>${markdown(r.detail||r.notes||'')}${(r.commands||[]).map(c=>`<div class="code-wrap"><div class="code-head"><span>${esc(c.label||'command')}</span><button class="copy-button" data-copy-code="true">${svg('copy')} Copy</button></div><pre><code>${esc(c.code||'')}</code></pre></div>${c.output?`<div class="code-wrap"><div class="code-head"><span>observed output</span><button class="copy-button" data-copy-code="true">${svg('copy')} Copy</button></div><pre><code>${esc(c.output)}</code></pre></div>`:''}`).join('')}</div>`).join('')]);
    if(e.findings && e.findings.length) sections.push(['findings','Verified findings',findings(e.findings)]);
    if(e.learnings && e.learnings.length) sections.push(['learnings','What I learned',list(e.learnings)]);
    if(e.difficulties && e.difficulties.length) sections.push(['difficulties','Gaps & difficulties',list(e.difficulties)]);
    if(e.report) sections.push(['full-report','Full report',markdown(e.report)]);
    if(e.references && e.references.length) sections.push(['references','References',`<div class="guide-links">${e.references.filter(x=>safeLink(x.url)).map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.label||x.url)} ${svg('up')}</a>`).join('')}</div>`]);
    const related=state.guides.filter(g=>(g.sourceLabs||[]).includes(e.id));
    if(related.length) sections.push(['related','Derived guide entries',`<div class="guide-links">${related.map(g=>`<a href="${routeTo('guide',g.id)}">${esc(entryTitle(g))} ${svg('arrow')}</a>`).join('')}</div>`]);
    return `<a href="#/labs" class="back-link">${svg('back')} ALL LAB REPORTS</a><header class="detail-header"><div class="detail-overline">${chip(e.platform||'Lab','accent')}${e.difficulty?chip(e.difficulty):''}${e.category?chip(e.category):''}</div><h1>${esc(entryTitle(e))}</h1><p>${esc(e.summary||'No summary recorded.')}</p><div class="detail-meta"><span>${svg('calendar')}${niceDate(e.date)}</span><span>${svg('shield')}Status: ${esc(reportStatus(e))}</span>${e.independence?`<span>${svg('layers')}Practice: ${esc(e.independence)}</span>`:''}</div></header><div class="detail-layout"><article>${sections.length?sections.map((s,i)=>section(s[0],s[1],String(i+1).padStart(2,'0'),s[2])).join(''):empty('file','Awaiting technical detail','This lab entry has not been populated with technical observations.')}</article><aside class="detail-sidebar"><h3>ON THIS REPORT</h3>${sections.map(s=>`<a href="#${s[0]}" data-scroll="${s[0]}">${esc(s[1])}</a>`).join('')||'<p class="muted">No report sections yet.</p>'}<div class="section-bar"><span class="section-kicker">${esc((e.tags||[]).join(' · '))}</span></div></aside></div>`;
  }
  function renderGuideDetail(e) {
    const sections=[];
    if(e.takeaways && e.takeaways.length) sections.push(['takeaways','Key takeaways',list(e.takeaways)]);
    if(e.content) sections.push(['notes','Technical notes',markdown(e.content)]);
    if(e.examples && e.examples.length) sections.push(['examples','Command examples',e.examples.map(x=>`<div class="code-wrap"><div class="code-head"><span>${esc(x.title||x.language||'example')}</span><button class="copy-button" data-copy-code="true">${svg('copy')} Copy</button></div><pre><code>${esc(x.code||'')}</code></pre></div>${x.explanation?`<p class="muted">${esc(x.explanation)}</p>`:''}`).join('')]);
    if(e.pitfalls && e.pitfalls.length) sections.push(['pitfalls','Pitfalls and limitations',list(e.pitfalls)]);
    const relatedLabs=state.labs.filter(l=>(e.sourceLabs||[]).includes(l.id));
    if(relatedLabs.length) sections.push(['sources','Learned from',`<div class="guide-links">${relatedLabs.map(l=>`<a href="${routeTo('lab',l.id)}">${esc(entryTitle(l))} ${svg('arrow')}</a>`).join('')}</div>`]);
    if(e.references && e.references.length) sections.push(['references','References',`<div class="guide-links">${e.references.filter(x=>safeLink(x.url)).map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.label||x.url)} ${svg('up')}</a>`).join('')}</div>`]);
    return `<a href="#/guides" class="back-link">${svg('back')} ALL GUIDE ENTRIES</a><header class="detail-header"><div class="detail-overline">${chip(e.category||'Guide','accent')}${chip(guideKind(e))}</div><h1>${esc(entryTitle(e))}</h1><p>${esc(e.summary||'No summary provided.')}</p><div class="detail-meta"><span>${svg('calendar')}${niceDate(e.date)}</span>${e.level?`<span>${svg('layers')}${esc(e.level)}</span>`:''}${e.reviewed?`<span>${svg('shield')}Reviewed</span>`:''}</div></header><div class="detail-layout"><article>${sections.length?sections.map((s,i)=>section(s[0],s[1],String(i+1).padStart(2,'0'),s[2])).join(''):empty('book','No guide text yet','The actual notes will appear here when approved.')}</article><aside class="detail-sidebar"><h3>ON THIS GUIDE</h3>${sections.map(s=>`<a href="#${s[0]}" data-scroll="${s[0]}">${esc(s[1])}</a>`).join('')||'<p class="muted">No sections yet.</p>'}<div class="section-bar"><span class="section-kicker">${esc((e.tags||[]).join(' · '))}</span></div></aside></div>`;
  }

  function renderPage() {
    if (state.error) {
      dom.breadcrumb.textContent = 'Data unavailable';
      dom.main.innerHTML = `<section class="error-panel"><span class="eyebrow">DATA ERROR</span><h2>Couldn't load the notebook data</h2><p>${esc(state.error)}. This site needs to be served over HTTP(S), such as via GitHub Pages, or a local development web server.</p><button class="subtle-link" id="retry-loading">Retry loading</button></section>`;
      return;
    }
    if (!state.loaded) {dom.main.innerHTML = panelEmpty('layers','Loading archive','Reading content from the repository.');return;}
    const route=parseRoute(), page=route.page;
    document.querySelectorAll('[data-nav]').forEach(n=>n.classList.toggle('active',n.dataset.nav===page || (page==='lab'&&n.dataset.nav==='labs') || (page==='guide'&&n.dataset.nav==='guides')));
    const crumb={overview:'Overview',labs:'Lab reports',guides:'Learning guide',paths:'Attack paths',tools:'Tools & commands',lab:'Lab report',guide:'Guide entry'};
    dom.breadcrumb.textContent=crumb[page] || 'Not found';
    dom.navLabs.textContent=state.labs.length;
    dom.navGuides.textContent=state.guides.length;
    dom.footer.textContent=`${state.labs.length} LABS / ${state.guides.length} GUIDES`;
    if (page==='overview') dom.main.innerHTML=renderOverview();
    else if(['labs','guides','paths','tools'].includes(page)) dom.main.innerHTML=renderCatalog(page);
    else if(page==='lab' || page==='guide') {
      const e=(page==='lab'?state.labs:state.guides).find(x=>x.id===route.id);
      dom.breadcrumb.textContent=e?entryTitle(e):'Entry not found';
      dom.main.innerHTML=e?(page==='lab'?renderLabDetail(e):renderGuideDetail(e)):empty('search','Entry not found','This record does not exist in the current notebook.');
    } else dom.main.innerHTML=empty('search','Page not found','Choose an area of the notebook from the sidebar.');
    renderTopics();
    document.title=`${dom.breadcrumb.textContent} · Hacking Notebook`;
    dom.main.focus({preventScroll:true});
  }
  function renderTopics() {
    const categories=unique(state.guides.map(g=>g.category)).sort();
    dom.topics.innerHTML=`<p class="nav-heading">LEARNED TOPICS</p>${categories.length?categories.map(c=>`<a class="nav-topic" href="#/guides?category=${encodeURIComponent(c)}"><span>${esc(c)}</span><b>${state.guides.filter(g=>g.category===c).length}</b></a>`).join(''):'<div class="nav-hint">Categories appear as content is added.</div>'}`;
  }
  function applyCatalogFilters() {
    const page=parseRoute().page;
    if(!['labs','guides','paths','tools'].includes(page))return;
    const {isLab,base,items}=catalogData(page);
    const target=document.getElementById('catalog-results');
    if(target)target.innerHTML=items.length?items.map(e=>card(e,isLab?'lab':'guide')).join(''):empty('search','No matching entries','Change your filters or search terms.');
    const count=document.getElementById('filter-count');if(count)count.textContent=`${items.length} / ${base.length} ENTRIES`;
  }
  function resetFilters() {state.filters={query:'',category:'all',platform:'all',kind:'all',sort:'newest'};}
  function openSearch() {dom.searchModal.hidden=false;dom.modalQuery.value='';renderSearchResults();requestAnimationFrame(()=>dom.modalQuery.focus());}
  function closeSearch(){dom.searchModal.hidden=true;document.getElementById('open-search').focus();}
  function searchResults(query) {
    const items=[...state.labs.map(e=>({...e,_type:'lab'})),...state.guides.map(e=>({...e,_type:'guide'}))];
    const term=norm(query).trim();
    return items.filter(e=>!term || [entryTitle(e),e.summary,e.category,e.platform,e.kind,(e.tags||[]).join(' '),e.content,e.report].join(' ').toLowerCase().includes(term)).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,12);
  }
  function renderSearchResults() {
    const items=searchResults(dom.modalQuery.value);
    dom.modalResults.innerHTML=items.length?items.map(e=>`<a class="search-result" href="${routeTo(e._type,e.id)}"><span class="search-result-icon">${svg(e._type==='lab'?'flask':'book')}</span><span class="search-result-body"><strong>${esc(entryTitle(e))}</strong><small>${esc(e._type.toUpperCase())} · ${esc(e.category||e.platform||'Entry')}</small></span>${svg('chevron')}</a>`).join(''):`<div class="modal-empty">${state.labs.length+state.guides.length?'No matching entries.':'No content has been added to the notebook yet.'}</div>`;
  }
  function toast(message){dom.toast.textContent=message;dom.toast.classList.add('show');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>dom.toast.classList.remove('show'),2200);}
  function closeMobile(){dom.sidebar.classList.remove('open');dom.scrim.hidden=true;}
  function events() {
    document.getElementById('open-search').addEventListener('click',openSearch);
    document.getElementById('close-search-backdrop').addEventListener('click',closeSearch);
    dom.modalQuery.addEventListener('input',renderSearchResults);
    dom.modalResults.addEventListener('click',event=>{if(event.target.closest('a'))closeSearch();});
    document.getElementById('mobile-toggle').addEventListener('click',()=>{const open=dom.sidebar.classList.toggle('open');dom.scrim.hidden=!open;});
    dom.scrim.addEventListener('click',closeMobile);
    window.addEventListener('hashchange',()=>{resetFilters();closeMobile();renderPage();window.scrollTo({top:0,behavior:'instant'});});
    document.addEventListener('keydown',event=>{
      const editing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
      if((event.ctrlKey||event.metaKey)&&norm(event.key)==='k'){event.preventDefault();dom.searchModal.hidden?openSearch():closeSearch();}
      else if(event.key==='/'&&!editing&&dom.searchModal.hidden){event.preventDefault();openSearch();}
      else if(event.key==='Escape'&&!dom.searchModal.hidden)closeSearch();
      else if(event.key==='Enter'&&!dom.searchModal.hidden&&document.activeElement===dom.modalQuery){const first=dom.modalResults.querySelector('a');if(first){first.click();closeSearch();}}
    });
    dom.main.addEventListener('input',event=>{if(event.target.dataset.filter){state.filters[event.target.dataset.filter]=event.target.value;applyCatalogFilters();}});
    dom.main.addEventListener('change',event=>{if(event.target.dataset.filter){state.filters[event.target.dataset.filter]=event.target.value;applyCatalogFilters();}});
    dom.main.addEventListener('click',async event=>{
      const copy=event.target.closest('[data-copy-code]');
      if(copy){const code=copy.closest('.code-wrap')?.querySelector('code')?.textContent||'';try{await navigator.clipboard.writeText(code);toast('Copied to clipboard');}catch(_){toast('Copy unavailable in this browser');}}
      const scroll=event.target.closest('[data-scroll]');
      if(scroll){event.preventDefault();document.getElementById(scroll.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'});}
      if(event.target.id==='retry-loading') loadData();
    });
  }
  async function loadData(){
    state.loaded=false;state.error=null;renderPage();
    try{
      const res=await fetch('data/library.json',{cache:'no-store'});
      if(!res.ok)throw new Error(`HTTP ${res.status}`);
      const data=await res.json();
      if(!data||!Array.isArray(data.labs)||!Array.isArray(data.guides))throw new Error('Invalid data/library.json schema');
      const ids=new Set();
      for(const entry of [...data.labs,...data.guides]){
        if(!entry.id || !entry.title)throw new Error('All entries require id and title');
        const key=entry.id;
        if(ids.has(key))throw new Error(`Duplicate id: ${key}`);
        ids.add(key);
      }
      state.labs=data.labs;state.guides=data.guides;state.loaded=true;
    }catch(error){state.error=error.message || 'Unknown loading error';}
    renderPage();
  }
  themeSetup();events();loadData();
})();