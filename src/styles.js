export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500;600&display=swap');

:root{
  --ink:#18211f; --ink-2:#2c3a36; --paper:#eaeee8; --card:#ffffff; --card-2:#f7faf6;
  --line:#dae1d9; --muted:#63726c; --sage:#3c7a67; --sage-deep:#2e5f50; --sage-soft:#e4efe9;
  --amber:#b87a33; --amber-soft:#f6e9d6; --clay:#a8493a; --clay-soft:#f3ddd7;
  --font-display:'Fraunces',Georgia,serif; --font-body:'Hanken Grotesk',system-ui,sans-serif;
  --font-mono:'Spline Sans Mono',ui-monospace,monospace; --r:16px;
}
*{box-sizing:border-box;}
body{margin:0; background:var(--paper); color:var(--ink); font-family:var(--font-body); font-size:14px; line-height:1.45; -webkit-font-smoothing:antialiased;}
button{font-family:inherit; cursor:pointer; border:none; background:none; color:inherit;}
input,select{font-family:inherit;}
h2{font-family:var(--font-display); font-weight:500; font-size:24px; margin:0; letter-spacing:-.01em;}
h3{font-family:var(--font-body); font-weight:600; font-size:14px; margin:0; letter-spacing:.01em;}
.muted{color:var(--muted);} .block{display:block;}

.boot{min-height:100vh; display:grid; place-items:center;}
.brand-mark{width:38px; height:38px; border-radius:11px; background:var(--sage-deep); color:#fff;
  display:grid; place-items:center; font-family:var(--font-display); font-size:22px; box-shadow:0 4px 14px rgba(46,95,80,.28);}

/* figures — signature ledger treatment */
.fig{font-family:var(--font-mono); font-weight:500; font-variant-numeric:tabular-nums; letter-spacing:-.01em;}
.fig .cents{font-size:.74em; opacity:.55; margin-left:.5px;}
.fig-big{font-family:var(--font-display); font-weight:500; font-size:46px; line-height:1; letter-spacing:-.02em; color:var(--ink);}
.fig-big .cents{font-size:.42em; opacity:.5;}
.neg{color:var(--clay);} .up{color:var(--sage-deep);} .down{color:var(--clay);}

/* auth */
.auth-wrap{min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; padding:24px;}
.auth-card{background:var(--card); border:1px solid var(--line); border-radius:20px; padding:30px; width:100%; max-width:400px; box-shadow:0 16px 50px rgba(24,33,31,.10);}
.auth-brand{display:flex; gap:11px; align-items:center; margin-bottom:18px;}
.brand-name{font-family:var(--font-display); font-weight:600; font-size:18px;}
.brand-sub{font-size:11px; color:var(--muted); letter-spacing:.04em; text-transform:uppercase;}
.auth-card h2{font-size:21px; margin-bottom:2px;}
.auth-mode{font-size:12px; margin:0 0 16px;}
.auth-err{background:var(--clay-soft); color:var(--clay); border-radius:9px; padding:9px 12px; font-size:12.5px;}
.auth-switch{font-size:13px; text-align:center; margin:16px 0 0; color:var(--muted);}
.auth-foot{font-size:12px;}
.social-row{display:flex; flex-direction:column; gap:9px; margin-bottom:6px;}
.btn.social{background:var(--card); color:var(--ink); border:1px solid var(--line); justify-content:center; padding:11px; font-weight:600;}
.btn.social:hover{background:var(--card-2);}
.divider{display:flex; align-items:center; gap:10px; color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.06em; margin:14px 0 4px;}
.divider::before,.divider::after{content:""; flex:1; height:1px; background:var(--line);}

