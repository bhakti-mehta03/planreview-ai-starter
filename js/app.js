/* ============================================================
   PlanReview AI — starter application (no build step)
   ------------------------------------------------------------
   Vanilla JavaScript, hash routing, localStorage persistence.
   Everything is demo data: there is no server and no account.
   See README.md for the tour and for what is not built yet.
   ============================================================ */

(function () {
  'use strict';

  /* =========================================================
     1. Small helpers
     ========================================================= */
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const modalRoot = document.getElementById('modal-root');

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = (p) => (p || 'id') + '_' + Math.random().toString(36).slice(2, 9);
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const nowISO = () => new Date().toISOString();
  const HOUR = 3600000;
  const DAY = 24 * HOUR;
  const isoAgo = (ms) => new Date(Date.now() - ms).toISOString();
  const isoIn = (ms) => new Date(Date.now() + ms).toISOString();

  const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtDateTime = (iso) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  function relTime(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const abs = Math.abs(diff);
    const future = diff < 0;
    let text;
    if (abs < 60000) text = 'just now';
    else if (abs < HOUR) text = Math.round(abs / 60000) + ' min';
    else if (abs < DAY) text = Math.round(abs / HOUR) + ' h';
    else if (abs < 30 * DAY) text = Math.round(abs / DAY) + ' d';
    else text = Math.round(abs / (30 * DAY)) + ' mo';
    if (text === 'just now') return text;
    return future ? 'in ' + text : text + ' ago';
  }

  function initials(name) {
    return String(name).trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 99999989;
    return h.toString(16).padStart(8, '0');
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) { /* fall through to the manual method below */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) {
      return false;
    }
  }

  /* =========================================================
     2. Icons (inline, no icon font)
     ========================================================= */
  const ICON = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
    sparkles: '<path d="M12 3v4M12 17v4M4.5 12h4M15.5 12h4M6.7 6.7l2.8 2.8M14.5 14.5l2.8 2.8M17.3 6.7l-2.8 2.8M9.5 14.5l-2.8 2.8"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 4v10"/><path d="m8 11 4 4 4-4"/><path d="M4 19h16"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>',
    upload: '<path d="M12 20V9"/><path d="m8 12 4-4 4 4"/><path d="M4 4h16"/>',
    chevronLeft: '<path d="m14 6-6 6 6 6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    zoomIn: '<circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6"/><path d="m20 20-3.5-3.5"/>',
    zoomOut: '<circle cx="11" cy="11" r="7"/><path d="M8 11h6"/><path d="m20 20-3.5-3.5"/>',
    pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    hand: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12"/><path d="M11 12V5.5a1.5 1.5 0 0 1 3 0V12"/><path d="M14 12V7.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6H9.5a5 5 0 0 1-4-2L3 15.5a1.6 1.6 0 0 1 2.6-1.8L8 16"/>',
    message: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12Z"/>',
    link: '<path d="M10 13a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 0 0-5.7-5.7L11.5 5.8"/><path d="M14 11a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 0 0 5.7 5.7l1.1-1.1"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6.5A2.5 2.5 0 0 0 4 5.5v6A2.5 2.5 0 0 0 6.5 14"/>',
    eye: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
    check: '<path d="m5 13 4.5 4.5L19 7"/>',
    alert: '<path d="M12 4 3 20h18L12 4Z"/><path d="M12 10v4M12 17h.01"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5"/>',
    back: '<path d="M4 12h16"/><path d="m9 7-5 5 5 5"/>',
    shield: '<path d="M12 3 5 6v6c0 4.4 3 7.7 7 9 4-1.3 7-4.6 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    dots: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>'
  };

  function icon(name, cls) {
    return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICON[name] || '') + '</svg>';
  }

  /* =========================================================
     3. Demo data
     ========================================================= */
  const TEAM = { name: 'Aarav Mehta', role: 'Studio owner', studio: 'Mehta Studio' };

  function seedData() {
    const projects = [
      {
        id: 'p_skyline',
        name: 'Skyline Residency',
        client: 'Ravi Mehta',
        company: 'Mehta Constructions',
        phone: '+91 98200 11223',
        email: 'ravi@mehtaconst.com',
        type: 'Residential',
        updatedAt: isoAgo(3 * HOUR),
        activity: [
          { at: isoAgo(3 * HOUR), who: 'Ravi Mehta', what: 'requested changes on Ground Floor Plan, Revision 02' },
          { at: isoAgo(9 * HOUR), who: 'Aarav Mehta', what: 'shared Ground Floor Plan with the client' },
          { at: isoAgo(2 * DAY), who: 'Aarav Mehta', what: 'uploaded Revision 02 of Ground Floor Plan' }
        ],
        drawings: [
          {
            id: 'd_gf',
            name: 'Ground Floor Plan',
            sheet: 'A-101',
            scale: '1:100',
            updatedAt: isoAgo(3 * HOUR),
            share: { token: 'skyline-gf-7f3a', expiry: isoIn(5 * DAY), allowComments: true, allowApproval: true, allowDownload: true, revoked: false, createdAt: isoAgo(9 * HOUR) },
            versions: [
              { n: 1, at: isoAgo(9 * DAY), by: 'Aarav Mehta', note: 'First issue for client review', size: '1.8 MB' },
              { n: 2, at: isoAgo(2 * DAY), by: 'Aarav Mehta', note: 'Kitchen window widened, store repositioned', size: '2.1 MB' }
            ],
            decision: { status: 'changes', by: 'Ravi Mehta', at: isoAgo(3 * HOUR), version: 2, note: 'Kitchen window still looks narrow on the drawing — please check the clear width before we lock the joinery.' },
            comments: [
              { id: 'c1', x: 0.28, y: 0.42, author: 'Ravi Mehta', role: 'client', text: 'Can the living room open fully to the balcony? Sliding door of 2.4 m would work better for us.', status: 'resolved', at: isoAgo(2 * DAY), replies: [{ author: 'Aarav Mehta', role: 'team', text: 'Changed to a 2.4 m sliding door in Revision 02.', at: isoAgo(2 * DAY + 3 * HOUR) }] },
              { id: 'c2', x: 0.14, y: 0.72, author: 'Ravi Mehta', role: 'client', text: 'Kitchen window width — please confirm the clear opening in mm.', status: 'open', at: isoAgo(1 * DAY), replies: [] },
              { id: 'c3', x: 0.62, y: 0.22, author: 'Neha Kulkarni', role: 'team', text: 'Bedroom 1 wardrobe depth shown as 600 mm. Confirm with the carpenter before the next revision.', status: 'open', at: isoAgo(20 * HOUR), replies: [] },
              { id: 'c4', x: 0.86, y: 0.66, author: 'Ravi Mehta', role: 'client', text: 'Balcony railing height to be 1.1 m as discussed.', status: 'resolved', at: isoAgo(3 * DAY), replies: [] }
            ]
          },
          {
            id: 'd_ff',
            name: 'First Floor Plan',
            sheet: 'A-102',
            scale: '1:100',
            updatedAt: isoAgo(6 * HOUR),
            share: { token: 'skyline-ff-2b91', expiry: isoIn(7 * DAY), allowComments: true, allowApproval: true, allowDownload: true, revoked: false, createdAt: isoAgo(6 * HOUR) },
            versions: [{ n: 1, at: isoAgo(6 * HOUR), by: 'Aarav Mehta', note: 'First issue for client review', size: '1.6 MB' }],
            decision: { status: 'pending', by: null, at: null, version: 1, note: '' },
            comments: [
              { id: 'c5', x: 0.44, y: 0.36, author: 'Neha Kulkarni', role: 'team', text: 'Stair headroom is 2.05 m — needs 2.1 m minimum. Adjust before sending.', status: 'open', at: isoAgo(5 * HOUR), replies: [] }
            ]
          }
        ]
      },
      {
        id: 'p_shanti',
        name: 'Shanti Villa Interiors',
        client: 'Anita Shah',
        company: 'Shah Residence',
        phone: '+91 99300 44556',
        email: 'anita.shah@example.com',
        type: 'Interiors',
        updatedAt: isoAgo(1 * DAY),
        activity: [
          { at: isoAgo(1 * DAY), who: 'Anita Shah', what: 'commented on Living Room Layout' },
          { at: isoAgo(2 * DAY), who: 'Aarav Mehta', what: 'shared Living Room Layout with the client' }
        ],
        drawings: [
          {
            id: 'd_lr',
            name: 'Living Room Layout',
            sheet: 'I-201',
            scale: '1:50',
            updatedAt: isoAgo(1 * DAY),
            share: { token: 'shanti-lr-9c4d', expiry: isoIn(4 * DAY), allowComments: true, allowApproval: true, allowDownload: false, revoked: false, createdAt: isoAgo(2 * DAY) },
            versions: [{ n: 1, at: isoAgo(2 * DAY), by: 'Aarav Mehta', note: 'Furniture layout option B', size: '2.4 MB' }],
            decision: { status: 'pending', by: null, at: null, version: 1, note: '' },
            comments: [
              { id: 'c6', x: 0.3, y: 0.3, author: 'Anita Shah', role: 'client', text: 'The sofa feels too deep for this wall — can we look at something slimmer?', status: 'open', at: isoAgo(1 * DAY), replies: [] },
              { id: 'c7', x: 0.7, y: 0.58, author: 'Anita Shah', role: 'client', text: 'Please keep the reading chair near the window.', status: 'open', at: isoAgo(26 * HOUR), replies: [] },
              { id: 'c8', x: 0.52, y: 0.8, author: 'Neha Kulkarni', role: 'team', text: 'Rug size 2.4 x 1.6 m works with the new sofa option.', status: 'open', at: isoAgo(22 * HOUR), replies: [] }
            ]
          }
        ]
      },
      {
        id: 'p_halcyon',
        name: 'Halcyon Offices',
        client: 'Summit Realty',
        company: 'Summit Realty LLP',
        phone: '+91 98110 77889',
        email: 'projects@summitrealty.example',
        type: 'Commercial',
        updatedAt: isoAgo(4 * DAY),
        activity: [{ at: isoAgo(4 * DAY), who: 'Aarav Mehta', what: 'created the project and added Typical Floor Plan' }],
        drawings: [
          {
            id: 'd_typ',
            name: 'Typical Floor Plan',
            sheet: 'C-301',
            scale: '1:200',
            updatedAt: isoAgo(4 * DAY),
            share: null,
            versions: [{ n: 1, at: isoAgo(4 * DAY), by: 'Aarav Mehta', note: 'Working drawing, not shared yet', size: '3.2 MB' }],
            decision: { status: 'pending', by: null, at: null, version: 1, note: '' },
            comments: []
          }
        ]
      },
      {
        id: 'p_palm',
        name: 'Palm Grove Bungalow',
        client: 'Kiran Patel',
        company: 'Patel Family',
        phone: '+91 97400 33221',
        email: 'kiran.patel@example.com',
        type: 'Residential',
        updatedAt: isoAgo(3 * DAY),
        activity: [
          { at: isoAgo(3 * DAY), who: 'Kiran Patel', what: 'approved Site Plan, Revision 02' },
          { at: isoAgo(5 * DAY), who: 'Aarav Mehta', what: 'uploaded Revision 02 of Site Plan' }
        ],
        drawings: [
          {
            id: 'd_site',
            name: 'Site Plan',
            sheet: 'A-001',
            scale: '1:500',
            updatedAt: isoAgo(3 * DAY),
            share: { token: 'palm-site-5e2c', expiry: isoIn(20 * DAY), allowComments: true, allowApproval: true, allowDownload: true, revoked: false, createdAt: isoAgo(6 * DAY) },
            versions: [
              { n: 1, at: isoAgo(9 * DAY), by: 'Aarav Mehta', note: 'First issue', size: '2.0 MB' },
              { n: 2, at: isoAgo(5 * DAY), by: 'Aarav Mehta', note: 'Setback corrected to 3 m on the north side', size: '2.2 MB' }
            ],
            decision: { status: 'approved', by: 'Kiran Patel', at: isoAgo(3 * DAY), version: 2, note: 'Approved. Happy with the setbacks now.', fingerprint: 'ac41f7e2' },
            comments: [
              { id: 'c9', x: 0.4, y: 0.46, author: 'Kiran Patel', role: 'client', text: 'North setback must be 3 m for the driveway.', status: 'resolved', at: isoAgo(8 * DAY), replies: [{ author: 'Aarav Mehta', role: 'team', text: 'Corrected in Revision 02.', at: isoAgo(5 * DAY) }] }
            ]
          }
        ]
      }
    ];
    return { projects, startedAt: nowISO() };
  }

  /* =========================================================
     4. State and persistence
     ========================================================= */
  const STORE_KEY = 'planreview.ai.starter.v1';

  const state = {
    data: null,
    route: { name: 'dashboard' },
    search: '',
    ui: {
      tab: 'drawings',
      selectedComment: null,
      placeMode: false,
      pendingPin: null,
      replyTo: null,
      zoom: 1,
      panX: 0,
      panY: 0,
      commentFilter: 'all',
      insightProject: 'p_skyline'
    }
  };

  function loadData() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.projects)) return parsed;
      }
    } catch (e) { /* corrupt storage: fall back to seed */ }
    const fresh = seedData();
    persist(fresh);
    return fresh;
  }

  function persist(data) {
    try {
      const copy = JSON.parse(JSON.stringify(data || state.data));
      // Object URLs for uploaded previews cannot survive a reload.
      copy.projects.forEach((p) => p.drawings.forEach((d) => d.versions.forEach((v) => { if (v.image && v.image.indexOf('blob:') === 0) delete v.image; })));
      localStorage.setItem(STORE_KEY, JSON.stringify(copy));
    } catch (e) {
      toast('Could not save locally — the demo data stays in memory for this session.');
    }
  }

  function save() { persist(state.data); }

  function resetDemo() {
    localStorage.removeItem(STORE_KEY);
    state.data = seedData();
    save();
    closeModal();
    toast('Demo data reset.');
    render();
  }

  /* =========================================================
     5. Derived helpers
     ========================================================= */
  function getProject(id) { return state.data.projects.find((p) => p.id === id); }

  function getDrawing(project, id) { return project && project.drawings.find((d) => d.id === id); }

  function openComments(drawing) { return drawing.comments.filter((c) => c.status === 'open'); }

  function drawingStatus(drawing) {
    if (drawing.decision && drawing.decision.status === 'approved') return { key: 'approved', label: 'Approved', cls: 'green' };
    if (drawing.decision && drawing.decision.status === 'changes') return { key: 'changes', label: 'Changes requested', cls: 'red' };
    if (!drawing.share || drawing.share.revoked) return { key: 'draft', label: 'Draft', cls: 'grey' };
    if (openComments(drawing).length) return { key: 'review', label: 'In review', cls: 'blue' };
    return { key: 'shared', label: 'Shared', cls: 'amber' };
  }

  function projectStatus(project) {
    const all = project.drawings.map(drawingStatus);
    if (all.some((s) => s.key === 'changes')) return { key: 'changes', label: 'Changes requested', cls: 'red' };
    if (all.every((s) => s.key === 'approved')) return { key: 'approved', label: 'Approved', cls: 'green' };
    if (all.some((s) => s.key === 'review' || s.key === 'shared')) return { key: 'review', label: 'In review', cls: 'blue' };
    return { key: 'draft', label: 'Draft', cls: 'grey' };
  }

  function currentVersion(drawing) { return drawing.versions[drawing.versions.length - 1]; }

  function reviewUrl(token) {
    const base = location.href.split('#')[0];
    return base + '#/review/' + token;
  }

  function findDrawingByToken(token) {
    for (const p of state.data.projects) {
      for (const d of p.drawings) {
        if (d.share && d.share.token === token) return { project: p, drawing: d };
      }
    }
    return null;
  }

  function shareIsLive(drawing) {
    if (!drawing.share || drawing.share.revoked) return false;
    return new Date(drawing.share.expiry).getTime() > Date.now();
  }

  function allDrawings() {
    const rows = [];
    state.data.projects.forEach((p) => p.drawings.forEach((d) => rows.push({ project: p, drawing: d })));
    return rows;
  }

  function logActivity(project, who, what, at) {
    project.activity = project.activity || [];
    project.activity.unshift({ at: at || nowISO(), who, what });
    project.updatedAt = at || nowISO();
  }

  /* =========================================================
     6. Shared markup
     ========================================================= */
  function planSVG(seed, labels) {
    const s = (seed || 'x') + '';
    const shift = (parseInt(hash(s).slice(0, 2), 16) % 7) - 3;
    const wall = '#1B2550';
    const thin = '#9AA4C4';
    const ink = '#5A6585';
    const roomLabels = labels || [
      { x: 185, y: 145, t: 'LIVING' },
      { x: 525, y: 105, t: 'BEDROOM 1' },
      { x: 525, y: 240, t: 'BEDROOM 2' },
      { x: 120, y: 340, t: 'KITCHEN' },
      { x: 265, y: 365, t: 'BATH' },
      { x: 650, y: 370, t: 'BALCONY' }
    ];
    const rooms = roomLabels.map((r) => '<text x="' + r.x + '" y="' + (r.y + shift) + '" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="600" letter-spacing="1.5" fill="' + ink + '">' + esc(r.t) + '</text>').join('');
    return '' +
      '<svg viewBox="0 0 760 520" role="img" aria-label="Floor plan drawing">' +
      '<rect x="0" y="0" width="760" height="520" fill="transparent"/>' +
      '<g stroke="' + wall + '" fill="none" stroke-linejoin="round">' +
      '<rect x="40" y="30" width="680" height="400" stroke-width="6"/>' +
      '<path d="M330 30v220M40 250h290M330 250h390M200 250v110M200 360h130M330 170h390M330 300h390M200 300h130" stroke-width="4"/>' +
      '</g>' +
      '<g stroke="' + thin + '" fill="none" stroke-width="2">' +
      '<path d="M200 360h130" stroke-dasharray="6 5"/>' +
      '<rect x="580" y="300" width="140" height="130" stroke-dasharray="7 6"/>' +
      '<path d="M70 250h50M160 250h50M330 60v60M330 190v40M520 30v40M620 30v40M520 300v40M620 300v40M360 430v-30M440 430v-30" stroke-width="3"/>' +
      '</g>' +
      '<g stroke="' + wall + '" fill="none" stroke-width="2">' +
      '<path d="M120 250a40 40 0 0 1 40 40h-40" />' +
      '<path d="M330 120a45 45 0 0 0-45 45v-45" />' +
      '<path d="M470 250a50 50 0 0 1 50 50v-50" />' +
      '</g>' +
      '<g font-family="Inter,sans-serif" font-size="9" fill="' + thin + '">' +
      '<path d="M40 462h680" stroke="' + thin + '" stroke-width="1"/>' +
      '<path d="M40 455v14M720 455v14M380 455v14" stroke="' + thin + '" stroke-width="1"/>' +
      '<text x="380" y="478" text-anchor="middle" font-size="10" font-weight="600" fill="' + ink + '">24.00 m</text>' +
      '</g>' +
      rooms +
      '<g stroke="' + thin + '" fill="none" stroke-width="1">' +
      '<rect x="470" y="440" width="250" height="56" rx="4"/>' +
      '<path d="M470 466h250"/>' +
      '</g>' +
      '<g font-family="Inter,sans-serif" fill="' + ink + '">' +
      '<text x="482" y="457" font-size="9.5" font-weight="700" letter-spacing="1">' + esc((seed || 'PLAN').toString().toUpperCase().slice(0, 26)) + '</text>' +
      '<text x="482" y="481" font-size="8.5">SCALE 1:100  ·  REV 02  ·  SHEET A-101</text>' +
      '<text x="708" y="457" text-anchor="end" font-size="8.5">PLANREVIEW AI</text>' +
      '<text x="708" y="481" text-anchor="end" font-size="8.5">13 NOV 2026</text>' +
      '</g>' +
      '</svg>';
  }

  function thumbSVG(seed) {
    return planSVG(seed).replace('<rect x="0" y="0" width="760" height="520" fill="transparent"/>', '');
  }

  function statusPill(s) {
    return '<span class="pill ' + s.cls + '">' + esc(s.label) + '</span>';
  }

  function avatar(name, cls) {
    return '<span class="avatar ' + (cls || '') + '" aria-hidden="true">' + esc(initials(name)) + '</span>';
  }

  function commentNo(drawing, c) {
    return drawing.comments.indexOf(c) + 1;
  }

  /* =========================================================
     7. Shell: sidebar + topbar
     ========================================================= */
  function sidebar(active) {
    const attention = allDrawings().filter((r) => drawingStatus(r.drawing).key === 'changes').length;
    const items = [
      { key: 'dashboard', href: '#/dashboard', label: 'Dashboard', ico: 'home' },
      { key: 'projects', href: '#/dashboard', label: 'Projects', ico: 'folder' },
      { key: 'approvals', href: '#/approvals', label: 'Approvals', ico: 'checkCircle', badge: attention || 0 },
      { key: 'insights', href: '#/insights', label: 'AI review summary', ico: 'sparkles' }
    ];
    return '' +
      '<aside class="sidebar">' +
      '<div class="brand"><span class="brand-mark">P</span><span class="brand-name brand-text">PlanReview <span>AI</span></span></div>' +
      '<nav class="nav" aria-label="Main">' +
      items.map((i) => '<a class="nav-item ' + (active === i.key ? 'active' : '') + '" href="' + i.href + '">' + icon(i.ico) +
        '<span class="nav-text">' + esc(i.label) + '</span>' +
        (i.badge ? '<span class="nav-badge">' + i.badge + '</span>' : '') + '</a>').join('') +
      '</nav>' +
      '<div class="sidebar-foot">' +
      '<div class="sidebar-note"><strong>Demo workspace.</strong> Data lives in this browser only. Everything resets from the account menu.</div>' +
      '</div>' +
      '</aside>';
  }

  function topbar(subtitle) {
    const open = allDrawings().reduce((n, r) => n + openComments(r.drawing).length, 0);
    return '' +
      '<header class="topbar">' +
      '<label class="search">' + icon('search', 'sm') +
      '<input id="globalSearch" type="search" placeholder="Search projects and drawings" value="' + esc(state.search) + '" aria-label="Search projects and drawings" />' +
      '</label>' +
      '<div class="row grow" style="justify-content:flex-end">' +
      '<span class="caption" style="margin-right:8px">' + esc(subtitle || '') + '</span>' +
      '<button class="icon-btn bell" data-act="notifications" aria-label="Notifications">' + icon('bell') + (open ? '<span class="dot"></span>' : '') + '</button>' +
      '<button class="row" data-act="account" style="border:0;background:transparent;padding:0;gap:8px">' +
      avatar(TEAM.name) +
      '<span class="caption" style="font-weight:700;color:var(--tx)">' + esc(TEAM.name) + '</span>' +
      '</button>' +
      '</div>' +
      '</header>';
  }

  function shell(active, subtitle, body) {
    return sidebar(active) + '<div class="main">' + topbar(subtitle) + '<main class="content">' + body + '</main></div>';
  }

  /* =========================================================
     8. Dashboard
     ========================================================= */
  function viewDashboard() {
    const projects = state.data.projects.filter((p) => {
      if (!state.search) return true;
      const q = state.search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q) ||
        p.drawings.some((d) => d.name.toLowerCase().includes(q));
    });

    const rows = allDrawings();
    const waiting = rows.filter((r) => shareIsLive(r.drawing) && r.drawing.decision.status === 'pending');
    const openTotal = rows.reduce((n, r) => n + openComments(r.drawing).length, 0);
    const approvedThisMonth = rows.filter((r) => r.drawing.decision.status === 'approved' && new Date(r.drawing.decision.at).getTime() > Date.now() - 30 * DAY);

    const kpis = [
      { label: 'Active projects', value: state.data.projects.length, ico: 'folder', cls: '', foot: state.data.projects.length + ' with live links' },
      { label: 'Awaiting client review', value: waiting.length, ico: 'clock', cls: 'wa', foot: 'drawings shared and undecided' },
      { label: 'Open comments', value: openTotal, ico: 'message', cls: 'er', foot: 'across all drawings' },
      { label: 'Approved this month', value: approvedThisMonth.length, ico: 'checkCircle', cls: 'ok', foot: 'signed off by clients' }
    ];

    const attention = rows.filter((r) => {
      const st = drawingStatus(r.drawing).key;
      return st === 'changes' || (st === 'review' && openComments(r.drawing).length);
    }).slice(0, 4);

    const activity = state.data.projects
      .flatMap((p) => (p.activity || []).map((a) => ({ ...a, project: p })))
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 5);

    const body = '' +
      '<div class="page-head">' +
      '<div><h1>Good afternoon, Aarav</h1><p class="muted" style="margin-top:6px">' + waiting.length + ' drawing' + (waiting.length === 1 ? '' : 's') + ' sitting with clients and ' + openTotal + ' open comment' + (openTotal === 1 ? '' : 's') + ' to clear.</p></div>' +
      '<div class="row"><button class="btn" data-act="reset-demo">' + icon('refresh', 'sm') + 'Reset demo data</button>' +
      '<button class="btn btn-primary" data-act="new-project">' + icon('plus', 'sm') + 'New project</button></div>' +
      '</div>' +

      '<div class="kpis">' + kpis.map((k) => '' +
        '<div class="kpi"><div class="kpi-top"><span class="chip-ico ' + k.cls + '">' + icon(k.ico, 'lg') + '</span></div>' +
        '<div class="kpi-num">' + k.value + '</div><div class="kpi-label">' + esc(k.label) + '</div>' +
        '<div class="caption" style="margin-top:4px">' + esc(k.foot) + '</div></div>').join('') +
      '</div>' +

      '<div class="layout-2">' +
      '<section class="stack">' +
      '<div class="row-between"><h2>Projects</h2><span class="caption">' + projects.length + ' shown</span></div>' +
      (projects.length ? '<div class="grid-2">' + projects.map(projectCard).join('') + '</div>' : '<div class="card empty-state">No project matches “' + esc(state.search) + '”.</div>') +
      '</section>' +

      '<aside class="stack">' +
      '<div class="card">' +
      '<div class="card-head"><h2>Needs your attention</h2>' + icon('alert', 'sm') + '</div>' +
      (attention.length ? attention.map((r) => {
        const st = drawingStatus(r.drawing);
        return '<a class="activity" href="#/projects/' + r.project.id + '/drawings/' + r.drawing.id + '" style="display:flex;color:inherit">' +
          '<span class="grow"><strong style="font-size:13px">' + esc(r.drawing.name) + '</strong>' +
          '<div class="caption">' + esc(r.project.name) + ' · ' + esc(r.drawing.sheet) + '</div>' +
          '<div style="margin-top:6px">' + statusPill(st) + '</div></span>' +
          '<span class="when">' + relTime(r.drawing.updatedAt) + '</span></a>';
      }).join('') : '<p class="caption">Nothing is blocked. Every shared drawing has a decision.</p>') +
      '</div>' +
      '<div class="card">' +
      '<div class="card-head"><h2>Recent activity</h2>' + icon('clock', 'sm') + '</div>' +
      activity.map((a) => '<div class="activity">' + avatar(a.who, 'sm') +
        '<div class="grow"><div class="small"><strong>' + esc(a.who) + '</strong> ' + esc(a.what) + '</div>' +
        '<div class="caption">' + esc(a.project.name) + '</div></div>' +
        '<span class="when">' + relTime(a.at) + '</span></div>').join('') +
      '</div>' +
      '</aside></div>';

    return shell('dashboard', 'Demo workspace', body);
  }

  function projectCard(p) {
    const st = projectStatus(p);
    const rows = p.drawings;
    const open = rows.reduce((n, d) => n + openComments(d).length, 0);
    const approved = rows.filter((d) => d.decision.status === 'approved').length;
    const pct = Math.round((approved / rows.length) * 100);
    return '' +
      '<article class="card project-card" data-act="open-project" data-id="' + p.id + '" tabindex="0" role="link" aria-label="Open ' + esc(p.name) + '">' +
      '<div class="thumb">' + thumbSVG(p.name) + '</div>' +
      '<div class="row-between" style="margin:14px 0 4px"><h3 class="truncate">' + esc(p.name) + '</h3>' + statusPill(st) + '</div>' +
      '<p class="caption">' + esc(p.client) + ' · ' + esc(p.type) + '</p>' +
      '<div class="row-between" style="margin-top:12px"><span class="caption">' + rows.length + ' drawing' + (rows.length === 1 ? '' : 's') + ' · ' + open + ' open</span><span class="caption">' + relTime(p.updatedAt) + '</span></div>' +
      '<div class="progress ' + (pct === 100 ? 'ok' : 'wa') + '" style="margin-top:8px"><span style="width:' + pct + '%"></span></div>' +
      '<div class="caption" style="margin-top:6px">' + approved + ' of ' + rows.length + ' approved</div>' +
      '</article>';
  }

  /* =========================================================
     9. Project page
     ========================================================= */
  function viewProject(project) {
    const st = projectStatus(project);
    const open = project.drawings.reduce((n, d) => n + openComments(d).length, 0);
    const tab = state.ui.tab;

    const drawingsTab = '' +
      '<div class="card" style="padding:0;overflow:hidden">' +
      '<table class="table"><thead><tr><th>Drawing</th><th>Sheet</th><th>Revision</th><th>Status</th><th>Open</th><th>Updated</th><th></th></tr></thead><tbody>' +
      project.drawings.map((d) => {
        const ds = drawingStatus(d);
        const v = currentVersion(d);
        return '<tr>' +
          '<td><div class="row">' + icon('file', 'sm') + '<a href="#/projects/' + project.id + '/drawings/' + d.id + '"><strong>' + esc(d.name) + '</strong></a></div></td>' +
          '<td class="mono">' + esc(d.sheet) + '</td>' +
          '<td class="num">Rev ' + String(v.n).padStart(2, '0') + '</td>' +
          '<td>' + statusPill(ds) + '</td>' +
          '<td class="num">' + openComments(d).length + '</td>' +
          '<td class="caption">' + relTime(d.updatedAt) + '</td>' +
          '<td style="text-align:right"><a class="btn btn-sm" href="#/projects/' + project.id + '/drawings/' + d.id + '">Open</a></td>' +
          '</tr>';
      }).join('') +
      '</tbody></table></div>';

    const versionsTab = '' +
      '<div class="stack">' +
      project.drawings.map((d) => '' +
        '<div class="card">' +
        '<div class="card-head"><div><h3>' + esc(d.name) + '</h3><p class="caption">' + esc(d.sheet) + ' · ' + d.versions.length + ' revision' + (d.versions.length === 1 ? '' : 's') + '</p></div>' +
        '<button class="btn btn-sm" data-act="upload" data-project="' + project.id + '" data-drawing="' + d.id + '">' + icon('upload', 'sm') + 'Upload revision</button></div>' +
        '<div class="timeline">' +
        d.versions.slice().reverse().map((v, i) => '<div class="tl-item">' +
          '<span class="tl-dot ' + (i === 0 ? '' : 'ok') + '">' + v.n + '</span>' +
          '<div class="grow"><div class="row-between"><strong class="small">Revision ' + String(v.n).padStart(2, '0') + (i === 0 ? ' — current' : '') + '</strong><span class="caption">' + fmtDateTime(v.at) + '</span></div>' +
          '<div class="caption">' + esc(v.note || '') + '</div>' +
          '<div class="caption">Uploaded by ' + esc(v.by) + (v.size ? ' · ' + esc(v.size) : '') + '</div></div></div>').join('') +
        '</div></div>').join('') +
      '</div>';

    const activityTab = '' +
      '<div class="card"><div class="timeline">' +
      (project.activity || []).map((a) => '<div class="tl-item">' +
        '<span class="tl-dot">' + esc(initials(a.who)[0]) + '</span>' +
        '<div class="grow"><div class="small"><strong>' + esc(a.who) + '</strong> ' + esc(a.what) + '</div>' +
        '<div class="caption">' + fmtDateTime(a.at) + ' · ' + relTime(a.at) + '</div></div></div>').join('') +
      '</div></div>';

    const body = '' +
      '<div class="page-head">' +
      '<div>' +
      '<div class="crumbs"><a href="#/dashboard">Dashboard</a><span>/</span><span>' + esc(project.name) + '</span></div>' +
      '<h1>' + esc(project.name) + '</h1>' +
      '<div class="row wrap" style="margin-top:10px">' + statusPill(st) +
      '<span class="caption">' + esc(project.client) + ' · ' + esc(project.company) + ' · ' + esc(project.type) + '</span></div>' +
      '</div>' +
      '<div class="row"><button class="btn" data-act="upload" data-project="' + project.id + '" data-drawing="' + project.drawings[0].id + '">' + icon('upload', 'sm') + 'Add revision</button>' +
      '<button class="btn btn-primary" data-act="share" data-project="' + project.id + '" data-drawing="' + project.drawings[0].id + '">' + icon('share', 'sm') + 'Share with client</button></div>' +
      '</div>' +

      '<div class="kpis" style="grid-template-columns:repeat(4,minmax(0,1fr))">' +
      miniKpi('folder', '', project.drawings.length, 'Drawings') +
      miniKpi('message', 'er', open, 'Open comments') +
      miniKpi('clock', 'wa', project.drawings.filter((d) => drawingStatus(d).key === 'review' || drawingStatus(d).key === 'shared').length, 'With the client') +
      miniKpi('checkCircle', 'ok', project.drawings.filter((d) => d.decision.status === 'approved').length, 'Approved') +
      '</div>' +

      '<div class="tabs" role="tablist">' +
      ['drawings', 'versions', 'activity'].map((t) => '<button class="tab ' + (tab === t ? 'active' : '') + '" role="tab" aria-selected="' + (tab === t) + '" data-act="tab" data-tab="' + t + '">' + t.charAt(0).toUpperCase() + t.slice(1) + '</button>').join('') +
      '</div>' +
      (tab === 'versions' ? versionsTab : tab === 'activity' ? activityTab : drawingsTab) +
      '<div class="card" style="margin-top:20px"><div class="row-between wrap">' +
      '<div><h3>Client details</h3><p class="caption">' + esc(project.client) + ' · ' + esc(project.email) + ' · ' + esc(project.phone) + '</p></div>' +
      '<button class="btn btn-sm" data-act="copy-client" data-project="' + project.id + '">' + icon('copy', 'sm') + 'Copy client email</button>' +
      '</div></div>';

    return shell('projects', project.name, body);
  }

  function miniKpi(ico, cls, num, label) {
    return '<div class="kpi card-tight"><div class="row"><span class="chip-ico ' + cls + '" style="width:36px;height:36px;border-radius:10px">' + icon(ico, 'sm') + '</span>' +
      '<div><div style="font-size:20px;font-weight:800;letter-spacing:-.02em">' + num + '</div><div class="caption">' + esc(label) + '</div></div></div></div>';
  }

  /* =========================================================
     10. Viewer (studio + customer review)
     ========================================================= */
  function viewerMarkup(project, drawing, opts) {
    const customer = !!opts.customer;
    const st = drawingStatus(drawing);
    const filter = state.ui.commentFilter;
    const shown = drawing.comments.filter((c) => filter === 'all' || c.status === filter);
    const open = openComments(drawing).length;
    const v = currentVersion(drawing);
    const persona = customer ? project.client : TEAM.name;
    const canComment = !customer || (drawing.share && drawing.share.allowComments);
    const canApprove = !customer || (drawing.share && drawing.share.allowApproval);

    const pins = drawing.comments.map((c) => {
      const selected = state.ui.selectedComment === c.id ? ' selected' : '';
      const resolved = c.status === 'resolved' ? ' resolved' : '';
      return '<button class="pin' + resolved + selected + '" data-act="pin" data-comment="' + c.id + '" style="left:' + (c.x * 100) + '%;top:' + (c.y * 100) + '%" title="Comment ' + commentNo(drawing, c) + ' — ' + esc(c.text.slice(0, 60)) + '"><span>' + commentNo(drawing, c) + '</span></button>';
    }).join('');

    const pendingPin = state.ui.pendingPin
      ? '<span class="pin" style="left:' + (state.ui.pendingPin.x * 100) + '%;top:' + (state.ui.pendingPin.y * 100) + '%"><span>+</span></span>'
      : '';

    const planLayer = v.image
      ? '<img src="' + esc(v.image) + '" alt="' + esc(drawing.name) + '" style="width:100%;height:100%;object-fit:contain;background:#fff;border-radius:8px" />'
      : planSVG(drawing.name, drawing.rooms);

    const canvas = '' +
      '<div class="canvas-wrap' + (state.ui.placeMode ? ' placing' : '') + '" id="canvasWrap">' +
      '<div class="toolbar" role="toolbar" aria-label="Drawing tools">' +
      '<button class="tool ' + (state.ui.placeMode ? '' : 'active') + '" data-act="tool-pan" title="Pan">' + icon('hand', 'sm') + '</button>' +
      '<button class="tool ' + (state.ui.placeMode ? 'active' : '') + '" data-act="tool-pin" title="Pin a comment">' + icon('pin', 'sm') + '</button>' +
      '<span class="tool-sep"></span>' +
      '<button class="tool" data-act="zoom-out" title="Zoom out">' + icon('zoomOut', 'sm') + '</button>' +
      '<button class="tool" data-act="zoom-in" title="Zoom in">' + icon('zoomIn', 'sm') + '</button>' +
      '<button class="tool" data-act="zoom-reset" title="Fit to screen">' + icon('refresh', 'sm') + '</button>' +
      '<span class="tool-sep"></span>' +
      '<button class="tool" data-act="download-summary" title="Download a comment summary">' + icon('download', 'sm') + '</button>' +
      '</div>' +
      '<div class="canvas-stage" id="canvasStage"><div class="drawing-host" id="drawingHost">' + planLayer + pins + pendingPin + '</div></div>' +
      '<div class="canvas-chip left">' + icon('layers', 'sm') + '<span>' + esc(v.image ? 'Uploaded plan' : 'Demo plan') + '</span></div>' +
      '<div class="canvas-chip right" id="zoomChip">' + Math.round(state.ui.zoom * 100) + '%</div>' +
      '</div>';

    const commentList = shown.length ? shown.map((c) => {
      const no = commentNo(drawing, c);
      const selected = state.ui.selectedComment === c.id ? ' selected' : '';
      const resolved = c.status === 'resolved' ? ' resolved' : '';
      const mine = c.author === persona;
      return '<article class="comment' + resolved + selected + '" data-act="select-comment" data-comment="' + c.id + '">' +
        '<div class="comment-top"><span class="comment-no">' + no + '</span>' +
        '<span class="comment-author">' + esc(c.author) + '</span>' +
        '<span class="pill plain ' + (c.role === 'client' ? 'amber' : 'blue') + '" style="margin-left:auto">' + (c.role === 'client' ? 'Client' : 'Studio') + '</span></div>' +
        '<p class="comment-text">' + esc(c.text) + '</p>' +
        '<div class="caption" style="margin-top:6px">' + relTime(c.at) + (c.status === 'resolved' ? ' · resolved' : '') + '</div>' +
        (c.replies.length ? '<div class="replies">' + c.replies.map((r) => '<div class="reply"><strong>' + esc(r.author) + '</strong> <span class="caption">' + relTime(r.at) + '</span><br>' + esc(r.text) + '</div>').join('') + '</div>' : '') +
        '<div class="comment-actions">' +
        '<button class="btn btn-sm" data-act="reply" data-comment="' + c.id + '">' + icon('message', 'sm') + 'Reply</button>' +
        (customer ? '' : '<button class="btn btn-sm" data-act="toggle-resolve" data-comment="' + c.id + '">' + (c.status === 'open' ? 'Mark resolved' : 'Reopen') + '</button>') +
        '</div></article>';
    }).join('') : '<div class="empty-state">' + icon('message', 'lg') + '<p style="margin-top:8px">' + (filter === 'all' ? 'No comments yet. Use the pin tool and click the drawing.' : 'Nothing in this filter.') + '</p></div>';

    const replyTarget = state.ui.replyTo ? drawing.comments.find((c) => c.id === state.ui.replyTo) : null;

    const composer = canComment ? '' +
      '<div class="panel-foot">' +
      (state.ui.pendingPin ? '<div class="banner amber" style="margin-bottom:8px">' + icon('pin', 'sm') + 'Note pinned. Type it below and save.</div>' : '') +
      (replyTarget ? '<div class="row-between" style="margin-bottom:8px"><span class="caption">Replying to #' + commentNo(drawing, replyTarget) + '</span><button class="btn btn-sm btn-ghost" data-act="cancel-reply">Cancel</button></div>' : '') +
      '<div class="composer"><textarea id="commentBox" placeholder="' + (state.ui.pendingPin ? 'What needs to change here?' : replyTarget ? 'Write a reply…' : 'Add a general comment…') + '" aria-label="Write a comment"></textarea></div>' +
      '<button class="btn btn-primary btn-block" style="margin-top:8px" data-act="add-comment">' + icon('message', 'sm') + (replyTarget ? 'Send reply' : 'Add comment') + '</button>' +
      '</div>' : '<div class="panel-foot"><p class="caption">The client link is view-only.</p></div>';

    const panel = '' +
      '<div class="panel">' +
      '<div class="panel-head">' +
      '<div class="row-between"><h2>Comments</h2><span class="pill ' + (open ? 'amber' : 'green') + '">' + open + ' open</span></div>' +
      '<div class="row wrap" style="margin-top:10px">' +
      ['all', 'open', 'resolved'].map((f) => '<button class="btn btn-sm ' + (filter === f ? 'btn-primary' : '') + '" data-act="filter" data-filter="' + f + '">' + f.charAt(0).toUpperCase() + f.slice(1) + '</button>').join('') +
      '</div></div>' +
      '<div class="panel-body">' + commentList + '</div>' +
      composer +
      '</div>';

    const decisionBlock = drawing.decision.status !== 'pending'
      ? '<div class="banner ' + (drawing.decision.status === 'approved' ? 'ok' : 'red') + '" style="margin-bottom:16px">' +
        icon(drawing.decision.status === 'approved' ? 'checkCircle' : 'alert', 'sm') +
        '<span>' + (drawing.decision.status === 'approved' ? 'Approved by ' + esc(drawing.decision.by) + ' on Revision ' + String(drawing.decision.version).padStart(2, '0') : 'Changes requested by ' + esc(drawing.decision.by) + ' on Revision ' + String(drawing.decision.version).padStart(2, '0')) + ' · ' + relTime(drawing.decision.at) + '</span></div>'
      : '';

    const decisionNote = drawing.decision.note
      ? '<div class="card card-tight" style="margin-bottom:16px"><div class="label">Client note</div><p class="small" style="margin-top:4px">“' + esc(drawing.decision.note) + '”</p></div>' : '';

    const decisionBar = customer ? '' +
      '<div class="decision-bar">' +
      (canApprove && drawing.decision.status !== 'approved' ? '<button class="btn btn-ok" data-act="customer-approve" style="flex:1">' + icon('check', 'sm') + 'Approve Revision ' + String(v.n).padStart(2, '0') + '</button>' : '') +
      (canComment ? '<button class="btn" data-act="customer-changes" style="flex:1">' + icon('message', 'sm') + 'Request changes</button>' : '') +
      '</div>' : '';

    return '<div class="viewer">' + canvas + panel + '</div>' + decisionBlock + decisionNote + decisionBar;
  }

  function viewViewer(project, drawing) {
    const st = drawingStatus(drawing);
    const v = currentVersion(drawing);
    const body = '' +
      '<div class="page-head">' +
      '<div>' +
      '<div class="crumbs"><a href="#/dashboard">Dashboard</a><span>/</span><a href="#/projects/' + project.id + '">' + esc(project.name) + '</a><span>/</span><span>' + esc(drawing.name) + '</span></div>' +
      '<h1>' + esc(drawing.name) + '</h1>' +
      '<div class="row wrap" style="margin-top:10px">' + statusPill(st) +
      '<span class="pill plain">Rev ' + String(v.n).padStart(2, '0') + '</span>' +
      '<span class="caption">Sheet ' + esc(drawing.sheet) + ' · ' + esc(drawing.scale) + ' · ' + esc(project.client) + '</span></div>' +
      '</div>' +
      '<div class="row"><button class="btn" data-act="upload" data-project="' + project.id + '" data-drawing="' + drawing.id + '">' + icon('upload', 'sm') + 'Upload revision</button>' +
      '<button class="btn" data-act="download-summary">' + icon('download', 'sm') + 'Download comments</button>' +
      '<button class="btn btn-primary" data-act="share" data-project="' + project.id + '" data-drawing="' + drawing.id + '">' + icon('share', 'sm') + 'Share</button></div>' +
      '</div>' +
      viewerMarkup(project, drawing, { customer: false }) +
      '<input type="file" id="revisionInput" class="hide" accept="image/*,.pdf" data-project="' + project.id + '" data-drawing="' + drawing.id + '" />';
    return shell('projects', project.name, body);
  }

  function viewReview(token) {
    const found = findDrawingByToken(token);
    if (!found) {
      return '<div class="customer-shell"><div class="customer-top"><span class="brand-mark">P</span><strong class="brand-name">PlanReview <span>AI</span></strong></div>' +
        '<div class="empty-state" style="margin:auto;max-width:460px">' + icon('link', 'lg') +
        '<h1 style="margin:16px 0 8px;font-size:22px">This review link is not valid</h1>' +
        '<p class="muted">It may have been revoked, or it has expired. Ask the studio to send a fresh link.</p></div></div>';
    }
    const { project, drawing } = found;
    const expired = new Date(drawing.share.expiry).getTime() < Date.now();
    const v = currentVersion(drawing);
    const st = drawingStatus(drawing);

    const header = '' +
      '<div class="customer-top">' +
      '<span class="brand-mark">P</span><strong class="brand-name">PlanReview <span>AI</span></strong>' +
      '<span class="secure-badge">' + icon('shield', 'sm') + 'Secure client link</span>' +
      '<div class="grow"></div>' +
      '<span class="caption">Shared by ' + esc(TEAM.studio) + ' with ' + esc(project.client) + '</span>' + avatar(project.client) +
      '</div>';

    if (drawing.share.revoked || expired) {
      return '<div class="customer-shell">' + header + '<div class="empty-state" style="margin:auto;max-width:520px">' + icon('clock', 'lg') +
        '<h1 style="margin:16px 0 8px;font-size:22px">' + (drawing.share.revoked ? 'This link was revoked' : 'This link has expired') + '</h1>' +
        '<p class="muted">' + (drawing.share.revoked ? 'The studio turned off access to this drawing.' : 'Review links last ' + Math.round((new Date(drawing.share.expiry) - new Date(drawing.share.createdAt)) / DAY) + ' days. Ask ' + esc(TEAM.studio) + ' for a new one.') + '</p></div></div>';
    }

    const intro = '' +
      '<div class="content" style="padding-bottom:8px">' +
      '<div class="page-head" style="margin-bottom:16px">' +
      '<div><div class="crumbs"><span>' + esc(project.name) + '</span><span>/</span><span>' + esc(drawing.name) + '</span></div>' +
      '<h1>' + esc(drawing.name) + '</h1>' +
      '<div class="row wrap" style="margin-top:10px">' + statusPill(st) + '<span class="pill plain">Revision ' + String(v.n).padStart(2, '0') + '</span>' +
      '<span class="caption">Sheet ' + esc(drawing.sheet) + ' · expires ' + fmtDate(drawing.share.expiry) + '</span></div></div>' +
      '<span class="caption">Click anywhere on the plan to leave a note</span></div>' +
      (drawing.decision.status !== 'pending' ? '<div class="banner ' + (drawing.decision.status === 'approved' ? 'ok' : 'amber') + '" style="margin-bottom:16px">' +
        icon(drawing.decision.status === 'approved' ? 'checkCircle' : 'message', 'sm') +
        (drawing.decision.status === 'approved'
          ? 'You approved Revision ' + String(drawing.decision.version).padStart(2, '0') + ' on ' + fmtDate(drawing.decision.at) + '. Thank you.'
          : 'You asked for changes on ' + fmtDate(drawing.decision.at) + '. The studio can see your notes below.') + '</div>' : '') +
      viewerMarkup(project, drawing, { customer: true }) +
      '</div>';

    return '<div class="customer-shell">' + header + intro + '</div>';
  }

  /* =========================================================
     11. Approvals
     ========================================================= */
  function viewApprovals() {
    const rows = allDrawings();
    const approved = rows.filter((r) => r.drawing.decision.status === 'approved')
      .sort((a, b) => new Date(b.drawing.decision.at) - new Date(a.drawing.decision.at));
    const pending = rows.filter((r) => r.drawing.decision.status !== 'approved');

    const body = '' +
      '<div class="page-head"><div><h1>Approvals</h1><p class="muted" style="margin-top:6px">Every sign-off is recorded against a revision, so you always know what the client approved.</p></div>' +
      '<button class="btn" data-act="download-approvals">' + icon('download', 'sm') + 'Export log</button></div>' +

      '<div class="grid-2" style="margin-bottom:20px">' +
      '<div class="card"><div class="card-head"><h2>Signed off</h2>' + icon('checkCircle', 'sm') + '</div>' +
      '<div class="row" style="gap:16px"><div><div style="font-size:30px;font-weight:800">' + approved.length + '</div><div class="caption">drawings approved</div></div>' +
      '<div><div style="font-size:30px;font-weight:800">' + new Set(approved.map((r) => r.project.id)).size + '</div><div class="caption">projects closed</div></div></div></div>' +
      '<div class="card"><div class="card-head"><h2>Waiting on clients</h2>' + icon('clock', 'sm') + '</div>' +
      '<div class="row" style="gap:16px"><div><div style="font-size:30px;font-weight:800">' + pending.filter((r) => shareIsLive(r.drawing)).length + '</div><div class="caption">shared, no decision</div></div>' +
      '<div><div style="font-size:30px;font-weight:800">' + rows.filter((r) => drawingStatus(r.drawing).key === 'changes').length + '</div><div class="caption">changes requested</div></div></div></div>' +
      '</div>' +

      '<div class="card" style="padding:0;overflow:hidden;margin-bottom:20px">' +
      '<div style="padding:20px 20px 0"><h2>Approval log</h2><p class="caption" style="margin-top:4px">A fingerprint is stored with each approval so a later edit to the same revision is detectable.</p></div>' +
      '<table class="table"><thead><tr><th>Drawing</th><th>Project</th><th>Revision</th><th>Approved by</th><th>Date</th><th>Fingerprint</th></tr></thead><tbody>' +
      (approved.length ? approved.map((r) => '<tr>' +
        '<td><a href="#/projects/' + r.project.id + '/drawings/' + r.drawing.id + '"><strong>' + esc(r.drawing.name) + '</strong></a><div class="caption mono">' + esc(r.drawing.sheet) + '</div></td>' +
        '<td class="caption">' + esc(r.project.name) + '</td>' +
        '<td class="num">Rev ' + String(r.drawing.decision.version).padStart(2, '0') + '</td>' +
        '<td>' + esc(r.drawing.decision.by) + '</td>' +
        '<td class="caption">' + fmtDate(r.drawing.decision.at) + '</td>' +
        '<td class="mono">' + esc(r.drawing.decision.fingerprint || hash(r.project.id + r.drawing.id)) + '</td>' +
        '</tr>').join('') : '<tr><td colspan="6" class="empty-state">No approvals yet.</td></tr>') +
      '</tbody></table></div>' +

      '<div class="card"><div class="card-head"><h2>Open decisions</h2></div>' +
      '<table class="table"><thead><tr><th>Drawing</th><th>Client</th><th>Status</th><th>Link expiry</th><th>Open comments</th><th></th></tr></thead><tbody>' +
      pending.map((r) => '<tr>' +
        '<td><strong>' + esc(r.drawing.name) + '</strong><div class="caption">' + esc(r.project.name) + '</div></td>' +
        '<td class="caption">' + esc(r.project.client) + '</td>' +
        '<td>' + statusPill(drawingStatus(r.drawing)) + '</td>' +
        '<td class="caption">' + (r.drawing.share ? (r.drawing.share.revoked ? 'revoked' : fmtDate(r.drawing.share.expiry)) : 'not shared') + '</td>' +
        '<td class="num">' + openComments(r.drawing).length + '</td>' +
        '<td style="text-align:right"><button class="btn btn-sm" data-act="nudge" data-project="' + r.project.id + '" data-drawing="' + r.drawing.id + '">Send reminder</button></td>' +
        '</tr>').join('') +
      '</tbody></table></div>';

    return shell('approvals', 'Approvals', body);
  }

  /* =========================================================
     12. AI review summary (local heuristic, no network)
     ========================================================= */
  const THEMES = [
    { key: 'dimensions', words: ['mm', 'dimension', 'width', 'height', 'clear opening', 'depth', 'size'], label: 'Dimensions to confirm', prio: 'high' },
    { key: 'openings', words: ['door', 'window', 'sliding', 'opening', 'ventilation'], label: 'Openings and joinery', prio: 'high' },
    { key: 'finishes', words: ['finish', 'material', 'colour', 'color', 'tile', 'paint'], label: 'Finishes and materials', prio: 'medium' },
    { key: 'layout', words: ['furniture', 'sofa', 'chair', 'layout', 'wardrobe', 'stor'], label: 'Layout and furniture', prio: 'medium' },
    { key: 'safety', words: ['railing', 'height', 'headroom', 'setback', 'stair'], label: 'Safety and clearances', prio: 'high' }
  ];

  function classify(text) {
    const t = text.toLowerCase();
    const hit = THEMES.find((th) => th.words.some((w) => t.includes(w)));
    return hit || { key: 'other', label: 'Other points', prio: 'low' };
  }

  function viewInsights() {
    const projects = state.data.projects;
    const project = getProject(state.ui.insightProject) || projects[0];
    const openItems = project.drawings.flatMap((d) => openComments(d).map((c) => ({ d, c })));
    const groups = {};
    openItems.forEach((item) => {
      const th = classify(item.c.text);
      groups[th.key] = groups[th.key] || { label: th.label, prio: th.prio, items: [], key: th.key };
      groups[th.key].items.push(item);
    });
    const grouped = Object.values(groups).sort((a, b) => b.items.length - a.items.length);

    const summary = openItems.length
      ? 'Clients and the studio have left ' + openItems.length + ' open point' + (openItems.length === 1 ? '' : 's') +
        ' on ' + project.name + '. ' + grouped[0].label.toLowerCase() + ' come up most often (' + grouped[0].items.length + ').' +
        (project.drawings.some((d) => d.decision.status === 'changes') ? ' One drawing is still waiting on changes requested by the client.' : '')
      : 'Nothing is open on ' + project.name + ' right now. Good time to send the next revision.';

    const body = '' +
      '<div class="page-head"><div><h1>AI review summary</h1><p class="muted" style="margin-top:6px">Groups open comments into themes you can act on. Runs in the browser: no network, no model.</p></div>' +
      '<div class="row"><select id="insightProject" class="btn" data-act="insight-project" style="height:40px">' +
      projects.map((p) => '<option value="' + p.id + '"' + (p.id === project.id ? ' selected' : '') + '>' + esc(p.name) + '</option>').join('') +
      '</select></div></div>' +

      '<div class="ai-hero" style="margin-bottom:20px">' +
      '<span class="ai-label">' + icon('sparkles', 'sm') + 'Generated in this browser</span>' +
      '<h2 style="font-size:20px;margin-bottom:6px">What the comments say</h2>' +
      '<p style="max-width:720px">' + esc(summary) + '</p>' +
      '</div>' +

      '<div class="grid-2">' +
      '<div class="card"><div class="card-head"><h2>Action items</h2><span class="caption">' + openItems.length + ' open</span></div>' +
      (grouped.length ? grouped.map((g) => g.items.map((item) => '' +
        '<div class="action-row"><span class="prio ' + g.prio + '">' + g.prio + '</span>' +
        '<div class="grow"><div class="small"><strong>' + esc(g.label) + '</strong> — ' + esc(item.c.text) + '</div>' +
        '<div class="caption">' + esc(item.d.name) + ' · comment ' + commentNo(item.d, item.c) + ' · ' + esc(item.c.author) + '</div></div>' +
        '<a class="btn btn-sm" href="#/projects/' + project.id + '/drawings/' + item.d.id + '">Open</a></div>').join('')).join('') :
        '<p class="caption">No open comments to summarise.</p>') +
      '</div>' +

      '<div class="stack">' +
      '<div class="card"><div class="card-head"><h2>Themes</h2></div>' +
      (grouped.length ? grouped.map((g) => '<div style="margin-bottom:12px"><div class="row-between"><span class="small" style="font-weight:600">' + esc(g.label) + '</span><span class="caption">' + g.items.length + '</span></div>' +
        '<div class="progress ' + (g.prio === 'high' ? '' : 'wa') + '" style="margin-top:6px"><span style="width:' + Math.round((g.items.length / openItems.length) * 100) + '%"></span></div></div>').join('') : '<p class="caption">Nothing open.</p>') +
      '</div>' +
      '<div class="card"><div class="card-head"><h2>Ready for the client?</h2></div>' +
      '<ul class="small" style="margin:0;padding-left:18px;color:var(--mu);line-height:1.9">' +
      '<li>' + project.drawings.filter((d) => d.decision.status === 'pending' && shareIsLive(d)).length + ' drawing(s) shared and undecided</li>' +
      '<li>' + project.drawings.filter((d) => drawingStatus(d).key === 'changes').length + ' waiting on your changes</li>' +
      '<li>' + project.drawings.filter((d) => d.decision.status === 'approved').length + ' approved</li>' +
      '</ul>' +
      '<p class="caption" style="margin-top:12px">A real model would also read the drawing and suggest fixes. The starter only reads comments.</p>' +
      '</div></div></div>';

    return shell('insights', 'AI summary', body);
  }

  /* =========================================================
     13. Modals
     ========================================================= */
  function openModal(html) {
    modalRoot.innerHTML = '<div class="scrim" data-act="scrim"><div class="modal" role="dialog" aria-modal="true">' + html + '</div></div>';
    const first = modalRoot.querySelector('input, select, textarea, button');
    if (first) first.focus();
  }

  function closeModal() { modalRoot.innerHTML = ''; }

  function shareModal(project, drawing) {
    const live = shareIsLive(drawing);
    const url = reviewUrl(drawing.share.token);
    const days = Math.max(1, Math.round((new Date(drawing.share.expiry) - Date.now()) / DAY));
    const msg = 'Hi ' + project.client + ', your drawings are ready for review: ' + drawing.name + ' (Revision ' + String(currentVersion(drawing).n).padStart(2, '0') + '). Please open the secure link and add your comments: ' + url;
    const html = '' +
      '<div class="modal-head"><div><h2>Share ' + esc(drawing.name) + '</h2><p class="caption">' + esc(project.client) + ' · ' + esc(project.phone) + '</p></div>' +
      '<button class="icon-btn" data-act="close-modal" aria-label="Close">' + icon('x', 'sm') + '</button></div>' +

      '<div class="stack">' +
      '<div class="field"><label for="shareLink">Secure review link</label>' +
      '<div class="row"><input id="shareLink" readonly value="' + esc(url) + '" />' +
      '<button class="btn" data-act="copy-link" data-link="' + esc(url) + '">' + icon('copy', 'sm') + 'Copy</button></div>' +
      '<span class="hint">' + (live ? 'Active · expires ' + fmtDate(drawing.share.expiry) + ' · revocable at any time' : 'Expired — set a new expiry to reopen it') + '</span></div>' +

      '<div class="field"><label for="expiryDays">Link stays open for</label>' +
      '<select id="expiryDays" data-act="expiry" data-project="' + project.id + '" data-drawing="' + drawing.id + '">' +
      [3, 7, 14, 30].map((n) => '<option value="' + n + '"' + (n === days ? ' selected' : '') + '>' + n + ' days</option>').join('') +
      '</select></div>' +

      '<div>' +
      toggleRow('Allow comments', 'Client can pin notes on the drawing', 'comments', drawing.share.allowComments, project.id, drawing.id) +
      toggleRow('Allow approval', 'Client can approve or request changes', 'approval', drawing.share.allowApproval, project.id, drawing.id) +
      toggleRow('Allow download', 'Client can download the PDF', 'download', drawing.share.allowDownload, project.id, drawing.id) +
      '</div>' +

      '<div class="wa-preview"><div class="wa-head">' + icon('message', 'sm') + 'WhatsApp preview</div>' + esc(msg) + '</div>' +

      '<div class="row wrap">' +
      '<button class="btn btn-primary" data-act="copy-link" data-link="' + esc(msg) + '">' + icon('copy', 'sm') + 'Copy message</button>' +
      '<a class="btn" href="#/review/' + drawing.share.token + '" data-act="open-customer">' + icon('eye', 'sm') + 'Preview as client</a>' +
      '<button class="btn" data-act="revoke" data-project="' + project.id + '" data-drawing="' + drawing.id + '">' + icon('x', 'sm') + (drawing.share.revoked ? 'Re-enable link' : 'Revoke link') + '</button>' +
      '</div>' +
      '<p class="hint">Demo notice: the link works on this computer only. Real email and WhatsApp sending needs a backend.</p>' +
      '</div>';
    openModal(html);
  }

  function toggleRow(label, hint, key, checked, projectId, drawingId) {
    return '<div class="toggle-row"><div><div class="small" style="font-weight:600">' + esc(label) + '</div><div class="caption">' + esc(hint) + '</div></div>' +
      '<label class="switch"><input type="checkbox" data-act="share-toggle" data-key="' + key + '" data-project="' + projectId + '" data-drawing="' + drawingId + '"' + (checked ? ' checked' : '') + ' />' +
      '<span class="track"></span></label></div>';
  }

  function accountModal() {
    openModal('' +
      '<div class="modal-head"><div><h2>Demo workspace</h2><p class="caption">Signed in as ' + esc(TEAM.name) + ' · ' + esc(TEAM.role) + '</p></div>' +
      '<button class="icon-btn" data-act="close-modal" aria-label="Close">' + icon('x', 'sm') + '</button></div>' +
      '<div class="stack">' +
      '<div class="banner">' + icon('shield', 'sm') + 'No account, no server: everything is stored in this browser.</div>' +
      '<p class="small muted">Sign-in, email and WhatsApp delivery, PDF rendering and multi-user sync are described in the README under “Not built yet”.</p>' +
      '<div class="row"><button class="btn" data-act="reset-demo">' + icon('refresh', 'sm') + 'Reset demo data</button>' +
      '<button class="btn btn-primary" data-act="close-modal">Done</button></div>' +
      '</div>');
  }

  function notificationsModal() {
    const rows = allDrawings().flatMap((r) => openComments(r.drawing).map((c) => ({ ...r, c })))
      .sort((a, b) => new Date(b.c.at) - new Date(a.c.at)).slice(0, 6);
    openModal('' +
      '<div class="modal-head"><div><h2>Notifications</h2><p class="caption">Open comments across your projects</p></div>' +
      '<button class="icon-btn" data-act="close-modal" aria-label="Close">' + icon('x', 'sm') + '</button></div>' +
      (rows.length ? rows.map((r) => '<a class="activity" href="#/projects/' + r.project.id + '/drawings/' + r.drawing.id + '" data-act="close-modal" style="color:inherit">' +
        avatar(r.c.author, 'sm') +
        '<div class="grow"><div class="small">' + esc(r.c.text.slice(0, 90)) + (r.c.text.length > 90 ? '…' : '') + '</div>' +
        '<div class="caption">' + esc(r.drawing.name) + ' · ' + esc(r.project.name) + '</div></div>' +
        '<span class="when">' + relTime(r.c.at) + '</span></a>').join('') : '<p class="caption">Nothing new.</p>'));
  }

  /* =========================================================
     14. Actions
     ========================================================= */
  function currentViewerContext() {
    const r = state.route;
    if (r.name === 'viewer') {
      const project = getProject(r.projectId);
      const drawing = project && getDrawing(project, r.drawingId);
      return project && drawing ? { project, drawing, customer: false } : null;
    }
    if (r.name === 'review') {
      const found = findDrawingByToken(r.token);
      return found ? { ...found, customer: true } : null;
    }
    return null;
  }

  function addComment(ctx) {
    const box = document.getElementById('commentBox');
    const text = (box && box.value || '').trim();
    if (!text) { toast('Type a comment first.'); if (box) box.focus(); return; }
    const { project, drawing, customer } = ctx;
    const persona = customer ? project.client : TEAM.name;
    const role = customer ? 'client' : 'team';

    if (state.ui.replyTo) {
      const parent = drawing.comments.find((c) => c.id === state.ui.replyTo);
      if (parent) {
        parent.replies.push({ author: persona, role, text, at: nowISO() });
        parent.status = 'open';
        if (box) box.value = '';
        state.ui.replyTo = null;
        logActivity(project, persona, 'replied on ' + drawing.name);
        save();
        render();
        toast('Reply added.');
        return;
      }
    }

    const pin = state.ui.pendingPin || { x: 0.5 + (Math.random() - 0.5) * 0.1, y: 0.5 + (Math.random() - 0.5) * 0.1 };
    const comment = {
      id: uid('c'),
      x: pin.x,
      y: pin.y,
      author: persona,
      role,
      text,
      status: 'open',
      at: nowISO(),
      replies: []
    };
    drawing.comments.push(comment);
    drawing.updatedAt = nowISO();
    state.ui.pendingPin = null;
    state.ui.selectedComment = comment.id;
    state.ui.placeMode = false;
    if (box) box.value = '';
    logActivity(project, persona, 'commented on ' + drawing.name);
    save();
    render();
    toast('Comment ' + commentNo(drawing, comment) + ' added.');
  }

  function toggleResolve(ctx, id) {
    const c = ctx.drawing.comments.find((x) => x.id === id);
    if (!c) return;
    c.status = c.status === 'open' ? 'resolved' : 'open';
    ctx.drawing.updatedAt = nowISO();
    save();
    render();
    toast(c.status === 'open' ? 'Comment reopened.' : 'Comment marked resolved.');
  }

  function recordDecision(ctx, status, note) {
    const { project, drawing } = ctx;
    const v = currentVersion(drawing);
    drawing.decision = {
      status,
      by: project.client,
      at: nowISO(),
      version: v.n,
      note: note || '',
      fingerprint: status === 'approved' ? hash(project.id + drawing.id + v.n) : undefined
    };
    drawing.updatedAt = nowISO();
    logActivity(project, project.client, (status === 'approved' ? 'approved ' : 'requested changes on ') + drawing.name + ', Revision ' + String(v.n).padStart(2, '0'));
    save();
    render();
    toast(status === 'approved' ? 'Revision ' + String(v.n).padStart(2, '0') + ' approved. The studio has been notified (in a real build).' : 'Change request sent to the studio.');
  }

  function requestChanges(ctx) {
    openModal('' +
      '<div class="modal-head"><div><h2>Request changes</h2><p class="caption">' + esc(ctx.drawing.name) + ' · Revision ' + String(currentVersion(ctx.drawing).n).padStart(2, '0') + '</p></div>' +
      '<button class="icon-btn" data-act="close-modal" aria-label="Close">' + icon('x', 'sm') + '</button></div>' +
      '<div class="stack">' +
      '<div class="field"><label for="changeNote">What needs to change?</label>' +
      '<textarea id="changeNote" placeholder="For example: kitchen window clear width to be at least 1200 mm"></textarea></div>' +
      '<p class="hint">Your pinned comments are sent along with this note.</p>' +
      '<div class="row"><button class="btn btn-primary" data-act="submit-changes">Send to studio</button>' +
      '<button class="btn btn-ghost" data-act="close-modal">Cancel</button></div>' +
      '</div>');
  }

  function uploadRevision(projectId, drawingId) {
    const input = document.getElementById('revisionInput');
    if (!input) {
      // Coming from the project or versions tab: pull the viewer's input into place first.
      const p = getProject(projectId);
      location.hash = '#/projects/' + p.id + '/drawings/' + drawingId;
      setTimeout(() => uploadRevision(projectId, drawingId), 120);
      return;
    }
    input.dataset.project = projectId;
    input.dataset.drawing = drawingId;
    input.value = '';
    input.click();
  }

  function applyRevision(projectId, drawingId, file) {
    const project = getProject(projectId);
    const drawing = getDrawing(project, drawingId);
    if (!project || !drawing) return;
    const n = currentVersion(drawing).n + 1;
    const version = { n, at: nowISO(), by: TEAM.name, note: file ? file.name : 'New revision', size: file ? (file.size / 1048576).toFixed(1) + ' MB' : '2.0 MB' };
    if (file && file.type && file.type.indexOf('image/') === 0) {
      try { version.image = URL.createObjectURL(file); } catch (e) { /* preview only */ }
    }
    drawing.versions.push(version);
    drawing.updatedAt = nowISO();
    if (drawing.decision.status !== 'pending') {
      drawing.decision = { status: 'pending', by: null, at: null, version: n, note: '' };
    }
    logActivity(project, TEAM.name, 'uploaded Revision ' + String(n).padStart(2, '0') + ' of ' + drawing.name);
    save();
    render();
    toast('Revision ' + String(n).padStart(2, '0') + ' added. Earlier approval no longer applies.');
  }

  function downloadCommentSummary(drawing) {
    const lines = [
      'PlanReview AI — comment summary',
      'Drawing: ' + drawing.name + ' (sheet ' + drawing.sheet + ')',
      'Revision: ' + String(currentVersion(drawing).n).padStart(2, '0'),
      'Exported: ' + new Date().toLocaleString(),
      ''
    ];
    drawing.comments.forEach((c, i) => {
      lines.push((i + 1) + '. [' + c.status + '] ' + c.author + ' (' + c.role + ') · ' + fmtDateTime(c.at));
      lines.push('   ' + c.text);
      c.replies.forEach((r) => lines.push('   ↳ ' + r.author + ': ' + r.text));
      lines.push('');
    });
    if (drawing.decision.status !== 'pending') {
      lines.push('Decision: ' + drawing.decision.status + ' by ' + drawing.decision.by + ' on ' + fmtDateTime(drawing.decision.at));
      if (drawing.decision.note) lines.push('Note: ' + drawing.decision.note);
    }
    downloadText(drawing.name.replace(/\s+/g, '-').toLowerCase() + '-comments.txt', lines.join('\n'));
  }

  /* =========================================================
     15. Viewer interactions (zoom, pan, pin)
     ========================================================= */
  function applyTransform() {
    const stage = document.getElementById('canvasStage');
    if (!stage) return;
    stage.style.transform = 'translate(' + state.ui.panX + 'px,' + state.ui.panY + 'px) scale(' + state.ui.zoom + ')';
    const chip = document.getElementById('zoomChip');
    if (chip) chip.textContent = Math.round(state.ui.zoom * 100) + '%';
  }

  function initViewer() {
    const wrap = document.getElementById('canvasWrap');
    if (!wrap) return;
    applyTransform();
    const stage = document.getElementById('canvasStage');
    let drag = null;

    wrap.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.pin')) return;
      if (e.target.closest('.toolbar') || e.target.closest('.canvas-chip')) return;
      if (state.ui.placeMode) {
        const host = document.getElementById('drawingHost');
        if (!host) return;
        const r = host.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
          toast('Click inside the drawing to place the comment.');
          return;
        }
        state.ui.pendingPin = {
          x: clamp((e.clientX - r.left) / r.width, 0.02, 0.98),
          y: clamp((e.clientY - r.top) / r.height, 0.02, 0.98)
        };
        state.ui.placeMode = false;
        render();
        const box = document.getElementById('commentBox');
        if (box) box.focus();
        return;
      }
      drag = { x: e.clientX, y: e.clientY, panX: state.ui.panX, panY: state.ui.panY };
      stage.classList.add('grabbing');
      try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });

    wrap.addEventListener('pointermove', (e) => {
      if (!drag) return;
      state.ui.panX = drag.panX + (e.clientX - drag.x);
      state.ui.panY = drag.panY + (e.clientY - drag.y);
      applyTransform();
    });

    const endDrag = () => {
      drag = null;
      if (stage) stage.classList.remove('grabbing');
      if (wrap.hasPointerCapture && drag === null) {
        try { /* release happens automatically on pointerup */ } catch (e) { /* ignore */ }
      }
    };
    wrap.addEventListener('pointerup', endDrag);
    wrap.addEventListener('pointercancel', endDrag);
    wrap.addEventListener('pointerleave', endDrag);

    wrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = wrap.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const nz = clamp(state.ui.zoom * factor, 0.4, 3);
      const k = nz / state.ui.zoom;
      state.ui.panX = cx - (cx - state.ui.panX) * k;
      state.ui.panY = cy - (cy - state.ui.panY) * k;
      state.ui.zoom = nz;
      applyTransform();
    }, { passive: false });
  }

  function zoomBy(factor) {
    const wrap = document.getElementById('canvasWrap');
    const nz = clamp(state.ui.zoom * factor, 0.4, 3);
    if (wrap) {
      const rect = wrap.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const k = nz / state.ui.zoom;
      state.ui.panX = cx - (cx - state.ui.panX) * k;
      state.ui.panY = cy - (cy - state.ui.panY) * k;
    }
    state.ui.zoom = nz;
    applyTransform();
  }

  function resetZoom() {
    state.ui.zoom = 1;
    state.ui.panX = 0;
    state.ui.panY = 0;
    applyTransform();
  }

  function scrollToComment(id) {
    const el = document.querySelector('.comment[data-comment="' + id + '"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  /* =========================================================
     16. Event wiring
     ========================================================= */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    const projectId = el.dataset.project;
    const drawingId = el.dataset.drawing;

    if (act === 'close-modal' || act === 'scrim') {
      if (act === 'scrim' && e.target !== el) return;
      closeModal();
      return;
    }
    if (act === 'account') { accountModal(); return; }
    if (act === 'notifications') { notificationsModal(); return; }
    if (act === 'reset-demo') { resetDemo(); return; }

    if (act === 'open-project') {
      location.hash = '#/projects/' + el.dataset.id;
      return;
    }
    if (act === 'tab') {
      state.ui.tab = el.dataset.tab;
      render();
      return;
    }
    if (act === 'new-project') {
      toast('Creating projects is not part of the starter — the demo data is fixed. Reset to restore it.');
      return;
    }
    if (act === 'copy-client') {
      const p = getProject(projectId);
      copyText(p.email).then((ok) => toast(ok ? 'Client email copied.' : p.email));
      return;
    }

    const ctx = currentViewerContext();

    if (act === 'share') {
      e.preventDefault();
      const p = getProject(projectId);
      const d = getDrawing(p, drawingId);
      if (!d.share) {
        d.share = { token: (p.name.split(' ')[0] + '-' + d.sheet).toLowerCase() + '-' + Math.random().toString(36).slice(2, 6), expiry: isoIn(7 * DAY), allowComments: true, allowApproval: true, allowDownload: true, revoked: false, createdAt: nowISO() };
        logActivity(p, TEAM.name, 'created a client link for ' + d.name);
        save();
      }
      shareModal(p, d);
      return;
    }
    if (act === 'copy-link') {
      const link = el.dataset.link;
      copyText(link).then((ok) => toast(ok ? 'Copied to the clipboard.' : 'Select the text and copy it manually.'));
      return;
    }
    if (act === 'revoke') {
      const p = getProject(projectId);
      const d = getDrawing(p, drawingId);
      d.share.revoked = !d.share.revoked;
      logActivity(p, TEAM.name, (d.share.revoked ? 'revoked' : 're-enabled') + ' the client link for ' + d.name);
      save();
      closeModal();
      render();
      toast(d.share.revoked ? 'Client link revoked.' : 'Client link is active again.');
      return;
    }

    if (act === 'upload') {
      uploadRevision(projectId, drawingId);
      return;
    }
    if (act === 'nudge') {
      toast('Reminder queued (demo only, nothing is sent).');
      return;
    }
    if (act === 'download-summary') {
      if (ctx) downloadCommentSummary(ctx.drawing);
      return;
    }
    if (act === 'download-approvals') {
      const lines = ['PlanReview AI — approval log', 'Exported: ' + new Date().toLocaleString(), ''];
      allDrawings().forEach((r) => {
        const d = r.drawing.decision;
        lines.push(r.project.name + ' · ' + r.drawing.name + ' (sheet ' + r.drawing.sheet + ') — ' +
          (d.status === 'approved' ? 'approved by ' + d.by + ' on ' + fmtDate(d.at) + ' · Rev ' + String(d.version).padStart(2, '0') + ' · ' + (d.fingerprint || '') : 'no approval'));
      });
      downloadText('planreview-approval-log.txt', lines.join('\n'));
      return;
    }

    if (act === 'tool-pan') {
      state.ui.placeMode = false;
      render();
      return;
    }
    if (act === 'tool-pin') {
      state.ui.placeMode = !state.ui.placeMode;
      state.ui.pendingPin = null;
      render();
      if (state.ui.placeMode) toast('Click the drawing to drop a pin.');
      return;
    }
    if (act === 'zoom-in') { zoomBy(1.2); return; }
    if (act === 'zoom-out') { zoomBy(1 / 1.2); return; }
    if (act === 'zoom-reset') { resetZoom(); return; }

    if (act === 'pin' || act === 'select-comment') {
      state.ui.selectedComment = el.dataset.comment;
      render();
      scrollToComment(el.dataset.comment);
      return;
    }
    if (act === 'filter') {
      state.ui.commentFilter = el.dataset.filter;
      render();
      return;
    }
    if (act === 'reply') {
      state.ui.replyTo = el.dataset.comment;
      state.ui.pendingPin = null;
      render();
      const box = document.getElementById('commentBox');
      if (box) box.focus();
      return;
    }
    if (act === 'cancel-reply') {
      state.ui.replyTo = null;
      render();
      return;
    }
    if (act === 'add-comment') {
      if (ctx) addComment(ctx);
      return;
    }
    if (act === 'toggle-resolve') {
      if (ctx) toggleResolve(ctx, el.dataset.comment);
      return;
    }
    if (act === 'customer-approve') {
      if (ctx) recordDecision(ctx, 'approved', '');
      return;
    }
    if (act === 'customer-changes') {
      if (ctx) requestChanges(ctx);
      requestChanges._ctx = ctx;
      return;
    }
    if (act === 'submit-changes') {
      const box = document.getElementById('changeNote');
      const note = (box && box.value || '').trim();
      const c = requestChanges._ctx;
      if (!c) return;
      if (!note) { toast('Add a short note for the studio.'); if (box) box.focus(); return; }
      closeModal();
      recordDecision(c, 'changes', note);
      return;
    }
    if (act === 'open-customer') {
      closeModal();
      return;
    }
  });

  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;

    if (act === 'share-toggle') {
      const p = getProject(el.dataset.project);
      const d = getDrawing(p, el.dataset.drawing);
      d.share[el.dataset.key] = el.checked;
      save();
      return;
    }
    if (act === 'expiry') {
      const p = getProject(el.dataset.project);
      const d = getDrawing(p, el.dataset.drawing);
      d.share.expiry = isoIn(Number(el.value) * DAY);
      save();
      shareModal(p, d);
      toast('Link now expires in ' + el.value + ' days.');
      return;
    }
    if (act === 'insight-project') {
      state.ui.insightProject = el.value;
      render();
      return;
    }
    if (el.id === 'revisionInput') {
      const file = el.files && el.files[0];
      applyRevision(el.dataset.project, el.dataset.drawing, file);
      return;
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'globalSearch') {
      state.search = e.target.value;
      if (state.route.name !== 'dashboard') location.hash = '#/dashboard';
      else renderDashboardList();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalRoot.innerHTML) { closeModal(); return; }
      if (state.ui.placeMode || state.ui.pendingPin) { state.ui.placeMode = false; state.ui.pendingPin = null; render(); }
      return;
    }
    if ((e.key === 'Enter') && (e.metaKey || e.ctrlKey) && document.getElementById('commentBox')) {
      const ctx = currentViewerContext();
      if (ctx) addComment(ctx);
    }
  });

  function renderDashboardList() {
    // Keep focus in the search box while filtering: re-render only the project grid.
    if (state.route.name !== 'dashboard') { render(); return; }
    const grid = document.querySelector('.layout-2 .grid-2');
    if (!grid) { render(); return; }
    const projects = state.data.projects.filter((p) => {
      if (!state.search) return true;
      const q = state.search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q) || p.drawings.some((d) => d.name.toLowerCase().includes(q));
    });
    grid.innerHTML = projects.length ? projects.map(projectCard).join('') : '<div class="card empty-state">No project matches “' + esc(state.search) + '”.</div>';
  }

  /* =========================================================
     17. Router and boot
     ========================================================= */
  function parseRoute() {
    const raw = (location.hash || '#/dashboard').replace(/^#/, '');
    const parts = raw.split('/').filter(Boolean);
    if (parts[0] === 'projects' && parts[1]) {
      if (parts[2] === 'drawings' && parts[3]) return { name: 'viewer', projectId: parts[1], drawingId: parts[3] };
      return { name: 'project', projectId: parts[1] };
    }
    if (parts[0] === 'approvals') return { name: 'approvals' };
    if (parts[0] === 'insights') return { name: 'insights' };
    if (parts[0] === 'review' && parts[1]) return { name: 'review', token: parts[1] };
    return { name: 'dashboard' };
  }

  function resetViewerState() {
    state.ui.selectedComment = null;
    state.ui.placeMode = false;
    state.ui.pendingPin = null;
    state.ui.replyTo = null;
    state.ui.zoom = 1;
    state.ui.panX = 0;
    state.ui.panY = 0;
    state.ui.commentFilter = 'all';
  }

  function notFound(title, message) {
    return '<div class="customer-shell"><div class="customer-top"><span class="brand-mark">P</span><strong class="brand-name">PlanReview <span>AI</span></strong></div>' +
      '<div class="empty-state" style="margin:auto;max-width:480px"><h1 style="font-size:22px;margin-bottom:8px">' + esc(title) + '</h1>' +
      '<p class="muted">' + esc(message) + '</p><p style="margin-top:16px"><a class="btn btn-primary" href="#/dashboard">Back to dashboard</a></p></div></div>';
  }

  function render() {
    const r = state.route;
    if (r.name === 'review') {
      app.className = 'customer-shell';
      app.innerHTML = viewReview(r.token);
      initViewer();
      return;
    }

    app.className = 'app-shell';
    let html;
    if (r.name === 'project') {
      const p = getProject(r.projectId);
      html = p ? viewProject(p) : notFound('Project not found', 'This project is not in the demo data.');
    } else if (r.name === 'viewer') {
      const p = getProject(r.projectId);
      const d = p && getDrawing(p, r.drawingId);
      html = p && d ? viewViewer(p, d) : notFound('Drawing not found', 'This drawing is not in the demo data.');
    } else if (r.name === 'approvals') {
      html = viewApprovals();
    } else if (r.name === 'insights') {
      html = viewInsights();
    } else {
      html = viewDashboard();
    }
    app.innerHTML = html;
    initViewer();
  }

  function onRouteChange() {
    const next = parseRoute();
    const changed = JSON.stringify(next) !== JSON.stringify(state.route);
    state.route = next;
    if (changed) {
      resetViewerState();
      window.scrollTo(0, 0);
      const search = document.getElementById('globalSearch');
      if (search) search.value = state.search;
    }
    render();
  }

  function boot() {
    state.data = loadData();
    if (!state.data.projects.length) state.data = seedData();
    state.route = parseRoute();
    try {
      render();
    } catch (err) {
      app.innerHTML = notFound('Something went wrong', 'Open the browser console for the error. Resetting the demo data usually clears it.');
      throw err;
    }
    window.addEventListener('hashchange', onRouteChange);
  }

  // Exposed for quick console poking while you explore the code.
  window.PlanReview = {
    state,
    reset: resetDemo,
    seed: seedData
  };

  boot();
})();