/* layout */
.tally-root{display:flex; min-height:100vh;}
.sidebar{width:222px; flex:0 0 222px; padding:22px 14px; border-right:1px solid var(--line);
  background:linear-gradient(180deg,#fff,#fbfdfb); display:flex; flex-direction:column; gap:6px; position:sticky; top:0; height:100vh;}
.brand{display:flex; gap:11px; align-items:center; padding:4px 8px 20px;}
.nav-item{display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:11px; font-weight:500; color:var(--ink-2); width:100%; text-align:left; transition:background .15s,color .15s; position:relative;}
.nav-item:hover{background:var(--sage-soft);}
.nav-item.active{background:var(--sage-soft); color:var(--sage-deep); font-weight:600;}
.nav-item.active::before{content:""; position:absolute; left:0; top:9px; bottom:9px; width:3px; border-radius:3px; background:var(--sage-deep);}
.signout{margin-top:auto; color:var(--muted);}

.content{flex:1; min-width:0; display:flex; flex-direction:column;}
.topbar{display:flex; justify-content:space-between; align-items:center; gap:14px; padding:16px 30px; border-bottom:1px solid var(--line); background:rgba(255,255,255,.6); backdrop-filter:blur(6px); position:sticky; top:0; z-index:5; flex-wrap:wrap;}
.month-nav{display:flex; align-items:center; gap:8px;}
.month-label{font-family:var(--font-display); font-size:18px; font-weight:500; min-width:150px; text-align:center;}
.topbar-right{display:flex; align-items:center; gap:14px; flex-wrap:wrap;}
.icon-btn{width:34px; height:34px; border-radius:10px; display:grid; place-items:center; color:var(--ink-2); transition:background .15s;}
.icon-btn:hover{background:var(--sage-soft);}
.icon-btn.ghost{width:30px; height:30px; color:var(--muted);}
.nw-pill{font-size:13px; color:var(--muted); display:flex; gap:8px; align-items:center;}
.nw-pill .fig{color:var(--ink); font-size:15px;}
.view{padding:26px 30px 96px; max-width:1180px; width:100%;}

.scope-switch{display:inline-flex; background:var(--card-2); border:1px solid var(--line); border-radius:10px; padding:3px;}
.scope-switch button{padding:5px 12px; border-radius:8px; font-size:12px; font-weight:600; color:var(--muted);}
.scope-switch button.active{background:var(--sage-deep); color:#fff;}

.grid{display:grid; grid-template-columns:repeat(3,1fr); gap:18px;}
.span-2{grid-column:span 2;}
.stack{display:flex; flex-direction:column; gap:18px;}
.row-gap{display:flex; gap:10px; align-items:center;} .wrap{flex-wrap:wrap;}
.section-head{display:flex; justify-content:space-between; align-items:flex-end; gap:16px; flex-wrap:wrap;}
.section-head p{margin:4px 0 0; font-size:13px;}

.card{background:var(--card); border:1px solid var(--line); border-radius:var(--r); padding:20px; box-shadow:0 1px 2px rgba(24,33,31,.03);}
.card-head{display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;}
.card-sub{font-size:12px; color:var(--muted); margin-left:2px;}
.kicker{font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); margin-bottom:8px;}
.link-btn{font-size:12px; color:var(--sage-deep); font-weight:600;}
.link-btn:hover{text-decoration:underline;}

.hero{position:relative; overflow:hidden;}
.hero-rule{position:absolute; inset:0; pointer-events:none; opacity:.5; background-image:repeating-linear-gradient(180deg,transparent,transparent 27px,var(--line) 27px,var(--line) 28px); -webkit-mask-image:linear-gradient(180deg,#000,transparent 70%);}
.hero-grid{display:flex; justify-content:space-between; align-items:center; gap:20px; position:relative;}
.hero-sub{display:flex; gap:16px; margin-top:12px; font-size:13px; font-weight:500;}
.hero-sub span{display:flex; align-items:center; gap:4px;}
.hero-stats{display:flex; gap:26px;}
.stat{text-align:right;}
.stat-label{font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.05em;}
.stat-value{font-family:var(--font-mono); font-weight:500; font-size:17px; margin-top:3px; font-variant-numeric:tabular-nums;}

.mini-row{display:flex; justify-content:space-between; align-items:center; padding:9px 0; border-bottom:1px solid var(--line); font-size:13px;}
.mini-row:last-child{border-bottom:none;}
.mini-row.total{font-weight:600; border-top:1.5px solid var(--ink); margin-top:4px; padding-top:11px;}
.mini-row.total .fig{font-size:16px;}
.dot{width:9px; height:9px; border-radius:50%; display:inline-block; margin-right:7px; vertical-align:middle;}
.dot.sm{width:7px; height:7px; margin-right:6px;}

.prog-row{margin-bottom:14px;}
.prog-top{display:flex; align-items:center; gap:6px; margin-bottom:6px; font-size:13px;}
.prog-name{font-weight:500;} .prog-num{margin-left:auto; font-family:var(--font-mono); font-size:12px; font-variant-numeric:tabular-nums;}
.prog-num small{color:var(--muted);}
.bar{height:8px; border-radius:6px; background:var(--sage-soft); overflow:hidden;}
.bar.slim{height:6px;}
.bar-fill{height:100%; border-radius:6px; transition:width .4s ease;}

.tx-row{display:flex; align-items:center; gap:8px; padding:9px 0; border-bottom:1px solid var(--line); font-size:13px;}
.tx-row:last-child{border-bottom:none;}
.tx-meta{flex:1; min-width:0;} .tx-meta div{overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
.tx-meta small{color:var(--muted); font-size:11px;}
.tx-row .fig{margin-left:auto;}

.bill-row{display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--line); font-size:13px;}
.bill-row:last-child{border-bottom:none;}
.bill-row.big{padding:13px 0;}
.bill-date{width:46px; flex:0 0 46px; text-align:center; background:var(--sage-soft); border-radius:10px; padding:6px 0;}
.bill-date span{font-family:var(--font-display); font-size:18px; font-weight:600; display:block; line-height:1; color:var(--sage-deep);}
.bill-date small{font-size:10px; text-transform:uppercase; color:var(--muted); letter-spacing:.05em;}
.bill-meta{flex:1; min-width:0;}
.bill-name{font-weight:600; display:flex; align-items:center; gap:7px; flex-wrap:wrap;}
.bill-sub{font-size:11px; color:var(--muted); text-transform:capitalize;}
.bill-row .fig{margin-left:auto;}

.tag{font-size:10px; padding:2px 7px; border-radius:20px; background:var(--paper); color:var(--muted); display:inline-flex; align-items:center; gap:3px; font-weight:600;}
.tag-sage{background:var(--sage-soft); color:var(--sage-deep);}
.tag-ok{background:var(--sage-soft); color:var(--sage-deep);}

.cal-head{display:grid; grid-template-columns:repeat(7,1fr); text-align:center; font-size:11px; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:.05em; margin-bottom:8px;}
.cal-grid{display:grid; grid-template-columns:repeat(7,1fr); gap:5px;}
.cal-cell{min-height:78px; border:1px solid var(--line); border-radius:9px; padding:5px; background:var(--card-2); display:flex; flex-direction:column; gap:3px;}
.cal-cell.blank{background:transparent; border:none;}
.cal-cell.today{border-color:var(--sage); box-shadow:inset 0 0 0 1px var(--sage);}
.cal-day{font-size:11px; color:var(--muted); font-weight:600; font-family:var(--font-mono);}
.cal-cell.today .cal-day{color:var(--sage-deep);}
.cal-bill{background:var(--paper); border-radius:6px; padding:3px 5px; text-align:left; font-size:10px; line-height:1.2; border-left:3px solid var(--muted); transition:transform .1s;}
.cal-bill:hover{transform:translateY(-1px);}
.cal-bill.auto{border-left-color:var(--sage); background:var(--sage-soft);}
.cal-bill-name{display:block; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
.cal-bill-amt{display:block; color:var(--muted); font-family:var(--font-mono);}
.cal-legend{display:flex; gap:18px; margin-top:12px; font-size:11px; color:var(--muted);}
.cal-legend span{display:flex; align-items:center; gap:6px;}
.cal-legend .lg{width:14px; height:8px; border-radius:3px; background:var(--paper); border-left:3px solid var(--muted);}
.cal-legend .lg.auto{background:var(--sage-soft); border-left-color:var(--sage);}

.method-banner{display:flex; justify-content:space-between; align-items:center; gap:18px; flex-wrap:wrap; border-left:4px solid var(--amber);}
.method-banner.ok{border-left-color:var(--sage);} .method-banner.bad{border-left-color:var(--clay);}
.method-banner p{margin:0; max-width:320px; font-size:13px;}
.cat-row{display:flex; align-items:center; gap:9px; padding:7px 0;}
.cat-name{font-weight:500;} .cat-spacer{flex:1;}
.bucket-tag{font-size:10px; padding:1px 7px; border-radius:5px; background:var(--paper); color:var(--muted); text-transform:capitalize;}
.cat-block{border-bottom:1px solid var(--line); padding:8px 0;}
.cat-block:last-child{border-bottom:none;}
.cat-foot{display:flex; align-items:center; gap:12px; padding-left:18px; margin-top:2px;}
.cat-foot .bar{flex:1;}
.remaining{font-size:11px; color:var(--muted); white-space:nowrap; font-family:var(--font-mono);}
.budget-input{display:inline-flex; align-items:center; background:var(--card-2); border:1px solid var(--line); border-radius:8px; padding:3px 8px; gap:2px;}
.budget-input .ccy{color:var(--muted); font-family:var(--font-mono);}
.budget-input input{width:64px; border:none; background:none; text-align:right; font-family:var(--font-mono); font-size:13px; outline:none; font-variant-numeric:tabular-nums;}

.table{display:flex; flex-direction:column;}
.trow{display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--line); font-size:13px;}
.trow:last-child{border-bottom:none;}
.trow.thead{font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; font-weight:600; border-bottom:1.5px solid var(--line);}
.tcell{display:flex; align-items:center;}
.tgrow{flex:1; min-width:0; flex-direction:column; align-items:flex-start; gap:0;}
.tdate{width:46px; flex:0 0 46px; font-family:var(--font-mono); color:var(--muted);}
.tnum{width:90px; flex:0 0 90px; justify-content:flex-end; text-align:right; font-family:var(--font-mono); font-variant-numeric:tabular-nums;}

.goal-card{display:flex; flex-direction:column; gap:10px;}
.goal-top{display:flex; justify-content:space-between; align-items:flex-start;}
.goal-top h3{font-family:var(--font-display); font-size:17px; font-weight:600;}
.goal-fig{font-size:15px;}
.goal-foot{display:flex; justify-content:space-between; align-items:center; font-size:12px;}

.connect-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:18px;}
.connect-card{display:flex; flex-direction:column; gap:9px;}
.connect-card.on{border-color:var(--sage); box-shadow:0 0 0 1px var(--sage-soft);}
.connect-top{display:flex; justify-content:space-between; align-items:center;}
.connect-icon{width:40px; height:40px; border-radius:11px; background:var(--sage-soft); color:var(--sage-deep); display:grid; place-items:center;}
.status{font-size:11px; font-weight:600; color:var(--muted); padding:3px 9px; border-radius:20px; background:var(--paper);}
.status.ok{background:var(--sage-soft); color:var(--sage-deep);}
.connect-card h3{font-family:var(--font-display); font-size:17px; font-weight:600;}
.blurb{font-size:13px; margin:0;} .detail{font-size:12px; margin:0; flex:1;}
.connect-card .btn,.partner-card .btn{margin-top:6px;}
.partner-card{display:flex; flex-direction:column; gap:9px;}
.partner-card h3{font-family:var(--font-display); font-size:17px; font-weight:600;}
.join-box{display:inline-flex; gap:6px; align-items:center;}
.join-box input{border:1px solid var(--line); border-radius:9px; padding:8px 11px; font-size:13px; background:var(--card-2); width:150px;}
.pref-row{display:flex; justify-content:space-between; align-items:center; padding:11px 0; border-bottom:1px solid var(--line); font-size:13px;}
.pref-row:last-child{border-bottom:none;}
.note{display:flex; gap:12px; align-items:flex-start; background:var(--amber-soft); border-color:#e8d3b0; color:var(--ink-2);}
.note p{margin:0; font-size:12.5px;} .note svg{flex:0 0 auto; margin-top:2px; color:var(--amber);}

.btn{display:inline-flex; align-items:center; gap:7px; background:var(--sage-deep); color:#fff; font-weight:600; padding:9px 15px; border-radius:10px; font-size:13px; transition:transform .1s,background .15s; white-space:nowrap;}
.btn:hover{background:var(--sage);} .btn:active{transform:translateY(1px);}
.btn:disabled{opacity:.6; cursor:default;}
.btn.ghost{background:var(--card); color:var(--ink-2); border:1px solid var(--line);}
.btn.ghost:hover{background:var(--sage-soft); border-color:var(--sage-soft);}
.btn.sm{padding:6px 11px; font-size:12px;}
.btn.full{width:100%; justify-content:center; padding:11px;}
.select{border:1px solid var(--line); background:var(--card); border-radius:9px; padding:8px 11px; font-size:13px; color:var(--ink);}
.empty{font-size:12px; color:var(--muted); padding:10px 0;}
.spin{animation:spin 1s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}

.overlay{position:fixed; inset:0; background:rgba(24,33,31,.4); backdrop-filter:blur(3px); display:grid; place-items:center; z-index:50; padding:18px;}
.modal{background:var(--card); border-radius:18px; padding:26px; width:100%; max-width:440px; position:relative; box-shadow:0 24px 60px rgba(24,33,31,.28); max-height:90vh; overflow:auto;}
.modal-x{position:absolute; top:14px; right:14px;}
.form{display:flex; flex-direction:column; gap:13px;}
.form h3{font-family:var(--font-display); font-size:20px; font-weight:600; margin-bottom:2px;}
.form label{display:flex; flex-direction:column; gap:5px; font-size:12px; font-weight:600; color:var(--ink-2);}
.form input,.form select{border:1px solid var(--line); border-radius:9px; padding:9px 11px; font-size:14px; background:var(--card-2); color:var(--ink); outline:none; font-weight:400;}
.form input:focus,.form select:focus{border-color:var(--sage); background:#fff;}
.form-row{display:flex; gap:10px;} .form-row label{flex:1;}
.amt-input{display:flex; gap:6px;} .amt-input select{width:52px;} .amt-input input{flex:1;}
.check{flex-direction:row !important; align-items:center; gap:8px !important; font-weight:500 !important;}
.check input{width:auto;}
.swatches{display:flex; gap:8px; flex-wrap:wrap;}
.swatch{width:26px; height:26px; border-radius:8px; border:2px solid transparent;}
.swatch.sel{border-color:var(--ink); transform:scale(1.12);}
.modal-actions{display:flex; gap:10px;}
.seg{display:flex; background:var(--card-2); border:1px solid var(--line); border-radius:10px; padding:3px;}
.seg button{flex:1; padding:8px; border-radius:8px; font-size:12.5px; font-weight:600; color:var(--muted);}
.seg button.active{background:var(--sage-deep); color:#fff;}
.custom-recur label{flex:1;}
.cal-bill.income{border-left-color:#1f7a55; background:#e7f2ec;}
.cal-bill.income .cal-bill-amt{color:#1f7a55; font-weight:600;}
.cal-legend .lg.income{background:#e7f2ec; border-left-color:#1f7a55;}
.bill-date.in{background:#e7f2ec;}
.bill-date.in span{color:#1f7a55;}
.popup-ad{max-width:380px; text-align:center;}
.popup-ad .ad-tag{position:absolute; top:14px; left:14px;}
.popup-ad-body{display:flex; flex-direction:column; align-items:center; gap:6px; padding:22px 6px 16px; color:var(--sage-deep);}
.popup-ad-body h3{font-family:var(--font-display); font-size:20px; color:var(--ink);}
.popup-ad-body p{margin:0; font-size:13px;}
.popup-ad .btn.full{margin-top:6px;}

/* onboarding */
.onb-root{display:block;}
.onb-wrap{min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:24px;}
.onb-card{background:var(--card); border:1px solid var(--line); border-radius:20px; padding:30px; width:100%; max-width:460px; box-shadow:0 16px 50px rgba(24,33,31,.10);}
.onb-head{display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px;}
.onb-card h2{font-size:23px; margin-bottom:4px;}
.onb-sub{font-size:13px; margin:0 0 18px;}
.onb-income{display:flex; align-items:center; gap:6px; border-bottom:2px solid var(--line); padding-bottom:8px; margin-bottom:16px;}
.onb-income:focus-within{border-color:var(--sage);}
.big-ccy{font-family:var(--font-display); font-size:34px; color:var(--muted);}
.big-input{flex:1; border:none; outline:none; background:none; font-family:var(--font-display); font-size:40px; font-weight:500; color:var(--ink); width:100%;}
.freq-row{display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;}
.freq-pill{padding:8px 14px; border-radius:20px; border:1px solid var(--line); background:var(--card-2); font-size:13px; font-weight:600; color:var(--muted);}
.freq-pill.active{background:var(--sage-deep); color:#fff; border-color:var(--sage-deep);}
.onb-hint{font-size:13px; margin:0 0 18px;}
.onb-card .btn.full{margin-top:6px;}
.onb-items{display:flex; flex-direction:column; gap:4px; margin-bottom:16px; max-height:46vh; overflow:auto;}
.onb-item{display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 0; border-bottom:1px solid var(--line);}
.onb-item-name{font-weight:500; display:flex; align-items:center; gap:8px;}
.onb-summary{display:flex; justify-content:space-between; gap:8px; font-size:12px; font-weight:600; background:var(--card-2); border:1px solid var(--line); border-radius:10px; padding:10px 12px; margin-bottom:14px;}
.onb-summary .up{color:var(--sage-deep);}

/* paywall */
.paywall{gap:11px;}
.paywall-badge{display:inline-flex; align-items:center; gap:6px; align-self:flex-start; background:var(--sage-soft); color:var(--sage-deep); padding:5px 11px; border-radius:20px; font-size:12px; font-weight:700;}
.paywall h3{font-family:var(--font-display); font-size:21px; font-weight:600;}
.paywall-list{list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:9px;}
.paywall-list li{display:flex; align-items:center; gap:9px; font-size:13.5px;}
.paywall-list svg{color:var(--sage-deep); flex:0 0 auto;}
.paywall-price{font-size:13px; color:var(--muted); text-align:center; padding:6px 0;}
.paywall-price strong{color:var(--ink); font-size:16px;}
.paywall-note{font-size:11px; text-align:center; margin:2px 0 0;}
.link-btn.center{display:block; margin:0 auto; text-align:center;}

/* ads */
.ad-slot{display:flex; align-items:center; gap:12px; background:repeating-linear-gradient(135deg,var(--card-2),var(--card-2) 10px,#f1f4ef 10px,#f1f4ef 20px); border:1px dashed var(--line); border-radius:12px; padding:12px 14px; margin-bottom:18px;}
.ad-tag{font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); border:1px solid var(--line); border-radius:5px; padding:2px 6px; background:var(--card);}
.ad-body{flex:1; font-size:13px; color:var(--ink-2);}
.ad-remove{display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; color:var(--sage-deep); white-space:nowrap;}
.ad-remove:hover{text-decoration:underline;}

/* plan + premium */
.plan-card{display:flex; flex-direction:column; gap:9px;}
.plan-card h3{font-family:var(--font-display); font-size:17px; font-weight:600;}
.plan-card.premium{border-color:var(--sage); box-shadow:0 0 0 1px var(--sage-soft);}
.go-premium{color:var(--amber); font-weight:600;}
.go-premium:hover{background:var(--amber-soft);}

.bottombar{display:none;}
@media(max-width:860px){
  .tally-root{flex-direction:column;}
  .sidebar{display:none;}
  .grid,.connect-grid{grid-template-columns:1fr;}
  .span-2{grid-column:span 1;}
  .view{padding:20px 16px 96px;}
  .topbar{padding:12px 16px;}
  .hero-grid{flex-direction:column; align-items:flex-start;}
  .hero-stats{gap:18px;}
  .nw-pill{font-size:11px;} .nw-pill .fig{font-size:13px;}
  .scope-switch button{padding:5px 9px;}
  .bottombar{display:flex; position:fixed; bottom:0; left:0; right:0; background:#fff; border-top:1px solid var(--line); justify-content:space-around; padding:8px 4px calc(8px + env(safe-area-inset-bottom)); z-index:40;}
  .bottombar button{display:flex; flex-direction:column; align-items:center; gap:3px; font-size:10px; color:var(--muted); padding:4px 4px; flex:1;}
  .bottombar button.active{color:var(--sage-deep);}
}
@media(prefers-reduced-motion:reduce){ *{transition:none !important; animation:none !important;} }
`;
