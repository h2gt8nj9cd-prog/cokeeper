import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./App.css";
import {
  BellIcon,
  MenuIcon,
  ChevronDown,
  ChevronRight,
  ScheduleIcon,
  ViewAgendaIcon,
  CalendarDotIcon,
  ChevronRightSmall,
  SunIcon,
  MoonIcon,
  PlusIcon,
} from "./icons.jsx";

/* ---------------- Static prototype data ---------------- */
const WEEK = [
  { d: "S", n: 24, wk: "sun" },
  { d: "M", n: 25 },
  { d: "T", n: 26 },
  { d: "W", n: 27 },
  { d: "T", n: 28 },
  { d: "F", n: 29 },
  { d: "S", n: 30, wk: "sat" },
];

const ROUTINE_CARDS = [
  {
    title: "클렌징 후 토너",
    summary: "클렌징 후 토너를 사용합니다",
    img: "/img/search/p03.png",
    // steps: 각 단계 = 런 배열 [텍스트, 강조여부(1=검정/0=흐림)] — Figma 293:7419 강조 패턴
    steps: [
      [["솜", 1], ["에 토너를 적셔줍니다", 0]],
      [["피부결", 1], ["을 따라 가볍게 닦아줍니다", 0]],
      [["가볍게 두드려", 1], [" 흡수 시켜줍니다", 0]],
    ],
  },
  {
    title: "비타민 앰플",
    summary: "비타민 앰플을 색조침착 부분에 도포합니다",
    img: "/img/search/p02.png",
    steps: [
      [["흔적케어", 1], ["가 필요한 부분에 도포합니다", 0]],
      [["손으로 ", 0], ["가볍게 두드려", 1], [" 흡수 시켜줍니다", 0]],
    ],
  },
  {
    title: "수분 크림",
    summary: "피부진정을 위한 시카 크림을 발라줍니다",
    img: "/img/search/p09.png",
    steps: [
      [["얼굴에 고르게 발라줍니다", 0]],
      [["가볍게 ", 0], ["마사지하듯 흡수", 1], [" 시켜줍니다", 0]],
    ],
  },
  {
    title: "선크림 (선택)",
    summary: "마지막으로 자외선 차단제를 충분히 바릅니다",
    img: "/img/prod_purito.png",
    steps: [
      [["외출 30분 전에 얼굴에 충분히 도포합니다", 0]],
      [["목과 귀에도 잊지 말고 발라줍니다", 0]],
    ],
  },
];

// 현재 서버(기기) 시간 기준 시간대 섹션
function currentSection() {
  const h = new Date().getHours();
  if (h >= 6 && h < 18) return "아침"; // 06:00~17:59 (점심 포함)
  if (h >= 18 && h < 23) return "저녁"; // 18:00~22:59
  return "자기 전"; // 23:00~05:59
}
// 시계형 루틴 — 시간대별 카드(상품 이미지 + 단계). 아침은 위 ROUTINE_CARDS 재사용
const SCHEDULE_ROUTINES = {
  아침: ROUTINE_CARDS,
  저녁: [
    { title: "저자극 클렌징", img: "/img/search/p53.png", steps: [[["미온수", 1], ["로 얼굴을 적셔줍니다", 0]], [["거품을 충분히 내", 1], [" 부드럽게 세안합니다", 0]]] },
    { title: "진정 토너", img: "/img/search/p03.png", steps: [[["화장솜", 1], ["에 토너를 적셔 결을 정돈해요", 0]], [["가볍게 두드려", 1], [" 흡수시켜줍니다", 0]]] },
    { title: "수분 앰플", img: "/img/search/p07.png", steps: [[["건조한 부위", 1], ["에 앰플을 도포합니다", 0]], [["손끝으로 ", 0], ["가볍게 흡수", 1], [" 시켜줍니다", 0]]] },
    { title: "나이트 크림", img: "/img/search/p24.png", steps: [[["얼굴 전체에 고르게 발라줍니다", 0]], [["목까지 ", 0], ["마사지하듯 흡수", 1], [" 시켜줍니다", 0]]] },
  ],
  "자기 전": [
    { title: "수분 수면팩", img: "/img/search/p29.png", steps: [[["자기 전 ", 0], ["얇게 펴 발라줍니다", 1]], [["다음 날 아침 ", 0], ["미온수로 헹궈냅니다", 0]]] },
    { title: "아이 크림", img: "/img/search/p11.png", steps: [[["눈가", 1], ["에 소량을 톡톡 얹어줍니다", 0]], [["약지로 ", 0], ["부드럽게 흡수", 1], [" 시켜줍니다", 0]]] },
  ],
};

// 내 화장대의 실제 제품과 연결된 루틴 — 상세 "포함된 루틴"에 노출
const ROUTINE_INFO = {
  name: "데일리 수분 루틴",
  time: "저녁 루틴",
  steps: [
    { step: "토너", brand: "샘유", name: "PH 센시티브 토너패드", tags: [["토너", "toner"]], img: "/img/search/p03.png" },
    { step: "앰플", brand: "마몽드", name: "아줄렌 카밍샷 앰플", tags: [["앰플", "ampoule"]], img: "/img/search/p02.png" },
    { step: "수분크림", brand: "일리윤", name: "히알루론 수분크림", tags: [["크림", "cream"]], img: "/img/search/p09.png" },
  ],
};
const ROUTINE_MEMBER_NAMES = new Set(ROUTINE_INFO.steps.map((s) => s.name));
function routineForProduct(p) {
  return p && ROUTINE_MEMBER_NAMES.has(p.name) ? ROUTINE_INFO : null;
}

const WEATHER_PRODUCTS = [
  { brand: "토니모리", name: "그린티 수분 크림", tags: [["크림", "cream"]], img: "/img/prod_tonymoly.png" },
  { brand: "에스네이처", name: "아쿠아 스쿠알란 수분크림", tags: [["크림", "cream"], ["기능성", "func"]], img: "/img/prod_esnature.png" },
  { brand: "토리든", name: "저분자 히알루론산 앰플", tags: [["앰플", "ampoule"]], img: "/img/prod_torriden.png" },
  { brand: "퓨리토 서울", name: "모이스처 펜타놀 크림", tags: [["크림", "cream"]], img: "/img/prod_purito.png" },
  { brand: "라운드랩", name: "자작나무 수분토너", tags: [["토너", "toner"]], img: "/img/prod_roundlab.png" },
  { brand: "크리스마", name: "PH 모이스처 카밍토너", tags: [["토너", "toner"]], img: "/img/prod_krisma.png" },
];

const FIRST_USE = [
  { name: "유통기한이 얼마 남지 않았어요", badge: "2주", img: "/img/fu_2weeks.png" },
  { name: "비타민 앰플과 조합이 좋아요", badge: "6개월", img: "/img/fu_6months.png" },
  { name: "개봉한 지 오래됐어요 지금 쓰세요", badge: "1주", img: "/img/prod_torriden.png" },
  { name: "요즘 날씨에 딱 맞는 수분크림", badge: "1개월", img: "/img/prod_tonymoly.png" },
  { name: "아침 루틴에 더해보면 좋아요", badge: "3개월", img: "/img/prod_roundlab.png" },
  { name: "한동안 안 쓴 제품이에요", badge: "5개월", img: "/img/prod_esnature.png" },
];

// 카운트다운 "해당 제품" 드롭다운 — 열림 상태에 표시되는 유통기한 임박 제품 리스트
// 해당 제품 = 가장 임박한(유통기한 얼마 안 남은) 제품들
// 곧 폐기예정(임박) 제품 — 유통기한 얼마 안 남은 것만 (모두 코랄 뱃지)
const EXPIRING_USE = [
  { name: "유통기한이 얼마 남지 않았어요", badge: "3일", img: "/img/prod_torriden.png" },
  { name: "몸에 발라서 바디에 활용해요", badge: "5일", img: "/img/fu_2weeks.png" },
  { name: "솜을 적셔 앰플팩으로 사용해요", badge: "1주", img: "/img/prod_tonymoly.png" },
  { name: "개봉한 지 오래됐어요 지금 쓰세요", badge: "2주", img: "/img/prod_esnature.png" },
];
// 해당 제품 = 가장 임박한(유통기한 얼마 안 남은) 제품들
const EXPIRING = [
  { brand: "이지듀", name: "MD 보습크림", tag: "크림", tagType: "cream", period: "3일 남음", img: "/img/search/p18.png" },
  { brand: "메디힐", name: "콜라겐 퍼밍 패드", tag: "토너", tagType: "toner", period: "3일 남음", img: "/img/search/p27.png" },
];

/* ---------------- Drag-to-scroll (마우스로 캐러셀 스와이프) ---------------- */
function useDragScroll() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let down = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;
    const onDown = (e) => {
      down = true;
      moved = false;
      startX = e.pageX;
      startScroll = el.scrollLeft;
      el.style.cursor = "grabbing";
    };
    const onMove = (e) => {
      if (!down) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > 4) moved = true;
      el.scrollLeft = startScroll - dx;
    };
    const onUp = () => {
      down = false;
      el.style.cursor = "";
    };
    const onClick = (e) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
    };
  }, []);
  return ref;
}

/* ---------------- Flip clock ---------------- */
// 새로고침 시 고정으로 안착하는 사용기한 값
const COUNTDOWN = { months: 0, days: 3, hours: 19 }; // 00 / 3일 / 19시 (가장 임박 제품 기준)
// 진입 시 각 칸이 5번 굴러 내려와 안착 (오른쪽→왼쪽 순차 시작)
const ROLLS = { months: 5, days: 5, hours: 5 };
const ROLL_STAGGER = 25; // 칸 사이 시작 간격(ms) — 아주 미세하게만 어긋나 멈춘 카드 없이 촤라라
const FLIP_SPEED = 2; // 재생 배속 계수 (0.5배속 — 앞은 빠르고 끝으로 갈수록 감속하며 안착)

const pad2 = (n) => String(((n % 100) + 100) % 100).padStart(2, "0");

// 마운트 시 (value+rolls) → value 로 스플릿플랩을 촤라라라 굴려 안착시키는 한 칸
function FlipUnit({ value, label, rolls = 10, onValue, startDelay = 0, dim = false }) {
  const start = value + rolls; // 시작 표시값
  const [cur, setCur] = useState(start);
  const [prev, setPrev] = useState(start);
  const [flip, setFlip] = useState(false);
  const [fd, setFd] = useState(0.09); // 접힘 지속시간(초) — 롤 중엔 짧게

  useEffect(() => {
    // 시퀀스: start → value (1씩 감소)
    const seq = [];
    for (let k = rolls; k >= 0; k--) seq.push(value + k);
    let i = 0;
    let alive = true;
    const timers = [];
    onValue && onValue(seq[0]);

    const tick = () => {
      if (!alive || i >= seq.length - 1) return;
      const from = seq[i];
      const to = seq[i + 1];
      // ease-out: 뒤로 갈수록 느려지며 "촤라라…탁 탁" 안착
      const p = i / Math.max(1, seq.length - 2); // 0..1
      // 살짝 느리게 + 끝쪽 감속 강화 (초반 빠르고 마지막 몇 칸이 또렷하게 느려짐)
      const d = (78 + Math.round(240 * Math.pow(p, 3))) * FLIP_SPEED; // ms: 78 → ~318 (×배속)
      setFd((d / 1000) * 0.5); // 두 단계(위/아래) 합쳐 d가 되도록
      setPrev(from);
      setCur(to);
      setFlip(true);
      onValue && onValue(to);
      const t1 = setTimeout(() => {
        setFlip(false);
        i += 1;
        const t2 = setTimeout(tick, 6);
        timers.push(t2);
      }, d);
      timers.push(t1);
    };
    const t0 = setTimeout(tick, (90 + startDelay) * FLIP_SPEED); // 칸별 지연 시작 (오른쪽→왼쪽)
    timers.push(t0);
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
    // 마운트 시 1회만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const two = pad2(cur);
  const twoPrev = pad2(prev);
  return (
    <div className={"flip-unit" + (dim ? " dim" : "")}>
      <div className={"flip-card" + (flip ? " flipping" : "")} style={{ "--fd": fd + "s" }}>
        {/* 정적 윗장: 새 값의 윗부분 */}
        <div className="fc-half fc-top">
          <span className="flip-num">{two}</span>
        </div>
        {/* 정적 아랫장: 플립 중엔 이전 값의 아랫부분 */}
        <div className="fc-half fc-bottom">
          <span className="flip-num">{flip ? twoPrev : two}</span>
        </div>
        {flip && (
          <>
            {/* 접혀 내려오는 윗장(이전 값 윗부분) */}
            <div className="fc-flap fc-flap-top">
              <span className="flip-num">{twoPrev}</span>
            </div>
            {/* 접혀 올라오는 아랫장(새 값 아랫부분) */}
            <div className="fc-flap fc-flap-bottom">
              <span className="flip-num">{two}</span>
            </div>
          </>
        )}
        <span className="flip-line" />
      </div>
      {label && <span className="flip-label">{label}</span>}
    </div>
  );
}

function FlipClock({ countdown = COUNTDOWN, monthLabel }) {
  return (
    <div className="flip-clock">
      {/* 오른쪽(시)부터 시작 → 왼쪽(월)이 가장 늦게. 간격이 아주 미세해 멈춘 카드 없이 촤라라 */}
      <FlipUnit value={countdown.months} label={monthLabel} rolls={ROLLS.months} startDelay={ROLL_STAGGER * 2} dim={!countdown.months} />
      <FlipUnit value={countdown.days} label="Day" rolls={ROLLS.days} startDelay={ROLL_STAGGER} />
      <FlipUnit value={countdown.hours} label="h" rolls={ROLLS.hours} startDelay={0} />
    </div>
  );
}

/* ---------------- Status bar (exact Figma SVG) ---------------- */
function StatusBar() {
  return <img className="statusbar" src="/statusbar.svg" alt="" draggable="false" />;
}

/* ---------------- Count badge (검정 블롭) ---------------- */
function CountBadge() {
  return <img className="count-badge" src="/ic_count.svg" alt="2개" />;
}

/* ---------------- 전체 메뉴 (햄버거 → 아코디언) ---------------- */
// 핵심 기능(중제목) + 세부 기능. nav 키는 App의 onMenuNav에서 페이지 이동으로 매핑
const MENU_SECTIONS = [
  {
    title: "화장품 관리",
    items: [
      { label: "새 화장품 등록하기", nav: "add" },
      { label: "내 화장대", nav: "cabinet" },
      { label: "유통기한 관리", nav: "expiry" },
    ],
  },
  {
    title: "스킨 루틴",
    items: [
      { label: "투데이 스킨루틴", nav: "routine" },
      { label: "제품 조합", nav: "combo" },
      { label: "공병 만들기", nav: "bottle" },
    ],
  },
  {
    title: "피부 분석",
    items: [
      { label: "피부 컨디션 문진", nav: "skincond" },
      { label: "오늘 날씨 추천", nav: "weather" },
    ],
  },
  {
    title: "쇼핑",
    items: [
      { label: "쇼핑홈", nav: "shop" },
      { label: "제품 검색", nav: "search" },
    ],
  },
];
function MenuDrawer({ open, onClose, onNavigate }) {
  const [openIdxs, setOpenIdxs] = useState([0]); // 열린 섹션들(복수 가능), 첫 섹션 기본 열림
  useEffect(() => {
    if (open) setOpenIdxs([0]); // 재진입 시 초기화(첫 섹션만 열림)
  }, [open]);
  const toggleSec = (i) =>
    setOpenIdxs((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  return (
    <div className={"menu-scrim" + (open ? " open" : "")} onClick={onClose}>
      <div className="menu-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="menu-head">
          <span className="menu-title">전체 메뉴</span>
          <button className="menu-close" onClick={onClose} aria-label="닫기">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M5 5L19 19M19 5L5 19" stroke="#1C1B1F" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="menu-body">
          {MENU_SECTIONS.map((sec, i) => {
            const secOpen = openIdxs.includes(i);
            return (
            <div className="menu-sec" key={i}>
              <button
                className={"menu-sec-head" + (secOpen ? " on" : "")}
                onClick={() => toggleSec(i)}
              >
                <span className="menu-sec-title">{sec.title}</span>
                <ChevronDown className={secOpen ? "up" : ""} />
              </button>
              {secOpen && (
                <div className="menu-items">
                  {sec.items.map((it, j) => (
                    <button
                      className="menu-item"
                      key={j}
                      onClick={() => {
                        onNavigate(it.nav);
                        onClose();
                      }}
                    >
                      {it.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- 알림 ---------------- */
// 기능별 알림 (루틴 실천 / 피부 컨디션 / 유통기한 임박 / 공병 / 쇼핑)
const NOTIFICATIONS = [
  { type: "routine", icon: "🌙", nav: "routine", title: "자기 전 스킨루틴 잊지 마세요", body: "오늘의 자기 전 루틴 2단계가 아직 남아 있어요.", time: "10분 전", unread: true },
  { type: "expiry", icon: "⏰", nav: "expiry", title: "유통기한이 곧 만료돼요", body: "에스트라 아토베리아 365 하이드로 수딩크림이 3일 후 만료돼요.", time: "오늘", unread: true },
  { type: "routine", icon: "☀️", nav: "routine", title: "오늘 아침 루틴 확인해보세요", body: "아침 스킨루틴을 실천하고 피부 컨디션을 지켜보세요.", time: "오늘 아침", unread: true },
  { type: "skin", icon: "🧬", nav: "skincond", title: "피부 컨디션을 체크해볼까요?", body: "마지막 문진 후 2주가 지났어요. 지금 피부 상태를 진단해보세요.", time: "어제" },
  { type: "expiry", icon: "🫗", nav: "bottle", title: "공병이 다 되어가요", body: "넘버즈인 판토텐탄 수딩크림을 거의 다 썼어요. 공병 활용법을 확인해보세요.", time: "2일 전" },
  { type: "shop", icon: "🛍️", nav: "shop", title: "만족했던 제품이 할인 중이에요", body: "일리윤 히알루론 수분크림이 17% 할인가로 판매되고 있어요.", time: "3일 전" },
  { type: "routine", icon: "🧴", nav: "combo", title: "새 조합 루틴 추천이 도착했어요", body: "보유 제품으로 만든 최적의 조합 루틴을 확인해보세요.", time: "3일 전" },
];
function NotificationsPage({ onBack, onItem }) {
  return (
    <div className="cabinetpage notipage">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="ap-header">
        <button className="ap-back" onClick={onBack} aria-label="뒤로">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1.5 9L9 17" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="ap-title">알림</h1>
      </div>
      <div className="cabinet-scroll noti-scroll">
        {NOTIFICATIONS.map((n, i) => (
          <button className={"noti-item" + (n.unread ? " unread" : "")} key={i} onClick={() => onItem && onItem(n.nav)}>
            <span className="noti-main">
              <span className="noti-title">{n.title}</span>
              <span className="noti-desc">{n.body}</span>
              <span className="noti-time">{n.time}</span>
            </span>
            {n.unread && <span className="noti-dot" />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Hero ---------------- */
function Hero({ onSeeAll, onMenu, onBell }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="hero">
      <StatusBar />
      <div className="hero-top">
        <div className="avatar">
          <img src="/img/avatar.png" alt="" />
        </div>
        <div className="hero-actions">
          <button className="icon-btn" aria-label="알림" onClick={onBell}>
            <img src="/ic_bell.svg" alt="" />
          </button>
          <button className="icon-btn" aria-label="메뉴" onClick={onMenu}>
            <img src="/ic_menu.svg" alt="" />
          </button>
        </div>
      </div>

      <p className="hero-msg">
        주빈님 곧<CountBadge label="2개" />의 상품의
        <br />
        사용기한이 {COUNTDOWN.days}일 후 만료돼요
      </p>

      <FlipClock />

      <div className={"dropdown" + (open ? " open" : "")}>
        <button className="dropdown-btn" onClick={() => setOpen((v) => !v)}>
          <span className="dropdown-label">
            <img className="dropdown-ic" src="/ic_haedang.svg" alt="" /> 해당 제품
          </span>
          <ChevronDown className={open ? "rot" : ""} />
        </button>
        {open && (
          <div className="dropdown-list">
            {EXPIRING.map((p, i) => (
              <div className="drop-row" key={i}>
                <div className="drop-thumb">
                  <img src={p.img} alt="" />
                </div>
                <div className="drop-info">
                  <div className="drop-top">
                    <span className="drop-brand">{p.brand}</span>
                    <span className={"tag " + p.tagType}>{p.tag}</span>
                  </div>
                  <div className="drop-name">{p.name}</div>
                </div>
                <span className="drop-period">{p.period}</span>
              </div>
            ))}
            <button className="drop-all" onClick={onSeeAll}>전체보기</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Two entry cards ---------------- */
function EntryCards({ onAddProduct, onSkinCondition }) {
  return (
    <div className="entry-cards">
      <button className="entry-card green" onClick={onAddProduct}>
        <div className="entry-text">
          새 화장품
          <br />
          등록하기
        </div>
        <img className="entry-ill" src="/img/ill_newproduct.png" alt="" />
      </button>
      <button className="entry-card light" onClick={onSkinCondition}>
        <div className="entry-text">
          오늘 피부
          <br />
          컨디션
        </div>
        <img className="entry-ill" src="/img/ill_skin.png" alt="" />
      </button>
    </div>
  );
}

/* ---------------- Today routine ---------------- */
// 스택형 시간대별 루틴 리스트 (탭마다 다른 목록)
const AGENDA_LISTS = {
  아침: [
    "클렌징 후 토너를 사용합니다",
    "비타민 앰플을 색조침착 부분에 도포합니다",
    "피부진정을 위한 시카 크림을 발라줍니다",
    "마지막으로 자외선 차단제를 충분히 바릅니다",
  ],
  저녁: [
    "오일 클렌징으로 메이크업을 지웁니다",
    "약산성 폼클렌저로 이중세안 합니다",
    "저분자 히알루론산 토너로 결을 정돈합니다",
    "레티놀 세럼을 소량 발라줍니다",
    "고보습 나이트 크림으로 마무리합니다",
  ],
  "자기 전": [
    "핸드크림으로 손을 촉촉하게 케어합니다",
    "립밤을 도톰하게 발라줍니다",
    "수면팩을 얇게 펴 발라줍니다",
  ],
};
const TIME_TABS = ["아침", "저녁", "자기 전"];
// 투데이 스킨루틴 — 모든 화면에서 동일한 리스트/변형(done)값 공유
const makeTodayRoutines = () =>
  Object.fromEntries(
    TIME_TABS.map((t) => [t, AGENDA_LISTS[t].map((text, i) => ({ text, done: t === "아침" && i <= 1 }))])
  );

// 시간대별 아이콘 — 히스토리와 동일한 TimeIconGray(해/노을/달) 재사용
function SectionIcon({ section }) {
  const type = section === "저녁" ? "twilight" : section === "자기 전" ? "moon" : "sun";
  return (
    <span className="rt-sec-ic">
      <TimeIconGray type={type} />
    </span>
  );
}

// 시계형 카드 롱프레스 컨텍스트 메뉴 (편집/삭제)
function RtCardMenu({ onEdit, onDelete }) {
  return (
    <div
      className="rt-ctx"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <button className="rt-ctx-btn" onClick={onEdit}>
        편집
      </button>
      <span className="rt-ctx-div" />
      <button className="rt-ctx-btn del" onClick={onDelete}>
        삭제
      </button>
    </div>
  );
}

function TodayRoutine({
  view,
  setView,
  timeTab,
  setTimeTab,
  routines,
  onToggleRoutine,
  onDeleteRoutines,
  onCreateRoutine,
  onEditRoutine,
  scheduleCards = [],
}) {
  const [selected, setSelected] = useState(28);
  const [deleteMode, setDeleteMode] = useState(false); // 삭제 선택 모드
  const [editMode, setEditMode] = useState(false); // 편집 모드(행 탭 → 편집 모달)
  const [delSel, setDelSel] = useState([]); // 삭제할 인덱스들
  const currentList = routines[timeTab]; // [{ text, done }]
  const scrollRef = useDragScroll();

  // 시계형 카드 롱프레스 → 옆에 편집/삭제 박스
  const [ctxKey, setCtxKey] = useState(null); // 컨텍스트 메뉴 대상 카드 키
  const [hiddenCards, setHiddenCards] = useState([]); // 삭제된 카드 키
  const pressTimer = useRef(null);
  const pressPos = useRef(null);
  const startPress = (key) => (e) => {
    const pt = e.touches ? e.touches[0] : e;
    pressPos.current = { x: pt.clientX, y: pt.clientY };
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => setCtxKey(key), 420);
  };
  const movePress = (e) => {
    if (!pressPos.current) return;
    const pt = e.touches ? e.touches[0] : e;
    if (Math.abs(pt.clientX - pressPos.current.x) > 8 || Math.abs(pt.clientY - pressPos.current.y) > 8)
      clearTimeout(pressTimer.current);
  };
  const endPress = () => clearTimeout(pressTimer.current);
  // 컨텍스트 메뉴 열린 상태에서 바깥 클릭 → 닫힘
  useEffect(() => {
    if (!ctxKey) return;
    const close = () => setCtxKey(null);
    const t = setTimeout(() => document.addEventListener("pointerdown", close), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("pointerdown", close);
    };
  }, [ctxKey]);

  const exitDelete = () => {
    setDeleteMode(false);
    setDelSel([]);
  };
  const toggleEdit = () => {
    setEditMode((v) => !v);
    setDeleteMode(false);
    setDelSel([]);
  };
  const selectTab = (t) => {
    setTimeTab(t);
    exitDelete();
  };
  const toggleDelSel = (i) =>
    setDelSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  const handleDelete = () => {
    if (delSel.length) onDeleteRoutines(timeTab, delSel);
    exitDelete();
  };

  return (
    <section className="section">
      <div className="routine-head">
        <h2 className="routine-title">
          투데이 <span className="routine-title-time">{timeTab}</span> 스킨루틴
        </h2>
        <div className="routine-head-right">
          <div className="view-toggle">
            <button
              className={view === "schedule" ? "vt on" : "vt"}
              onClick={() => setView("schedule")}
              aria-label="타임라인 보기"
            >
              <ScheduleIcon />
            </button>
            <button
              className={view === "agenda" ? "vt on" : "vt"}
              onClick={() => setView("agenda")}
              aria-label="목록 보기"
            >
              <ViewAgendaIcon />
            </button>
          </div>
        </div>
      </div>

      {view === "schedule" ? (
        <>
          <div className="week">
            {WEEK.map((w) => (
              <button
                key={w.n}
                className={
                  "day" +
                  (selected === w.n ? " sel" : "") +
                  (w.wk ? " " + w.wk : "")
                }
                onClick={() => setSelected(w.n)}
              >
                <span className="day-d">{w.d}</span>
                <span className="day-n">{w.n}</span>
              </button>
            ))}
          </div>

          <div className="routine-scroll" ref={scrollRef}>
            {(SCHEDULE_ROUTINES[timeTab] || []).map((c, i) => {
              const key = "r" + i;
              if (hiddenCards.includes(key)) return null;
              return (
                <div
                  className="routine-card"
                  key={key}
                  onPointerDown={startPress(key)}
                  onPointerMove={movePress}
                  onPointerUp={endPress}
                  onPointerLeave={endPress}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <div className="routine-card-head">
                    <span className="routine-num">{i + 1}</span>
                    <span className="routine-step-title">{c.title}</span>
                    <ChevronRightSmall />
                    <SectionIcon section={timeTab} />
                  </div>
                  <div className="routine-body">
                    <div className="routine-thumb">
                      <img src={c.img} alt="" />
                    </div>
                    <ol className="routine-steps">
                      {c.steps.map((runs, j) => (
                        <li key={j}>
                          {runs.map(([text, em], k) => (
                            <span key={k} className={em ? undefined : "rt-dim"}>
                              {text}
                            </span>
                          ))}
                        </li>
                      ))}
                    </ol>
                  </div>
                  {ctxKey === key && (
                    <RtCardMenu
                      onEdit={() => { setCtxKey(null); (onEditRoutine || onCreateRoutine)({ name: c.title, timeChips: c.tabs || [timeTab], products: c.products }); }}
                      onDelete={() => { setHiddenCards((h) => [...h, key]); setCtxKey(null); }}
                    />
                  )}
                </div>
              );
            })}
            {/* AI로 추가한 루틴 카드 — 현재 시간대에 해당하는 것만, 다른 카드처럼 해 아이콘 */}
            {scheduleCards.map((c, i) => {
              if (!(c.tabs && c.tabs.includes(timeTab))) return null;
              const key = "a" + i;
              if (hiddenCards.includes(key)) return null;
              return (
                <div
                  className="routine-card routine-card-added"
                  key={key}
                  onPointerDown={startPress(key)}
                  onPointerMove={movePress}
                  onPointerUp={endPress}
                  onPointerLeave={endPress}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <div className="routine-card-head">
                    <span className="routine-num">{(SCHEDULE_ROUTINES[timeTab] || []).length + i + 1}</span>
                    <span className="routine-step-title">{c.title}</span>
                    <ChevronRightSmall />
                    <SectionIcon section={timeTab} />
                  </div>
                  <div className="routine-body">
                    {c.products && c.products[0] && (
                      <div className="routine-thumb">
                        <img src={c.products[0].img} alt="" draggable="false" />
                      </div>
                    )}
                    <ol className="routine-steps">
                      {c.products && c.products.length ? (
                        c.products.map((p, k) => (
                          <li key={k}>
                            <span>{p.name}</span>
                            <span className="rt-dim">을 사용합니다</span>
                          </li>
                        ))
                      ) : (
                        <li>
                          <span className="rt-dim">루틴에 맞춰 사용합니다</span>
                        </li>
                      )}
                    </ol>
                  </div>
                  {ctxKey === key && (
                    <RtCardMenu
                      onEdit={() => { setCtxKey(null); (onEditRoutine || onCreateRoutine)({ name: c.title, timeChips: c.tabs || [timeTab], products: c.products }); }}
                      onDelete={() => { setHiddenCards((h) => [...h, key]); setCtxKey(null); }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* 스택형: 캘린더 대신 시간대 필터 칩 + 편집/삭제 */}
          <div className="routine-filter">
            <div className="filter-chips">
              {TIME_TABS.map((t) => (
                <button
                  key={t}
                  className={"chip" + (timeTab === t ? " on" : "")}
                  onClick={() => selectTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="filter-actions">
              <button className={"fa-btn" + (editMode ? " active" : "")} onClick={toggleEdit}>
                편집
              </button>
              <span className="fa-div" />
              <button
                className={"fa-btn" + (deleteMode ? " active" : "")}
                onClick={() => (deleteMode ? exitDelete() : (setDeleteMode(true), setEditMode(false)))}
              >
                삭제
              </button>
            </div>
          </div>

          <div className="routine-agenda">
            {currentList.map((item, i) => {
              const picked = delSel.includes(i);
              return (
                <button
                  className={
                    "agenda-row" +
                    (!deleteMode && item.done ? " done" : "") +
                    (deleteMode ? " selectable" : "") +
                    (editMode ? " editable" : "") +
                    (deleteMode && picked ? " picked" : "")
                  }
                  onClick={() =>
                    deleteMode
                      ? toggleDelSel(i)
                      : editMode
                      ? (onEditRoutine || onCreateRoutine)({ name: item.text, timeChips: [timeTab] })
                      : onToggleRoutine(timeTab, i)
                  }
                  key={i}
                >
                  <span className="routine-num">{i + 1}</span>
                  <span className="agenda-text">{item.text}</span>
                  <span
                    className={
                      "agenda-check" +
                      (deleteMode && picked ? " on" : "")
                    }
                  >
                    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                      <path
                        d="M1.5 5.2L4.8 8.4L11.2 1.6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {deleteMode ? (
        <button className="delete-routine" onClick={handleDelete}>
          삭제하기
        </button>
      ) : (
        <button className="make-routine" onClick={onCreateRoutine}>
          <PlusIcon />
          루틴 만들기
        </button>
      )}
    </section>
  );
}

/* ---------------- Weather ---------------- */
function Weather({ onSeeAll }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">오늘 날씨엔 이 제품 사용해요</h2>
        <button className="see-all" onClick={onSeeAll}>
          전체보기 <ChevronRight />
        </button>
      </div>

      <div className="weather-card">
        <img className="weather-mountain" src="/img/mountain.svg" alt="" />
        <span className="wsun wsun-1" />
        <span className="wsun wsun-2" />
        <span className="wsun wsun-3" />
        <div className="weather-temp">29℃</div>
        <div className="weather-sub">어제보다 기온 3℃ 높음</div>
        <span className="weather-divider" />
        <div className="weather-right">
          <div className="wr-block">
            <span className="wr-key">주의점</span>
            <span className="wr-val">수분 손실 / 장벽 손상</span>
          </div>
          <div className="wr-block">
            <span className="wr-key">추천템</span>
            <span className="wr-val">히알루론산 / 판테놀 성분</span>
          </div>
        </div>
      </div>

      <div className="product-grid">
        {WEATHER_PRODUCTS.map((p, i) => (
          <button className="product" key={i}>
            <div className="product-img">
              <img src={p.img} alt="" />
            </div>
            <div className="product-brand">{p.brand}</div>
            <div className="product-name">{p.name}</div>
            <div className="product-tags">
              {p.tags.map(([label, type]) => (
                <span className={"tag " + type} key={type}>
                  {label}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Expiry badge (유통기한 뱃지) ---------------- */
function badgeColor(label) {
  // 2주(=14일) 이내 = 코랄(임박), 2주 초과 = 그린
  const n = parseInt(label, 10);
  if (label.includes("일")) return n <= 14 ? "#FF5160" : "#1DBF7E";
  if (label.includes("주")) return n <= 2 ? "#FF5160" : "#1DBF7E";
  return "#1DBF7E"; // 개월 등
}
// 남은 일수(정렬용): 일/주/개월 → 일 단위
function badgeDays(label) {
  const n = parseInt(label, 10);
  if (label.includes("일")) return n;
  if (label.includes("주")) return n * 7;
  if (label.includes("개월")) return n * 30;
  return 99999;
}
// 앰플류(좁고 작은 이미지) — 썸네일에서 살짝 키워 다른 제품과 비율 맞춤
function isAmpoule(p) {
  return !!(p && p.tags && p.tags.some(([, t]) => t === "ampoule"));
}
// 개봉일 기준 사용시간(미개봉이면 "미개봉") — 이름 기반 결정론적 값
const USAGE_BUCKETS = ["1주간 사용", "2주간 사용", "3주간 사용", "1개월 사용", "2개월 사용", "3개월 사용", "5개월 사용"];
function usageSinceOpen(p) {
  const name = (p && p.name) || "";
  let key = 0;
  for (let i = 0; i < name.length; i++) key = (key * 31 + name.charCodeAt(i)) >>> 0;
  if (key % 5 === 0) return { text: "미개봉", opened: false }; // ~20% 미개봉
  return { text: USAGE_BUCKETS[key % USAGE_BUCKETS.length], opened: true };
}
// 색조 제품 여부 (포함된 루틴/AI 평가 없음)
function isColorProduct(p) {
  return !!(p && p.tags && p.tags.some(([l]) => l === "색조"));
}
// AI 리포트 — 제품 카테고리별로 점수·칩·평가문이 다르게 (색조는 평가 없음)
const AI_REPORTS = {
  cream: {
    score: "8.7",
    chips: ["장벽강화", "끈적이지 않는", "민감성 피부 사용"],
    text: (n) => (
      <>
        {n}은 <u>피부장벽 강화능력</u>이 우수한 데일리 보습 크림으로 평가됩니다. <u>판테놀</u> 기반의 수분 유지력이
        강점이며, 대부분의 <u>피부 타입에서 부담 없이</u> 사용할 수 있습니다. 수분 공급에 집중된 기본기 좋은 보습 크림.{" "}
        <u>피부 타입을 크게 타지 않는</u> 무난한 데일리 수분크림입니다.✨
      </>
    ),
  },
  toner: {
    score: "8.4",
    chips: ["수분 충전", "각질 케어", "산뜻한 마무리"],
    text: (n) => (
      <>
        {n}은 <u>수분 공급과 각질 정돈</u>에 강점이 있는 데일리 토너로 평가됩니다. <u>산뜻한 사용감</u>으로 유수분
        밸런스를 잡아주며, 다음 단계 흡수를 도와 <u>피부결을 매끈하게</u> 정돈합니다. 아침저녁 부담 없이 쓰기 좋은
        토너입니다.✨
      </>
    ),
  },
  ampoule: {
    score: "9.1",
    chips: ["고농축 케어", "빠른 흡수", "피부 진정"],
    text: (n) => (
      <>
        {n}은 <u>고농축 유효성분</u>으로 집중 케어에 강점이 있는 앰플로 평가됩니다. <u>가볍게 스며드는 흡수력</u>이 좋아
        끈적임이 적으며, <u>예민해진 피부를 진정</u>시켜 컨디션을 끌어올립니다. 부스터로 더하기 좋은 데일리 앰플입니다.✨
      </>
    ),
  },
  func: {
    score: "8.9",
    chips: ["집중 케어", "저자극", "피부결 개선"],
    text: (n) => (
      <>
        {n}은 <u>피부 고민 집중 케어</u>에 특화된 기능성 제품으로 평가됩니다. <u>저자극 처방</u>으로 민감한 피부도
        부담이 적으며, 꾸준히 사용하면 <u>피부결과 톤</u> 개선에 도움을 줍니다. 목적이 뚜렷한 데일리 케어 아이템입니다.✨
      </>
    ),
  },
  default: {
    score: "8.5",
    chips: ["데일리 케어", "순한 사용감", "편안한 마무리"],
    text: (n) => (
      <>
        {n}은 <u>부담 없는 데일리 케어</u>에 적합한 제품으로 평가됩니다. <u>순한 사용감</u>으로 대부분의 피부 타입에서
        편안하게 사용할 수 있으며, 기본기에 충실해 <u>매일 쓰기 좋은</u> 아이템입니다.✨
      </>
    ),
  },
};
function aiReport(p) {
  const t = (p && p.tags && p.tags[0] && p.tags[0][1]) || "default";
  return AI_REPORTS[t] || AI_REPORTS.default;
}

// 주요 성분 — 카테고리별 대표 성분 3종 (이름·태그·설명, 아코디언용)
const INGREDIENT_DATA = {
  cream: [
    { name: "판테놀", tags: ["보습", "진정", "장벽강화"], desc: (n) => (<><u>피부 장벽을 강화</u>하고 수분을 잡아주는 대표 보습 성분이에요. 자극이 적어 <u>민감한 피부</u>도 편안하게 쓸 수 있고, 건조로 인한 <u>붉은기 진정</u>에도 도움을 줘요.</>) },
    { name: "히알루론산", tags: ["수분충전", "저자극", "탄력"], desc: (n) => (<>자기 무게의 수백 배에 달하는 <u>수분을 끌어당겨</u> 속당김을 완화해요. 여러 분자 크기로 <u>피부 결을 촉촉하게</u> 채워주며 대부분의 피부 타입에 잘 맞아요.</>) },
    { name: "부틸렌글라이콜", tags: ["보습", "용해", "산뜻함"], desc: (n) => (<>다른 유효성분의 <u>흡수를 돕는</u> 보습·용해 성분이에요. 산뜻한 사용감으로 <u>번들거림 없이</u> 촉촉함을 더해줘요.</>) },
  ],
  toner: [
    { name: "나이아신아마이드", tags: ["미백", "결개선", "피지조절"], desc: (n) => (<>멜라닌 생성을 억제해 <u>칙칙함과 색소</u> 케어에 도움을 주는 기능성 성분이에요. 꾸준히 쓰면 <u>피부결과 톤</u>이 한층 정돈돼요.</>) },
    { name: "판테놀", tags: ["보습", "진정", "장벽강화"], desc: (n) => (<><u>수분을 잡아주고 장벽을 강화</u>해 예민해진 피부를 달래줘요. 자극이 적어 데일리로 쓰기 좋아요.</>) },
    { name: "알란토인", tags: ["진정", "저자극", "각질케어"], desc: (n) => (<>피부를 부드럽게 <u>진정</u>시키고 묵은 각질 정돈을 도와요. 자극이 적어 <u>민감성 피부</u>에도 무난해요.</>) },
  ],
  ampoule: [
    { name: "히알루론산", tags: ["수분충전", "저자극", "탄력"], desc: (n) => (<><u>고농축 수분</u>을 빠르게 채워 속건조를 완화해요. 가볍게 스며들어 <u>끈적임 없이</u> 촉촉함이 오래 지속돼요.</>) },
    { name: "아데노신", tags: ["탄력", "주름개선", "안티에이징"], desc: (n) => (<><u>주름 개선 기능성</u> 성분으로 탄력 케어에 도움을 줘요. 저농도로도 효과가 좋아 <u>데일리 안티에이징</u>에 적합해요.</>) },
    { name: "마데카소사이드", tags: ["진정", "재생", "장벽강화"], desc: (n) => (<>병풀 유래 성분으로 <u>자극받은 피부를 진정</u>시키고 회복을 도와요. 붉은기와 <u>트러블 케어</u>에 강점이 있어요.</>) },
  ],
  func: [
    { name: "나이아신아마이드", tags: ["미백", "결개선", "피지조절"], desc: (n) => (<><u>색소·칙칙함 케어</u>에 특화된 기능성 성분이에요. 피지 밸런스를 잡아 <u>매끈한 피부결</u>로 정돈해줘요.</>) },
    { name: "아데노신", tags: ["탄력", "주름개선", "안티에이징"], desc: (n) => (<><u>주름 개선</u>에 도움을 주는 대표 안티에이징 성분이에요. 저자극이라 꾸준히 쓰기 좋아요.</>) },
    { name: "센텔라아시아티카", tags: ["진정", "재생", "저자극"], desc: (n) => (<>병풀 추출물로 <u>진정과 재생</u>을 동시에 케어해요. 예민하고 <u>붉은기 있는 피부</u>에 특히 잘 맞아요.</>) },
  ],
  color: [
    { name: "티타늄디옥사이드", tags: ["커버", "자외선차단", "저자극"], desc: (n) => (<>피부 톤을 <u>자연스럽게 커버</u>하고 자외선을 물리적으로 막아줘요. 자극이 적어 <u>예민한 피부</u>에도 무난해요.</>) },
    { name: "글리세린", tags: ["보습", "밀착", "산뜻함"], desc: (n) => (<>수분을 끌어와 <u>밀착과 지속력</u>을 높여줘요. 발림성이 좋아 <u>건조함 없이</u> 매끄럽게 발려요.</>) },
    { name: "토코페롤", tags: ["항산화", "보습", "피부보호"], desc: (n) => (<>비타민 E 성분으로 <u>항산화·피부 보호</u>에 도움을 줘요. 외부 자극으로부터 <u>피부를 케어</u>해요.</>) },
  ],
  default: [
    { name: "글리세린", tags: ["보습", "밀착", "산뜻함"], desc: (n) => (<>대표 보습 성분으로 <u>수분을 끌어와</u> 촉촉함을 더해요. 대부분의 피부 타입에 잘 맞아요.</>) },
    { name: "판테놀", tags: ["보습", "진정", "장벽강화"], desc: (n) => (<><u>장벽 강화와 진정</u>에 도움을 주는 순한 성분이에요.</>) },
    { name: "부틸렌글라이콜", tags: ["보습", "용해", "산뜻함"], desc: (n) => (<>유효성분 <u>흡수를 돕고</u> 산뜻한 사용감을 더해요.</>) },
  ],
};
function ingredientsFor(p) {
  const t = (p && p.tags && p.tags[0] && p.tags[0][1]) || "default";
  return INGREDIENT_DATA[t] || INGREDIENT_DATA.default;
}
// info 안내 바 (Figma 356-8142) — 모든 인포에 재사용
function InfoBar({ children }) {
  return (
    <div className="info-bar">
      <span className="info-bar-ic">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.6" stroke="#FF6D78" strokeWidth="1.3" />
          <circle cx="8" cy="5" r="0.95" fill="#FF6D78" />
          <path d="M8 7.2V11.4" stroke="#FF6D78" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </span>
      <span className="info-bar-txt">{children}</span>
    </div>
  );
}
// "이렇게 쓰면 더 좋아요" — 제품별 조합 사용 팁
const BETTER_TOGETHER = {
  cream: (n) => (
    <>
      {n} 단독으로 사용하면 수분만 채워지고 <u>기존 각질이 정돈되지 않을</u> 수 있어요. 각질 정돈 토너로 결을 정리한 뒤
      사용하고, <u>수분 앰플</u>을 먼저 올려 수분을 채운 다음 마무리하면 <u>보습 지속력</u>이 한층 올라가요.🔍
    </>
  ),
  toner: (n) => (
    <>
      {n}으로 결을 정돈한 뒤에는 <u>수분 앰플</u>로 수분을 채우고 크림으로 <u>유수분 밸런스</u>를 잡아주는 걸 추천드려요.
      토너 단독보다 다음 단계 흡수가 좋아져 <u>속건조</u> 없이 촉촉함이 오래 지속돼요.🔍
    </>
  ),
  ampoule: (n) => (
    <>
      {n}은 <u>세안·토너 직후</u> 가장 먼저 올려야 유효성분 흡수가 좋아요. 이후 크림으로 덮어 <u>수분 증발을 막아</u> 주면
      진정·보습 효과가 오래 유지돼요. 자극이 느껴질 땐 진정 크림과 함께 사용하세요.🔍
    </>
  ),
  func: (n) => (
    <>
      {n}은 <u>집중 케어 단계</u>에서 사용하고, 자극이 느껴지면 사용 빈도를 조절해 주세요. 저자극 토너로 결을 정돈한 뒤
      올리고 <u>보습 크림</u>으로 마무리하면 피부 부담을 줄이면서 효과를 높일 수 있어요.🔍
    </>
  ),
  color: (n) => (
    <>
      {n}은 <u>스킨케어 마무리 후</u> 발라야 밀착과 지속력이 좋아요. 사용 전 <u>수분 크림</u>으로 결을 정돈하고, 클렌징
      단계에서 꼼꼼히 지워 <u>모공 트러블</u>을 예방하는 걸 추천드려요.🔍
    </>
  ),
  default: (n) => (
    <>
      {n}은 토너로 결을 정돈한 뒤 사용하고, <u>수분 앰플</u>과 크림을 순서대로 올려주면 흡수와 <u>보습 지속력</u>이 좋아져요.
      피부 컨디션에 맞춰 사용 순서를 조절해 보세요.🔍
    </>
  ),
};
function betterTogetherFor(p) {
  const t = (p && p.tags && p.tags[0] && p.tags[0][1]) || "default";
  return BETTER_TOGETHER[t] || BETTER_TOGETHER.default;
}
// 적합/영향 정도 슬라이더 (Figma 320-7794) — active=true면 왼→오 채워지는 애니메이션
function RatingSlider({ label, level, color, active }) {
  const pct = [38, 66, 94][level] || 66; // 별로/보통/좋음
  const ticks = ["별로", "보통", "좋음"];
  return (
    <div className="pd-slider">
      <div className="pd-slider-label">{label}</div>
      <div className="pd-slider-track">
        <div className="pd-slider-fill" style={{ width: (active ? pct : 0) + "%", background: color }} />
        {ticks.map((t, i) => (
          <span key={t} className={"pd-slider-tick" + (active && i === level ? " on" : active && i < level ? " filled" : "")}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
// 제품별 날씨 적합/피부 영향 정도 (결정론적)
function gaugesFor(p) {
  const name = (p && p.name) || "";
  let key = 0;
  for (let i = 0; i < name.length; i++) key = (key * 31 + name.charCodeAt(i)) >>> 0;
  return { weather: key % 3, skin: (Math.floor(key / 7)) % 3 };
}
function ExpiryBadge({ label, inline }) {
  const color = badgeColor(label);
  return (
    <span className={"fu-badge" + (inline ? " fu-badge-inline" : "")}>
      <svg
        className="fu-badge-blob"
        width="56"
        height="32"
        viewBox="0 0 56 32"
        fill="none"
      >
        <ellipse cx="14.2862" cy="8.23645" rx="14.2862" ry="8.23645" transform="matrix(0.778029 -0.628229 0.567819 0.823153 0 17.9502)" fill={color} />
        <ellipse cx="14.2862" cy="8.23645" rx="14.2862" ry="8.23645" transform="matrix(0.778029 -0.628229 0.567819 0.823153 11.7441 17.9502)" fill={color} />
        <ellipse cx="14.2862" cy="8.23645" rx="14.2862" ry="8.23645" transform="matrix(0.778029 -0.628229 0.567819 0.823153 23.4883 17.9502)" fill={color} />
      </svg>
      <span className="fu-badge-text">{label}</span>
    </span>
  );
}

/* ---------------- First use ---------------- */
function FirstUse({ title = "이 제품들 먼저 쓰세요", seeAll = "전체보기", products = FIRST_USE, hideBadge = false, btnLabel = "내 루틴 추가하기", doneLabel = "✓ 추가됨", btnVariant = "", onBtnClick, onSeeAll }) {
  const [added, setAdded] = useState(() => products.map(() => false));
  const scrollRef = useDragScroll();
  return (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title" style={{ whiteSpace: "pre-line" }}>{title}</h2>
        <button className="see-all" onClick={onSeeAll}>
          {seeAll} <ChevronRight />
        </button>
      </div>

      <div className="firstuse-scroll" ref={scrollRef}>
        {products.map((p, i) => (
          <div className="firstuse-card" key={i}>
            <div className="fu-top">
              <div className="fu-img">
                <img src={p.img} alt="" />
              </div>
              {!hideBadge && <ExpiryBadge label={p.badge} />}
            </div>
            <div className="fu-name">{p.name}</div>
            <button
              className={"add-routine" + (btnVariant ? " " + btnVariant : "") + (added[i] ? " done" : "")}
              onClick={() =>
                onBtnClick
                  ? onBtnClick(p)
                  : setAdded((a) => a.map((v, j) => (j === i ? !v : v)))
              }
            >
              {added[i] ? (
                doneLabel
              ) : (
                <>
                  <PlusIcon />
                  {btnLabel}
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Promo banner carousel ---------------- */
const BANNERS = [
  "/img/banner1_clean.png",
  "/img/banner2_clean.png",
  "/img/banner3_clean.png",
  "/img/banner4_clean.png",
];
function PromoCarousel() {
  const n = BANNERS.length;
  // 앞뒤로 복제본을 두어 양방향 무한 루프 + 양옆 peek
  const items = [BANNERS[n - 1], ...BANNERS, BANNERS[0]];
  const [idx, setIdx] = useState(1); // 1 = 첫 실제 배너
  const [anim, setAnim] = useState(true);
  const drag = useRef({ down: false, startX: 0, dx: 0, moved: false });

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => i + 1), 3000);
    return () => clearInterval(id);
  }, []);

  // 복제본에 도달하면 트랜지션 종료 후 반대편 실제 배너로 순간 이동
  const onEnd = () => {
    if (idx === n + 1) {
      setAnim(false);
      setIdx(1);
    } else if (idx === 0) {
      setAnim(false);
      setIdx(n);
    }
  };
  useEffect(() => {
    if (!anim) {
      const r = requestAnimationFrame(() => setAnim(true));
      return () => cancelAnimationFrame(r);
    }
  }, [anim]);

  const onDown = (e) => {
    drag.current = { down: true, startX: e.pageX, dx: 0, moved: false };
  };
  const onMove = (e) => {
    if (!drag.current.down) return;
    drag.current.dx = e.pageX - drag.current.startX;
    if (Math.abs(drag.current.dx) > 4) drag.current.moved = true;
  };
  const onUp = () => {
    if (!drag.current.down) return;
    const dx = drag.current.dx;
    drag.current.down = false;
    if (dx < -40) setIdx((i) => i + 1);
    else if (dx > 40) setIdx((i) => i - 1);
  };

  const SLIDE = 89; // %
  const offset = (100 - SLIDE) / 2; // 중앙 정렬 + 양옆 peek

  return (
    <div className="promo">
      <div
        className="promo-viewport"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        <div
          className={"promo-track" + (anim ? " anim" : "")}
          style={{ transform: `translateX(calc(${-idx * SLIDE + offset}%))` }}
          onTransitionEnd={onEnd}
        >
          {items.map((src, i) => (
            <div className="promo-slide" key={i}>
              <img
                className="promo-banner"
                src={src}
                alt=""
                draggable="false"
              />
              {/* 현재 중앙에 보이는 카드에만 페이지 번호 표시 */}
              {i === idx && (
                <span className="promo-badge">
                  {((idx - 1 + n) % n) + 1}/{n}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Bottom nav ---------------- */
const NAV_ITEMS = [
  { key: "left", icon: "/nav/bag.svg", iconOn: "/nav/bag_on.svg", label: "보관" },
  { key: "center", icon: "/nav/scan.svg", iconOn: "/nav/scan_on.svg", label: "등록" },
  { key: "right", icon: "/nav/person.svg", iconOn: "/nav/person_on.svg", label: "제품" },
];
function BottomNav({ active = "center", onNav }) {
  return (
    <>
      <div className="nav-scrim" />
      <nav className="bottom-nav">
        {NAV_ITEMS.map((n) => {
          const on = active === n.key;
          return (
            <button
              key={n.key}
              className={"nav-btn" + (on ? " on" : "")}
              onClick={() => onNav && onNav(n.key)}
              aria-label={n.label}
            >
              <img src={on ? n.iconOn : n.icon} alt={n.label} />
            </button>
          );
        })}
      </nav>
      <div className="home-indicator" />
    </>
  );
}

/* ---------------- Toggle switch ---------------- */
function Toggle({ on, onToggle }) {
  return (
    <button
      className={"tgl" + (on ? " on" : "")}
      onClick={onToggle}
      aria-pressed={on}
    >
      <span className="tgl-knob" />
    </button>
  );
}

/* ---------------- Routine create modal (bottom sheet) ---------------- */
const MODAL_WEEK = [
  { d: "S", wk: "sun" },
  { d: "M" },
  { d: "T" },
  { d: "W" },
  { d: "T" },
  { d: "F" },
  { d: "S", wk: "sat" },
];
// AI 추천받기 상태에서 노출되는 추천 제품들
const AI_PRODUCTS = [
  { brand: "일리윤", name: "히알루론 모이스처 수분크림", tags: [["크림", "cream"], ["기능성", "func"]], img: "/img/ai_illiyoon.png" },
  { brand: "에스트라", name: "아토베리아 365 하이드로 크림", tags: [["크림", "cream"]], img: "/img/ai_estra1.png" },
  { brand: "에스트라", name: "아토베리아 365 수딩 크림", tags: [["크림", "cream"]], img: "/img/ai_estra2.png" },
];
const AI_NAME = "수분 크림";

// AI 뱃지 (정확한 Figma SVG)
function AiBadge() {
  return (
    <svg
      className="ai-badge-svg"
      width="29"
      height="15"
      viewBox="0 0 29 15"
      fill="none"
    >
      <rect x="0.5" y="0.5" width="27.75" height="14" rx="7" fill="#FFEFF2" />
      <rect x="0.5" y="0.5" width="27.75" height="14" rx="7" stroke="#FFC9CE" />
      <path
        d="M11.3462 11.5H9.85303L12.5923 3.72266H14.311L17.061 11.5H15.5679L14.9233 9.57715H11.9907L11.3462 11.5ZM12.3667 8.44922H14.5474L13.4839 5.3125H13.4194L12.3667 8.44922ZM19.3813 3.72266V11.5H17.9849V3.72266H19.3813Z"
        fill="#FF5160"
      />
    </svg>
  );
}

function RoutineModal({ open, onClose, onSave, initialAi = false, seedProduct = null, editData = null }) {
  const [name, setName] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false); // AI 추천 분석 로딩 (조합 추천처럼)
  const [aiProduct, setAiProduct] = useState(0);
  const runAiLoading = () => {
    setAiLoading(true);
    setTimeout(() => setAiLoading(false), 1300);
  };
  // AI 추천 대상 제품 이름 — 편집 시 저장된 이름, 상세페이지 시드 제품이 있으면 그 제품
  const aiTitle = editData?.name || (seedProduct ? seedProduct.name : AI_NAME);
  // 추천 이유 — 제품별로 다른 내용 (카테고리 기반)
  const rep = aiReport(seedProduct || { tags: [["", "default"]] });
  const [reportOpen, setReportOpen] = useState(true); // AI 추천 이유 펼침/접힘
  const [repeat, setRepeat] = useState(false);
  const [days, setDays] = useState([false, false, false, false, false, false, false]);
  const [timeChips, setTimeChips] = useState([]); // 아침/저녁/자기 전 (복수 선택)
  const [timeSet, setTimeSet] = useState(false);
  const [notify, setNotify] = useState(false);
  const [selProds, setSelProds] = useState(() => AI_PRODUCTS.map(() => false)); // 화장품 선택
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      if (editData) {
        // 편집: 저장된 정보(이름·시간대·선택 제품) 그대로 프리필
        const hasProds = editData.products && editData.products.length;
        setAiMode(!!hasProds);
        setReportOpen(true);
        setName(editData.name || "");
        setTimeChips(editData.timeChips || []);
        setRepeat((editData.timeChips || []).length > 0);
        setSelProds(AI_PRODUCTS.map((p) => (editData.products || []).some((q) => q.name === p.name)));
      } else if (initialAi) {
        // 상세페이지 "AI 추천 루틴 생성" → AI 모드로 바로 열기 + 추천 기본값
        setAiMode(true);
        setAiProduct(0);
        setReportOpen(true);
        setRepeat(true);
        setDays([false, true, false, true, true, false, false]);
        setTimeChips(["아침", "자기 전"]); // AI 추천: 시간대도 임시 선택
        runAiLoading();
      }
      const t = setTimeout(
        () => inputRef.current?.focus({ preventScroll: true }),
        340
      );
      return () => clearTimeout(t);
    }
    // 닫히면 모든 입력값 초기화 (다음 열림은 항상 기본값: 반복·요일 OFF)
    setName("");
    setAiMode(false);
    setAiLoading(false);
    setAiProduct(0);
    setReportOpen(true);
    setRepeat(false);
    setDays([false, false, false, false, false, false, false]);
    setTimeChips([]);
    setTimeSet(false);
    setNotify(false);
    setSelProds(AI_PRODUCTS.map(() => false));
  }, [open]);

  const toggleDay = (i) => setDays((d) => d.map((v, j) => (j === i ? !v : v)));
  const hasName = name.trim().length > 0;
  const canSave = aiMode || hasName;

  const toggleAi = () =>
    setAiMode((v) => {
      const next = !v;
      if (next) {
        // AI 추천값 채우기 + 잠시 분석 로딩
        setRepeat(true);
        setDays([false, true, false, true, true, false, false]);
        setTimeChips(["아침", "자기 전"]); // AI 추천: 시간대도 임시 선택
        runAiLoading();
      }
      return next;
    });

  const handleSave = () => {
    const finalName = aiMode ? aiTitle : name.trim();
    if (!finalName) return;
    // AI 모드에서 선택한 제품 → 시계(스케줄) 카드에 사용
    const products = aiMode ? AI_PRODUCTS.filter((_, i) => selProds[i]) : [];
    onSave({ name: finalName, timeChips, repeat, days, timeSet, notify, products });
  };

  // 반복 카드 내용 (기본/AI 공통)
  const repeatInner = (
    <>
      <div className="repeat-row">
        <span className="rp-label">반복</span>
        <Toggle on={repeat} onToggle={() => setRepeat((v) => !v)} />
      </div>
      <div className="week-select">
        {MODAL_WEEK.map((w, i) => (
          <button
            key={i}
            className={"wd" + (days[i] ? " sel" : "") + (w.wk ? " " + w.wk : "")}
            onClick={() => toggleDay(i)}
          >
            {w.d}
          </button>
        ))}
      </div>
    </>
  );
  const chipsInner = TIME_TABS.map((t) => (
    <button
      key={t}
      className={"chip" + (timeChips.includes(t) ? " on" : "")}
      onClick={() => setTimeChips((c) => (c.includes(t) ? c.filter((x) => x !== t) : [...c, t]))}
    >
      {t}
    </button>
  ));

  return (
    <div className={"sheet-overlay" + (open ? " open" : "")} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <span className="sheet-handle" />

        <div className="sheet-head">
          <button className="sheet-close" onClick={onClose} aria-label="닫기">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 5L19 19M19 5L5 19"
                stroke="#1C1B1F"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            className={"ai-btn" + (aiMode ? " manual" : "")}
            onClick={toggleAi}
          >
            {aiMode ? "직접 작성하기" : "AI 추천받기"}
          </button>
        </div>

        {!aiMode ? (
          <>
            <input
              ref={inputRef}
              className="routine-input"
              placeholder="루틴을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="repeat-card">{repeatInner}</div>
            <div className="chips-card">{chipsInner}</div>
            <div className="set-time">
              <div className="set-left">
                <div className="set-date">2026.06.07</div>
                <div className="set-sub">시간 설정</div>
              </div>
              <Toggle on={timeSet} onToggle={() => setTimeSet((v) => !v)} />
            </div>
            <div className="sheet-divider" />
            <div className="set-alarm">
              <span className="set-date">알림</span>
              <Toggle on={notify} onToggle={() => setNotify((v) => !v)} />
            </div>
          </>
        ) : aiLoading ? (
          <div className="ai-scroll">
            <div className="pd-ai rt-ai rt-combo-ai">
              <div className="ai-reason rt-gen">
                <div className="ai-reason-head">
                  <span className="ai-reason-title">
                    <AiBadge /> AI 루틴 분석 중
                  </span>
                </div>
                <div className="rt-gen-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <p className="rt-gen-txt">주빈님께 딱 맞는 루틴을 구성하고 있어요</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="ai-scroll">
            <div className="ai-title">{aiTitle}</div>

            <div className={"ai-reason" + (reportOpen ? "" : " collapsed")}>
              <div className="ai-reason-head">
                <span className="ai-reason-title">
                  <AiBadge /> 추천 이유
                </span>
                <button
                  className="ai-reason-chev"
                  onClick={() => setReportOpen((v) => !v)}
                  aria-label="추천 이유 펼치기/접기"
                >
                  <ChevronDown className={reportOpen ? "up" : ""} />
                </button>
              </div>
              {reportOpen && (
                <>
                  <div className="ai-reason-tags">
                    {rep.chips.map((c) => (
                      <span className="ai-rtag" key={c}>
                        {c}
                      </span>
                    ))}
                  </div>
                  <p className="ai-reason-text">{rep.text(aiTitle)}</p>
                  <div className="ai-reason-date">2025.05.22</div>
                </>
              )}
            </div>

            {/* 화장품 선택 영역 (Figma 612-16710) */}
            <div className="ai-prod-title">제품을 선택하세요</div>
            <div className="sameline-grid ai-prod-grid">
              {AI_PRODUCTS.map((p, i) => (
                <button
                  key={i}
                  className={"sameline-card ai-prod-card" + (selProds[i] ? " sel" : "")}
                  onClick={() => setSelProds((s) => s.map((v, j) => (j === i ? !v : v)))}
                >
                  <div className="sameline-thumb">
                    <img src={p.img} alt="" draggable="false" />
                    <span className="ai-prodsel-check">
                      <SqCheck on={selProds[i]} />
                    </span>
                  </div>
                  <div className="sameline-brand">{p.brand}</div>
                  <div className="sameline-name">{p.name}</div>
                  <div className="cab-tags ai-prod-tags">
                    {p.tags.map(([l, t]) => (
                      <span className={"tag " + t} key={t}>
                        {l}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="card-box repeat-flow">{repeatInner}</div>
            <div className="card-box chips-flow">{chipsInner}</div>
            <div className="set-flow">
              <div className="set-left">
                <div className="set-date">2026.06.07</div>
                <div className="set-sub">시간 설정</div>
              </div>
              <Toggle on={timeSet} onToggle={() => setTimeSet((v) => !v)} />
            </div>
            <div className="flow-divider" />
            <div className="set-flow">
              <span className="set-date">알림</span>
              <Toggle on={notify} onToggle={() => setNotify((v) => !v)} />
            </div>
          </div>
        )}

        <div className="sheet-bottom">
          {canSave && (
            <button className="save-btn" onClick={handleSave}>
              저장
            </button>
          )}
          <span className="sheet-home" />
        </div>
      </div>
    </div>
  );
}

/* ---------------- 화장품 등록하기 page ---------------- */
const ADD_PRODUCTS = [
  { brand: "일리윤", name: "히알루론 모이스처 수분크림", tags: [["크림", "cream"], ["기능성", "func"]], img: "/img/ap/ap1.png" },
  { brand: "닥터지", name: "레드 블리미쉬 클리어 수딩토너", tags: [["토너", "toner"]], img: "/img/ap/ap2.png" },
  { brand: "설화수", name: "UV 데일리 메이크업 베이스", tags: [["색조", "color"]], img: "/img/ap/ap3.png" },
  { brand: "일리윤", name: "AC 시카 클리어 미스트", tags: [["앰플", "ampoule"], ["기능성", "func"]], img: "/img/ap/ap4.png" },
  { brand: "헤라", name: "블랙 쿠션 파운데이션", tags: [["색조", "color"]], img: "/img/ap/ap5.png" },
  { brand: "넘버즈인", name: "1번 판토텐탄 엑티브 수딩크림", tags: [["크림", "cream"], ["기능성", "func"]], img: "/img/ap/ap6.png" },
  { brand: "메디힐", name: "티트리 수분 진정 토너", tags: [["토너", "toner"]], img: "/img/ap/ap7.png" },
  { brand: "에스트라", name: "아토베리아 365 하이드로 수딩크림", tags: [["크림", "cream"]], img: "/img/ap/ap8.png" },
  { brand: "에스트라", name: "아토베리아 365 수딩크림", tags: [["크림", "cream"]], img: "/img/ap/ap9.png" },
];
const ADD_CHIPS = ["전체", "크림", "립스틱", "토너", "쿠션", "선크림", "페이셜 마스크", "스팟 트리트먼트"];

// 검색 아이콘 (Figma 원본: 검정 링 + 코랄 손잡이)
function SearchIcon() {
  return (
    <svg className="ap-search-ic" width="20" height="20" viewBox="0 0 18 18" fill="none">
      <path
        d="M6.65711 13.3142C4.79653 13.3142 3.22187 12.6698 1.93312 11.3811C0.644374 10.0923 0 8.51769 0 6.65711C0 4.79653 0.644374 3.22187 1.93312 1.93312C3.22187 0.644374 4.79653 0 6.65711 0C8.51769 0 10.0923 0.644374 11.3811 1.93312C12.6698 3.22187 13.3142 4.79653 13.3142 6.65711C13.3142 7.40817 13.1947 8.11655 12.9558 8.78226C12.7168 9.44797 12.3925 10.0369 11.9828 10.549L17.7182 16.2843C17.9059 16.4721 17.9998 16.7111 17.9998 17.0012C17.9998 17.2914 17.9059 17.5304 17.7182 17.7182C17.5304 17.9059 17.2914 17.9998 17.0012 17.9998C16.7111 17.9998 16.4721 17.9059 16.2843 17.7182L10.549 11.9828C10.0369 12.3925 9.44797 12.7168 8.78226 12.9558C8.11655 13.1947 7.40817 13.3142 6.65711 13.3142ZM6.65711 11.2659C7.93732 11.2659 9.0255 10.8178 9.92165 9.92165C10.8178 9.0255 11.2659 7.93732 11.2659 6.65711C11.2659 5.3769 10.8178 4.28871 9.92165 3.39257C9.0255 2.49642 7.93732 2.04834 6.65711 2.04834C5.3769 2.04834 4.28871 2.49642 3.39257 3.39257C2.49642 4.28871 2.04834 5.3769 2.04834 6.65711C2.04834 7.93732 2.49642 9.0255 3.39257 9.92165C4.28871 10.8178 5.3769 11.2659 6.65711 11.2659Z"
        fill="#FF5160"
      />
      <path
        d="M6.65711 13.3142C4.79653 13.3142 3.22187 12.6698 1.93312 11.3811C0.644374 10.0923 0 8.51769 0 6.65711C0 4.79653 0.644374 3.22187 1.93312 1.93312C3.22187 0.644374 4.79653 0 6.65711 0C8.51769 0 10.0923 0.644374 11.3811 1.93312C12.6698 3.22187 13.3142 4.79653 13.3142 6.65711C13.3142 7.40817 13.1947 8.11655 12.9558 8.78226C12.7168 9.44797 12.3925 10.0369 11.9828 10.549L11.9999 10.566C12.1876 10.7538 11.2659 9.43944 11.2659 9.72962C11.2659 10.0198 11.4536 10.0539 11.2659 10.2417C11.0781 10.4295 11.1732 10.549 10.883 10.549C10.5929 10.549 10.7367 12.1706 10.549 11.9828C10.0369 12.3925 9.44797 12.7168 8.78226 12.9558C8.11655 13.1947 7.40817 13.3142 6.65711 13.3142ZM6.65711 11.2659C7.93732 11.2659 9.0255 10.8178 9.92165 9.92165C10.8178 9.0255 11.2659 7.93732 11.2659 6.65711C11.2659 5.3769 10.8178 4.28871 9.92165 3.39257C9.0255 2.49642 7.93732 2.04834 6.65711 2.04834C5.3769 2.04834 4.28871 2.49642 3.39257 3.39257C2.49642 4.28871 2.04834 5.3769 2.04834 6.65711C2.04834 7.93732 2.49642 9.0255 3.39257 9.92165C4.28871 10.8178 5.3769 11.2659 6.65711 11.2659Z"
        fill="black"
      />
      <path
        d="M6.65711 0C4.79653 0 3.22187 0.644374 1.93312 1.93312C0.644374 3.22187 0 4.79653 0 6.65711C0 8.51769 0.644374 10.0923 1.93312 11.3811C3.22187 12.6698 4.79653 13.3142 6.65711 13.3142C8.51769 13.3142 10.0923 12.6698 11.3811 11.3811C12.6698 10.0923 13.3142 8.51769 13.3142 6.65711C13.3142 5.90605 13.1947 5.19767 12.9558 4.53196C12.7168 3.86624 12.3925 3.27735 11.9828 2.76526L11.9999 2.74819C12.1876 2.56043 11.2659 3.87478 11.2659 3.5846C11.2659 3.29442 11.4536 3.26028 11.2659 3.07251C11.0781 2.88475 11.1732 2.76526 10.883 2.76526C10.5929 2.76526 10.7367 1.14366 10.549 1.33142C10.0369 0.921754 9.44797 0.597433 8.78226 0.358459C8.11655 0.119486 7.40817 0 6.65711 0ZM6.65711 2.04834C7.93732 2.04834 9.0255 2.49642 9.92165 3.39257C10.8178 4.28871 11.2659 5.3769 11.2659 6.65711C11.2659 7.93732 10.8178 9.0255 9.92165 9.92165C9.0255 10.8178 7.93732 11.2659 6.65711 11.2659C5.3769 11.2659 4.28871 10.8178 3.39257 9.92165C2.49642 9.0255 2.04834 7.93732 2.04834 6.65711C2.04834 5.3769 2.49642 4.28871 3.39257 3.39257C4.28871 2.49642 5.3769 2.04834 6.65711 2.04834Z"
        fill="black"
      />
    </svg>
  );
}

function AddProductPage({ onBack, onOpenSearch, onPickRecent, onImport }) {
  const [chip, setChip] = useState("전체");
  const chipScroll = useDragScroll();
  // 카테고리 칩 = 제품 뱃지(태그) 기준으로 추려서 노출
  const filtered =
    chip === "전체"
      ? ADD_PRODUCTS
      : ADD_PRODUCTS.filter((p) => p.tags.some(([label]) => label === chip));
  return (
    <div className="addpage">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="ap-header">
        <button className="ap-back" onClick={onBack} aria-label="뒤로">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1.5 9L9 17" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="ap-title">화장품 등록하기</h1>
      </div>

      <div className="entry-cards ap-cards">
        <button className="entry-card green">
          <div className="entry-text">
            AI로
            <br />
            스캔하기
          </div>
          <img className="entry-ill" src="/img/ap/ill_scan.png" alt="" />
        </button>
        <button className="entry-card light" onClick={onImport}>
          <div className="entry-text">
            제품 사진
            <br />
            불러오기
          </div>
          <img className="entry-ill" src="/img/ap/ill_photo.png" alt="" />
        </button>
      </div>

      <h2 className="ap-recent">최근 등록한 제품</h2>

      <button className="ap-search" onClick={onOpenSearch}>
        <span className="ap-search-ph">제품명, 브랜드를 입력하세요</span>
        <SearchIcon />
      </button>

      <div className="ap-chips" ref={chipScroll}>
        {ADD_CHIPS.map((c) => (
          <button
            key={c}
            className={"ap-chip" + (chip === c ? " on" : "")}
            onClick={() => setChip(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="product-grid ap-grid">
        {filtered.map((p, i) => (
          <button className="product" key={i} onClick={() => onPickRecent(p)}>
            <div className="product-img">
              <img src={p.img} alt="" />
            </div>
            <div className="product-brand">{p.brand}</div>
            <div className="product-name">{p.name}</div>
            <div className="product-tags">
              {p.tags.map(([label, type]) => (
                <span className={"tag " + type} key={type}>
                  {label}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- 제품 찾기 (검색) page ---------------- */
const RECENT_SEARCHES = ["미샤 토마토 선크림", "한율 쑥", "아토", "넘버즈"];
const RECO_SEARCHES = ["에스트라", "일리윤 로션", "일리윤", "영양 크림", "아토베리아", "쑥팩폼", "넘버즈 4번 패드"];
// 검색어 별칭: 키워드 → 정확히 매칭할 "브랜드 제품명" (해당 제품만 노출)
const SEARCH_ALIASES = { "쑥팩폼": "한율 어린쑥 클렌징 폼" };
const SEARCH_RESULTS = [
  { brand: "네이처리퍼블릭", name: "데일리 블러셔", tags: [["색조", "color"]], img: "/img/search/p01.png" },
  { brand: "마몽드", name: "아줄렌 카밍샷 앰플", tags: [["앰플", "ampoule"]], img: "/img/search/p02.png" },
  { brand: "샘유", name: "PH 센시티브 토너패드", tags: [["토너", "toner"]], img: "/img/search/p03.png" },
  { brand: "퓌", name: "스웨이드 쿠션", tags: [["색조", "color"]], img: "/img/search/p04.png" },
  { brand: "클리오", name: "킬커버 쿠션", tags: [["색조", "color"]], img: "/img/search/p05.png" },
  { brand: "퓌", name: "무드업 아이팔레트", tags: [["색조", "color"]], img: "/img/search/p06.png" },
  { brand: "토리든", name: "다이브인 프로 앰플", tags: [["앰플", "ampoule"]], img: "/img/search/p07.png" },
  { brand: "토리든", name: "셀메이징 브라이트닝 앰플", tags: [["앰플", "ampoule"]], img: "/img/search/p08.png" },
  { brand: "일리윤", name: "히알루론 수분크림", tags: [["크림", "cream"]], img: "/img/search/p09.png" },
  { brand: "토리든", name: "밸런스풀 필링 토너", tags: [["토너", "toner"]], img: "/img/search/p10.png" },
  { brand: "포고니아", name: "시카 리페어 크림", tags: [["크림", "cream"]], img: "/img/search/p11.png" },
  { brand: "프랑소와", name: "올인원 퍼펙터", tags: [["앰플", "ampoule"]], img: "/img/search/p12.png" },
  { brand: "샹테카이", name: "루미네센스 립스틱", tags: [["색조", "color"]], img: "/img/search/p13.png" },
  { brand: "퓌", name: "립앤치크 푸딩팟", tags: [["색조", "color"]], img: "/img/search/p14.png" },
  { brand: "프롬니어", name: "시카 워터 선앰플", tags: [["기능성", "func"]], img: "/img/search/p15.png" },
  { brand: "세로랩스", name: "수딩 토너", tags: [["토너", "toner"]], img: "/img/search/p16.png" },
  { brand: "윤작", name: "내추럴 피니시 파운데이션", tags: [["색조", "color"]], img: "/img/search/p17.png" },
  { brand: "이지듀", name: "MD 보습크림", tags: [["크림", "cream"]], img: "/img/search/p18.png" },
  { brand: "토리든", name: "밸런스풀 pH 토너", tags: [["토너", "toner"]], img: "/img/search/p19.png" },
  { brand: "클리오", name: "프로 아이팔레트", tags: [["색조", "color"]], img: "/img/search/p20.png" },
  { brand: "메나드", name: "TK 립스틱", tags: [["색조", "color"]], img: "/img/search/p21.png" },
  { brand: "닥터산테", name: "아줄렌 수더 토너", tags: [["토너", "toner"]], img: "/img/search/p22.png" },
  { brand: "아비브", name: "콜라겐 겔 마스크", tags: [["기타", "etc"]], img: "/img/search/p23.png" },
  { brand: "이니스프리", name: "그린티 세라마이드 크림", tags: [["크림", "cream"]], img: "/img/search/p24.png" },
  { brand: "메디힐", name: "PDRN 리프팅 패드", tags: [["토너", "toner"]], img: "/img/search/p25.png" },
  { brand: "메디힐", name: "티트리 카밍 패드", tags: [["토너", "toner"]], img: "/img/search/p26.png" },
  { brand: "메디힐", name: "콜라겐 퍼밍 패드", tags: [["토너", "toner"]], img: "/img/search/p27.png" },
  { brand: "메디힐", name: "히알루론 수분 패드", tags: [["토너", "toner"]], img: "/img/search/p28.png" },
  { brand: "메디힐", name: "마데카소사이드 마스크", tags: [["기타", "etc"]], img: "/img/search/p29.png" },
  { brand: "퓌", name: "글래스 쿠션", tags: [["색조", "color"]], img: "/img/search/p30.png" },
  { brand: "더페이스샵", name: "잉크래스팅 파운데이션", tags: [["색조", "color"]], img: "/img/search/p31.png" },
  { brand: "코스알엑스", name: "하이드리움 워터리 토너", tags: [["토너", "toner"]], img: "/img/search/p32.png" },
  { brand: "아로마티카", name: "pH 밸런싱 토너", tags: [["토너", "toner"]], img: "/img/search/p33.png" },
  { brand: "팜스테이", name: "티트리 바이옴 토너패드", tags: [["토너", "toner"]], img: "/img/search/p34.png" },
  { brand: "브링그린", name: "나이아신아마이드 세럼", tags: [["앰플", "ampoule"]], img: "/img/search/p35.png" },
  { brand: "입생로랑", name: "루쥬 립스틱", tags: [["색조", "color"]], img: "/img/search/p36.png" },
  { brand: "제주마을", name: "바다포도 앰플", tags: [["앰플", "ampoule"]], img: "/img/search/p37.png" },
  { brand: "프랑소와", name: "브릴리언트 모이스처 크림", tags: [["크림", "cream"]], img: "/img/search/p38.png" },
  { brand: "힌스", name: "트루 디멘션 팔레트", tags: [["색조", "color"]], img: "/img/search/p39.png" },
  { brand: "토니모리", name: "그린티 수분크림", tags: [["크림", "cream"]], img: "/img/search/p40.png" },
  { brand: "바비브라운", name: "럭스 립스틱", tags: [["색조", "color"]], img: "/img/search/p41.png" },
  { brand: "끌레드뽀", name: "립 글로스", tags: [["색조", "color"]], img: "/img/search/p42.png" },
  { brand: "페리페라", name: "슈가트윙클 팔레트", tags: [["색조", "color"]], img: "/img/search/p43.png" },
  { brand: "더마하우스", name: "멜라스탑 선크림", tags: [["기능성", "func"]], img: "/img/search/p44.png" },
  { brand: "어뮤즈", name: "3색 블러셔 팔레트", tags: [["색조", "color"]], img: "/img/search/p45.png" },
  { brand: "한율", name: "쌀 보습크림", tags: [["크림", "cream"]], img: "/img/search/p46.png" },
  { brand: "맥", name: "페이스 쿠션", tags: [["색조", "color"]], img: "/img/search/p47.png" },
  { brand: "푸드어홀릭", name: "멀티 선크림", tags: [["기능성", "func"]], img: "/img/search/p48.png" },
  { brand: "끌레드뽀", name: "루쥬 립스틱", tags: [["색조", "color"]], img: "/img/search/p49.png" },
  { brand: "파넬", name: "시카마누 토너", tags: [["토너", "toner"]], img: "/img/search/p50.png" },
  { brand: "한율", name: "어린쑥 진정 미스트", tags: [["토너", "toner"]], img: "/img/search/p51.png" },
  { brand: "한율", name: "은행잎 모공핏 세럼", tags: [["앰플", "ampoule"]], img: "/img/search/p52.png" },
  { brand: "한율", name: "어린쑥 클렌징 폼", tags: [["기타", "etc"]], img: "/img/search/p53.png" },
  { brand: "한율", name: "달빛유자 클렌징 폼", tags: [["기타", "etc"]], img: "/img/search/p54.png" },
  { brand: "한율", name: "어린쑥 수분진정 크림", tags: [["크림", "cream"]], img: "/img/search/p55.png" },
  { brand: "한율", name: "어린쑥 속수분 크림", tags: [["크림", "cream"]], img: "/img/search/p56.png" },
  { brand: "에스트라", name: "아토베리아 365 하이드로 수딩크림", tags: [["크림", "cream"]], img: "/img/search/r_ap8.png" },
  { brand: "에스트라", name: "아토베리아 365 수딩크림", tags: [["크림", "cream"]], img: "/img/search/r_ap9.png" },
  { brand: "퓨리토 서울", name: "모이스처 펜타놀 크림", tags: [["크림", "cream"]], img: "/img/search/r_purito.png" },
  { brand: "동아제약", name: "무첨가 D판테놀 연고", tags: [["크림", "cream"]], img: "/img/search/r_donga.png" },
  { brand: "아토팜", name: "집중 고보습 진정 크림", tags: [["크림", "cream"]], img: "/img/search/r_atopalm.png" },
  { brand: "라운드랩", name: "약콩 판테놀 크림", tags: [["크림", "cream"]], img: "/img/search/r_roundlab.png" },
  { brand: "닥터지", name: "스킨베리어 모이스처 크림", tags: [["크림", "cream"]], img: "/img/search/r_drg.png" },
  { brand: "네이처카인드", name: "시카 판테놀 크림", tags: [["크림", "cream"]], img: "/img/search/r_naturekind.png" },
  { brand: "토소웅", name: "덱스 판테놀 크림", tags: [["크림", "cream"]], img: "/img/search/r_tosoung.png" },
  { brand: "넘버즈인", name: "1번 판토텐탄 수딩크림", tags: [["크림", "cream"]], img: "/img/search/r_ap6.png" },
  { brand: "포밤", name: "퍼펙션 베이비 아토크림", tags: [["크림", "cream"]], img: "/img/search/r_pobam.png" },
  { brand: "에스네이처", name: "아쿠아 스쿠알란 수분크림", tags: [["크림", "cream"]], img: "/img/search/r_esnature.png" },
  { brand: "일리윤", name: "세라마이드 아토 집중크림", tags: [["크림", "cream"]], img: "/img/search/r_illiyoon.png" },
  { brand: "세타필", name: "데일리 모이스처라이징 크림", tags: [["크림", "cream"]], img: "/img/search/r_dropcream.png" },
  { brand: "라운드랩", name: "1025 독도 수분 크림", tags: [["크림", "cream"]], img: "/img/search/r_prodpurito.png" },
  { brand: "라운드랩", name: "자작나무 수분 토너", tags: [["토너", "toner"]], img: "/img/search/r_prodroundlab.png" },
  { brand: "닥터지", name: "레드 블레미쉬 수딩 토너", tags: [["토너", "toner"]], img: "/img/search/r_ap2.png" },
  { brand: "메디힐", name: "티트리 카밍 토너", tags: [["토너", "toner"]], img: "/img/search/r_ap7.png" },
  { brand: "크리스마", name: "PH 모이스처 카밍 토너", tags: [["토너", "toner"]], img: "/img/search/r_krisma.png" },
  { brand: "일리윤", name: "AC 시카 클리어 미스트", tags: [["토너", "toner"]], img: "/img/search/r_ap4.png" },
  { brand: "토리든", name: "다이브인 저분자 히알루론 세럼", tags: [["앰플", "ampoule"]], img: "/img/search/r_torriden.png" },
  { brand: "넘버즈인", name: "5번 광채 필링 세럼", tags: [["앰플", "ampoule"]], img: "/img/search/r_dropper.png" },
  { brand: "아이소이", name: "불가리안 로즈 히알루론 앰플", tags: [["앰플", "ampoule"]], img: "/img/search/r_dropampoule.png" },
  { brand: "헤라", name: "블랙 쿠션 파운데이션", tags: [["색조", "color"]], img: "/img/search/r_ap5.png" },
  { brand: "설화수", name: "UV 데일리 메이크업 베이스", tags: [["색조", "color"]], img: "/img/search/r_ap3.png" },
];

const PER_PAGE = 12; // 한 페이지 최대 상품 수

const BROWSE_CATS = ["전체", "수분충전", "지성피부", "건성피부", "수부지"];
// 이전에 만족한 크림 — 브랜드·제품·이미지 모두 서로 다른 3종 (중복 없음, 에스트라 검색결과와도 겹치지 않게)
const SHOP_SATISFIED = [
  { brand: "일리윤", name: "히알루론 모이스처 수분크림", off: "17%", price: "37,160", img: "/img/skin/top_illiyoon.png" },
  { brand: "에스네이처", name: "아쿠아 스쿠알란 수분크림", off: "8%", price: "34,200", img: "/img/skin/refill_esnature.png" },
  { brand: "포밤", name: "퍼펙션 베이비 아토크림", off: "15%", price: "19,160", img: "/img/shop/s1_pobam.png" },
];
const BROWSE_OFFS = ["8%", "12%", "17%", "23%", "10%", "26%", "20%"];
const BROWSE_PRICES = ["18,400", "37,160", "29,200", "14,800", "38,700", "22,100", "30,160"];
const browsePrice = (i) => ({ off: BROWSE_OFFS[i % BROWSE_OFFS.length], price: BROWSE_PRICES[i % BROWSE_PRICES.length] });
function SearchPage({ onBack, picked, onTogglePick, initialQuery = "", onRequest, browse = false, onProductClick, onNav, onQueryChange, initialBcat = "전체", onBcatChange, initialPage = 1, onPageChange }) {
  const [q, setQ] = useState(initialQuery);
  const [page, setPage] = useState(initialPage);
  const [bcat, setBcat] = useState(initialBcat);
  const inputRef = useRef(null);
  // 검색 상태를 상위로 올려 상세 진입 후 뒤로 와도 검색하던 페이지가 유지되게 함
  useEffect(() => { onQueryChange && onQueryChange(q); }, [q]);
  useEffect(() => { onBcatChange && onBcatChange(bcat); }, [bcat]);
  useEffect(() => { onPageChange && onPageChange(page); }, [page]);
  // 진입 시점의 선택값을 고정(마운트 1회) — 정렬 우선순위에만 사용
  const initialPicked = useRef(picked).current;
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
    return () => clearTimeout(t);
  }, []);
  const hasQuery = q.trim().length > 0;

  // 검색어 토큰 중 하나라도 브랜드/제품명/태그에 포함되면 노출 (원본 인덱스 보존)
  const alias = SEARCH_ALIASES[q.trim()]; // 별칭이면 해당 제품만 정확 매칭
  const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const catTags = browse ? BROWSE_CAT_TAGS[bcat] : null; // 카테고리 필터
  const results = SEARCH_RESULTS.map((p, i) => ({ ...p, _i: i })).filter((p) => {
    if (catTags && !p.tags.some(([l, t]) => catTags.includes(t))) return false;
    if (alias) return p.brand + " " + p.name === alias;
    const hay = (p.brand + " " + p.name + " " + p.tags.map(([l]) => l).join(" ")).toLowerCase();
    return tokens.some((t) => hay.includes(t));
  });
  // 진입 시 미리 선택된(최근제품 클릭으로 엮인) 제품만 맨 앞으로 고정.
  // 사용자가 직접 체크/해제할 때는 순서가 바뀌지 않고 체크박스만 채워짐.
  results.sort(
    (a, b) => (initialPicked.includes(b._i) ? 1 : 0) - (initialPicked.includes(a._i) ? 1 : 0)
  );

  // 현재 검색 결과 기준 페이지네이션 (12개씩)
  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const curPage = Math.min(page, totalPages);
  const pageResults = results.slice((curPage - 1) * PER_PAGE, curPage * PER_PAGE);

  return (
    <div className="addpage">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="ap-header">
        <button className="ap-back" onClick={onBack} aria-label="뒤로">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1.5 9L9 17" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="ap-title">제품 찾기</h1>
      </div>

      <div className="ap-search">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="제품명, 브랜드를 입력하세요"
        />
        <SearchIcon />
      </div>

      {!hasQuery ? (
        <div className="sr-terms">
          <div className="sr-term-title">최근 검색어</div>
          <div className="sr-chips">
            {RECENT_SEARCHES.map((t) => (
              <button key={t} className="sr-chip recent" onClick={() => { setQ(t); setPage(1); }}>
                {t}
              </button>
            ))}
          </div>
          <div className="sr-term-title reco">추천 검색어</div>
          <div className="sr-chips">
            {RECO_SEARCHES.map((t) => (
              <button key={t} className="sr-chip reco" onClick={() => { setQ(t); setPage(1); }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      ) : browse ? (
        <>
          <div className="shop-chips sr-bcats">
            {BROWSE_CATS.map((c) => (
              <button key={c} className={"rt-chip shop-chip" + (bcat === c ? " on" : "")} onClick={() => setBcat(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="sr-browse-scroll">
            <div className="sameline-grid sr-browse-grid">
              {pageResults.map((p) => {
                const pr = browsePrice(p._i);
                return (
                  <button className={"sameline-card shop-card" + (canShopDetail(p) ? " link" : "")} key={p._i} onClick={() => canShopDetail(p) && onProductClick && onProductClick({ ...p, ...pr })}>
                    <div className="sameline-thumb">
                      <img src={p.img} alt="" draggable="false" />
                    </div>
                    <div className="sameline-brand">{p.brand}</div>
                    <div className="sameline-name">{p.name}</div>
                    <div className="sameline-price">
                      <span className="sameline-off">{pr.off}</span> {pr.price}
                    </div>
                  </button>
                );
              })}
            </div>
            {results.length > 0 && totalPages > 1 && (
              <div className="sr-pager">
                {Array.from({ length: totalPages }, (_, k) => k + 1).map((n) => (
                  <button key={n} className={"sr-page" + (n === curPage ? " on" : "")} onClick={() => setPage(n)}>
                    {n}
                  </button>
                ))}
              </div>
            )}
            <div className="section-head sr-sec2">
              <h2 className="section-title">
                이전에 만족한 <span className="shop-cat-hl">크림</span>이에요
              </h2>
              <button className="see-all shop-see-all">
                전체보기 <ChevronRight />
              </button>
            </div>
            <div className="sameline-grid sr-browse-grid">
              {SHOP_SATISFIED.map((p, i) => (
                <button className={"sameline-card shop-card" + (canShopDetail(p) ? " link" : "")} key={i} onClick={() => canShopDetail(p) && onProductClick && onProductClick(p)}>
                  <div className="sameline-thumb">
                    <img src={p.img} alt="" draggable="false" />
                  </div>
                  <div className="sameline-brand">{p.brand}</div>
                  <div className="sameline-name">{p.name}</div>
                  <div className="sameline-price">
                    <span className="sameline-off">{p.off}</span> {p.price}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <BottomNav active="left" onNav={onNav} />
        </>
      ) : (
        <>
          {/* Figma Frame 111 — 세로 오토레이아웃 gap 40 (결과 → 밴드 → footer) */}
          <div className="sr-body">
          <div className="sr-results">
          <div className="product-grid ap-grid">
            {pageResults.map((p) => (
              <button
                className={"product sr-product" + (picked.includes(p._i) ? " on" : "")}
                key={p._i}
                onClick={() => onTogglePick(p._i)}
              >
                <div className="product-img sr-img">
                  <img src={p.img} alt="" />
                  <span className="ai-prod-check">
                    <svg className="ai-check-ic" width="11" height="8" viewBox="0 0 13 10" fill="none">
                      <path d="M1.5 5.2L4.8 8.4L11.2 1.6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
                <div className="product-brand">{p.brand}</div>
                <div className="product-name">{p.name}</div>
                <div className="product-tags">
                  {p.tags.map(([label, type]) => (
                    <span className={"tag " + type} key={type}>
                      {label}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {results.length > 0 && totalPages > 1 && (
            <div className="sr-pager">
              {Array.from({ length: totalPages }, (_, k) => k + 1).map((n) => (
                <button
                  key={n}
                  className={"sr-page" + (n === curPage ? " on" : "")}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
          </div>

          <div className="sr-divider" />

          <div className="sr-footer">
            <svg className="sr-foot-ic" width="41" height="44" viewBox="0 0 41 44" fill="none">
              <rect x="6" y="6" width="24" height="32" rx="4" fill="#FFEEEF" />
              <line x1="11" y1="13" x2="25" y2="13" stroke="#FFC9CE" strokeWidth="2" strokeLinecap="round" />
              <line x1="11" y1="23" x2="18" y2="23" stroke="#FFC9CE" strokeWidth="2" strokeLinecap="round" />
              <line x1="11" y1="18" x2="18" y2="18" stroke="#FFC9CE" strokeWidth="2" strokeLinecap="round" />
              <line x1="19.5" y1="23.5" x2="25.5" y2="23.5" stroke="#FFC9CE" strokeWidth="3" strokeLinecap="round" />
              <path d="M24.6354 32.0843C22.5538 32.0843 20.7921 31.3634 19.3503 29.9215C17.9084 28.4797 17.1875 26.718 17.1875 24.6364C17.1875 22.5548 17.9084 20.7931 19.3503 19.3512C20.7921 17.9094 22.5538 17.1885 24.6354 17.1885C26.717 17.1885 28.4787 17.9094 29.9206 19.3512C31.3624 20.7931 32.0833 22.5548 32.0833 24.6364C32.0833 25.4767 31.9497 26.2692 31.6823 27.014C31.4149 27.7588 31.0521 28.4176 30.5937 28.9906L37.0104 35.4072C37.2205 35.6173 37.3255 35.8847 37.3255 36.2093C37.3255 36.534 37.2205 36.8013 37.0104 37.0114C36.8003 37.2215 36.533 37.3265 36.2083 37.3265C35.8837 37.3265 35.6163 37.2215 35.4062 37.0114L28.9896 30.5947C28.4167 31.0531 27.7578 31.4159 27.013 31.6833C26.2682 31.9506 25.4757 32.0843 24.6354 32.0843ZM24.6354 29.7926C26.0677 29.7926 27.2852 29.2913 28.2878 28.2887C29.2904 27.2861 29.7917 26.0687 29.7917 24.6364C29.7917 23.2041 29.2904 21.9867 28.2878 20.984C27.2852 19.9814 26.0677 19.4801 24.6354 19.4801C23.2031 19.4801 21.9857 19.9814 20.9831 20.984C19.9805 21.9867 19.4792 23.2041 19.4792 24.6364C19.4792 26.0687 19.9805 27.2861 20.9831 28.2887C21.9857 29.2913 23.2031 29.7926 24.6354 29.7926Z" fill="#FF5160" />
              <path d="M24.6354 17.1872C22.5538 17.1872 20.7921 17.9081 19.3503 19.3499C17.9084 20.7918 17.1875 22.5535 17.1875 24.6351C17.1875 26.7167 17.9084 28.4784 19.3503 29.9202C20.7921 31.3621 22.5538 32.083 24.6354 32.083C26.717 32.083 28.4787 31.3621 29.9206 29.9202C31.3624 28.4784 32.0833 26.7167 32.0833 24.6351C32.0833 23.7948 31.9497 23.0023 31.6823 22.2575C31.4149 21.5127 31.0521 20.8538 30.5938 20.2809L30.6129 20.2618C30.8229 20.0518 29.7917 21.5222 29.7917 21.1976C29.7917 20.8729 30.0017 20.8347 29.7917 20.6247C29.5816 20.4146 29.688 20.2809 29.3634 20.2809C29.0387 20.2809 29.1997 18.4667 28.9896 18.6768C28.4167 18.2184 27.7578 17.8556 27.013 17.5882C26.2682 17.3208 25.4757 17.1872 24.6354 17.1872ZM24.6354 19.4788C26.0677 19.4788 27.2852 19.9801 28.2878 20.9827C29.2904 21.9853 29.7917 23.2028 29.7917 24.6351C29.7917 26.0674 29.2904 27.2848 28.2878 28.2874C27.2852 29.29 26.0677 29.7913 24.6354 29.7913C23.2031 29.7913 21.9857 29.29 20.9831 28.2874C19.9805 27.2848 19.4792 26.0674 19.4792 24.6351C19.4792 23.2028 19.9805 21.9853 20.9831 20.9827C21.9857 19.9801 23.2031 19.4788 24.6354 19.4788Z" fill="black" />
            </svg>
            <div className="sr-foot-q">찾으시는 상품이 없으신가요?</div>
            <button className="sr-register" onClick={onRequest}>상품 정보 등록하기</button>
          </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- 상품 등록 요청 (Figma 680-19110 / 681-19362) ---------------- */
function RequestPage({ onBack, onPickImage, onSubmit, brand, setBrand, name, setName, imageCells = [] }) {
  const ready = brand.trim() !== "" && name.trim() !== "";
  const imgSrcs = imageCells.map((c) => ALBUM_SRC[ALBUM_GRID[c]]);
  return (
    <div className="addpage reqpage">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="ap-header">
        <button className="ap-back" onClick={onBack} aria-label="뒤로">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1.5 9L9 17" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="ap-title">상품 등록 요청</h1>
      </div>

      <div className="req-body">
        <div className="req-field">
          <label className="req-label">
            브랜드<span className="req-star">*</span>
          </label>
          <input
            className="req-input"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="브랜드명을 입력하세요"
          />
        </div>
        <div className="req-field">
          <label className="req-label">
            상품 이름<span className="req-star">*</span>
          </label>
          <input
            className="req-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="상품명을 입력하세요"
          />
        </div>
        <div className="req-field">
          <label className="req-label">이미지</label>
          {imgSrcs.length === 0 ? (
            <button className="req-upload" type="button" onClick={onPickImage}>
              <span className="req-upload-txt">해당 상품의 이미지를 업로드 해주세요</span>
            </button>
          ) : (
            <div className="req-upload-filled">
              <div className="req-thumbs">
                {imgSrcs.map((src, i) => (
                  <div className="req-thumb" key={i}>
                    <img src={src} alt="" draggable="false" />
                  </div>
                ))}
                <button className="req-plus" type="button" onClick={onPickImage} aria-label="이미지 추가">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 3.75V14.25M3.75 9H14.25" stroke="#FFC9CE" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="req-cta">
        <button
          className={"req-submit" + (ready ? " on" : "")}
          disabled={!ready}
          onClick={ready ? onSubmit : undefined}
        >
          등록 요청
        </button>
      </div>
    </div>
  );
}

/* ---------------- 상품 등록 요청 완료 (Figma 681-19321) ---------------- */
// 화장대 일러스트 + 성공화면과 동일한 파티클(SUCCESS_CONFETTI) + 타이틀/서브타이틀
function RequestDonePage({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000); // 약 3초 노출 후 이전 화면으로 복귀
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flowpage">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <Confetti particles={SUCCESS_CONFETTI} cx={197} />
      <img className="reqdone-illus" src="/img/ap/illus_reqdone.png" alt="" draggable="false" />
      <div className="reqdone-title">
        제품 등록 요청이<br />
        완료되었어요!
      </div>
      <div className="reqdone-sub">등록일 기준 4~5일 소요됩니다</div>
    </div>
  );
}

/* ---------------- 개봉일 입력 (선택 제품 등록) ---------------- */
// 개봉 상태: 사용 중(유통기한+개봉일 둘 다) / 개봉 안 함(유통기한만). 기본값은 선택 전(null)
const REG_MODES = [
  { key: "using", label: "사용 중이에요" },
  { key: "unopened", label: "개봉 안 했어요" },
];
const MAX_EXPIRY_MONTHS = 72; // 유통기한 최대 72개월(약 6년)

// 카테고리별 개봉 후 권장 사용기간(PAO, 개월)
const PAO_MONTHS = { cream: 12, toner: 6, ampoule: 6, func: 12, color: 12, etc: 6 };

const dstr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayStr = () => dstr(new Date());
const monthsAgoStr = (m) => {
  const d = new Date();
  d.setMonth(d.getMonth() - m);
  return dstr(d);
};
const weekAgoStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return dstr(d);
};
const monthsAheadStr = (m) => {
  const d = new Date();
  d.setMonth(d.getMonth() + m);
  return dstr(d);
};
// 개봉일 + PAO개월 = 사용기한
const addMonthsStr = (dateStr, months) => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return dstr(d);
};

function CalendarIcon({ active }) {
  // Figma 정확 SVG: 비활성(기본)=회색 바디+회색 링 / 활성(날짜 선택됨)=검정 바디+코랄 링
  const body = active ? "#000000" : "#999999";
  const ring = active ? "#FF5160" : "#999999";
  return (
    <svg className="reg-cal" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 22C4.45 22 3.97917 21.8042 3.5875 21.4125C3.19583 21.0208 3 20.55 3 20V6C3 5.45 3.19583 4.97917 3.5875 4.5875C3.97917 4.19583 4.45 4 5 4H6H7H8H16H17H18H19C19.55 4 20.0208 4.19583 20.4125 4.5875C20.8042 4.97917 21 5.45 21 6V20C21 20.55 20.8042 21.0208 20.4125 21.4125C20.0208 21.8042 19.55 22 19 22H5ZM5 20H19V11H5V20ZM5 9H19V6H5V9ZM12 14C11.7167 14 11.4792 13.9042 11.2875 13.7125C11.0958 13.5208 11 13.2833 11 13C11 12.7167 11.0958 12.4792 11.2875 12.2875C11.4792 12.0958 11.7167 12 12 12C12.2833 12 12.5208 12.0958 12.7125 12.2875C12.9042 12.4792 13 12.7167 13 13C13 13.2833 12.9042 13.5208 12.7125 13.7125C12.5208 13.9042 12.2833 14 12 14ZM7.2875 13.7125C7.09583 13.5208 7 13.2833 7 13C7 12.7167 7.09583 12.4792 7.2875 12.2875C7.47917 12.0958 7.71667 12 8 12C8.28333 12 8.52083 12.0958 8.7125 12.2875C8.90417 12.4792 9 12.7167 9 13C9 13.2833 8.90417 13.5208 8.7125 13.7125C8.52083 13.9042 8.28333 14 8 14C7.71667 14 7.47917 13.9042 7.2875 13.7125ZM16 14C15.7167 14 15.4792 13.9042 15.2875 13.7125C15.0958 13.5208 15 13.2833 15 13C15 12.7167 15.0958 12.4792 15.2875 12.2875C15.4792 12.0958 15.7167 12 16 12C16.2833 12 16.5208 12.0958 16.7125 12.2875C16.9042 12.4792 17 12.7167 17 13C17 13.2833 16.9042 13.5208 16.7125 13.7125C16.5208 13.9042 16.2833 14 16 14ZM12 18C11.7167 18 11.4792 17.9042 11.2875 17.7125C11.0958 17.5208 11 17.2833 11 17C11 16.7167 11.0958 16.4792 11.2875 16.2875C11.4792 16.0958 11.7167 16 12 16C12.2833 16 12.5208 16.0958 12.7125 16.2875C12.9042 16.4792 13 16.7167 13 17C13 17.2833 12.9042 17.5208 12.7125 17.7125C12.5208 17.9042 12.2833 18 12 18ZM7.2875 17.7125C7.09583 17.5208 7 17.2833 7 17C7 16.7167 7.09583 16.4792 7.2875 16.2875C7.47917 16.0958 7.71667 16 8 16C8.28333 16 8.52083 16.0958 8.7125 16.2875C8.90417 16.4792 9 16.7167 9 17C9 17.2833 8.90417 17.5208 8.7125 17.7125C8.52083 17.9042 8.28333 18 8 18C7.71667 18 7.47917 17.9042 7.2875 17.7125ZM16 18C15.7167 18 15.4792 17.9042 15.2875 17.7125C15.0958 17.5208 15 17.2833 15 17C15 16.7167 15.0958 16.4792 15.2875 16.2875C15.4792 16.0958 15.7167 16 16 16C16.2833 16 16.5208 16.0958 16.7125 16.2875C16.9042 16.4792 17 16.7167 17 17C17 17.2833 16.9042 17.5208 16.7125 17.7125C16.5208 17.9042 16.2833 18 16 18Z"
        fill={body}
      />
      <ellipse cx="3.48008" cy="1.38278" rx="3.48008" ry="1.38278" transform="matrix(0.5 -0.866025 -0.823289 -0.567623 7.27734 9)" fill={ring} />
      <ellipse cx="3.48008" cy="1.38278" rx="3.48008" ry="1.38278" transform="matrix(0.5 -0.866025 -0.823289 -0.567623 16.0332 9)" fill={ring} />
    </svg>
  );
}

/* 날짜 선택 캘린더 모달 (앱 스타일) */
const WEEK_KO = ["일", "월", "화", "수", "목", "금", "토"];
function fmtDot(d) {
  return d ? d.replaceAll("-", ". ") : "";
}
function CalendarModal({ open, value, onClose, onSelect, minDate, maxDate }) {
  const base = value ? new Date(value) : new Date();
  const [ym, setYm] = useState({ y: base.getFullYear(), m: base.getMonth() });
  const [sel, setSel] = useState(value || null);
  useEffect(() => {
    if (open) {
      const b = value ? new Date(value) : new Date();
      setYm({ y: b.getFullYear(), m: b.getMonth() });
      setSel(value || null);
    }
  }, [open, value]);
  if (!open) return null;

  const firstDow = new Date(ym.y, ym.m, 1).getDay();
  const daysIn = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  const prevMonth = () => setYm((s) => (s.m === 0 ? { y: s.y - 1, m: 11 } : { y: s.y, m: s.m - 1 }));
  const nextMonth = () => setYm((s) => (s.m === 11 ? { y: s.y + 1, m: 0 } : { y: s.y, m: s.m + 1 }));
  const mk = (d) => `${ym.y}-${String(ym.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const today = new Date();
  const isToday = (d) => today.getFullYear() === ym.y && today.getMonth() === ym.m && today.getDate() === d;
  // 유통기한 최대 72개월 등 선택 가능 범위 제한 (범위 밖 날짜 비활성)
  const outOfRange = (d) => (minDate && mk(d) < minDate) || (maxDate && mk(d) > maxDate);

  return (
    <div className="cal-scrim" onClick={onClose}>
      <div className="cal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="cal-handle" />
        <div className="cal-head">
          <button className="cal-nav" onClick={prevMonth} aria-label="이전 달">
            <svg width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M8 1L1.5 8L8 15" stroke="#1f1f1f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span className="cal-title">{ym.y}년 {ym.m + 1}월</span>
          <button className="cal-nav" onClick={nextMonth} aria-label="다음 달">
            <svg width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 1L7.5 8L1 15" stroke="#1f1f1f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        <div className="cal-week">
          {WEEK_KO.map((w, i) => (
            <span key={w} className={i === 0 ? "sun" : ""}>{w}</span>
          ))}
        </div>
        <div className="cal-grid">
          {cells.map((d, i) =>
            d === null ? (
              <span key={i} className="cal-cell empty" />
            ) : (
              <button
                key={i}
                className={"cal-cell" + (sel === mk(d) ? " on" : "") + (isToday(d) ? " today" : "") + (outOfRange(d) ? " oor" : "")}
                disabled={outOfRange(d)}
                onClick={() => setSel(mk(d))}
              >
                {d}
              </button>
            )
          )}
        </div>
        <button className="cal-confirm" disabled={!sel} onClick={() => { onSelect(sel); onClose(); }}>
          선택 완료
        </button>
      </div>
    </div>
  );
}

// 유통기한/개봉일 날짜 입력 박스 (라벨 + 값 + 캘린더 아이콘)
function RegDateBox({ label, value, onClick }) {
  const has = !!value;
  return (
    <button type="button" className="reg-date" onClick={onClick}>
      <div className="reg-date-txt">
        <span className="reg-date-label">{label}</span>
        <span className={"reg-date-val" + (has ? "" : " ph")}>{has ? fmtDot(value) : "날짜 선택"}</span>
      </div>
      <CalendarIcon active={has} />
    </button>
  );
}

function RegisterPage({ picked, products, onBack, onRegister }) {
  // products가 주어지면(구매 완료 후 등록) 제품 객체를 직접 사용, 아니면 검색 선택 인덱스
  const productList = products && products.length ? products : picked.map((i) => SEARCH_RESULTS[i]);
  // 기본값: 사용중/개봉안함 선택 전(mode=null), 날짜 미입력
  const [rows, setRows] = useState(() =>
    productList.map((_, i) => ({ i, checked: true, mode: null, expiry: "", openDate: "" }))
  );
  const [cal, setCal] = useState(null); // 캘린더 대상 { row, field }
  const setRow = (k, patch) =>
    setRows((rs) => rs.map((r, j) => (j === k ? { ...r, ...patch } : r)));
  const reset = () =>
    setRows((rs) => rs.map((r) => ({ ...r, checked: true, mode: null, expiry: "", openDate: "" })));

  // 사용중/개봉안함 토글: 같은 칩 재선택 → 해제(선택 전). 개봉안함 선택 시 개봉일 값 비움.
  const onMode = (k, key) =>
    setRows((rs) =>
      rs.map((r, j) => {
        if (j !== k) return r;
        if (r.mode === key) return { ...r, mode: null };
        return { ...r, mode: key, openDate: key === "unopened" ? "" : r.openDate };
      })
    );
  const onDatePick = (d) =>
    cal &&
    setRows((rs) => rs.map((r, j) => (j === cal.row ? { ...r, [cal.field]: d } : r)));

  return (
    <div className="regpage">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="ap-header reg-header">
        <button className="ap-back" onClick={onBack} aria-label="뒤로">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1.5 9L9 17" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="ap-title">개봉일 입력</h1>
      </div>

      <div className="reg-scroll">
        <div className="reg-sub">
          <span className="reg-count">상품 {rows.length}개</span>
          <button className="reg-sort">
            제형순
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="#9E9E9E" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {rows.map((r, k) => {
          const p = productList[r.i];
          const pTag = p.tags ? p.tags[0] : p.tag; // 검색결과=tags[], 쇼핑상품=tag
          return (
            <Fragment key={k}>
              <div className={"reg-card" + (r.checked ? "" : " off")}>
                <div className="reg-top">
                  <div className="reg-thumb">
                    <img src={p.img} alt="" />
                  </div>
                  <div className="reg-info">
                    <div className="reg-brandline">
                      <span className="reg-brand">{p.brand}</span>
                      <span className={"tag " + pTag[1]}>{pTag[0]}</span>
                    </div>
                    <div className="reg-name">{p.name}</div>
                  </div>
                  <button
                    className={"reg-check" + (r.checked ? " on" : "")}
                    onClick={() => setRow(k, { checked: !r.checked })}
                    aria-label="선택"
                  >
                    <svg width="12" height="9" viewBox="0 0 13 10" fill="none">
                      <path d="M1.5 5.2L4.8 8.4L11.2 1.6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                <div className="reg-chips">
                  {REG_MODES.map((s) => (
                    <button
                      key={s.key}
                      className={"reg-chip" + (r.mode === s.key ? " on" : "")}
                      onClick={() => onMode(k, s.key)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* 사용중 → 유통기한+개봉일 / 개봉안함 → 유통기한 / 선택 전 → 없음 */}
                {r.mode && (
                  <div className="reg-dates">
                    <RegDateBox label="유통기한" value={r.expiry} onClick={() => setCal({ row: k, field: "expiry" })} />
                    {r.mode === "using" && (
                      <RegDateBox label="개봉일" value={r.openDate} onClick={() => setCal({ row: k, field: "openDate" })} />
                    )}
                  </div>
                )}
              </div>
              {k < rows.length - 1 && <div className="reg-divider" />}
            </Fragment>
          );
        })}
      </div>

      <div className="reg-bar">
        <button className="sel-clear" onClick={reset}>
          초기화
        </button>
        <button
          className="sel-confirm"
          onClick={() => onRegister(rows.filter((r) => r.checked).map((r) => ({ ...r, p: productList[r.i] })))}
        >
          등록하기
        </button>
      </div>

      <CalendarModal
        open={!!cal}
        value={cal ? rows[cal.row][cal.field] : ""}
        minDate={cal && cal.field === "expiry" ? todayStr() : monthsAheadStr(-MAX_EXPIRY_MONTHS)}
        maxDate={cal && cal.field === "expiry" ? monthsAheadStr(MAX_EXPIRY_MONTHS) : todayStr()}
        onClose={() => setCal(null)}
        onSelect={onDatePick}
      />
    </div>
  );
}

/* ---------------- 사용기한이 설정됐어요 (등록 완료) ---------------- */
// Figma 파티클 (좌표·크기·색·회전·모양) — 393폭 헤더 기준
// 파티클 사각형은 얇은 슬라이버(≈4.7×11) — 회전 전 실제 치수, bbox 중심 기준으로 배치
const CONFETTI = [
  { x: 90.6, y: 64, w: 4.73, h: 10.96, c: "#FFC9CE", rot: 51.6, s: "rect", o: 0.49 },
  { x: 305.6, y: 126, w: 4.73, h: 10.96, c: "#FFC9CE", rot: 51.6, s: "rect", o: 0.49 },
  { x: 336.6, y: 57, w: 4.73, h: 10.96, c: "#FFE081", rot: 51.6, s: "rect", o: 0.53 },
  { x: 69.6, y: 97.4, w: 4.8, h: 12.1, c: "#FFE6A7", rot: 16, s: "rect", o: 0.4 },
  { x: 240.5, y: 39.5, w: 5.1, h: 12, c: "#38FFF5", rot: -27, s: "rect", o: 0.4 },
  { x: 191.3, y: 115.4, w: 4.4, h: 11.2, c: "#38FFF5", rot: -27, s: "rect", o: 0.41 },
  { x: 343.1, y: 86.3, w: 4.9, h: 12.4, c: "#FEDA7E", rot: -34, s: "rect", o: 0.4 },
  { x: 269, y: 166, w: 8, h: 8, c: "#FF4A4A", rot: 0, s: "circle", o: 0.23 },
  { x: -9, y: 99, w: 8, h: 8, c: "#B9EBD7", rot: 0, s: "circle", o: 0.9 },
  { x: 172, y: 55, w: 20, h: 20, c: "#FFEAE9", rot: -50, s: "star", o: 0.35 },
];

function StarSvg({ color = "#FFEAE9" }) {
  return (
    <svg viewBox="0 0 13 14" fill="none" width="100%" height="100%">
      <path d="M3.01993 -0.00019723L4.50415 5.01693L0.525806 5.58858L3.26791 7.88544L0.000892941 11.7857L5.49586 9.75164L8.62566 13.6746L8.6173 8.46222L13.0008 7.05873L9.96087 5.81374L9.80193 0.0848301L6.7271 3.75571L3.01993 -0.00019723Z" fill={color} />
    </svg>
  );
}

// 재사용 컨페티 — 팡! 퍼진 뒤 제각기 방향·속도로 곡선 낙하하며 페이드 (아까 그 인터랙션)
function Confetti({ particles = CONFETTI, cx = 196 }) {
  return (
    <div className="confetti">
      {particles.map((p, i) => {
        const dir = p.x < cx ? -1 : 1;
        const dx = dir * (34 + ((i * 13) % 62));
        const spin = (i % 2 ? 1 : -1) * (8 + ((i * 7) % 13));
        const dur = (1.02 + ((i * 0.11) % 0.32)).toFixed(2);
        const delay = 300 + ((i * 33) % 120);
        return (
          <span
            key={i}
            className={"cft" + (p.s === "star" ? " cft-star" : "")}
            style={{
              left: p.x + "px",
              top: p.y + "px",
              width: (p.s === "rect" ? p.w * 1.3 : p.w) + "px",
              height: p.h + "px",
              background: p.s === "star" ? "transparent" : p.c,
              borderRadius: p.s === "circle" ? "50%" : "0",
              "--r": p.rot + "deg",
              "--o": Math.min(0.9, (p.o ?? 0.45) + 0.15),
              "--dx": dx + "px",
              "--spin": spin + "deg",
              "--dur": dur + "s",
              animationDelay: delay + "ms",
            }}
          >
            {p.s === "star" && <StarSvg color={p.c} />}
          </span>
        );
      })}
    </div>
  );
}

// 성공화면 파티클 (Figma 667-18623 — 일러스트 주변 배치)
const SUCCESS_CONFETTI = [
  { x: 106.6, y: 304, w: 4.73, h: 10.96, c: "#FFC9CE", rot: 52, s: "rect", o: 0.49 },
  { x: 294.6, y: 348, w: 4.73, h: 10.96, c: "#FFC9CE", rot: 52, s: "rect", o: 0.49 },
  { x: 297.6, y: 413, w: 4.73, h: 10.96, c: "#FFC9CE", rot: 52, s: "rect", o: 0.49 },
  { x: 97.6, y: 383.5, w: 4.6, h: 10.5, c: "#FFC9CE", rot: 123, s: "rect", o: 0.49 },
  { x: 325.6, y: 279, w: 4.73, h: 10.96, c: "#FFE081", rot: 52, s: "rect", o: 0.53 },
  { x: 58.6, y: 319.4, w: 4.8, h: 12.1, c: "#FFE6A7", rot: 16, s: "rect", o: 0.4 },
  { x: 229.5, y: 261.5, w: 5.1, h: 12, c: "#38FFF5", rot: -27, s: "rect", o: 0.4 },
  { x: 180.3, y: 337.4, w: 4.4, h: 11.2, c: "#38FFF5", rot: -27, s: "rect", o: 0.41 },
  { x: 158, y: 256, w: 20, h: 20, c: "#FFEAE9", rot: -50, s: "star", o: 0.4 },
  { x: 332, y: 308.3, w: 4.9, h: 12.4, c: "#FEDA7E", rot: -34, s: "rect", o: 0.4 },
];

// 로딩 중 착착착착 무한 교체될 제품 이미지들 (우리가 가진 상품)
const LOADING_IMGS = [3, 7, 11, 16, 21, 26, 31, 36, 41, 46, 51, 5, 13, 23, 44, 18].map(
  (n) => `/img/search/p${String(n).padStart(2, "0")}.png`
);
// 최종 "제품 정보 확인" 감지 결과 (Figma 517-23371) — Figma 원본 깨끗한 제품컷
const DETECTED = [
  { brand: "일리윤", name: "저자극 이지워시 선크림", tag: ["기타", "etc"], img: "/img/ap/detect_illiyoon.png" },
  { brand: "맥", name: "맥시멀 실키 매트 립스틱", tag: ["색조", "color"], img: "/img/ap/detect_mac.png" },
];
// 인식 가능한(원본 제품) 앨범 사진 = ALBUM_SRC 0(맥) / 1(일리윤)
const RECOGNIZABLE = [0, 1];

// 살짝 우는 얼굴 SVG (illus_fail.png 없을 때 폴백)
function SadFace() {
  return (
    <svg className="flow-illus" width="150" height="150" viewBox="0 0 150 150" fill="none">
      <circle cx="75" cy="75" r="60" fill="#FFE7DF" />
      <circle cx="75" cy="75" r="60" stroke="#FFD3C7" strokeWidth="2" />
      <path d="M45 66C49 60 61 60 65 66" stroke="#6B5B57" strokeWidth="4" strokeLinecap="round" />
      <path d="M85 66C89 60 101 60 105 66" stroke="#6B5B57" strokeWidth="4" strokeLinecap="round" />
      <path d="M58 74C58 74 52 84 52 89C52 92.3137 54.6863 95 58 95C61.3137 95 64 92.3137 64 89C64 84 58 74 58 74Z" fill="#7FC7FF" />
      <circle cx="50" cy="88" r="7" fill="#FFC2AE" opacity="0.6" />
      <circle cx="100" cy="88" r="7" fill="#FFC2AE" opacity="0.6" />
      <path d="M64 100C68 96 82 96 86 100" stroke="#6B5B57" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
// 실패 일러스트 = 첨부 이미지(illus_fail.png), 없으면 SVG 폴백
function FailIllus() {
  const [err, setErr] = useState(false);
  if (err) return <SadFace />;
  return (
    <img
      className="flow-illus"
      src="/img/ap/illus_fail.png"
      onError={() => setErr(true)}
      alt=""
      draggable="false"
    />
  );
}

// 앨범 원본 소스 → 감지 제품 매핑 (src 0=맥 / 1=일리윤)
const SRC_TO_DETECTED = { 0: DETECTED[1], 1: DETECTED[0] };
function ImportFlow({ picked = [], onBack, onDone, onRequest, onRegister }) {
  const [phase, setPhase] = useState("loading"); // loading | success | fail | final
  const [imgIdx, setImgIdx] = useState(0);
  // 선택 사진이 전부 인식 가능한 원본 제품(맥/일리윤)이면 성공, 아니면 실패
  const recognized =
    picked.length > 0 && picked.every((c) => RECOGNIZABLE.includes(ALBUM_GRID[c]));
  // 실제로 선택한 사진에 해당하는 제품만 등록 (하나 선택 → 하나만)
  const detected = recognized
    ? [...new Set(picked.map((c) => ALBUM_GRID[c]))].map((s) => SRC_TO_DETECTED[s]).filter(Boolean)
    : [];
  const [checks, setChecks] = useState(() => detected.map(() => true));

  useEffect(() => {
    if (phase !== "loading") return;
    const swap = setInterval(() => setImgIdx((i) => (i + 1) % LOADING_IMGS.length), 520);
    const done = setTimeout(() => setPhase(recognized ? "success" : "fail"), 3900);
    return () => {
      clearInterval(swap);
      clearTimeout(done);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "success") return;
    const t = setTimeout(() => setPhase("final"), 2000); // 약 2초 머문 뒤 최종화면
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "loading") {
    return (
      <div className="flowpage">
        <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
        <div className="flow-bar">
          <div className="flow-bar-fill loading" />
        </div>
        <div className="flow-card">
          <img key={imgIdx} src={LOADING_IMGS[imgIdx]} alt="" draggable="false" />
        </div>
        <div className="flow-text">
          제품 정보를
          <br />
          확인하고 있어요
        </div>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="flowpage">
        <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
        <div className="flow-bar">
          <div className="flow-bar-fill full" />
        </div>
        <Confetti particles={SUCCESS_CONFETTI} cx={197} />
        <img className="flow-illus" src="/img/ap/illus_done.png" alt="" draggable="false" />
        <div className="flow-text">
          제품 정보를
          <br />
          모두 파악했어요!
        </div>
      </div>
    );
  }

  if (phase === "fail") {
    // 제품 파악 실패 — 파티클 없이 우는 얼굴 + 하단 나가기/다시 선택 (Figma 679-19046)
    return (
      <div className="flowpage">
        <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
        <div className="flow-bar">
          <div className="flow-bar-fill full" />
        </div>
        <FailIllus />
        <div className="flow-text">
          제품 파악에
          <br />
          실패했어요
        </div>
        <div className="reg-bar fail-bar">
          <button className="sel-clear" onClick={onDone}>
            나가기
          </button>
          <button className="sel-confirm" onClick={onBack}>
            다시 선택
          </button>
        </div>
      </div>
    );
  }

  // 최종: 제품 정보 확인
  const allOn = checks.every(Boolean);
  const toggle = (k) => setChecks((c) => c.map((v, j) => (j === k ? !v : v)));
  return (
    <div className="detectpage">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="ap-header">
        <button className="ap-back" onClick={onBack} aria-label="뒤로">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1.5 9L9 17" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="ap-title">제품 정보 확인</h1>
      </div>
      <div className="detect-scroll">
        <div className="detect-sub">
          <span className="detect-q">이 제품 맞아요?</span>
          <button className="detect-all" onClick={() => setChecks(detected.map(() => !allOn))}>
            전체선택
            <span className={"detect-allbox" + (allOn ? " on" : "")}>
              {allOn && (
                <svg width="12" height="9" viewBox="0 0 13 10" fill="none">
                  <path d="M1.5 5.2L4.8 8.4L11.2 1.6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          </button>
        </div>
        {/* Figma Frame 111 — 세로 오토레이아웃 gap 40 (리스트 → 밴드 → footer) */}
        <div className="detect-body">
          <div className="detect-list">
            {detected.map((p, k) => (
              <div className="detect-card" key={k}>
                <div className="detect-thumb">
                  <img src={p.img} alt="" />
                </div>
                <div className="detect-info">
                  <div className="detect-brandline">
                    <span className="detect-brand">{p.brand}</span>
                    <span className={"tag " + p.tag[1]}>{p.tag[0]}</span>
                  </div>
                  <div className="detect-name">{p.name}</div>
                </div>
                <button
                  className={"detect-check" + (checks[k] ? " on" : "")}
                  onClick={() => toggle(k)}
                  aria-label="선택"
                >
                  {checks[k] && (
                    <svg width="12" height="9" viewBox="0 0 13 10" fill="none">
                      <path d="M1.5 5.2L4.8 8.4L11.2 1.6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
          <div className="detect-band" />
          {/* 찾으시는 상품 없음 — 검색결과 페이지와 동일 asset (sr-footer) 재사용 */}
          <div className="sr-footer">
          <svg className="sr-foot-ic" width="41" height="44" viewBox="0 0 41 44" fill="none">
            <rect x="6" y="6" width="24" height="32" rx="4" fill="#FFEEEF" />
            <line x1="11" y1="13" x2="25" y2="13" stroke="#FFC9CE" strokeWidth="2" strokeLinecap="round" />
            <line x1="11" y1="23" x2="18" y2="23" stroke="#FFC9CE" strokeWidth="2" strokeLinecap="round" />
            <line x1="11" y1="18" x2="18" y2="18" stroke="#FFC9CE" strokeWidth="2" strokeLinecap="round" />
            <line x1="19.5" y1="23.5" x2="25.5" y2="23.5" stroke="#FFC9CE" strokeWidth="3" strokeLinecap="round" />
            <path d="M24.6354 32.0843C22.5538 32.0843 20.7921 31.3634 19.3503 29.9215C17.9084 28.4797 17.1875 26.718 17.1875 24.6364C17.1875 22.5548 17.9084 20.7931 19.3503 19.3512C20.7921 17.9094 22.5538 17.1885 24.6354 17.1885C26.717 17.1885 28.4787 17.9094 29.9206 19.3512C31.3624 20.7931 32.0833 22.5548 32.0833 24.6364C32.0833 25.4767 31.9497 26.2692 31.6823 27.014C31.4149 27.7588 31.0521 28.4176 30.5937 28.9906L37.0104 35.4072C37.2205 35.6173 37.3255 35.8847 37.3255 36.2093C37.3255 36.534 37.2205 36.8013 37.0104 37.0114C36.8003 37.2215 36.533 37.3265 36.2083 37.3265C35.8837 37.3265 35.6163 37.2215 35.4062 37.0114L28.9896 30.5947C28.4167 31.0531 27.7578 31.4159 27.013 31.6833C26.2682 31.9506 25.4757 32.0843 24.6354 32.0843ZM24.6354 29.7926C26.0677 29.7926 27.2852 29.2913 28.2878 28.2887C29.2904 27.2861 29.7917 26.0687 29.7917 24.6364C29.7917 23.2041 29.2904 21.9867 28.2878 20.984C27.2852 19.9814 26.0677 19.4801 24.6354 19.4801C23.2031 19.4801 21.9857 19.9814 20.9831 20.984C19.9805 21.9867 19.4792 23.2041 19.4792 24.6364C19.4792 26.0687 19.9805 27.2861 20.9831 28.2887C21.9857 29.2913 23.2031 29.7926 24.6354 29.7926Z" fill="#FF5160" />
            <path d="M24.6354 17.1872C22.5538 17.1872 20.7921 17.9081 19.3503 19.3499C17.9084 20.7918 17.1875 22.5535 17.1875 24.6351C17.1875 26.7167 17.9084 28.4784 19.3503 29.9202C20.7921 31.3621 22.5538 32.083 24.6354 32.083C26.717 32.083 28.4787 31.3621 29.9206 29.9202C31.3624 28.4784 32.0833 26.7167 32.0833 24.6351C32.0833 23.7948 31.9497 23.0023 31.6823 22.2575C31.4149 21.5127 31.0521 20.8538 30.5938 20.2809L30.6129 20.2618C30.8229 20.0518 29.7917 21.5222 29.7917 21.1976C29.7917 20.8729 30.0017 20.8347 29.7917 20.6247C29.5816 20.4146 29.688 20.2809 29.3634 20.2809C29.0387 20.2809 29.1997 18.4667 28.9896 18.6768C28.4167 18.2184 27.7578 17.8556 27.013 17.5882C26.2682 17.3208 25.4757 17.1872 24.6354 17.1872ZM24.6354 19.4788C26.0677 19.4788 27.2852 19.9801 28.2878 20.9827C29.2904 21.9853 29.7917 23.2028 29.7917 24.6351C29.7917 26.0674 29.2904 27.2848 28.2878 28.2874C27.2852 29.29 26.0677 29.7913 24.6354 29.7913C23.2031 29.7913 21.9857 29.29 20.9831 28.2874C19.9805 27.2848 19.4792 26.0674 19.4792 24.6351C19.4792 23.2028 19.9805 21.9853 20.9831 20.9827C21.9857 19.9801 23.2031 19.4788 24.6354 19.4788Z" fill="black" />
          </svg>
          <div className="sr-foot-q">찾으시는 상품이 없으신가요?</div>
          <button className="sr-register" onClick={onRequest}>상품 정보 등록하기</button>
          </div>
        </div>
      </div>
      <div className="reg-bar">
        <button className="sel-clear" onClick={onBack}>
          다시 찍기
        </button>
        <button
          className="sel-confirm"
          onClick={() => {
            const sel = detected.filter((_, k) => checks[k]);
            if (onRegister && sel.length) onRegister(sel);
            else onDone();
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
}

function ConfirmPage({ rows, onHome, onCabinet }) {
  return (
    <div className="confirm-page">
      {/* 컨페티 — 팡! 퍼진 뒤 곡선 낙하하며 사라짐 */}
      <Confetti />
      <div className="confirm-page-inner">
        <div className="confirm-top">
          <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
          {/* 뒤 은은한 플립 카운트다운 데코 */}
          <div className="confirm-clock" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div className="cc-card" key={i}>
                <span className="cc-num">00</span>
                <span className="cc-line" />
              </div>
            ))}
          </div>
        <div className="confirm-head">
          <h1 className="confirm-title">사용기한이 설정됐어요</h1>
          <div className="confirm-note">
            <svg className="confirm-note-ic" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7.4" stroke="#878787" strokeOpacity="0.71" strokeWidth="1.3" />
              <path d="M10 9V13.4" stroke="#878787" strokeOpacity="0.71" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="10" cy="6.2" r="0.95" fill="#878787" fillOpacity="0.71" />
            </svg>
            제품별 개봉 후 권장 사용 기간(PAO)에 기반하여 책정했어요
          </div>
        </div>
      </div>

      <div className="confirm-sheet">
        <div className="confirm-list">
          {rows.map((r, k) => {
            const p = r.p || SEARCH_RESULTS[r.idx];
            const pTag = p.tags ? p.tags[0] : p.tag; // 검색결과=tags[], 쇼핑상품=tag
            const type = pTag[1];
            const pao = PAO_MONTHS[type] || 6;
            const unopened = r.mode === "unopened";
            // 사용중: 유통기한 vs (개봉일+PAO) 중 더 빠른 마감일 / 개봉안함: 유통기한 그대로
            let expiry;
            if (unopened) {
              expiry = r.expiry || todayStr();
            } else {
              const byPao = addMonthsStr(r.openDate || todayStr(), pao);
              const exp = r.expiry || byPao;
              expiry = new Date(exp) < new Date(byPao) ? exp : byPao;
            }
            return (
              <div className="confirm-item" key={k}>
                <div className="confirm-thumb">
                  <span className="confirm-pao">{unopened ? "미개봉" : pao + "개월"}</span>
                  <img src={p.img} alt="" />
                </div>
                <div className="confirm-info">
                  <div className="confirm-brandline">
                    <span className="confirm-brand">{p.brand}</span>
                    <span className={"tag " + type}>{pTag[0]}</span>
                  </div>
                  <div className="confirm-name">{p.name}</div>
                  <span className="confirm-expiry">{fmtDot(expiry)} 까지</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="reg-bar confirm-bar">
          <button className="sel-clear" onClick={onCabinet}>
            내 화장대
          </button>
          <button className="sel-confirm" onClick={onHome}>
            홈으로
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

/* ---------------- Onboarding (3 splash screens) ---------------- */
const ONB_SCREENS = [
  { img: "/img/onboarding/ob1.png", last: false }, // 다음
  { img: "/img/onboarding/ob2.png", last: false }, // 다음
  { img: "/img/onboarding/ob3.png", last: true }, //  시작하기
];
// 온보딩 1페이지 배경 마퀴 문구 (서로 엇갈리며 무한 이동)
const OB_SEP = " ";
const OB_ROWS = [
  ["언제샀지?", "내 피부에 괜찮을까?", "쓰기 어렵다"],
  ["써도될까?", "찜찜해.", "아직 괜찮나?"],
].map((r) => r.join(OB_SEP) + OB_SEP);
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const s = ONB_SCREENS[step];
  const next = () => (s.last ? onDone() : setStep((v) => v + 1));
  return (
    <div className="onboarding">
      {step === 0 ? (
        <>
          {/* 배경 흐린 텍스트 마퀴 (서로 엇갈리며 옆으로 무한 이동) */}
          <div className="ob-marquee" aria-hidden="true">
            {OB_ROWS.map((row, i) => (
              <div key={i} className={"ob-mrow" + (i % 2 ? " rev" : "")}>
                <span>{row}</span>
                <span>{row}</span>
              </div>
            ))}
          </div>
          <img className="ob-img ob-img-fg" src="/img/onboarding/ob1_fg.png" alt="" draggable="false" />
        </>
      ) : (
        <img className="ob-img" src={s.img} alt="" draggable="false" />
      )}
      {/* 2·3번 화면: 뒤로가기 / Skip (Figma: arrow_back_ios[23,82], Skip[345,79]) */}
      {step > 0 && (
        <>
          <button className="ob-back" onClick={() => setStep((v) => v - 1)} aria-label="뒤로가기" />
          <button className="ob-skip" onClick={onDone} aria-label="건너뛰기" />
        </>
      )}
      {/* Figma 기준 버튼 영역 [17,329] 360×56 만 클릭 가능 */}
      <button className="ob-hotspot" onClick={next} aria-label={s.last ? "시작하기" : "다음"} />
    </div>
  );
}

/* ---------------- 제품 사진 불러오기 (앨범 최근 항목, Figma 516-23104) ---------------- */
// 앨범 사진 = Figma 원본 찐 앨범(제품 손사진 2장 + 음식/커피/고양이/사과/도시/포스터…) + 풍경 사진
const ALBUM_SRC = [
  ...Array.from({ length: 14 }, (_, i) => `/img/album/p${String(i + 1).padStart(2, "0")}.png`),
  ...Array.from({ length: 14 }, (_, i) => `/img/album/land${String(i + 1).padStart(2, "0")}.png`),
];
// 실제 앨범처럼 제품컷을 생활사진 사이에 자연스럽게 섞음 — 전부 고유(중복 없음)
const ALBUM_GRID = [
  0, 1, 14, 2, 15, 3, 4, 16, 5, 17, 6, 18, 7, 8,
  19, 9, 20, 10, 21, 11, 22, 12, 23, 13, 24, 25, 26, 27,
];

function AlbumPage({ onBack, onRegister, initialSel = [] }) {
  const [sel, setSel] = useState(initialSel); // 선택된 셀 인덱스들 (이전 선택 유지)
  const toggle = (i) =>
    setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  const hasSel = sel.length > 0;
  return (
    <div className={"albumpage" + (hasSel ? " has-sel" : "")}>
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="album-header">
        <button className="ap-back album-back" onClick={onBack} aria-label="뒤로">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1.5 9L9 17" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="album-title">
          최근 항목
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1.5 1.5L6 6L10.5 1.5" stroke="#1C1B1F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="album-scroll">
        <div className="album-grid">
          {/* 첫 셀 = 카메라 */}
          <button className="album-cell album-camera" aria-label="카메라">
            <svg width="26" height="24" viewBox="0 0 26 24" fill="none">
              <path d="M9.2 3H16.8L18.6 5.4H22.5C23.3 5.4 24 6.1 24 6.9V19.2C24 20 23.3 20.7 22.5 20.7H3.5C2.7 20.7 2 20 2 19.2V6.9C2 6.1 2.7 5.4 3.5 5.4H7.4L9.2 3Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
              <circle cx="13" cy="13" r="4.2" stroke="#fff" strokeWidth="1.8" />
            </svg>
          </button>
          {ALBUM_GRID.map((p, i) => {
            const on = sel.includes(i);
            return (
              <button
                key={i}
                className={"album-cell album-photo" + (on ? " on" : "")}
                onClick={() => toggle(i)}
              >
                <img src={ALBUM_SRC[p]} alt="" draggable="false" />
                <span className={"album-check" + (on ? " on" : "")}>
                  {on && (
                    <svg width="14" height="10" viewBox="0 0 13 10" fill="none">
                      <path d="M1.5 5.2L4.8 8.4L11.2 1.6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 하단 버튼 두 개 — 사진을 선택해야 나타남 */}
      {hasSel && (
        <div className="reg-bar album-bar">
          <button className="sel-clear" onClick={() => setSel([])}>
            초기화
          </button>
          <button className="sel-confirm" onClick={() => onRegister(sel)}>
            등록하기
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- 내 화장대 (Figma 236-32446) ---------------- */
const CABINET_CATS = ["전체", "크림", "기능성", "토너", "앰플", "선크림", "페이셜 마스크", "스팟 트리트먼트"];
// 유통기한 뱃지 (일=임박 코랄 / 개월=그린), 37개 — 우리가 가진 상품 이미지 순서대로 부여
// 유통기한 뱃지 — 최대 12개월 (12개월 초과 값은 실제 없음)
const CABINET_BADGES = [
  "9일", "3개월", "8개월", "14일", "3개월", "11일", "12개월", "12개월", "4개월", "6일",
  "2개월", "10개월", "5일", "1개월", "12개월", "13일", "7개월", "3일", "9개월", "9개월",
  "10일", "5개월", "11개월", "8일", "2개월", "8개월", "4일", "11개월", "12개월", "12일",
  "6개월", "1개월", "7일", "7개월", "11개월", "2일", "10개월",
];
// 검색 상품 데이터를 재사용(고유 이미지, 중복 없음) + 유통기한 뱃지 부여
const CABINET_PRODUCTS = SEARCH_RESULTS.slice(0, CABINET_BADGES.length).map((p, i) => ({
  ...p,
  badge: CABINET_BADGES[i],
}));
// 커스텀 부드러운 스크롤 (기본 smooth보다 느린 이징)
function smoothScrollTo(el, to, duration = 900) {
  const start = el.scrollTop;
  const change = to - start;
  if (Math.abs(change) < 1) return;
  const startTime = performance.now();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // easeInOutCubic
  const step = (now) => {
    const t = Math.min(1, (now - startTime) / duration);
    el.scrollTop = start + change * ease(t);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
// 같은 라인 미리 구매 (할인 상품)
const SAMELINE = [
  { brand: "메디필", name: "히알루론산 레이어 물톡스 앰플", off: "23%", price: "38,700", img: "/img/sameline1.png" },
  { brand: "넘버즈인", name: "글루타치온 비타 C 앰플", off: "17%", price: "27,160", img: "/img/sameline2.png" },
  { brand: "포밤", name: "퍼펙션 베이비 아토크림", off: "17%", price: "19,160", img: "/img/sameline3.png" },
];
/* ===== 내 화장대 · 루틴 탭 (Figma 236-32921 / 329-7821 / 329-8868 / 330-8176) ===== */
// 2026년 5월 월간 캘린더 (루틴 실천일 점 + 선택일)
const RT_DOT_DAYS = new Set([6, 7, 12, 13, 14, 18, 21, 25, 30]);
function RoutineMonthCalendar({ selected = 20, onSelect }) {
  // 2026-05-01 = 금요일 → 첫 주 앞 5칸 공백
  const first = 5; // 0=Sun..6=Sat, 금=5
  const days = 31;
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return (
    <div className="rt-cal">
      <button className="rt-cal-month">
        2026년 5월
        <svg width="13" height="8" viewBox="0 0 14 8" fill="none">
          <path d="M1 1L7 7L13 1" stroke="#1f1f1f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="rt-cal-wk">
        {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
          <span key={i} className={"rt-cal-wd" + (i === 0 ? " sun" : i === 6 ? " sat" : "")}>
            {w}
          </span>
        ))}
      </div>
      {weeks.map((wk, wi) => (
        <div className="rt-cal-row" key={wi}>
          {wk.map((d, di) => (
            <button
              key={di}
              className={"rt-cal-cell" + (d === selected ? " sel" : "") + (di === 0 ? " sun" : di === 6 ? " sat" : "")}
              onClick={() => d && onSelect && onSelect(d)}
              disabled={!d}
            >
              {d && <span className="rt-cal-d">{d}</span>}
              {d && RT_DOT_DAYS.has(d) && <span className="rt-cal-dot" />}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// 루틴 히스토리 캘린더 — 제품 상세보기 히스토리와 동일한 에셋(HistoryCalendar) + "5월" 월 토글
function RtHistCalendar({ selected, onSelect }) {
  const [month, setMonth] = useState(5);
  const [year, setYear] = useState(2025);
  const [monthOpen, setMonthOpen] = useState(false);
  return (
    <div className="rt-histcal">
      <div className="hist-top rt-histcal-top">
        <div className="hist-month-wrap">
          <button className={"hist-month" + (monthOpen ? " open" : "")} onClick={() => setMonthOpen((v) => !v)}>
            {month}월
            <svg width="13" height="8" viewBox="0 0 14 8" fill="none">
              <path d="M1 1L7 7L13 1" stroke="#1f1f1f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {monthOpen && (
            <>
              <div className="hist-month-scrim" onClick={() => setMonthOpen(false)} />
              <div className="hist-month-pop">
                <div className="hist-year-nav">
                  <button className="hist-year-arrow" onClick={() => setYear((y) => y - 1)} aria-label="이전 연도">
                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                      <path d="M7 1L1 7L7 13" stroke="#1f1f1f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="hist-year-val">{year}</span>
                  <button className="hist-year-arrow" onClick={() => setYear((y) => y + 1)} aria-label="다음 연도">
                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                      <path d="M1 1L7 7L1 13" stroke="#1f1f1f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <div className="hist-month-grid">
                  {Array.from({ length: 12 }, (_, k) => k + 1).map((m) => (
                    <button key={m} className={"hist-month-opt" + (m === month ? " on" : "")} onClick={() => { setMonth(m); setMonthOpen(false); }}>
                      {m}월
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <HistoryCalendar recordDays={RT_DOT_DAYS} selected={selected} onSelect={onSelect} />
    </div>
  );
}

// 루틴 체크박스 (제공된 원본 SVG — 체크/미체크)
// 쇼핑(장바구니/결제) 체크박스 — 원본 18px 라운드 스퀘어, 체크 시 코랄 + 흰 체크
function SqCheck({ on }) {
  return (
    <span className={"sq-check" + (on ? " on" : "")}>
      {on && (
        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
          <path d="M1 4.6L4.4 8L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}
function RtCheck({ on }) {
  return (
    <span className={"rt-combo-check" + (on ? " on" : "")}>
      {on ? (
        <svg width="18" height="18" viewBox="15.53 15.53 18.63 18.63" fill="none">
          <rect x="16.5604" y="16.5594" width="16.5595" height="16.5595" rx="1.03497" fill="#FF5160" stroke="#FF5160" strokeWidth="2.06994" />
          <path
            d="M30.3125 20.873C30.5051 20.8731 30.6734 20.9457 30.8184 21.0908C30.9633 21.236 31.0361 21.4081 31.0361 21.6074C31.0361 21.8066 30.9632 21.9789 30.8184 22.124L24.0635 28.9102C23.9186 29.0552 23.7501 29.1269 23.5576 29.127C23.365 29.127 23.1958 29.0554 23.0508 28.9102L19.8857 25.7383C19.7409 25.5932 19.6717 25.4209 19.6777 25.2217C19.6838 25.0224 19.7585 24.8503 19.9033 24.7051C20.0482 24.5599 20.2201 24.4873 20.4189 24.4873C20.5684 24.4873 20.7024 24.5285 20.8213 24.6104L20.9346 24.7051L23.5479 27.3418L23.5576 27.3516L23.5664 27.3418L29.8066 21.0908C29.9516 20.9457 30.1199 20.873 30.3125 20.873Z"
            fill="white"
            stroke="black"
            strokeWidth="0.0258743"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 18.63 18.63" fill="none">
          <rect x="1.03497" y="1.03497" width="16.5595" height="16.5595" rx="1.03497" stroke="#919191" strokeWidth="2.06994" />
        </svg>
      )}
    </span>
  );
}
const RT_CHIPS = ["피부관리 브리핑", "히스토리", "제품조합", "공병 만들기"];
const RT_HERO = {
  "피부관리 브리핑": "주빈님 매일매일\n건강한 피부 만들어봐요!",
  히스토리: "주빈님이 그 동안\n실천한 루틴들이에요!",
  제품조합: "내 제품만으로도\n최적의 조합루틴 만들기",
  "공병 만들기": "곧 폐기되는 제품\n이렇게 다 써보세요!",
};
// AI 피부관리 브리핑 카드 썸네일 (아침·저녁·자기전 — 이전에 쓰던 시간대 아이콘 재사용)
const RT_BRIEF_STEPS = [
  { img: "/img/prod_roundlab.png", ic: "sun" },
  { img: "/img/prod_torriden.png", ic: "twilight" },
  { img: "/img/prod_purito.png", ic: "moon" },
];
// 제품 조합해보기 선택 리스트
const RT_COMBO = [
  { brand: "에스트라", name: "아토베리아 365 하이드로 수딩크림", tags: [["크림", "cream"]], img: "/img/ai_estra1.png", on: true },
  { brand: "에버린", name: "클리어 AHA 앰플", tags: [["앰플", "ampoule"]], img: "/img/prod_dropper.png", on: true },
  { brand: "에스트라", name: "아토베리아 365 하이드로 수딩크림", tags: [["크림", "cream"]], img: "/img/prod_illiyoon.png", on: false },
];
// 조합 점수 리포트 — 선택 조합에 따라 다르게 표시
const RT_COMBO_REPORTS = [
  {
    score: "2.1",
    tags: ["민감성 피부 주의", "따가움", "고자극"],
    text: (
      <>
        해당 수분크림과 AHA, BHA가 포함된 앰플은 현재 주빈님처럼 피부가 건조하고 예민해진 상태에서 <u>향료나 알코올이 더 따갑게
        느껴질 수 있습니다.</u> 따라서 <u>세라마이드</u>나 <u>판테놀 성분</u>으로 <u>장벽보습</u>을 함께 챙기는 것이 좋아요. ✨
      </>
    ),
  },
  {
    score: "7.4",
    tags: ["궁합 좋음", "수분 시너지", "진정 케어"],
    text: (
      <>
        수분 토너와 판테놀 크림은 서로의 <u>수분 시너지</u>를 높여주는 조합이에요. <u>진정 성분</u>이 겹쳐 예민해진 피부에도
        안정적으로 사용할 수 있고, 장벽 회복에 도움이 됩니다. 😊
      </>
    ),
  },
  {
    score: "5.2",
    tags: ["보통", "유수분 조절", "단계 조정"],
    text: (
      <>
        두 제품 모두 보습력이 높아 겨울엔 좋지만 <u>여름철엔 번들거림</u>이 생길 수 있어요. <u>가벼운 제형</u>을 낮에, 리치한 제형을
        밤에 나눠 쓰면 유수분 밸런스를 잡을 수 있어요. 🙂
      </>
    ),
  },
  {
    score: "3.8",
    tags: ["각질 주의", "성분 충돌", "시간차 사용"],
    text: (
      <>
        레티놀과 AHA 성분을 함께 쓰면 <u>각질이 과하게 벗겨질</u> 수 있어요. <u>격일로 번갈아</u> 사용하고, 낮에는 <u>자외선 차단</u>을
        꼭 병행해 자극을 줄여주세요. ⚠️
      </>
    ),
  },
];
// 공병 만들기 — 보유 제품 풀 (검색 시 필터, 기본은 사용기한 임박 3개)
const RT_BOTTLE = [
  { brand: "에스트라", name: "아토베리아 365 하이드로 수딩크림", badge: "9일", img: "/img/ai_estra1.png", use: "몸에도 발라서 활용해요" },
  { brand: "넘버즈인", name: "1번 판토텐탄 엑티브 수딩크림", badge: "12일", img: "/img/prod_purito.png", use: "솜을 적셔 팩으로 사용해요" },
  { brand: "닥터지", name: "레드 블레미쉬 클리어 수딩토너", badge: "2주", img: "/img/prod_roundlab.png", use: "토너로 가볍게 결을 정돈해요" },
  { brand: "일리윤", name: "세라마이드 아토 집중크림", badge: "3주", img: "/img/search/r_illiyoon.png", use: "건조한 부위에 덧발라 마무리해요" },
  { brand: "토리든", name: "다이브인 저분자 히알루론 세럼", badge: "1개월", img: "/img/search/r_torriden.png", use: "손등·팔 등 전신 보습에 활용해요" },
  { brand: "라운드랩", name: "자작나무 수분 토너", badge: "2개월", img: "/img/search/r_prodroundlab.png", use: "화장솜에 적셔 결 정돈용으로 써요" },
  { brand: "아토팜", name: "집중 고보습 진정 크림", badge: "3개월", img: "/img/search/r_atopalm.png", use: "핸드크림처럼 수시로 발라요" },
  { brand: "메디힐", name: "티트리 카밍 토너", badge: "5개월", img: "/img/search/r_ap7.png", use: "진정 팩 대용으로 올려두세요" },
];
// 사용기한 임박순 정렬(기본 3개 노출용) — 원본 인덱스 보존
const RT_BOTTLE_SORTED = RT_BOTTLE.map((p, i) => ({ ...p, _i: i })).sort((a, b) => badgeDays(a.badge) - badgeDays(b.badge));
// 히스토리 — 선택일에 실천한 루틴 카드 (가로 캐러셀)
const RT_HIST_CARDS = [
  { num: 4, title: "선크림 (선택)", img: "/img/prod_illiyoon.png", steps: ["외출 30분 전에 얼굴에 충분히 도포합니다", "목과 귀에도 잊지 말고 발라줍니다"] },
  { num: 1, title: "클렌징 후 토너", img: "/img/prod_roundlab.png", steps: ["솜에 토너를 적셔줍니다", "피부결을 따라 가볍게 닦아줍니다"] },
];
function RoutineTab({ onNav, onCreateRoutine, initialChip }) {
  const [chip, setChip] = useState(initialChip || "피부관리 브리핑");
  const [briefOpen, setBriefOpen] = useState(true);
  const [calSel, setCalSel] = useState(20);
  const [seg, setSeg] = useState("기초");
  const [alarmOn, setAlarmOn] = useState(false); // 알림 받기 토글
  const [search, setSearch] = useState(""); // 공병 만들기 검색어 (기본값 비움)
  const [comboItems, setComboItems] = useState(RT_COMBO); // 조합 대상 제품(내 제품에서 추가 가능)
  const [comboSel, setComboSel] = useState(() => RT_COMBO.map(() => false)); // 기본값: 모두 해제
  const [comboPicker, setComboPicker] = useState(false); // 조합할 제품 추가 모달
  const [comboGen, setComboGen] = useState(false); // AI 리포트 생성중 인터랙션
  const [comboEdit, setComboEdit] = useState(false); // 편집 모드(추가 제품 빼기)
  // 편집: 조합 리스트에서 제품 제거 (선택 상태도 함께 정리)
  const removeCombo = (idx) => {
    setComboItems((items) => items.filter((_, j) => j !== idx));
    setComboSel((s) => s.filter((_, j) => j !== idx));
  };
  const [bottleSel, setBottleSel] = useState(() => RT_BOTTLE.map(() => false)); // 기본값: 모두 해제
  // 공병: 검색어 없으면 사용기한 임박 3개, 있으면 브랜드/제품명 매칭 결과
  const bottleQ = search.trim().toLowerCase();
  const bottleList = bottleQ
    ? RT_BOTTLE.map((p, i) => ({ ...p, _i: i })).filter((p) => (p.brand + p.name).toLowerCase().includes(bottleQ))
    : RT_BOTTLE_SORTED.slice(0, 3);
  const comboCount = comboSel.filter(Boolean).length;
  const comboReport = RT_COMBO_REPORTS[comboSel.reduce((a, v, i) => a + (v ? i + 1 : 0), 0) % RT_COMBO_REPORTS.length];
  const comboPair = comboItems.filter((_, i) => comboSel[i]).slice(0, 2);
  // 2개 이상 선택되면 AI 리포트 생성(짧은 생성 인터랙션 후 노출)
  useEffect(() => {
    if (comboCount >= 2) {
      setComboGen(true);
      const t = setTimeout(() => setComboGen(false), 1300);
      return () => clearTimeout(t);
    }
    setComboGen(false);
  }, [comboCount]);
  // 투데이 스킨루틴 (기존 컴포넌트 재사용) 로컬 상태
  const [rtView, setRtView] = useState(chip === "피부관리 브리핑" ? "agenda" : "schedule");
  const [rtTime, setRtTime] = useState(currentSection); // 서버 시간대 기본값
  const [rtRoutines, setRtRoutines] = useState(makeTodayRoutines);
  const toggleRt = (t, i) => setRtRoutines((r) => ({ ...r, [t]: r[t].map((x, j) => (j === i ? { ...x, done: !x.done } : x)) }));
  const delRt = (t, idxs) => setRtRoutines((r) => ({ ...r, [t]: r[t].filter((_, j) => !idxs.includes(j)) }));
  const selectChip = (c) => {
    setChip(c);
    setRtView(c === "피부관리 브리핑" ? "agenda" : "schedule");
  };
  const today = (
    <TodayRoutine
      view={rtView}
      setView={setRtView}
      timeTab={rtTime}
      setTimeTab={setRtTime}
      routines={rtRoutines}
      onToggleRoutine={toggleRt}
      onDeleteRoutines={delRt}
      onCreateRoutine={onCreateRoutine || (() => {})}
    />
  );
  return (
    <div className="cabinet-scroll rt-scroll">
      {/* 히어로 + 아바타 */}
      <div className="rt-hero">
        <h2 className="rt-hero-txt">{RT_HERO[chip]}</h2>
        <div className="rt-hero-avatar">
          <img src="/img/avatar.png" alt="" draggable="false" />
        </div>
      </div>
      {/* 칩 행 */}
      <div className="rt-chips">
        {RT_CHIPS.map((c) => (
          <button key={c} className={"rt-chip" + (chip === c ? " on" : "")} onClick={() => selectChip(c)}>
            {c}
          </button>
        ))}
      </div>

      {/* ── 피부관리 브리핑 ── */}
      {chip === "피부관리 브리핑" && (
        <>
          <div className="rt-pad">
            <div className="pd-ai rt-ai">
              <div className={"ai-reason" + (briefOpen ? "" : " collapsed")}>
                <div className="ai-reason-head">
                  <span className="ai-reason-title">
                    <AiBadge /> 피부관리 브리핑
                  </span>
                  <button className="ai-reason-chev" onClick={() => setBriefOpen((v) => !v)} aria-label="펼치기/접기">
                    <ChevronDown className={briefOpen ? "up" : ""} />
                  </button>
                </div>
                {briefOpen && (
                  <>
                    <div className="rt-brief-thumbs">
                      {RT_BRIEF_STEPS.map((s, i) => (
                        <div className="rt-brief-thumb" key={i}>
                          <img src={s.img} alt="" draggable="false" />
                          <span className="rt-brief-ic">
                            <TimeIconGray type={s.ic} />
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="ai-reason-text">
                      그동안 미뤄왔던 <u>토너팩</u>으로 오늘은 꼭 수분관리에 신경 써줘야해요 이후 흔적개선을 위해 <u>비타민 앰플</u>{" "}
                      마지막으로 자기 전 건조하지 않게 <u>수분크림을 두껍게 올린 후 수분팩</u>을 해주세요 뷰티 디바이스가 있다면
                      사용해도 좋아요. 🤗
                    </p>
                    <div className="ai-reason-date">2025.05.22</div>
                  </>
                )}
              </div>
            </div>
            {/* 알림 바 — 토글 (Figma 235-23801) */}
            <div className="rt-alarm">
              <span className="rt-alarm-txt">알림 설정하고 루틴관련 알림받기</span>
              <button
                className={"rt-alarm-toggle" + (alarmOn ? " on" : "")}
                onClick={() => setAlarmOn((v) => !v)}
                aria-pressed={alarmOn}
              >
                <span className="rt-alarm-ic">
                  {alarmOn ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2.07904 11.9C1.87986 11.9 1.7129 11.8329 1.57816 11.6987C1.44342 11.5646 1.37605 11.3983 1.37605 11.2C1.37605 11.0017 1.44342 10.8354 1.57816 10.7013C1.7129 10.5671 1.87986 10.5 2.07904 10.5H2.78203V5.6C2.78203 4.63167 3.07495 3.77125 3.66078 3.01875C4.24661 2.26625 5.00818 1.77333 5.94551 1.54V1.05C5.94551 0.758333 6.04803 0.510417 6.25307 0.30625C6.45811 0.102083 6.70709 0 7 0C7.29291 0 7.54189 0.102083 7.74693 0.30625C7.95197 0.510417 8.05449 0.758333 8.05449 1.05V1.54C8.99182 1.77333 9.7534 2.26625 10.3392 3.01875C10.9251 3.77125 11.218 4.63167 11.218 5.6V10.5H11.921C12.1201 10.5 12.2871 10.5671 12.4218 10.7013C12.5566 10.8354 12.624 11.0017 12.624 11.2C12.624 11.3983 12.5566 11.5646 12.4218 11.6987C12.2871 11.8329 12.1201 11.9 11.921 11.9H2.07904ZM7 14C6.61335 14 6.28236 13.8629 6.00702 13.5888C5.73168 13.3146 5.59401 12.985 5.59401 12.6H8.40599C8.40599 12.985 8.26832 13.3146 7.99298 13.5888C7.71764 13.8629 7.38665 14 7 14ZM4.18802 10.5H9.81198V5.6C9.81198 4.83 9.53664 4.17083 8.98596 3.6225C8.43528 3.07417 7.77329 2.8 7 2.8C6.22671 2.8 5.56472 3.07417 5.01404 3.6225C4.46336 4.17083 4.18802 4.83 4.18802 5.6V10.5ZM0.673052 5.6C0.47387 5.6 0.306909 5.52417 0.172168 5.3725C0.0374279 5.22083 -0.0182258 5.04583 0.00520736 4.8475C0.0989399 3.9725 0.344988 3.15875 0.743351 2.40625C1.14171 1.65375 1.65139 0.9975 2.27236 0.4375C2.42468 0.309167 2.5975 0.250833 2.79082 0.2625C2.98415 0.274167 3.13939 0.361667 3.25656 0.525C3.37372 0.688333 3.42059 0.863333 3.39715 1.05C3.37372 1.23667 3.28585 1.4 3.13353 1.54C2.67659 1.97167 2.30166 2.47333 2.00874 3.045C1.71583 3.61667 1.5225 4.235 1.42877 4.9C1.40534 5.09833 1.32332 5.26458 1.18272 5.39875C1.04212 5.53292 0.872234 5.6 0.673052 5.6ZM13.3269 5.6C13.1278 5.6 12.9579 5.53292 12.8173 5.39875C12.6767 5.26458 12.5947 5.09833 12.5712 4.9C12.4775 4.235 12.2842 3.61667 11.9913 3.045C11.6983 2.47333 11.3234 1.97167 10.8665 1.54C10.7142 1.4 10.6263 1.23667 10.6028 1.05C10.5794 0.863333 10.6263 0.688333 10.7434 0.525C10.8606 0.361667 11.0159 0.274167 11.2092 0.2625C11.4025 0.250833 11.5753 0.309167 11.7276 0.4375C12.3486 0.9975 12.8583 1.65375 13.2566 2.40625C13.655 3.15875 13.9011 3.9725 13.9948 4.8475C14.0182 5.04583 13.9626 5.22083 13.8278 5.3725C13.6931 5.52417 13.5261 5.6 13.3269 5.6Z"
                        fill="#fff"
                      />
                    </svg>
                  ) : (
                    <svg width="13" height="14" viewBox="0 0 13 14" fill="none">
                      <path
                        d="M9.82044 11.7968H2.17661C1.98237 11.7968 1.81955 11.7303 1.68816 11.5973C1.55676 11.4643 1.49106 11.2995 1.49106 11.1029C1.49106 10.9062 1.55676 10.7414 1.68816 10.6084C1.81955 10.4754 1.98237 10.4089 2.17661 10.4089H2.86215V5.55143C2.86215 5.16976 2.91071 4.79389 3.00783 4.42379C3.10495 4.0537 3.25063 3.70095 3.44487 3.36555L4.47319 4.40644C4.3932 4.59149 4.33322 4.77943 4.29323 4.97026C4.25324 5.16109 4.23324 5.35481 4.23324 5.55143V10.4089H8.48363L0.188525 2.01239C0.0628417 1.88517 0 1.72326 0 1.52664C0 1.33003 0.0628417 1.16811 0.188525 1.04089C0.314208 0.913672 0.474169 0.850062 0.668407 0.850062C0.862645 0.850062 1.02261 0.913672 1.14829 1.04089L12.8026 12.8377C12.9282 12.9649 12.9939 13.1239 12.9997 13.3147C13.0054 13.5056 12.9397 13.6704 12.8026 13.8092C12.6769 13.9364 12.5169 14 12.3227 14C12.1284 14 11.9685 13.9364 11.8428 13.8092L9.82044 11.7968ZM8.00374 1.52664C8.9178 1.75795 9.66048 2.24659 10.2318 2.99257C10.8031 3.73854 11.0887 4.59149 11.0887 5.55143V7.45973C11.0887 7.69104 11.0173 7.86452 10.8745 7.98017C10.7316 8.09583 10.5745 8.15366 10.4032 8.15366C10.2318 8.15366 10.0747 8.09294 9.93184 7.9715C9.78902 7.85006 9.71761 7.67369 9.71761 7.44238V5.55143C9.71761 4.7881 9.4491 4.13466 8.91209 3.59108C8.37508 3.0475 7.72953 2.77571 6.97543 2.77571C6.79261 2.77571 6.59838 2.79884 6.39271 2.84511C6.18705 2.89137 6.00424 2.94919 5.84428 3.01859C5.65004 3.09955 5.45866 3.11689 5.27013 3.07063C5.08161 3.02437 4.93593 2.9145 4.8331 2.74102C4.74169 2.59067 4.71027 2.43164 4.73883 2.26394C4.7674 2.09624 4.85595 1.97191 5.00448 1.89095C5.15302 1.81 5.30727 1.7406 5.46723 1.68278C5.62719 1.62495 5.78715 1.5729 5.94711 1.52664V1.04089C5.94711 0.751756 6.04708 0.505989 6.24703 0.303594C6.44698 0.101198 6.68978 0 6.97543 0C7.26107 0 7.50387 0.101198 7.70382 0.303594C7.90377 0.505989 8.00374 0.751756 8.00374 1.04089V1.52664ZM6.97543 13.8786C6.63265 13.8786 6.32701 13.7831 6.05851 13.5923C5.79 13.4015 5.65575 13.1442 5.65575 12.8203C5.65575 12.7278 5.69288 12.6497 5.76715 12.5861C5.84142 12.5225 5.92426 12.4907 6.01566 12.4907H7.93519C8.0266 12.4907 8.10943 12.5225 8.1837 12.5861C8.25797 12.6497 8.2951 12.7278 8.2951 12.8203C8.2951 13.1442 8.16085 13.4015 7.89234 13.5923C7.62384 13.7831 7.3182 13.8786 6.97543 13.8786Z"
                        fill="#fff"
                      />
                    </svg>
                  )}
                </span>
                알림 받기
              </button>
            </div>
          </div>
          <div className="rt-divider" />
          <div className="rt-pad">
            <RtHistCalendar selected={calSel} onSelect={setCalSel} />
          </div>
        </>
      )}

      {/* ── 히스토리 ── */}
      {chip === "히스토리" && (
        <>
          <div className="rt-pad">
            <div className="rt-stats">
              <div className="rt-stat">
                <span className="rt-stat-k">실천한 루틴</span>
                <span className="rt-stat-v">232개</span>
              </div>
              <span className="rt-stat-div" />
              <div className="rt-stat">
                <span className="rt-stat-k">현재 피부 컨디션</span>
                <span className="rt-stat-v">수분부족</span>
              </div>
            </div>
            <RtHistCalendar selected={calSel} onSelect={setCalSel} />
          </div>
          <div className="rt-hist-scroll">
            {RT_HIST_CARDS.map((c, i) => (
              <div className="rt-hist-card" key={i}>
                <div className="rt-hist-head">
                  <span className="routine-num">{c.num}</span>
                  <span className="rt-hist-title">{c.title}</span>
                </div>
                <div className="rt-hist-body">
                  <div className="rt-hist-thumb">
                    <img src={c.img} alt="" draggable="false" />
                  </div>
                  <ol className="rt-hist-steps">
                    {c.steps.map((s, j) => (
                      <li key={j}>{s}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── 제품조합 ── */}
      {chip === "제품조합" && (
        <div className="rt-pad">
          <div className="section-head rt-sec-head">
            <h2 className="section-title">제품 조합해보기</h2>
            <button className="rt-combo-edit" onClick={() => setComboEdit((v) => !v)}>
              {comboEdit ? "완료" : "편집"}
            </button>
          </div>
          <InfoBar>1:1로 제품을 매칭하여 조합점수를 산출 할 수 있어요</InfoBar>
          <div className="rt-combo-list">
            {comboItems.map((p, i) => {
              const row = (
                <>
                  <div className={"rt-combo-thumb" + (isAmpoule(p) ? " amp" : "")}>
                    <img src={p.img} alt="" draggable="false" />
                  </div>
                  <div className="rt-combo-info">
                    <span className="rt-combo-brand">
                      {p.brand} <span className={"tag " + p.tags[0][1]}>{p.tags[0][0]}</span>
                    </span>
                    <span className="rt-combo-name">{p.name}</span>
                  </div>
                </>
              );
              // 편집 모드: 우측에 빼기(−) 버튼 / 일반 모드: 체크박스
              return comboEdit ? (
                <div className="rt-combo-row" key={i}>
                  {row}
                  <button
                    className="rt-combo-remove"
                    onClick={() => removeCombo(i)}
                    aria-label="제품 빼기"
                  >
                    <svg width="14" height="2" viewBox="0 0 14 2" fill="none">
                      <path d="M1 1H13" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  key={i}
                  className="rt-combo-row"
                  onClick={() => setComboSel((s) => s.map((v, j) => (j === i ? !v : v)))}
                >
                  {row}
                  <RtCheck on={comboSel[i]} />
                </button>
              );
            })}
          </div>
          <div className="rt-combo-dots">
            <span className="rt-combo-dot on" />
            <span className="rt-combo-dot" />
          </div>
          <button className="rt-combo-add" onClick={() => setComboPicker(true)}>
            <svg className="rt-combo-add-plus" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.4V12.6M1.4 7H12.6" stroke="#212121" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="rt-combo-add-label">조합할 내 제품 추가하기</span>
            <span className="rt-combo-count">{comboCount}/10</span>
          </button>
          {comboCount >= 2 &&
            (comboGen ? (
              <div className="pd-ai rt-ai rt-combo-ai">
                <div className="ai-reason rt-gen">
                  <div className="ai-reason-head">
                    <span className="ai-reason-title">
                      <AiBadge /> 조합 점수 분석 중
                    </span>
                  </div>
                  <div className="rt-gen-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <p className="rt-gen-txt">선택한 제품 조합을 AI가 분석하고 있어요</p>
                </div>
              </div>
            ) : (
              <div className="pd-ai rt-ai rt-combo-ai">
                <div className="ai-reason">
                  <div className="ai-reason-head">
                    <span className="ai-reason-title">
                      <AiBadge /> 조합 점수 ({comboReport.score} /10)
                    </span>
                    <ChevronDown className="up" />
                  </div>
                  <div className="rt-combo-pair">
                    {comboPair.map((p, k) => (
                      <Fragment key={k}>
                        {k > 0 && (
                          <span className="rt-combo-plus">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M7 1V13M1 7H13" stroke="#B0B4BA" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          </span>
                        )}
                        <span className="rt-combo-pair-thumb">
                          <img src={p.img} alt="" draggable="false" />
                        </span>
                      </Fragment>
                    ))}
                  </div>
                  <div className="ai-reason-tags">
                    {comboReport.tags.map((t) => (
                      <span className="ai-rtag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="ai-reason-text">{comboReport.text}</p>
                  <div className="ai-reason-date">2025.05.22</div>
                </div>
              </div>
            ))}
          <div className="section-head rt-sec-head rt-need-head">
            <h2 className="section-title">새 제품이 필요해요</h2>
            <button className="see-all">
              쇼핑 <ChevronRight />
            </button>
          </div>
          <div className="sameline-grid">
            {SAMELINE.map((p, i) => (
              <div className="sameline-card" key={i}>
                <div className="sameline-thumb">
                  <img src={p.img} alt="" draggable="false" />
                </div>
                <div className="sameline-brand">{p.brand}</div>
                <div className="sameline-name">{p.name}</div>
                <div className="sameline-price">
                  <span className="sameline-off">{p.off}</span> {p.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 공병 만들기 ── */}
      {chip === "공병 만들기" && (
        <div className="rt-pad">
          <div className="cab-seg rt-seg">
            <button className={"cab-seg-item" + (seg === "기초" ? " on" : "")} onClick={() => setSeg("기초")}>
              기초
            </button>
            <button className={"cab-seg-item" + (seg === "색조" ? " on" : "")} onClick={() => setSeg("색조")}>
              색조
            </button>
          </div>
          <div className="ap-search rt-search">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="제품명, 브랜드를 입력하세요" />
            <SearchIcon />
          </div>
          <div className="rt-combo-list">
            {bottleList.map((p) => (
              <button
                key={p._i}
                className="rt-combo-row"
                onClick={() => setBottleSel((s) => s.map((v, j) => (j === p._i ? !v : v)))}
              >
                <div className="rt-combo-thumb">
                  <img src={p.img} alt="" draggable="false" />
                </div>
                <div className="rt-combo-info">
                  <span className="rt-combo-brand">
                    {p.brand} <ExpiryBadge label={p.badge} inline />
                  </span>
                  <span className="rt-combo-name">{p.name}</span>
                </div>
                <RtCheck on={bottleSel[p._i]} />
              </button>
            ))}
            {bottleList.length === 0 && <div className="rt-bottle-empty">검색 결과가 없어요</div>}
          </div>
          {bottleSel.some(Boolean) && (
            <>
              <h3 className="rt-use-title">이렇게 사용해요!</h3>
              <div className="rt-use-grid">
                {RT_BOTTLE.filter((_, i) => bottleSel[i]).map((p, k) => (
                  <div className="rt-use-card" key={k}>
                    <div className="rt-use-thumb">
                      <img src={p.img} alt="" draggable="false" />
                      <ExpiryBadge label={p.badge} />
                    </div>
                    <div className="rt-use-name">{p.use}</div>
                    <button className="add-routine rt-use-btn">
                      <PlusIcon /> 내 루틴 추가하기
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {chip !== "피부관리 브리핑" && <div className="rt-divider" />}
      {today}

      {/* 이 제품들 먼저 쓰세요 (공병 만들기 제외) */}
      {chip !== "공병 만들기" && <FirstUse />}

      {/* 조합할 제품 추가 모달 */}
      <ProductPickerModal
        open={comboPicker}
        title="조합할 제품 추가"
        onClose={() => setComboPicker(false)}
        onPick={(prod) => {
          setComboPicker(false);
          setComboItems((items) => [...items, prod]);
          setComboSel((s) => [...s, true]);
        }}
      />
    </div>
  );
}

function CabinetPage({ onAddProduct, onNav, onProductClick, onCreateRoutine, initialTab = "제품", initialChip, autoScroll = false }) {
  const [tab, setTab] = useState(initialTab);
  const scrollRef = useRef(null);
  // 하위 메뉴(기초/색조 세그먼트)가 위에 살짝 갭 두고 보이도록 부드럽게 스크롤 (빨간 히어로는 가려짐)
  // scroll-margin-top(.cab-seg)이 상단 갭을 담당
  const scrollToGrid = () => {
    const sc = scrollRef.current;
    const seg = sc && sc.querySelector(".cab-seg");
    if (seg) {
      // seg.offsetTop 은 .cabinetpage 기준 → 스크롤 컨테이너 오프셋(154, 타이틀+탭) 빼야 함. 위 16px 갭.
      const top = Math.max(0, seg.offsetTop - sc.offsetTop - 16);
      smoothScrollTo(sc, top, 900); // 부드럽게(느린 이징)
    }
  };
  // 메인 전체보기로 진입 시(유통기한): 레이아웃(플립시계 높이)이 안정된 뒤 부드럽게 그리드로 스크롤
  useEffect(() => {
    if (!(autoScroll && initialTab === "유통기한")) return;
    let timer;
    let last = -1;
    const settleAndScroll = () => {
      const sc = scrollRef.current;
      const seg = sc && sc.querySelector(".cab-seg");
      const pos = seg ? seg.offsetTop : -1;
      if (pos > 0 && pos === last) {
        scrollToGrid(); // 안정됨 → 세그먼트가 상단(위 16px 갭)에 오도록 스크롤
      } else {
        last = pos;
        timer = setTimeout(settleAndScroll, 70);
      }
    };
    timer = setTimeout(settleAndScroll, 300);
    return () => clearTimeout(timer);
  }, []);
  const [seg, setSeg] = useState("기초");
  const [cat, setCat] = useState("전체");
  const [imminent, setImminent] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [shown, setShown] = useState(6); // 유통기한 탭 더보기 페이지네이션
  useEffect(() => {
    setShown(6);
  }, [seg, cat, imminent, tab]);
  const isColor = (p) => p.tags.some(([l]) => l === "색조");
  // 기초/색조 세그먼트 + 카테고리 칩 + 임박(빨간 뱃지=2주 이내) 필터
  const filtered = CABINET_PRODUCTS.filter((p) => {
    const segOk = seg === "색조" ? isColor(p) : !isColor(p);
    const catOk = cat === "전체" || p.tags.some(([l]) => l === cat);
    const immOk = !imminent || badgeColor(p.badge) === "#FF5160";
    return segOk && catOk && immOk;
  });
  // 유통기한 탭: 임박(남은 일수 적은)순으로 상위 배치
  const expSorted = [...filtered].sort((a, b) => badgeDays(a.badge) - badgeDays(b.badge));
  const pickSeg = (s) => {
    setSeg(s);
    setCat("전체");
  };
  const productCard = (p, i) => (
    <div className="cab-card" key={i} onClick={() => onProductClick && onProductClick(p)}>
      <div className={"cab-thumb" + (isAmpoule(p) ? " amp" : "")}>
        <img src={p.img} alt="" draggable="false" />
        <ExpiryBadge label={p.badge} />
      </div>
      <div className="cab-brand">{p.brand}</div>
      <div className="cab-name">{p.name}</div>
      <div className="cab-tags">
        {p.tags.map(([l, t]) => (
          <span className={"tag " + t} key={t}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
  // 공통 필터 컨트롤 (세그먼트 + 칩 + 개수/정렬/임박)
  const filterControls = (
    <>
      <div className="cab-seg">
        <button className={"cab-seg-item" + (seg === "기초" ? " on" : "")} onClick={() => pickSeg("기초")}>
          기초
        </button>
        <button className={"cab-seg-item" + (seg === "색조" ? " on" : "")} onClick={() => pickSeg("색조")}>
          색조
        </button>
      </div>
      <div className="cab-chips">
        {CABINET_CATS.map((c) => (
          <button key={c} className={"cab-chip" + (cat === c ? " on" : "")} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="cab-count">
        <div className="cab-count-left">
          <span className="cab-count-num">상품 {filtered.length}개</span>
          <button className="cab-sort">
            담은순
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1L5 5L9 1" stroke="#777777" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <button className="cab-imminent" onClick={() => setImminent((v) => !v)}>
          임박한 제품만
          <span className={"cab-checkbox" + (imminent ? " on" : "")}>
            {imminent && (
              <svg width="9" height="7" viewBox="0 0 13 10" fill="none">
                <path d="M1.5 5.2L4.8 8.4L11.2 1.6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </button>
      </div>
    </>
  );
  return (
    <div className="cabinetpage">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <h1 className="cab-title">내 화장대</h1>
      <div className="cab-tabs">
        {["제품", "유통기한", "루틴"].map((t) => (
          <button key={t} className={"cab-tab" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "루틴" ? (
        <RoutineTab onNav={onNav} onCreateRoutine={onCreateRoutine} initialChip={initialChip} />
      ) : tab === "유통기한" ? (
        <div className="cabinet-scroll" ref={scrollRef}>
          {/* 빨간 히어로 (플립 카운트다운) */}
          <div className="cab-exp-hero">
            <p className="hero-msg">
              주빈님 곧<CountBadge label="2개" />의 상품의
              <br />
              사용기한이 {COUNTDOWN.days}일 후 만료돼요
            </p>
            <FlipClock />
            <div className={"dropdown" + (dropOpen ? " open" : "")}>
              <button className="dropdown-btn" onClick={() => setDropOpen((v) => !v)}>
                <span className="dropdown-label">
                  <img className="dropdown-ic" src="/ic_haedang.svg" alt="" /> 해당 제품
                </span>
                <ChevronDown className={dropOpen ? "rot" : ""} />
              </button>
              {dropOpen && (
                <div className="dropdown-list">
                  {EXPIRING.map((p, i) => (
                    <div className="drop-row" key={i}>
                      <div className="drop-thumb">
                        <img src={p.img} alt="" />
                      </div>
                      <div className="drop-info">
                        <div className="drop-top">
                          <span className="drop-brand">{p.brand}</span>
                          <span className={"tag " + p.tagType}>{p.tag}</span>
                        </div>
                        <div className="drop-name">{p.name}</div>
                      </div>
                      <span className="drop-period">{p.period}</span>
                    </div>
                  ))}
                  <button
                    className="drop-all"
                    onClick={() => {
                      setDropOpen(false);
                      setTimeout(scrollToGrid, 60);
                    }}
                  >
                    전체보기
                  </button>
                </div>
              )}
            </div>
          </div>

          {filterControls}

          <div className="cab-grid">{expSorted.slice(0, shown).map(productCard)}</div>
          {shown < expSorted.length ? (
            <button className="cab-more" onClick={() => setShown((s) => s + 6)}>
              더보기
            </button>
          ) : (
            /* 더보기가 없을 때(모두 표시) = 섹션 구분선 (위아래 25px) */
            <div className="cab-grid-divider" />
          )}

          {/* 곧 폐기예정인 제품 */}
          <FirstUse title={"곧 폐기예정인 제품\n이렇게 사용해보세요"} seeAll="상세보기" products={EXPIRING_USE} />

          {/* 같은 라인 미리 구매해요 */}
          <section className="section">
            <div className="section-head">
              <h2 className="section-title">같은 라인 미리 구매해요</h2>
              <button className="see-all">
                더보기 <ChevronRight />
              </button>
            </div>
            <div className="sameline-grid">
              {SAMELINE.map((p, i) => (
                <div className="sameline-card" key={i}>
                  <div className="sameline-thumb">
                    <img src={p.img} alt="" draggable="false" />
                  </div>
                  <div className="sameline-brand">{p.brand}</div>
                  <div className="sameline-name">{p.name}</div>
                  <div className="sameline-price">
                    <span className="sameline-off">{p.off}</span> {p.price}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 사용기한 측정 기준 안내 (Figma 685-16534) */}
          <button className="cab-pao">
            <span className="cab-pao-ic">
              <img src="/img/ic_clock.png" alt="" />
            </span>
            <span className="cab-pao-txt">
              <b>사용기한 측정 기준이 궁금해요</b>
              <em>화장품 PAO 기준 자세히 보기</em>
            </span>
            <svg className="cab-pao-arrow" width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M1 1L6 6L1 11" stroke="#9599A1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="cabinet-scroll" ref={scrollRef}>
          {/* 프로모 배너 */}
          <div className="cab-promo">
            <div className="cab-promo-txt">
              주빈님 이번주 날씨 경고에
              <br />이 제품이 딱이에요!
            </div>
            <button className="cab-promo-btn">오늘 사용 추천 제품 보러가기</button>
            <img className="cab-promo-img" src="/img/cabinet_promo.png" alt="" draggable="false" />
          </div>

          {filterControls}

          <div className="cab-grid">{filtered.map(productCard)}</div>

          <button className="cab-add" onClick={onAddProduct}>
            새 화장품 등록하기
          </button>
        </div>
      )}

      <BottomNav active="right" onNav={onNav} />
    </div>
  );
}

/* ---------------- 제품 상세 (Figma 236-32525) ---------------- */
// 뱃지 → 플립 카운트다운(월/일/시)
function badgeCountdown(label) {
  const n = parseInt(label, 10) || 0;
  if (label.includes("개월")) return { months: n, days: 16, hours: 20 };
  if (label.includes("주")) return { months: 0, days: n * 7, hours: 20 };
  return { months: 0, days: n, hours: 20 };
}
const PD_TOGETHER = [
  { brand: "코스알엑스", name: "하이드리움 워터리 토너", tags: [["토너", "toner"]], img: "/img/search/p32.png" },
  { brand: "아비브", name: "콜라겐 겔 마스크", tags: [["기타", "etc"]], img: "/img/search/p23.png" },
  { brand: "토리든", name: "다이브인 저분자 히알루론 세럼", tags: [["앰플", "ampoule"]], img: "/img/search/r_torriden.png" },
];
const PD_IMMINENT = [
  { brand: "포더스킨", name: "바이오 세러마이드 메트릭스 크림", tags: [["크림", "cream"]], badge: "9일", img: "/img/search/p11.png" },
  { brand: "에스트라", name: "아토베리아 365 하이드로 수딩크림", tags: [["크림", "cream"]], badge: "9일", img: "/img/search/r_ap8.png" },
  { brand: "공스킨", name: "EGF 앰플", tags: [["앰플", "ampoule"], ["기능성", "func"]], badge: "9일", img: "/img/search/r_dropampoule.png" },
];

/* ===== 히스토리 탭 (Figma 323-9622) ===== */
// 시간대 아이콘 (아침/낮/저녁)
function TimeIcon({ type }) {
  if (type === "sun")
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4.2" stroke="#FFB020" strokeWidth="1.6" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const r = (a * Math.PI) / 180;
          return (
            <line
              key={a}
              x1={12 + 7 * Math.cos(r)}
              y1={12 + 7 * Math.sin(r)}
              x2={12 + 9.3 * Math.cos(r)}
              y2={12 + 9.3 * Math.sin(r)}
              stroke="#FFB020"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    );
  if (type === "twilight")
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 17H20" stroke="#F08A5D" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M7 17a5 5 0 0 1 10 0" stroke="#F08A5D" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 3.5V6M4.5 8.5l1.6 1.6M19.5 8.5l-1.6 1.6" stroke="#F08A5D" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5Z"
        stroke="#6C7BF0"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
// 둥근 육각형 path (모서리 r) — Figma 693-17061의 라운드 링
function roundedHexPath(cx, cy, R, angles, cr) {
  const pts = angles.map((a) => {
    const r = (a * Math.PI) / 180;
    return [cx + R * Math.cos(r), cy + R * Math.sin(r)];
  });
  const n = pts.length;
  let path = "";
  for (let i = 0; i < n; i++) {
    const cur = pts[i],
      prev = pts[(i - 1 + n) % n],
      next = pts[(i + 1) % n];
    const v1 = [prev[0] - cur[0], prev[1] - cur[1]];
    const v2 = [next[0] - cur[0], next[1] - cur[1]];
    const l1 = Math.hypot(v1[0], v1[1]) || 1;
    const l2 = Math.hypot(v2[0], v2[1]) || 1;
    const r = Math.min(cr, l1 / 2, l2 / 2);
    const p1 = [cur[0] + (v1[0] / l1) * r, cur[1] + (v1[1] / l1) * r];
    const p2 = [cur[0] + (v2[0] / l2) * r, cur[1] + (v2[1] / l2) * r];
    path += i === 0 ? `M${p1[0].toFixed(1)},${p1[1].toFixed(1)}` : `L${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;
    path += `Q${cur[0].toFixed(1)},${cur[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return path + "Z";
}
// 피부 컨디션 레이더 차트 (Figma 693-17061) — 그레이=이전 / 빨강=최근, 라운드 링
function SkinRadar({ data, prev, active }) {
  const size = 300,
    cx = 150,
    cy = 150,
    R = 141; // 육각형이 뷰박스를 거의 채워 원본 비율(275/349≈79%) 재현
  const angles = [-90, -30, 30, 90, 150, 210]; // 수분·유분·모공·각질·주름·피지
  const toXY = (a, r) => {
    const rad = (a * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  // 중앙에서 부드럽게 스며들듯 퍼지는 애니메이션 (rAF, 모든 점 동시)
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef();
  const DUR = 1050; // 느리고 자연스럽게
  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    let startT = null;
    const loop = (now) => {
      if (startT === null) startT = now;
      const e = now - startT;
      setElapsed(e);
      if (e < DUR) rafRef.current = requestAnimationFrame(loop);
      else setElapsed(DUR);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);
  // 튕기지 않고 부드럽게 스며드는 느낌 — easeInOutSine
  const easeSoft = (x) => {
    const c = Math.min(1, Math.max(0, x));
    return -(Math.cos(Math.PI * c) - 1) / 2; // easeInOutSine
  };
  const prog = active ? easeSoft(elapsed / DUR) : 0; // 모든 꼭짓점 동일 진행
  const ptsAnim = (arr) => arr.map((d, i) => toXY(angles[i], (d.score / 100) * R * prog).join(",")).join(" ");
  // 링: 원본 스트로크 색 그대로 (외곽 2겹 #dbdbdb / 가운데 2겹 #c1c1c1 / 안쪽 2겹 #cacaca)
  const rings = [
    { ratio: 1, color: "#dbdbdb" },
    { ratio: 0.804, color: "#dbdbdb" },
    { ratio: 0.622, color: "#c1c1c1" },
    { ratio: 0.455, color: "#c1c1c1" },
    { ratio: 0.316, color: "#cacaca" },
    { ratio: 0.185, color: "#cacaca" },
  ];
  const CR = 11; // 원본 모서리 r11
  return (
    // isolate + 흰 배경 → 하드라이트/멀티플라이가 원본처럼 흰 바탕 위에서 블렌딩됨
    <svg viewBox={`0 0 ${size} ${size}`} className="skin-radar" style={{ isolation: "isolate" }}>
      <rect x="0" y="0" width={size} height={size} fill="#ffffff" />
      {rings.map((rg, i) => (
        <path
          key={i}
          d={roundedHexPath(cx, cy, rg.ratio * R, angles, CR)}
          fill="none"
          stroke={rg.color}
          strokeWidth="1"
        />
      ))}
      {/* 이전 결과 (그레이 — 원본: #a8a8a8 33% linear-burn≈multiply + 검정 외곽, 레이어 60%) */}
      {prev && (
        <polygon
          points={ptsAnim(prev)}
          fill="#a8a8a8"
          fillOpacity="0.33"
          stroke="#000000"
          strokeWidth="1"
          strokeLinejoin="round"
          style={{ mixBlendMode: "multiply", opacity: 0.6 }}
        />
      )}
      {prev &&
        prev.map((d, i) => {
          const [x, y] = toXY(angles[i], (d.score / 100) * R * prog);
          return <circle key={i} cx={x} cy={y} r="2.4" fill="#A9A9A9" />;
        })}
      {/* 최근 결과 — 채움 #ff5160 56% 하드라이트, 외곽선 #ff5160 솔리드 (원본 Vector 2) */}
      <polygon points={ptsAnim(data)} fill="#FF5160" fillOpacity="0.56" style={{ mixBlendMode: "hard-light" }} />
      <polygon points={ptsAnim(data)} fill="none" stroke="#FF5160" strokeWidth="1.4" strokeLinejoin="round" />
      {data.map((d, i) => {
        const [x, y] = toXY(angles[i], (d.score / 100) * R * prog);
        return <circle key={i} cx={x} cy={y} r="2.6" fill="#FF5160" />;
      })}
    </svg>
  );
}
// 레이더 라벨 pill (원본 693-17061: 솔리드 코랄/그린 + 흰 글자, 50점은 회색 텍스트)
function radarLabelStyle(s) {
  if (s < 50) return { pill: true, background: "#FF5160", color: "#fff" };
  if (s > 50) return { pill: true, background: "#1DBF7E", color: "#fff" };
  return { pill: false };
}
// 이전 피부 분석 결과(그레이 폴리곤)
const RADAR_PREV = [
  { label: "수분", score: 52 },
  { label: "유분", score: 46 },
  { label: "모공", score: 54 },
  { label: "각질", score: 62 },
  { label: "주름", score: 60 },
  { label: "피지", score: 70 },
];
const RADAR_DATA = [
  { label: "수분", score: 43 },
  { label: "유분", score: 50 },
  { label: "모공", score: 50 },
  { label: "각질", score: 70 },
  { label: "주름", score: 50 },
  { label: "피지", score: 43 },
];
const HISTORY_USED = [
  { img: "/img/ai_estra1.png", name: "수분충전을 위해 사용했어요", brand: "에스트라", prod: "아토베리아 365 하이드로 크림", tags: [["크림", "cream"]] },
  { img: "/img/prod_illiyoon.png", name: "피부장벽을 위해 사용했어요", brand: "일리윤", prod: "히알루론 모이스처 수분크림", tags: [["크림", "cream"], ["기능성", "func"]] },
  { img: "/img/prod_purito.png", name: "진정 케어를 위해 사용했어요", brand: "퓨리토 서울", prod: "모이스처 펜타놀 크림", tags: [["크림", "cream"]] },
];
function scoreColor(s) {
  return s >= 60 ? "#1dbf7e" : s <= 45 ? "#ff5160" : "#9599a1";
}
// 제품별 히스토리 기록 풀 (날짜/사용이력 랜덤, 결정론적) — 5월 기준
const WKMAP = ["일", "월", "화", "수", "목", "금", "토"];
function historyPoolFor(p, month = 5, year = 2025) {
  const name = (p && p.name) || "";
  // 시드에 월/연도를 섞어 월 변경 시 카드값이 모두 달라지게
  let seed = (7 + month * 131 + year * 17) >>> 0;
  for (let i = 0; i < name.length; i++) seed = (seed * 31 + name.charCodeAt(i)) >>> 0;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][(month - 1 + 12) % 12];
  const out = [];
  let day = daysInMonth - Math.floor(rnd() * 3); // 월 말일 근처에서 시작
  for (let i = 0; i < 15 && day > 1; i++) {
    day -= 1 + Math.floor(rnd() * 3);
    if (day < 1) break;
    const wk = WKMAP[(day + month * 2 + 4) % 7]; // 월마다 요일 배치도 달라짐
    const am = rnd() > 0.35;
    const pm = rnd() > 0.3;
    const entry = {
      day,
      wk,
      am: am || !pm,
      noon: rnd() > 0.75,
      pm: pm || !am,
      // 문진한 날에만 피부점수 (약 30%), 랜덤 배정
      score: rnd() > 0.7 ? 35 + Math.floor(rnd() * 55) : null,
    };
    out.push(entry);
  }
  return out;
}
// 시간대 아이콘(그레이, Figma 328-7863/7904/7892) — 아침/저녁/자기 전
function TimeIconGray({ type }) {
  if (type === "sun")
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M8.25 2.25V1.5C8.25 1.2875 8.32188 1.10938 8.46563 0.965625C8.60938 0.821875 8.7875 0.75 9 0.75C9.2125 0.75 9.39063 0.821875 9.53438 0.965625C9.67813 1.10938 9.75 1.2875 9.75 1.5V2.25C9.75 2.4625 9.67813 2.64063 9.53438 2.78438C9.39063 2.92813 9.2125 3 9 3C8.7875 3 8.60938 2.92813 8.46563 2.78438C8.32188 2.64063 8.25 2.4625 8.25 2.25ZM8.25 16.5V15.75C8.25 15.5375 8.32188 15.3594 8.46563 15.2156C8.60938 15.0719 8.7875 15 9 15C9.2125 15 9.39063 15.0719 9.53438 15.2156C9.67813 15.3594 9.75 15.5375 9.75 15.75V16.5C9.75 16.7125 9.67813 16.8906 9.53438 17.0344C9.39063 17.1781 9.2125 17.25 9 17.25C8.7875 17.25 8.60938 17.1781 8.46563 17.0344C8.32188 16.8906 8.25 16.7125 8.25 16.5ZM16.5 9.75H15.75C15.5375 9.75 15.3594 9.67813 15.2156 9.53438C15.0719 9.39063 15 9.2125 15 9C15 8.7875 15.0719 8.60938 15.2156 8.46563C15.3594 8.32188 15.5375 8.25 15.75 8.25H16.5C16.7125 8.25 16.8906 8.32188 17.0344 8.46563C17.1781 8.60938 17.25 8.7875 17.25 9C17.25 9.2125 17.1781 9.39063 17.0344 9.53438C16.8906 9.67813 16.7125 9.75 16.5 9.75ZM2.25 9.75H1.5C1.2875 9.75 1.10938 9.67813 0.965625 9.53438C0.821875 9.39063 0.75 9.2125 0.75 9C0.75 8.7875 0.821875 8.60938 0.965625 8.46563C1.10938 8.32188 1.2875 8.25 1.5 8.25H2.25C2.4625 8.25 2.64063 8.32188 2.78438 8.46563C2.92813 8.60938 3 8.7875 3 9C3 9.2125 2.92813 9.39063 2.78438 9.53438C2.64063 9.67813 2.4625 9.75 2.25 9.75ZM14.8125 4.25625L14.55 4.51875C14.4125 4.65625 14.2406 4.725 14.0344 4.725C13.8281 4.725 13.65 4.65 13.5 4.5C13.3625 4.3625 13.2906 4.19063 13.2844 3.98438C13.2781 3.77813 13.3438 3.6 13.4813 3.45L13.7625 3.16875C13.9 3.01875 14.075 2.94375 14.2875 2.94375C14.5 2.94375 14.6813 3.01875 14.8313 3.16875C14.9813 3.31875 15.0531 3.5 15.0469 3.7125C15.0406 3.925 14.9625 4.10625 14.8125 4.25625ZM4.51875 14.55L4.2375 14.8313C4.1 14.9813 3.925 15.0563 3.7125 15.0563C3.5 15.0563 3.31875 14.9813 3.16875 14.8313C3.01875 14.6813 2.94688 14.5 2.95313 14.2875C2.95938 14.075 3.0375 13.8938 3.1875 13.7438L3.45 13.4813C3.5875 13.3438 3.75938 13.275 3.96563 13.275C4.17188 13.275 4.35 13.35 4.5 13.5C4.6375 13.6375 4.70938 13.8094 4.71563 14.0156C4.72188 14.2219 4.65625 14.4 4.51875 14.55ZM13.7438 14.8125L13.4813 14.55C13.3438 14.4125 13.275 14.2406 13.275 14.0344C13.275 13.8281 13.35 13.65 13.5 13.5C13.6375 13.3625 13.8094 13.2906 14.0156 13.2844C14.2219 13.2781 14.4 13.3438 14.55 13.4813L14.8313 13.7625C14.9813 13.9 15.0563 14.075 15.0563 14.2875C15.0563 14.5 14.9813 14.6813 14.8313 14.8313C14.6813 14.9813 14.5 15.0531 14.2875 15.0469C14.075 15.0406 13.8938 14.9625 13.7438 14.8125ZM3.45 4.51875L3.16875 4.2375C3.01875 4.1 2.94375 3.925 2.94375 3.7125C2.94375 3.5 3.01875 3.31875 3.16875 3.16875C3.31875 3.01875 3.5 2.94688 3.7125 2.95313C3.925 2.95938 4.10625 3.0375 4.25625 3.1875L4.51875 3.45C4.65625 3.5875 4.725 3.75938 4.725 3.96563C4.725 4.17188 4.65 4.35 4.5 4.5C4.3625 4.6375 4.19063 4.70938 3.98438 4.71563C3.77813 4.72188 3.6 4.65625 3.45 4.51875ZM5.8125 12.1875C4.9375 11.3125 4.5 10.25 4.5 9C4.5 7.75 4.9375 6.6875 5.8125 5.8125C6.6875 4.9375 7.75 4.5 9 4.5C10.25 4.5 11.3125 4.9375 12.1875 5.8125C13.0625 6.6875 13.5 7.75 13.5 9C13.5 10.25 13.0625 11.3125 12.1875 12.1875C11.3125 13.0625 10.25 13.5 9 13.5C7.75 13.5 6.6875 13.0625 5.8125 12.1875ZM11.1281 11.1281C11.7094 10.5469 12 9.8375 12 9C12 8.1625 11.7094 7.45313 11.1281 6.87188C10.5469 6.29063 9.8375 6 9 6C8.1625 6 7.45313 6.29063 6.87188 6.87188C6.29063 7.45313 6 8.1625 6 9C6 9.8375 6.29063 10.5469 6.87188 11.1281C7.45313 11.7094 8.1625 12 9 12C9.8375 12 10.5469 11.7094 11.1281 11.1281Z"
          fill="#A8A8A8"
        />
      </svg>
    );
  if (type === "twilight")
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M2.75 15.8118C2.5549 15.8118 2.39158 15.746 2.26004 15.6143C2.12835 15.4828 2.0625 15.3194 2.0625 15.1243C2.0625 14.9293 2.12835 14.7659 2.26004 14.6344C2.39158 14.5027 2.5549 14.4368 2.75 14.4368H19.25C19.4451 14.4368 19.6084 14.5027 19.74 14.6344C19.8717 14.7659 19.9375 14.9293 19.9375 15.1243C19.9375 15.3194 19.8717 15.4828 19.74 15.6143C19.6084 15.746 19.4451 15.8118 19.25 15.8118H2.75ZM6.80625 10.541H15.1938C14.8424 9.71602 14.2909 9.05143 13.5394 8.54727C12.7879 8.0431 11.9414 7.79102 11 7.79102C10.0586 7.79102 9.21212 8.0431 8.4606 8.54727C7.70909 9.05143 7.15764 9.71602 6.80625 10.541ZM5.0946 11.916C5.20033 10.3577 5.81847 9.05143 6.94902 7.99727C8.07958 6.9431 9.4299 6.41602 11 6.41602C12.5701 6.41602 13.9204 6.9431 15.051 7.99727C16.1815 9.05143 16.7997 10.3577 16.9054 11.916H5.0946Z"
          fill="#A8A8A8"
        />
      </svg>
    );
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9.05742 16.4998C8.00742 16.4998 7.02305 16.2998 6.1043 15.8998C5.18555 15.4998 4.38555 14.9592 3.7043 14.2779C3.02305 13.5967 2.48242 12.7967 2.08242 11.8779C1.68242 10.9592 1.48242 9.9748 1.48242 8.9248C1.48242 7.3748 1.91055 5.96855 2.7668 4.70605C3.62305 3.44355 4.76992 2.51855 6.20742 1.93105C6.38242 1.86855 6.56367 1.84668 6.75117 1.86543C6.93867 1.88418 7.09492 1.94355 7.21992 2.04355C7.31992 2.13105 7.39805 2.25293 7.4543 2.40918C7.51055 2.56543 7.53867 2.76855 7.53867 3.01855C7.56367 4.00605 7.76367 4.94668 8.13867 5.84043C8.51367 6.73418 9.05117 7.53105 9.75117 8.23105C10.4512 8.93105 11.2512 9.46855 12.1512 9.84356C13.0512 10.2186 13.9949 10.4186 14.9824 10.4436C15.2449 10.4436 15.4449 10.4654 15.5824 10.5092C15.7199 10.5529 15.8324 10.6248 15.9199 10.7248C16.0199 10.8498 16.0855 11.0123 16.1168 11.2123C16.148 11.4123 16.1324 11.5936 16.0699 11.7561C15.4949 13.1936 14.5699 14.3436 13.2949 15.2061C12.0199 16.0686 10.6074 16.4998 9.05742 16.4998ZM9.05742 14.9998C10.1574 14.9998 11.1762 14.7248 12.1137 14.1748C13.0512 13.6248 13.7887 12.8686 14.3262 11.9061C13.2512 11.8061 12.2324 11.5342 11.2699 11.0904C10.3074 10.6467 9.44492 10.0436 8.68242 9.28105C7.91992 8.51855 7.31367 7.65605 6.86367 6.69355C6.41367 5.73105 6.14492 4.7123 6.05742 3.6373C5.09492 4.1748 4.3418 4.91543 3.79805 5.85918C3.2543 6.80293 2.98242 7.8248 2.98242 8.9248C2.98242 10.6123 3.57305 12.0467 4.7543 13.2279C5.93555 14.4092 7.36992 14.9998 9.05742 14.9998ZM10.7262 5.4748L9.52617 4.2748C9.37617 4.1248 9.30117 3.9498 9.30117 3.7498C9.30117 3.5498 9.37617 3.3748 9.52617 3.2248L10.7262 2.0248C10.8762 1.8748 11.0512 1.7998 11.2512 1.7998C11.4512 1.7998 11.6262 1.8748 11.7762 2.0248L12.9762 3.2248C13.1262 3.3748 13.2012 3.5498 13.2012 3.7498C13.2012 3.9498 13.1262 4.1248 12.9762 4.2748L11.7762 5.4748C11.6262 5.6248 11.4512 5.6998 11.2512 5.6998C11.0512 5.6998 10.8762 5.6248 10.7262 5.4748ZM14.4762 7.7248L14.0262 7.27481C13.8762 7.1248 13.8012 6.9498 13.8012 6.7498C13.8012 6.5498 13.8762 6.3748 14.0262 6.2248L14.4762 5.7748C14.6262 5.6248 14.8012 5.5498 15.0012 5.5498C15.2012 5.5498 15.3762 5.6248 15.5262 5.7748L15.9762 6.2248C16.1262 6.3748 16.2012 6.5498 16.2012 6.7498C16.2012 6.9498 16.1262 7.1248 15.9762 7.27481L15.5262 7.7248C15.3762 7.8748 15.2012 7.9498 15.0012 7.9498C14.8012 7.9498 14.6262 7.8748 14.4762 7.7248Z"
        fill="#A8A8A8"
      />
    </svg>
  );
}
function scorePillStyle(s) {
  // 50점 이상 초록, 50점 미만 코랄
  return s >= 50 ? { background: "#e8f9f2", color: "#1dbf7e" } : { background: "#ffeeef", color: "#ff5160" };
}
// 히스토리 기록 카드 (Figma 691-17060)
function HistoryEntry({ entry, product }) {
  const p = product;
  return (
    <div className="hist-entry">
      <div className="hist-entry-date">
        <div className="hist-entry-num">
          {entry.day}
          <span className="hist-entry-wk">({entry.wk})</span>
        </div>
        {entry.score != null && (
          <span className="hist-entry-score" style={scorePillStyle(entry.score)}>
            피부점수 {entry.score}점
          </span>
        )}
      </div>
      <div className="hist-entry-card">
        {[["am", "sun"], ["noon", "twilight"], ["pm", "moon"]].map(([slot, icon]) => (
          <div className="hist-erow" key={slot}>
            {entry[slot] ? (
              <>
                <div className="hist-erow-thumb">
                  <img src={p.img} alt="" draggable="false" />
                </div>
                <div className="hist-erow-info">
                  <span className="hist-erow-brand">
                    {p.brand} <span className={"tag " + p.tags[0][1]}>{p.tags[0][0]}</span>
                  </span>
                  <span className="hist-erow-name">{p.name}</span>
                </div>
              </>
            ) : (
              <span className="hist-erow-empty">—</span>
            )}
            <TimeIconGray type={icon} />
          </div>
        ))}
      </div>
    </div>
  );
}
// 5월 달력 (Figma 328-8301)
function HistoryCalendar({ recordDays, selected, onSelect }) {
  const weeks = [
    [null, null, null, null, null, 1, 2],
    [3, 4, 5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14, 15, 16],
    [17, 18, 19, 20, 21, 22, 23],
    [24, 25, 26, 27, 28, 29, 30],
  ];
  return (
    <div className="hist-cal">
      <div className="hist-cal-head">
        {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
          <span key={i} className={"hist-cal-wd" + (i === 0 ? " sun" : i === 6 ? " sat" : "")}>
            {w}
          </span>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div className="hist-cal-row" key={wi}>
          {week.map((d, di) => (
            <button
              key={di}
              className={"hist-cal-cell" + (d ? "" : " empty") + (d === selected ? " sel" : "") + (di === 0 ? " sun" : di === 6 ? " sat" : "")}
              onClick={() => d && onSelect(d)}
              disabled={!d}
            >
              {d && <span className="hist-cal-num">{d}</span>}
              {d && recordDays.has(d) && d !== selected && <span className="hist-cal-dot" />}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
const FEEDBACK_PRODUCTS = [
  { brand: "에스트라", name: "아토베리아 365 하이드로 수딩크림", tags: [["크림", "cream"]], img: "/img/ai_estra1.png", tags3: ["수분충전", "장벽개선", "피부진정"] },
  { brand: "토리든", name: "다이브인 저분자 히알루론 세럼", tags: [["앰플", "ampoule"]], img: "/img/search/r_torriden.png", tags3: ["수분충전", "흡수력", "산뜻함"] },
  { brand: "라운드랩", name: "자작나무 수분 토너", tags: [["토너", "toner"]], img: "/img/prod_roundlab.png", tags3: ["각질케어", "진정", "저자극"] },
];
function HistoryTab({ product }) {
  const p = product;
  const [month, setMonth] = useState(5); // 선택된 월
  const [year, setYear] = useState(2025); // 선택된 연도
  const pool = historyPoolFor(p, month, year);
  const [view, setView] = useState("list");
  const [shown, setShown] = useState(3); // 리스트 3개씩
  const recordDays = new Set(pool.map((e) => e.day));
  const [calSel, setCalSel] = useState(() => (pool[0] ? pool[0].day : 28));
  const fbScrollRef = useDragScroll();
  const [fbIdx, setFbIdx] = useState(0);
  const [radarOn, setRadarOn] = useState(false); // 레이더 확장 애니메이션 (최초 1회)
  const [fbModal, setFbModal] = useState(null); // 피드백 작성 모달 대상 제품
  const [fbChecked, setFbChecked] = useState({}); // 피드백 완료된 제품 (기본 모두 미체크)
  const [fbDone, setFbDone] = useState(false); // "피드백 완료!" 팝업
  const [pickerOpen, setPickerOpen] = useState(false); // 다른 화장품 선택 모달
  const [briefOpen, setBriefOpen] = useState(true); // AI 브리핑 토글
  const [monthOpen, setMonthOpen] = useState(false); // 월 선택 드롭다운
  const radarRef = useRef(null);
  const submitFeedback = (prod) => {
    if (prod) setFbChecked((c) => ({ ...c, [prod.brand + prod.name]: true }));
    setFbModal(null);
    setFbDone(true);
    setTimeout(() => setFbDone(false), 1700);
  };
  useEffect(() => {
    setRadarOn(false);
    const el = radarRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            setRadarOn(true);
            io.disconnect();
          }
        }),
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [p]);
  // 월/연도 변경 시 리스트·캘린더 선택 초기화 (카드값이 달라지므로)
  useEffect(() => {
    setShown(3);
    setCalSel(pool[0] ? pool[0].day : 28);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, p]);
  const calEntry = pool.find((e) => e.day === calSel) || { day: calSel, wk: WKMAP[(calSel + 4) % 7], am: true, noon: false, pm: true, score: null };
  // 색조 제품은 히스토리 카드영역을 없애고 피부 컨디션 변화를 맨 위로
  const isColor = !!(p && p.tags && p.tags.some((t) => t[1] === "color"));
  return (
    <div className="pd-history">
      {!isColor && (
        <>
      {/* 월 선택 + 뷰 토글 (Figma 328-8110) */}
      <div className="hist-top">
        <div className="hist-month-wrap">
          <button className={"hist-month" + (monthOpen ? " open" : "")} onClick={() => setMonthOpen((v) => !v)}>
            {month}월
            <svg width="13" height="8" viewBox="0 0 14 8" fill="none">
              <path d="M1 1L7 7L13 1" stroke="#1f1f1f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {monthOpen && (
            <>
              <div className="hist-month-scrim" onClick={() => setMonthOpen(false)} />
              <div className="hist-month-pop">
                <div className="hist-year-nav">
                  <button className="hist-year-arrow" onClick={() => setYear((y) => y - 1)} aria-label="이전 연도">
                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                      <path d="M7 1L1 7L7 13" stroke="#1f1f1f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="hist-year-val">{year}</span>
                  <button className="hist-year-arrow" onClick={() => setYear((y) => y + 1)} aria-label="다음 연도">
                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                      <path d="M1 1L7 7L1 13" stroke="#1f1f1f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <div className="hist-month-grid">
                  {Array.from({ length: 12 }, (_, k) => k + 1).map((m) => (
                    <button
                      key={m}
                      className={"hist-month-opt" + (m === month ? " on" : "")}
                      onClick={() => {
                        setMonth(m);
                        setMonthOpen(false);
                      }}
                    >
                      {m}월
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="hist-view">
          <button className={"hist-view-btn" + (view === "list" ? " on" : "")} onClick={() => setView("list")} aria-label="목록">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M12.4444 6.22222C12.8722 6.22222 13.2384 6.06991 13.5431 5.76528C13.8477 5.46065 14 5.09444 14 4.66667V1.55556C14 1.12778 13.8477 0.761574 13.5431 0.456944C13.2384 0.152315 12.8722 0 12.4444 0H1.55556C1.12778 0 0.761573 0.152315 0.456944 0.456944C0.152314 0.761574 0 1.12778 0 1.55556V4.66667C0 5.09444 0.152314 5.46065 0.456944 5.76528C0.761573 6.06991 1.12778 6.22222 1.55556 6.22222H12.4444ZM12.4444 4.66667H1.55556V1.55556H12.4444V4.66667ZM12.4444 14C12.8722 14 13.2384 13.8477 13.5431 13.5431C13.8477 13.2384 14 12.8722 14 12.4444V9.33333C14 8.90556 13.8477 8.53935 13.5431 8.23472C13.2384 7.93009 12.8722 7.77778 12.4444 7.77778H1.55556C1.12778 7.77778 0.761573 7.93009 0.456944 8.23472C0.152314 8.53935 0 8.90556 0 9.33333V12.4444C0 12.8722 0.152314 13.2384 0.456944 13.5431C0.761573 13.8477 1.12778 14 1.55556 14H12.4444ZM12.4444 12.4444H1.55556V9.33333H12.4444V12.4444Z"
                fill={view === "list" ? "#fff" : "#B9B9B9"}
              />
            </svg>
          </button>
          <button className={"hist-view-btn" + (view === "cal" ? " on" : "")} onClick={() => setView("cal")} aria-label="캘린더">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M18.2222 21C18.7111 21 19.1296 20.8237 19.4778 20.4713C19.8259 20.1187 20 19.695 20 19.2V6.6C20 6.105 19.8259 5.68125 19.4778 5.32875C19.1296 4.97625 18.7111 4.8 18.2222 4.8H17.3333V3.9C17.3333 3.645 17.2481 3.43125 17.0778 3.25875C16.9074 3.08625 16.6963 3 16.4444 3C16.1926 3 15.9815 3.08625 15.8111 3.25875C15.6407 3.43125 15.5556 3.645 15.5556 3.9V4.8H8.44444V3.9C8.44444 3.645 8.35926 3.43125 8.18889 3.25875C8.01852 3.08625 7.80741 3 7.55556 3C7.3037 3 7.09259 3.08625 6.92222 3.25875C6.75185 3.43125 6.66667 3.645 6.66667 3.9V4.8H5.77778C5.28889 4.8 4.87037 4.97625 4.52222 5.32875C4.17407 5.68125 4 6.105 4 6.6V19.2C4 19.695 4.17407 20.1187 4.52222 20.4713C4.87037 20.8237 5.28889 21 5.77778 21H18.2222ZM18.2222 19.2H5.77778V10.2H18.2222V19.2ZM18.2222 8.4H5.77778V6.6H18.2222V8.4ZM12 13.8C12.2519 13.8 12.463 13.7137 12.6333 13.5413C12.8037 13.3688 12.8889 13.155 12.8889 12.9C12.8889 12.645 12.8037 12.4312 12.6333 12.2587C12.463 12.0863 12.2519 12 12 12C11.7481 12 11.537 12.0863 11.3667 12.2587C11.1963 12.4312 11.1111 12.645 11.1111 12.9C11.1111 13.155 11.1963 13.3688 11.3667 13.5413C11.537 13.7137 11.7481 13.8 12 13.8ZM16.1889 13.5413C16.3593 13.3688 16.4444 13.155 16.4444 12.9C16.4444 12.645 16.3593 12.4312 16.1889 12.2587C16.0185 12.0863 15.8074 12 15.5556 12C15.3037 12 15.0926 12.0863 14.9222 12.2587C14.7519 12.4312 14.6667 12.645 14.6667 12.9C14.6667 13.155 14.7519 13.3688 14.9222 13.5413C15.0926 13.7137 15.3037 13.8 15.5556 13.8C15.8074 13.8 16.0185 13.7137 16.1889 13.5413ZM8.44444 13.8C8.6963 13.8 8.90741 13.7137 9.07778 13.5413C9.24815 13.3688 9.33333 13.155 9.33333 12.9C9.33333 12.645 9.24815 12.4312 9.07778 12.2587C8.90741 12.0863 8.6963 12 8.44444 12C8.19259 12 7.98148 12.0863 7.81111 12.2587C7.64074 12.4312 7.55556 12.645 7.55556 12.9C7.55556 13.155 7.64074 13.3688 7.81111 13.5413C7.98148 13.7137 8.19259 13.8 8.44444 13.8ZM12 17.4C12.2519 17.4 12.463 17.3138 12.6333 17.1413C12.8037 16.9688 12.8889 16.755 12.8889 16.5C12.8889 16.245 12.8037 16.0312 12.6333 15.8588C12.463 15.6862 12.2519 15.6 12 15.6C11.7481 15.6 11.537 15.6862 11.3667 15.8588C11.1963 16.0312 11.1111 16.245 11.1111 16.5C11.1111 16.755 11.1963 16.9688 11.3667 17.1413C11.537 17.3138 11.7481 17.4 12 17.4ZM16.1889 17.1413C16.3593 16.9688 16.4444 16.755 16.4444 16.5C16.4444 16.245 16.3593 16.0312 16.1889 15.8588C16.0185 15.6862 15.8074 15.6 15.5556 15.6C15.3037 15.6 15.0926 15.6862 14.9222 15.8588C14.7519 16.0312 14.6667 16.245 14.6667 16.5C14.6667 16.755 14.7519 16.9688 14.9222 17.1413C15.0926 17.3138 15.3037 17.4 15.5556 17.4C15.8074 17.4 16.0185 17.3138 16.1889 17.1413ZM8.44444 17.4C8.6963 17.4 8.90741 17.3138 9.07778 17.1413C9.24815 16.9688 9.33333 16.755 9.33333 16.5C9.33333 16.245 9.24815 16.0312 9.07778 15.8588C8.90741 15.6862 8.6963 15.6 8.44444 15.6C8.19259 15.6 7.98148 15.6862 7.81111 15.8588C7.64074 16.0312 7.55556 16.245 7.55556 16.5C7.55556 16.755 7.64074 16.9688 7.81111 17.1413C7.98148 17.3138 8.19259 17.4 8.44444 17.4Z"
                fill={view === "cal" ? "#fff" : "#B9B9B9"}
              />
            </svg>
          </button>
        </div>
      </div>

      {view === "list" ? (
        <>
          {pool.slice(0, shown).map((e) => (
            <HistoryEntry key={e.day} entry={e} product={p} />
          ))}
          {shown < pool.length && (
            <button className="hist-more" onClick={() => setShown((s) => s + 3)}>
              더보기
            </button>
          )}
        </>
      ) : (
        <>
          <HistoryCalendar recordDays={recordDays} selected={calSel} onSelect={setCalSel} />
          <div className="hist-cal-entry">
            {recordDays.has(calSel) ? (
              <HistoryEntry entry={pool.find((e) => e.day === calSel)} product={p} />
            ) : (
              <p className="hist-empty-txt">히스토리 내용이 없습니다</p>
            )}
          </div>
        </>
      )}
        </>
      )}

      {/* 피부 컨디션 변화 */}
      <section className="hist-section">
        <div className="section-head">
          <h2 className="section-title">피부 컨디션 변화</h2>
          <button className="see-all">
            문진하기 <ChevronRight />
          </button>
        </div>
        <InfoBar>주관적 문진에 의한 변화로 실제 변화와 상이할 수 있습니다</InfoBar>
        <div className="skin-radar-wrap" ref={radarRef}>
          <SkinRadar data={RADAR_DATA} prev={RADAR_PREV} active={radarOn} />
          {RADAR_DATA.map((d, i) => {
            const st = radarLabelStyle(d.score);
            return (
              <span key={d.label} className={"radar-label pos" + i}>
                {st.pill ? (
                  <span className="radar-pill" style={{ background: st.background, color: st.color }}>
                    {d.label} {d.score}점
                  </span>
                ) : (
                  <span className="radar-plain">
                    {d.label} {d.score}점
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </section>

      {/* AI 피부 변화 브리핑 (항상 토글) */}
      <div className="pd-ai pd-brief">
        <div className={"ai-reason" + (briefOpen ? "" : " collapsed")}>
          <div className="ai-reason-head">
            <span className="ai-reason-title">
              <AiBadge /> 피부 변화 브리핑
            </span>
            <button className="ai-reason-chev" onClick={() => setBriefOpen((v) => !v)} aria-label="펼치기/접기">
              <ChevronDown className={briefOpen ? "up" : ""} />
            </button>
          </div>
          {briefOpen && (
            <>
              <div className="ai-reason-tags">
                <span className="ai-rtag">수분감 감소</span>
                <span className="ai-rtag">칙칙한 피부</span>
                <span className="ai-rtag">수분부족지성</span>
              </div>
              <p className="ai-reason-text">
                이전 피부 분석 결과와 비교시 <u>수분 점수와 피지 점수가 모두 감소</u>했습니다. 현재 피부는 전반적으로 건조하고
                <u>민감도가 높아진 상태</u>로 분석됩니다. 피부 장벽이 약해지면서 <u>수분 손실</u>이 늘어나고 있으며, 이를 보완하기
                위해 <u>유분 분비가 증가</u>하고 있을 가능성이 있습니다.😥
              </p>
              <div className="ai-reason-date">2025.05.22</div>
            </>
          )}
        </div>
      </div>

      {/* 제품 피드백 */}
      <section className="hist-section">
        <div className="section-head">
          <h2 className="section-title">제품 피드백</h2>
        </div>
        <InfoBar>쇼핑 추천탭 및 AI 루틴 설계에 정확도를 높일 수 있어요</InfoBar>
        <div
          className="hist-fb-scroll"
          ref={fbScrollRef}
          onScroll={(e) => {
            const w = e.target.firstChild ? e.target.firstChild.offsetWidth + 11 : 1;
            setFbIdx(Math.round(e.target.scrollLeft / w));
          }}
        >
          {FEEDBACK_PRODUCTS.map((fb, i) => {
            const checked = !!fbChecked[fb.brand + fb.name];
            return (
              <div className="hist-fb-card" key={i}>
                <div className="hist-fb-top">
                  <div className="hist-fb-thumb">
                    <img src={fb.img} alt="" draggable="false" />
                  </div>
                  <div className="hist-fb-info">
                    <span className="hist-fb-brand">
                      {fb.brand} <span className={"tag " + fb.tags[0][1]}>{fb.tags[0][0]}</span>
                    </span>
                    <span className="hist-fb-name">{fb.name}</span>
                  </div>
                  <button
                    className={"hist-fb-check" + (checked ? " on" : "")}
                    onClick={() => setFbModal(fb)}
                    aria-label="피드백 작성"
                  >
                    {checked && (
                      <svg width="15" height="11" viewBox="0 0 13 10" fill="none">
                        <path d="M1.5 5.2L4.8 8.4L11.2 1.6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="hist-fb-tags">
                  {fb.tags3.map((t) => (
                    <span className="hist-fb-tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="hist-dots">
          {FEEDBACK_PRODUCTS.map((_, i) => (
            <span key={i} className={"hist-dot" + (i === fbIdx ? " on" : "")} />
          ))}
        </div>
        <button className="hist-cta" onClick={() => setPickerOpen(true)}>
          다른 화장품 추가하기
        </button>
      </section>

      {/* 2개월 이상 사용한 제품 — 메인 FirstUse 컴포넌트 재사용(뱃지 제거) */}
      <FirstUse
        title={"2개월 이상\n사용한 제품이에요"}
        seeAll="전체보기"
        products={HISTORY_USED}
        hideBadge
        btnLabel="피드백 추가하기"
        doneLabel="✓ 완료"
        btnVariant="green"
        onBtnClick={(prod) => setFbModal(prod)}
      />

      <FeedbackModal open={!!fbModal} product={fbModal} onClose={() => setFbModal(null)} onSave={() => submitFeedback(fbModal)} />
      <ProductPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(prod) => {
          setPickerOpen(false);
          setFbModal(prod);
        }}
      />
      {fbDone && (
        <div className="pd-confirm-overlay">
          <div className="pd-confirm fb-done-box">
            <p className="fb-done-title">피드백 완료!</p>
            <p className="fb-done-sub">해주신 내용을 앱 서비스 전반에 반영합니다</p>
          </div>
        </div>
      )}
    </div>
  );
}

// 제품 피드백 모달 (Figma 695-16281)
const FB_PERIODS = ["6개월 이상", "2개월 이상", "한 달 이내"];
const FB_EFFECTS = ["만족했어요", "그냥 그랬어요", "별로였어요"];
function FeedbackModal({ open, product, onClose, onSave }) {
  const [period, setPeriod] = useState(null); // 기본값: 아무것도 선택 안 됨
  const [effect, setEffect] = useState(null);
  const [text, setText] = useState("");
  useEffect(() => {
    if (open) {
      setPeriod(null);
      setEffect(null);
      setText("");
    }
  }, [open]);
  // 선택(기간·효과) + 입력이 모두 되면 저장 버튼 노출/활성화
  const canSave = period !== null && effect !== null && text.trim().length > 0;
  const p = product || {};
  const tag = p.tags && p.tags[0] ? p.tags[0] : ["크림", "cream"];
  return (
    <div className={"sheet-overlay" + (open ? " open" : "")} onClick={onClose}>
      <div className="sheet fb-sheet" onClick={(e) => e.stopPropagation()}>
        <span className="sheet-handle" />
        <button className="fb-close" onClick={onClose} aria-label="닫기">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 5L19 19M19 5L5 19" stroke="#1C1B1F" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="fb-scroll">
          <h2 className="fb-title">제품이 어땠나요?</h2>
          <div className="fb-prodcard">
            <div className="fb-prod-thumb">
              <img src={p.img} alt="" draggable="false" />
            </div>
            <div className="fb-prod-info">
              <span className="fb-prod-brand">
                {p.brand || "제품"} <span className={"tag " + tag[1]}>{tag[0]}</span>
              </span>
              <span className="fb-prod-name">{p.prod || p.name}</span>
            </div>
          </div>
          <h3 className="fb-sec">사용기간</h3>
          <div className="fb-chips">
            {FB_PERIODS.map((t, i) => (
              <button key={t} className={"fb-chip" + (period === i ? " on" : "")} onClick={() => setPeriod(i)}>
                {t}
              </button>
            ))}
          </div>
          <h3 className="fb-sec">효과</h3>
          <div className="fb-chips">
            {FB_EFFECTS.map((t, i) => (
              <button key={t} className={"fb-chip" + (effect === i ? " on" : "")} onClick={() => setEffect(i)}>
                {t}
              </button>
            ))}
          </div>
          <div className="fb-textbox">
            <textarea
              className="fb-textarea"
              maxLength={300}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {!text && (
              <div className="fb-ta-empty">
                <span className="fb-memo-ic">
                  <svg width="43" height="46" viewBox="0 0 43 46" fill="none">
                    <rect x="6.20508" y="6.2085" width="24.8222" height="33.0962" rx="4.13703" fill="#FFEEEF" />
                    <line x1="11.3761" y1="13.4462" x2="25.8557" y2="13.4462" stroke="#FFC9CE" strokeWidth="2.06851" strokeLinecap="round" />
                    <line x1="11.378" y1="23.704" x2="21.3095" y2="23.704" stroke="#FFC9CE" strokeWidth="2.06851" strokeLinecap="round" />
                    <line x1="11.378" y1="18.704" x2="21.3095" y2="18.704" stroke="#FFC9CE" strokeWidth="2.06851" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="fb-ta-ph">만족한 부분에 대해서 작성해주세요</span>
              </div>
            )}
            <span className="fb-ta-count">{text.length}/300</span>
          </div>
        </div>
        {canSave && (
          <div className="fb-bottom">
            <button className="fb-save" onClick={() => onSave && onSave({ period, effect, text })}>
              저장
            </button>
            <span className="sheet-home" />
          </div>
        )}
      </div>
    </div>
  );
}

// 다른 화장품 선택 모달 — 내 화장대 상품 컴포넌트(뱃지 제외 + 체크박스) 그리드
const PICKER_PRODUCTS = CABINET_PRODUCTS.slice(0, 12);
function ProductPickerModal({ open, onClose, onPick, title = "어떤 제품에 남기시겠어요?", desc = "보유한 제품 중 피드백을 남길 제품을 선택해주세요" }) {
  const [sel, setSel] = useState(null);
  useEffect(() => {
    if (open) setSel(null);
  }, [open]);
  return (
    <div className={"sheet-overlay" + (open ? " open" : "")} onClick={onClose}>
      <div className="sheet fb-sheet" onClick={(e) => e.stopPropagation()}>
        <span className="sheet-handle" />
        <button className="fb-close" onClick={onClose} aria-label="닫기">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 5L19 19M19 5L5 19" stroke="#1C1B1F" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="fb-scroll">
          <h2 className="fb-title">{title}</h2>
          <p className="pick-desc">{desc}</p>
          <div className="cab-grid pick-grid">
            {PICKER_PRODUCTS.map((p, i) => {
              const on = sel === i;
              return (
                <button
                  className={"cab-card pick-card" + (on ? " on" : "")}
                  key={i}
                  onClick={() => {
                    setSel(i);
                    setTimeout(() => onPick(p), 180);
                  }}
                >
                  <div className={"cab-thumb" + (isAmpoule(p) ? " amp" : "")}>
                    <img src={p.img} alt="" draggable="false" />
                    <span className={"pick-card-check" + (on ? " on" : "")}>
                      {on && (
                        <svg width="12" height="9" viewBox="0 0 13 10" fill="none">
                          <path d="M1.5 5.2L4.8 8.4L11.2 1.6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  </div>
                  <div className="cab-brand">{p.brand}</div>
                  <div className="cab-name">{p.name}</div>
                  <div className="cab-tags">
                    {p.tags.map(([l, t]) => (
                      <span className={"tag " + t} key={t}>
                        {l}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// 편집 → 개봉일 입력 모달 (단일 제품, 하단 저장하기) — RegisterPage 디자인 재사용
function EditOpenDateModal({ open, product, onClose, onSave }) {
  const [row, setRow] = useState({ mode: null, expiry: "", openDate: "" });
  const [calField, setCalField] = useState(null); // "expiry" | "openDate" | null
  useEffect(() => {
    if (open) {
      setRow({ mode: null, expiry: "", openDate: "" });
      setCalField(null);
    }
  }, [open]);
  const p = product || {};
  const onMode = (key) =>
    setRow((r) => {
      if (r.mode === key) return { ...r, mode: null };
      return { ...r, mode: key, openDate: key === "unopened" ? "" : r.openDate };
    });
  const onDatePick = (d) => calField && setRow((r) => ({ ...r, [calField]: d }));
  return (
    <div className={"sheet-overlay" + (open ? " open" : "")} onClick={onClose}>
      <div className="sheet edit-sheet" onClick={(e) => e.stopPropagation()}>
        <span className="sheet-handle" />
        <div className="sheet-head edit-head">
          <button className="sheet-close" onClick={onClose} aria-label="닫기">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 5L19 19M19 5L5 19" stroke="#1C1B1F" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <span className="edit-open-title">개봉일 입력</span>
        </div>
        <div className="edit-body">
        {product && (
          <div className="reg-card">
            <div className="reg-top">
              <div className="reg-thumb">
                <img src={p.img} alt="" />
              </div>
              <div className="reg-info">
                <div className="reg-brandline">
                  <span className="reg-brand">{p.brand}</span>
                  <span className={"tag " + p.tags[0][1]}>{p.tags[0][0]}</span>
                </div>
                <div className="reg-name">{p.name}</div>
              </div>
            </div>
            <div className="reg-chips">
              {REG_MODES.map((s) => (
                <button
                  key={s.key}
                  className={"reg-chip" + (row.mode === s.key ? " on" : "")}
                  onClick={() => onMode(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {row.mode && (
              <div className="reg-dates">
                <RegDateBox label="유통기한" value={row.expiry} onClick={() => setCalField("expiry")} />
                {row.mode === "using" && (
                  <RegDateBox label="개봉일" value={row.openDate} onClick={() => setCalField("openDate")} />
                )}
              </div>
            )}
          </div>
        )}
        </div>
        <div className="sheet-bottom">
          <button className="save-btn" onClick={() => onSave && onSave(row)}>
            저장하기
          </button>
          <span className="sheet-home" />
        </div>
        <CalendarModal
          open={!!calField}
          value={calField ? row[calField] : ""}
          minDate={calField === "expiry" ? todayStr() : monthsAheadStr(-MAX_EXPIRY_MONTHS)}
          maxDate={calField === "expiry" ? monthsAheadStr(MAX_EXPIRY_MONTHS) : todayStr()}
          onClose={() => setCalField(null)}
          onSelect={onDatePick}
        />
      </div>
    </div>
  );
}
function ProductDetail({ product, onBack, onDelete, onCreateRoutine }) {
  const [tab, setTab] = useState("제품정보");
  const [segIdx, setSegIdx] = useState(0); // 0=첫 탭(포함된 루틴/추천 제품), 1=주요 성분
  const [liked, setLiked] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);
  const [betterOpen, setBetterOpen] = useState(true); // "이렇게 쓰면 더 좋아요" 토글
  const [editOpen, setEditOpen] = useState(false); // 개봉일 편집 모달
  const [delOpen, setDelOpen] = useState(false); // 삭제 확인 팝업
  const [delDone, setDelDone] = useState(false); // "삭제되었습니다" 토스트
  const [openIng, setOpenIng] = useState(-1); // 열린 성분 아코디언 index
  const [gaugeOn, setGaugeOn] = useState(false); // 슬라이더 애니메이션 트리거
  const gaugeRef = useRef(null);
  const routineScrollRef = useDragScroll();
  const p = product || CABINET_PRODUCTS[0];
  const imminent = badgeColor(p.badge) === "#FF5160";
  const cd = badgeCountdown(p.badge);
  const usage = usageSinceOpen(p); // 개봉일 기준 사용시간 / 미개봉
  const isColor = isColorProduct(p); // 색조: 루틴/평가 없음
  const routine = routineForProduct(p); // 포함된 루틴(있으면)
  const rep = aiReport(p); // 제품별 AI 리포트
  // 슬라이더: 최초 진입 1회만 왼→오 채워짐(두 그래프 동시). 재진입(탭/제품 변경) 시 리셋
  useEffect(() => {
    setGaugeOn(false); // 재진입 리셋
    const el = gaugeRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            setGaugeOn(true); // 한 번 채워지면 유지(false로 되돌리지 않음)
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [segIdx, tab, p]);
  const miniCard = (x, i, withBadge) => (
    <div className="cab-card" key={i}>
      <div className={"cab-thumb" + (isAmpoule(x) ? " amp" : "")}>
        <img src={x.img} alt="" draggable="false" />
        {withBadge && <ExpiryBadge label={x.badge} />}
      </div>
      <div className="cab-brand">{x.brand}</div>
      <div className="cab-name">{x.name}</div>
      <div className="cab-tags">
        {x.tags.map(([l, t]) => (
          <span className={"tag " + t} key={t}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
  const togetherSection = (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">같이 쓰면 좋아요</h2>
        <button className="see-all">
          더보기 <ChevronRight />
        </button>
      </div>
      <div className="cab-grid pd-mini-grid">{PD_TOGETHER.map((x, i) => miniCard(x, i, false))}</div>
    </section>
  );
  const imminentSection = (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">사용기한 임박 제품</h2>
        <button className="see-all">
          더보기 <ChevronRight />
        </button>
      </div>
      <div className="cab-grid pd-mini-grid">{PD_IMMINENT.map((x, i) => miniCard(x, i, true))}</div>
    </section>
  );
  const effectRow = (
    <button className="cab-pao pd-effect">
      <span className="cab-pao-ic">
        <img src="/img/ic_memo.png" alt="" />
      </span>
      <span className="cab-pao-txt">
        <b>해당제품이 효과적이였다면?</b>
        <em>히스토리에 제품 효과 작성하기</em>
      </span>
      <svg className="cab-pao-arrow" width="7" height="12" viewBox="0 0 7 12" fill="none">
        <path d="M1 1L6 6L1 11" stroke="#9599A1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
  // ---- 주요 성분 탭 콘텐츠 ----
  const ingredients = ingredientsFor(p);
  const comboThumbs = [p.img, PD_TOGETHER[2].img, PD_TOGETHER[0].img];
  const ingredientList = (
    <div className="pd-ingredients">
      {ingredients.map((ing, i) => {
        const open = openIng === i;
        return (
          <div className={"pd-ing-item" + (open ? " open" : "")} key={ing.name}>
            <button className="pd-ing-row" onClick={() => setOpenIng(open ? -1 : i)}>
              <span className={"pd-ing-no" + (i === 0 ? " main" : "")}>{i + 1}</span>
              <span className="pd-ing-name">{ing.name}</span>
              <svg className={"pd-ing-arrow" + (open ? " up" : "")} width="14" height="8" viewBox="0 0 14 8" fill="none">
                <path d="M1 1L7 7L13 1" stroke="#9599A1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {open && (
              <div className="pd-ing-body">
                <div className="pd-ing-tags">
                  {ing.tags.map((t) => (
                    <span className="ai-rtag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                <p className="pd-ing-desc">{ing.desc(p.name)}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
  const betterCard = (
    <div className="pd-ai pd-better">
      <div className={"ai-reason" + (betterOpen ? "" : " collapsed")}>
        <div className="ai-reason-head">
          <span className="ai-reason-title">
            <AiBadge /> 이렇게 쓰면 더 좋아요
          </span>
          <button className="ai-reason-chev" onClick={() => setBetterOpen((v) => !v)} aria-label="펼치기/접기">
            <ChevronDown className={betterOpen ? "up" : ""} />
          </button>
        </div>
        {betterOpen && (
          <>
            <div className="pd-better-thumbs">
              {comboThumbs.map((src, i) => (
                <Fragment key={i}>
                  {i === 1 && (
                    <span className="pd-better-plus">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1V13M1 7H13" stroke="#B0B4BA" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </span>
                  )}
                  <span className="pd-better-thumb">
                    <img src={src} alt="" draggable="false" />
                  </span>
                </Fragment>
              ))}
            </div>
            <p className="ai-reason-text">{betterTogetherFor(p)(p.name)}</p>
            <div className="ai-reason-date">2025.05.22</div>
          </>
        )}
      </div>
    </div>
  );
  const gauges = gaugesFor(p);
  const gaugeSection = (
    <div className="pd-gauges" ref={gaugeRef}>
      <RatingSlider label="날씨 적합정도" level={gauges.weather} color="#FF5160" active={gaugeOn} />
      <RatingSlider label="피부 영향정도" level={gauges.skin} color="#000000" active={gaugeOn} />
    </div>
  );
  const similarSection = (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">비슷한 제품이에요</h2>
        <button className="see-all">
          더보기 <ChevronRight />
        </button>
      </div>
      <div className="cab-grid pd-mini-grid">{WEATHER_PRODUCTS.slice(0, 3).map((x, i) => miniCard(x, i, false))}</div>
    </section>
  );
  const ingredientTab = (
    <>
      {ingredientList}
      {betterCard}
      {gaugeSection}
      {similarSection}
      {imminentSection}
    </>
  );
  return (
    <div className="pdetailpage">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="ap-header">
        <button className="ap-back" onClick={onBack} aria-label="뒤로">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1.5 9L9 17" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="ap-title">상세정보</h1>
      </div>
      <div className="pd-tabs">
        {["제품정보", "히스토리"].map((t) => (
          <button key={t} className={"pd-tab" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="pd-scroll">
        {tab === "히스토리" ? (
          <HistoryTab product={p} />
        ) : (
          <>
        {/* 대시보드 (임박=코랄 / 여유=그린) */}
        <div className={"pd-dash" + (imminent ? " red" : "")}>
          <div className="pd-dash-top">
            <span className="pd-regdate">등록일&nbsp;&nbsp;&nbsp;2026. 05.17</span>
            <span className="pd-actions">
              <button className="pd-edit-btn" onClick={() => setEditOpen(true)}>
                편집
              </button>
              <i>|</i>
              <button className="pd-edit-btn" onClick={() => setDelOpen(true)}>
                삭제
              </button>
            </span>
          </div>
          <FlipClock countdown={cd} monthLabel="Month" />
          <div className="pd-prodcard">
            <div className={"pd-prod-thumb" + (isAmpoule(p) ? " amp" : "")}>
              <img src={p.img} alt="" draggable="false" />
            </div>
            <div className="pd-prod-info">
              <div className="pd-prod-brandline">
                <span className="pd-prod-brand">{p.brand}</span>
                <span className={"tag " + p.tags[0][1]}>{p.tags[0][0]}</span>
              </div>
              <div className="pd-prod-name">{p.name}</div>
            </div>
            <span className={"pd-prod-pill" + (usage.opened ? "" : " unopened")}>{usage.text}</span>
          </div>
        </div>

        {/* 세그먼트 — 색조: 추천 제품 / 기초: 포함된 루틴 */}
        <div className="pd-seg">
          <button className={"pd-seg-item" + (segIdx === 0 ? " on" : "")} onClick={() => setSegIdx(0)}>
            {isColor ? "추천 제품" : "포함된 루틴"}
          </button>
          <button className={"pd-seg-item" + (segIdx === 1 ? " on" : "")} onClick={() => setSegIdx(1)}>
            주요 성분
          </button>
        </div>

        {segIdx === 1 ? (
          /* 주요 성분 탭 (색조/기초 공통) */
          ingredientTab
        ) : isColor ? (
          <>
            {/* 색조: 추천 제품 탭 → 같이 쓰면 좋아요 바로 밑 */}
            {togetherSection}
            {imminentSection}
            {/* 효과 작성 안내는 맨 밑 */}
            {effectRow}
          </>
        ) : (
          <>
            {/* 기초: 포함된 루틴 (루틴 있으면 메인 루틴 카드 재사용, 없으면 빈 상태 245-43890) */}
            {routine ? (
                <div className="pd-routine-scroll" ref={routineScrollRef}>
                  {ROUTINE_CARDS.map((c, i) => (
                    <div className="routine-card" key={i}>
                      <div className="routine-card-head">
                        <span className="routine-num">{i + 1}</span>
                        <span className="routine-step-title">{c.title}</span>
                        <ChevronRightSmall />
                        <img className="routine-sun" src="/ic_wb_sunny.svg" alt="" />
                      </div>
                      <div className="routine-body">
                        <div className="routine-thumb">
                          <img src={c.img} alt="" />
                        </div>
                        <ol className="routine-steps">
                          {c.steps.map((runs, j) => (
                            <li key={j}>
                              {runs.map(([text, em], k) => (
                                <span key={k} className={em ? undefined : "rt-dim"}>
                                  {text}
                                </span>
                              ))}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pd-noroutine">
                  <p className="pd-noroutine-txt">
                    건강한 피부를 위한
                    <br />
                    주빈님만의 루틴 시작해보세요!
                  </p>
                  <button className="pd-noroutine-btn" onClick={() => onCreateRoutine && onCreateRoutine(p)}>
                    AI 추천 루틴 생성
                  </button>
                </div>
              )}

            {/* AI 평가 — 제품별 리포트 (루틴 AI 브리핑 에셋) */}
            <div className="pd-ai">
              <div className={"ai-reason" + (aiOpen ? "" : " collapsed")}>
                <div className="ai-reason-head">
                  <span className="ai-reason-title">
                    <AiBadge /> 해당 제품에 대한 평가 ({rep.score} / 10)
                  </span>
                  <button className="ai-reason-chev" onClick={() => setAiOpen((v) => !v)} aria-label="평가 펼치기/접기">
                    <ChevronDown className={aiOpen ? "up" : ""} />
                  </button>
                </div>
                {aiOpen && (
                  <>
                    <div className="ai-reason-tags">
                      {rep.chips.map((c) => (
                        <span className="ai-rtag" key={c}>
                          {c}
                        </span>
                      ))}
                    </div>
                    <p className="ai-reason-text">{rep.text(p.name)}</p>
                    <div className="ai-reason-date">2025.05.22</div>
                  </>
                )}
              </div>
            </div>

            {effectRow}
            {togetherSection}
            {imminentSection}
          </>
        )}
          </>
        )}
      </div>

      {/* 하단 바 (Figma 685-17049) */}
      <div className="pd-bottombar">
        <div className="pd-actionpill">
          <button className="pd-heart" onClick={() => setLiked((v) => !v)} aria-label="찜">
            {/* 공유 버튼과 동일한 스트록 두께(1.7)로 통일 */}
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 20.3C12 20.3 3.2 14.6 3.2 8.5C3.2 5.6 5.4 3.4 8.1 3.4C9.9 3.4 11.4 4.4 12 5.8C12.6 4.4 14.1 3.4 15.9 3.4C18.6 3.4 20.8 5.6 20.8 8.5C20.8 14.6 12 20.3 12 20.3Z"
                fill={liked ? "#FF5160" : "none"}
                stroke={liked ? "#FF5160" : "#424242"}
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className="pd-pill-div" />
          <button className="pd-share" aria-label="공유">
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 15.5V3.5M12 3.5L8 7.5M12 3.5L16 7.5"
                stroke="#424242"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.5 11H5.5C4.4 11 3.5 11.9 3.5 13V18.5C3.5 19.6 4.4 20.5 5.5 20.5H18.5C19.6 20.5 20.5 19.6 20.5 18.5V13C20.5 11.9 19.6 11 18.5 11H17.5"
                stroke="#424242"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <button className="pd-delete" onClick={() => setDelOpen(true)}>
          삭제하기
        </button>
      </div>
      {/* 홈 인디케이터 (Figma 685-17049에 포함) */}
      <div className="home-indicator" />

      <EditOpenDateModal
        open={editOpen}
        product={p}
        onClose={() => setEditOpen(false)}
        onSave={() => setEditOpen(false)}
      />

      {/* 삭제 확인 팝업 */}
      {delOpen && (
        <div className="pd-confirm-overlay" onClick={() => setDelOpen(false)}>
          <div className="pd-confirm" onClick={(e) => e.stopPropagation()}>
            <p className="pd-confirm-title">
              해당 제품을
              <br />
              삭제하시겠습니까?
            </p>
            <div className="pd-confirm-btns">
              <button className="pd-confirm-cancel" onClick={() => setDelOpen(false)}>
                취소
              </button>
              <button
                className="pd-confirm-ok"
                onClick={() => {
                  setDelOpen(false);
                  setDelDone(true);
                  setTimeout(() => onDelete && onDelete(), 1100);
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
      {delDone && (
        <div className="pd-toast-overlay">
          <div className="pd-toast">삭제되었습니다</div>
        </div>
      )}
    </div>
  );
}

/* ---------------- App ---------------- */
// 세션 저장 키. sessionStorage 는 새로고침엔 유지되고 탭(앱)을 껐다 켜면 비워진다.
const CK_KEY = "ck_state_v1";
function loadSavedState() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has("onboarding")) {
      // 명시적으로 "온보딩으로 돌려줘" → 저장 상태 초기화 + URL 파라미터 제거
      sessionStorage.removeItem(CK_KEY);
      window.history.replaceState(null, "", window.location.pathname);
      return null;
    }
    const raw = sessionStorage.getItem(CK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ===== 오늘 사용 추천 (Figma 236-32722) ===== */
// Figma 320-8286 세로 막대 (fill/track = 38·60·71·71·19 / 81)
const WEATHER_FACTORS = [
  { name: "미세먼지", level: "보통", h: 0.47 },
  { name: "자외선", level: "높음", h: 0.74 },
  { name: "장벽손상", level: "높음", h: 0.877 },
  { name: "수분손실", level: "높음", h: 0.877 },
  { name: "유분정도", level: "낮음", h: 0.235 },
];
// 재사용 제품 (이미지 = Figma 원본 뜯어온 제품컷 /img/skin)
const _P = {
  illiyoon: { brand: "일리윤", name: "히알루론 모이스처 수분크림", tags: [["크림", "cream"]], img: "/img/skin/met_illiyoon.png", badge: "3개월" },
  torriden: { brand: "토리든", name: "저분자 히알루론산 앰플", tags: [["앰플", "ampoule"]], img: "/img/skin/top_torriden.png", badge: "2개월" },
  roundlab: { brand: "라운드랩", name: "자작나무 수분 토너", tags: [["토너", "toner"]], img: "/img/skin/refill_roundlab.png", badge: "8개월" },
  gongskin: { brand: "공스킨", name: "EGF 앰플", tags: [["앰플", "ampoule"], ["기능성", "func"]], img: "/img/skin/met_gongskin.png", badge: "1개월" },
  purito: { brand: "퓨리토 서울", name: "모이스처 펜타놀 크림", tags: [["크림", "cream"]], img: "/img/prod_purito.png", badge: "2주" },
  esnature: { brand: "에스네이처", name: "아쿠아 스쿠알란 수분크림", tags: [["크림", "cream"], ["기능성", "func"]], img: "/img/skin/refill_esnature.png", badge: "3개월" },
  estra: { brand: "에스트라", name: "아토베리아 365 하이드로 수딩크림", tags: [["크림", "cream"]], img: "/img/skin/refill_estra.png", badge: "9일" },
};
// 최근 내 피부 컨디션 토글 (Figma 363-8844) — 6개 영역, 점수 기반 서로 다른 내용
const SKIN_TOGGLES = [
  {
    key: "수분",
    score: 43,
    peer: 66,
    emoji: "💧",
    avatar: "drop",
    title: "피부가 건조하고 갈라져요",
    body: (
      <>
        최근 피부 당김, 건조함, 각질 등의 징후가 확인되었어요. 피부 속 <u>수분이 부족해 장벽 기능이 약해</u>지고 있을 가능성이
        있습니다.
      </>
    ),
    manage: (
      <>
        <u>보습 에센스</u>와 <u>크림</u>을 충분히 사용하고 수분 손실을 막아주는 <u>장벽 케어</u>를 병행해보세요
      </>
    ),
    products: [_P.illiyoon, _P.torriden],
  },
  {
    key: "유분",
    score: 50,
    peer: 55,
    emoji: "🧴",
    title: "유수분 밸런스는 무난한 편이에요",
    body: (
      <>
        유분 분비는 보통 수준이지만 <u>부분적으로 번들거림</u>이 나타날 수 있어요. 계절과 컨디션에 따라 <u>T존 유분</u>이 늘 수
        있습니다.
      </>
    ),
    manage: (
      <>
        <u>가벼운 젤 타입 보습</u>으로 유분을 조절하고, 주 1~2회 <u>클레이 마스크</u>로 관리해보세요
      </>
    ),
    products: [_P.roundlab, _P.gongskin],
  },
  {
    key: "모공",
    score: 50,
    peer: 58,
    emoji: "🔍",
    title: "모공이 조금씩 넓어지고 있어요",
    body: (
      <>
        피지와 각질이 쌓이면 <u>모공이 늘어나 보일</u> 수 있어요. 탄력이 떨어지면 <u>모공 처짐</u>으로 이어질 수 있습니다.
      </>
    ),
    manage: (
      <>
        <u>BHA 성분</u>으로 모공 속 노폐물을 정돈하고, <u>나이아신아마이드</u>로 탄력을 채워보세요
      </>
    ),
    products: [_P.torriden, _P.roundlab],
  },
  {
    key: "각질",
    score: 70,
    peer: 62,
    emoji: "🧼",
    title: "각질 관리가 잘 되고 있어요",
    body: (
      <>
        각질층이 <u>매끈하게 정돈</u>된 상태예요. 다만 과도한 각질 제거는 오히려 <u>장벽을 약화</u>시킬 수 있으니 주의하세요.
      </>
    ),
    manage: (
      <>
        현재 루틴을 유지하되, <u>주 1회 이하</u>의 부드러운 <u>각질 케어</u>면 충분해요
      </>
    ),
    products: [_P.illiyoon, _P.purito],
  },
  {
    key: "주름",
    score: 50,
    peer: 57,
    emoji: "👵",
    title: "잔주름이 생기기 시작했어요",
    body: (
      <>
        표정 라인과 눈가에 <u>미세한 잔주름</u>이 관찰돼요. 수분과 탄력이 부족하면 <u>주름이 깊어질</u> 수 있습니다.
      </>
    ),
    manage: (
      <>
        <u>펩타이드·레티놀</u> 성분으로 탄력을 채우고, <u>아이크림</u>으로 눈가를 집중 케어해보세요
      </>
    ),
    products: [_P.gongskin, _P.torriden],
  },
  {
    key: "피지",
    score: 43,
    peer: 61,
    emoji: "✨",
    title: "피지·유분 밸런스가 불안정해요",
    body: (
      <>
        수분이 부족하면 이를 보완하려 <u>피지 분비가 늘어</u>날 수 있어요. 겉은 번들거리고 속은 당기는 <u>수분부족지성</u> 상태일
        가능성이 있습니다.
      </>
    ),
    manage: (
      <>
        <u>산뜻한 수분 토너</u>로 유수분 밸런스를 잡고, 피지 케어 성분이 든 <u>가벼운 앰플</u>을 더해보세요
      </>
    ),
    products: [_P.roundlab, _P.torriden],
  },
];
const WEATHER_ROUTINE_ADD = [
  { name: "부족한 수분을 채워줄 수 있어요", badge: "2주", img: "/img/prod_purito.png" },
  { name: "흔적 개선에 도움이 돼요", badge: "2주", img: "/img/prod_dropper.png" },
  { name: "장벽 케어에 좋아요", badge: "1개월", img: "/img/prod_illiyoon.png" },
];
// 물방울 아이콘 (VS 카드 아바타)
function DropGlyph({ w, h, fill }) {
  return (
    <svg width={w} height={h} viewBox="0 0 24 28" fill="none">
      <path d="M12 2C12 2 4 11 4 17.5C4 21.6 7.6 25 12 25C16.4 25 20 21.6 20 17.5C20 11 12 2 12 2Z" fill={fill} />
    </svg>
  );
}
// 나 vs 또래 비교 카드 (Figma 363-10024) — 아바타 + 점수바 + VS, 열릴 때 바가 채워짐
function VsCard({ me, peer, emoji, avatar, active }) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    if (!active) {
      setGo(false);
      return;
    }
    const t = setTimeout(() => setGo(true), 40);
    return () => clearTimeout(t);
  }, [active]);
  // 원 크기는 점수에 비례 (높은 점수 = 큰 원)
  const avaSize = (s) => Math.round(42 + Math.max(0, Math.min(100, s)) / 100 * 26); // 42~68
  const meSize = avaSize(me);
  const peerSize = avaSize(peer);
  const dropH = (sz) => Math.round(sz * 0.47);
  const meAva =
    avatar === "drop" ? (
      <span className="vs-ava me" style={{ width: meSize, height: meSize }}>
        <DropGlyph w={dropH(meSize) * 0.77} h={dropH(meSize)} fill="#fff" />
      </span>
    ) : (
      <span className="vs-ava me emoji" style={{ width: meSize, height: meSize }}>
        {emoji}
      </span>
    );
  const peerAva =
    avatar === "drop" ? (
      <span className="vs-ava peer" style={{ width: peerSize, height: peerSize }}>
        <span className="vs-drop-back">
          <DropGlyph w={dropH(peerSize) * 0.72} h={dropH(peerSize) * 0.9} fill="#D9EEFF" />
        </span>
        <span className="vs-drop-front">
          <DropGlyph w={dropH(peerSize) * 0.77} h={dropH(peerSize)} fill="#fff" />
        </span>
      </span>
    ) : (
      <span className="vs-ava peer emoji" style={{ width: peerSize, height: peerSize }}>
        {emoji}
      </span>
    );
  return (
    <div className="vs-card">
      <div className="vs-legend">
        <span className="vs-lg">
          <i style={{ background: "#FF5160" }} /> 나
        </span>
        <span className="vs-lg">
          <i style={{ background: "#000" }} /> 또래
        </span>
      </div>
      <div className="vs-body">
        <div className="vs-col">
          {meAva}
          <div className="vs-bar">
            <div className="vs-bar-fill me" style={{ width: (go ? me : 0) + "%" }}>
              <span className="vs-bar-val">{me}점</span>
            </div>
          </div>
        </div>
        <span className="vs-mid">VS</span>
        <div className="vs-col">
          {peerAva}
          <div className="vs-bar">
            <div className="vs-bar-fill peer" style={{ width: (go ? peer : 0) + "%" }}>
              <span className="vs-bar-val">{peer}점</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// 최근 내 피부 컨디션 토글 (Figma 363-8844)
function SkinToggle({ item, open, onToggle, active, onProductClick }) {
  return (
    <div className={"st-toggle" + (open ? " open" : "")}>
      <button className="st-head" onClick={onToggle}>
        <span className="st-ic">{item.emoji}</span>
        <span className="st-label">
          {item.key} {item.score}점
        </span>
        <ChevronDown className={open ? "up" : ""} />
      </button>
      {open && (
        <div className="st-body">
          <div className="st-divider st-divider-top" />
          <div className="st-desc">
            <h3 className="st-desc-title">{item.title}</h3>
            <p className="st-desc-p">{item.body}</p>
          </div>
          <VsCard me={item.score} peer={item.peer} emoji={item.emoji} avatar={item.avatar} active={active} />
          <div className="st-divider st-divider-mid" />
          <div className="st-manage">
            <h4 className="st-manage-title">이렇게 관리해보세요</h4>
            <p className="st-desc-p">{item.manage}</p>
          </div>
          <div className="st-prods">
            {item.products.map((pr, j) => (
              <div className="st-prod" key={j}>
                <div className={"st-prod-thumb" + (isAmpoule(pr) ? " amp" : "")}>
                  <img src={pr.img} alt="" draggable="false" />
                </div>
                <div className="st-prod-info">
                  <span className="st-prod-brand">
                    {pr.brand} <span className={"tag " + pr.tags[0][1]}>{pr.tags[0][0]}</span>
                  </span>
                  <span className="st-prod-name">{pr.name}</span>
                </div>
                <button className="st-prod-btn" onClick={() => onProductClick && onProductClick(pr)}>
                  해당 제품 보기
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
function WeatherPage({ onBack, onNav, onProductClick }) {
  const [openKeys, setOpenKeys] = useState({}); // 기본값: 모든 토글 닫힘
  const [aiOpen, setAiOpen] = useState(true);
  const [radarOn, setRadarOn] = useState(false);
  const [cmpOn, setCmpOn] = useState(false);
  const radarRef = useRef(null);
  const cmpRef = useRef(null);
  // 점수 50점 미만(주의요소)만 리스트로 노출 (나머지는 SKIN_TOGGLES에 컴포넌트로 보존)
  const shownToggles = SKIN_TOGGLES.filter((item) => item.score < 50);
  useEffect(() => {
    const obs = (ref, set) => {
      const el = ref.current;
      if (!el) return null;
      const io = new IntersectionObserver(
        (es) => es.forEach((e) => e.isIntersecting && (set(true), io.disconnect())),
        { threshold: 0.5 }
      );
      io.observe(el);
      return io;
    };
    const a = obs(radarRef, setRadarOn);
    const b = obs(cmpRef, setCmpOn);
    return () => {
      a && a.disconnect();
      b && b.disconnect();
    };
  }, []);
  return (
    <div className="cabinetpage weatherpage">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="ap-header wp-header">
        <button className="ap-back" onClick={onBack} aria-label="뒤로">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1.5 9L9 17" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="ap-title">오늘 사용 추천</h1>
      </div>
      <div className="cabinet-scroll">
        {/* 날씨 배너 */}
        <div className="wp-pad">
          <div className="weather-card wp-banner">
            <img className="weather-mountain" src="/img/mountain.svg" alt="" />
            <span className="wsun wsun-1" />
            <span className="wsun wsun-2" />
            <span className="wsun wsun-3" />
            <div className="weather-temp">29℃</div>
            <div className="weather-sub">어제보다 기온 3℃ 높음</div>
            <span className="weather-divider" />
            <div className="weather-right">
              <div className="wr-block">
                <span className="wr-key">주의점</span>
                <span className="wr-val">수분 손실 / 장벽 손상</span>
              </div>
              <div className="wr-block">
                <span className="wr-key">추천템</span>
                <span className="wr-val">히알루론산 / 판테놀 성분</span>
              </div>
            </div>
          </div>

          {/* AI 오늘 날씨 주의요소 */}
          <div className="pd-ai wp-ai">
            <div className={"ai-reason" + (aiOpen ? "" : " collapsed")}>
              <div className="ai-reason-head">
                <span className="ai-reason-title">
                  <AiBadge /> 오늘 날씨 주의요소
                </span>
                <button className="ai-reason-chev" onClick={() => setAiOpen((v) => !v)} aria-label="펼치기/접기">
                  <ChevronDown className={aiOpen ? "up" : ""} />
                </button>
              </div>
              {aiOpen && (
                <>
                  <div className="wp-gauges">
                    {WEATHER_FACTORS.map((f) => (
                      <div className="wp-gauge" key={f.name}>
                        <span className={"wp-gauge-lv" + (f.level === "높음" ? " hi" : "")}>{f.level}</span>
                        <div className="wp-gauge-bar">
                          <div
                            className={"wp-gauge-fill" + (f.level === "높음" ? " hi" : "")}
                            style={{ height: f.h * 100 + "%" }}
                          />
                        </div>
                        <span className="wp-gauge-name">{f.name}</span>
                      </div>
                    ))}
                  </div>
                  <p className="ai-reason-text">
                    오늘 최고기온은 32도로 <u>강한 자외선과 건조함</u>이 예상됩니다. 따라서 수분부족형인 주빈님은 수분이 손실되지
                    않도록 <u>수분 크림</u>과 피부온도를 낮추는 <u>쿨링팩</u>을 추천해드릴게요! 외출을 준비 중이시라면{" "}
                    <u>자외선차단제</u>도 잊지마세요. 😎
                  </p>
                  <div className="ai-reason-date">2025.05.22</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 날씨기반 추천 제품 */}
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">날씨기반 추천 제품</h2>
            <button className="see-all">
              전체보기 <ChevronRight />
            </button>
          </div>
          <div className="cab-grid pd-mini-grid">
            {WEATHER_PRODUCTS.slice(0, 3).map((x, i) => (
              <div className="cab-card" key={i}>
                <div className={"cab-thumb" + (isAmpoule(x) ? " amp" : "")}>
                  <img src={x.img} alt="" draggable="false" />
                </div>
                <div className="cab-brand">{x.brand}</div>
                <div className="cab-name">{x.name}</div>
                <div className="cab-tags">
                  {x.tags.map(([l, t]) => (
                    <span className={"tag " + t} key={t}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 섹션 구분 밴드 (Figma 236-32722: 393×12 #f4f4f4) */}
        <div className="wp-divider" />

        {/* 최근 내 피부 컨디션 */}
        <section className="wp-section">
          <div className="section-head">
            <h2 className="section-title">최근 내 피부 컨디션</h2>
            <button className="see-all">
              문진하기 <ChevronRight />
            </button>
          </div>
          <InfoBar>간단한 피부 컨디션 체크를 통해 피부점수를 산출했어요</InfoBar>
          <div className="skin-radar-wrap" ref={radarRef}>
            <SkinRadar data={RADAR_DATA} prev={RADAR_PREV} active={radarOn} />
            {RADAR_DATA.map((d, i) => {
              const st = radarLabelStyle(d.score);
              return (
                <span key={d.label} className={"radar-label pos" + i}>
                  {st.pill ? (
                    <span className="radar-pill" style={{ background: st.background, color: st.color }}>
                      {d.label} {d.score}점
                    </span>
                  ) : (
                    <span className="radar-plain">
                      {d.label} {d.score}점
                    </span>
                  )}
                </span>
              );
            })}
          </div>
          {/* 영역별 토글 — 점수 50점 이하(주의요소)만 노출 */}
          <div className="st-list">
            {shownToggles.map((item) => {
              const open = !!openKeys[item.key];
              return (
                <SkinToggle
                  key={item.key}
                  item={item}
                  open={open}
                  active={open}
                  onToggle={() => setOpenKeys((o) => ({ ...o, [item.key]: !o[item.key] }))}
                  onProductClick={onProductClick}
                />
              );
            })}
          </div>
        </section>

        {/* 평균 또래보다 수분감이 낮아요 */}
        <section className="wp-section">
          <div className="section-head">
            <h2 className="section-title" style={{ whiteSpace: "pre-line" }}>{"평균 또래보다 수분감이\n23점 낮아요"}</h2>
            <button className="see-all">
              상세보기 <ChevronRight />
            </button>
          </div>
          <div ref={cmpRef}>
            <VsCard me={43} peer={66} emoji="💧" avatar="drop" active={cmpOn} />
          </div>
        </section>

        {/* 오늘 루틴에 추가해보세요 */}
        <FirstUse title="오늘 루틴에 추가해보세요" seeAll="자세히 보기" products={WEATHER_ROUTINE_ADD} btnLabel="내 루틴 추가하기" />
      </div>
      <BottomNav active="center" onNav={onNav} />
    </div>
  );
}

/* ===== 내 피부 컨디션 (Figma 236-33540) + 문진 (236-33633) ===== */
const SC_RECORDS = [
  { date: "2026.04.15", color: "#ff5160", summary: "수분부족지성 · 건조함 · 민감도 상승" },
  { date: "2024.03.12", color: "#ff5160", summary: "복합성 · T존 유분 · 모공 확장" },
  { date: "2024.01.03", color: "#1dbf7e", summary: "정상 · 수분 충분 · 장벽 안정" },
];
function NoteIcon({ color }) {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
      <rect x="2" y="2" width="16" height="18" rx="3" fill={color} />
      <line x1="6" y1="8" x2="14" y2="8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="6" y1="11.5" x2="14" y2="11.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="6" y1="15" x2="10.5" y2="15" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function SkinConditionPage({ onBack, onStart, onRegister }) {
  const [openRec, setOpenRec] = useState(-1);
  return (
    <div className="cabinetpage skincondpage">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="ap-header">
        <button className="ap-back" onClick={onBack} aria-label="뒤로">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1.5 9L9 17" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="ap-title">내 피부 컨디션</h1>
      </div>
      <div className="cabinet-scroll sc-scroll">
        <div className="sc-pad">
          <h2 className="sc-hero">
            <span className="sc-hero-hl">2분</span>내에 간단한 문진으로
            <br />
            지금 필요한 내 화장품 찾기
          </h2>
          <InfoBar>주관적 문진에 의한 변화로 실제 변화와 상이할 수 있습니다</InfoBar>
          <div className="sc-promo">
            <div className="sc-promo-phone">
              <img src="/img/munjin/mockup.png" alt="" draggable="false" />
            </div>
          </div>
          <h3 className="sc-q-title">내 피부를 알아보는 5가지 질문</h3>
          <p className="sc-q-sub">날씨, 사용자 데이터에 따라 질문이 달라져요</p>
        </div>
        <div className="rt-divider" />
        <div className="sc-pad">
          <h3 className="sc-rec-title">문진기록</h3>
          <div className="sc-rec-list">
            {SC_RECORDS.map((r, i) => {
              const open = openRec === i;
              return (
                <div className={"sc-rec" + (open ? " open" : "")} key={i}>
                  <button className="sc-rec-head" onClick={() => setOpenRec(open ? -1 : i)}>
                    <span className="sc-rec-ic">
                      <NoteIcon color={r.color} />
                    </span>
                    <span className="sc-rec-date">{r.date}</span>
                    <ChevronDown className={open ? "up" : ""} />
                  </button>
                  {open && <div className="sc-rec-body">{r.summary}</div>}
                </div>
              );
            })}
          </div>
          <button className="sc-register" onClick={onRegister}>
            새 화장품 등록하기
          </button>
        </div>
      </div>
      <div className="sc-cta-bar">
        <button className="sc-cta" onClick={onStart}>
          문진하러 가기
        </button>
        <span className="sheet-home" />
      </div>
    </div>
  );
}

// 원본(236-33685 등): 각 선택지 일러스트는 크기가 제각각 → 원본 픽셀 크기 그대로 표시
const MUNJIN_QUESTIONS = [
  {
    q: "세안을 한 후 나의 피부는?",
    sub: "세안 후 기초제품을 바르기 전 상태를 체크해주세요",
    opts: [
      { img: "/img/munjin/33733.png", txt: "피부가 팽팽하게 땡겨져요", w: 88, h: 88 },
      { img: "/img/munjin/33727.png", txt: "따갑고 붉어져요", w: 46, h: 72 },
      { img: "/img/munjin/33729.png", txt: "번들번들 기름이 올라와요", w: 55, h: 54 },
      { img: "/img/munjin/33728.png", txt: "보송하고 매끈해져요", w: 55, h: 55 },
    ],
  },
  {
    q: "현재 트러블의 상태는?",
    sub: "기미, 주름 이외에 여드름이나 색소침착에 대해 체크해주세요",
    opts: [
      { img: "/img/munjin/33784.png", txt: "깨끗해요", w: 82, h: 82 },
      { img: "/img/munjin/33786.png", txt: "약간 있어요", w: 86, h: 86 },
      { img: "/img/munjin/33785.png", txt: "최근에 트러블이 많아요", w: 74, h: 74 },
      { img: "/img/munjin/33783.png", txt: "거의 매일 트러블이 나요", w: 76, h: 76 },
    ],
  },
  {
    q: "최근 가장 고민인 피부 부위는?",
    sub: "최근 피부 증상이나 고민이였던 부분을 체크해주세요",
    opts: [
      { img: "/img/munjin/33840.png", txt: "피부 주름", w: 60, h: 60 },
      { img: "/img/munjin/33837.png", txt: "좁쌀 여드름", w: 86, h: 86 },
      { img: "/img/munjin/33838.png", txt: "화농성 여드름", w: 74, h: 74 },
      { img: "/img/munjin/33839.png", txt: "블랙헤드 및 화이트헤드", w: 76, h: 76 },
      { img: "/img/munjin/33841.png", txt: "없음", w: 65, h: 72 },
    ],
  },
  {
    q: "평소 화장 유지력은?",
    sub: "화장 후 시간이 지났을 때 변화를 체크해주세요",
    opts: [
      { img: "/img/munjin/33885.png", txt: "보송한 상태 유지", w: 55, h: 55 },
      { img: "/img/munjin/33893.png", txt: "자주 수정해야 해요", w: 62, h: 62 },
      { img: "/img/munjin/33886.png", txt: "번들번들 해져요", w: 55, h: 54 },
      { img: "/img/munjin/33891.png", txt: "화장이 잘 밀려요", w: 58, h: 58 },
    ],
  },
  {
    q: "피부 자극 정도는?",
    sub: "평소 피부가 예민하고 자극에 반응하는 정도를 체크해주세요",
    opts: [
      { img: "/img/munjin/33942.png", txt: "별 변화 없어요", w: 82, h: 82 },
      { img: "/img/munjin/33945.png", txt: "환절기 때 예민해져요", w: 68, h: 68 },
      { img: "/img/munjin/33944.png", txt: "자주 예민해져요", w: 46, h: 72 },
      { img: "/img/munjin/33943.png", txt: "매우 예민해요", w: 76, h: 76 },
    ],
  },
];
function MunjinPage({ onBack, onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const q = MUNJIN_QUESTIONS[step - 1];
  const sel = answers[step];
  const last = step === MUNJIN_QUESTIONS.length;
  const next = () => {
    if (sel == null) return;
    if (!last) setStep(step + 1);
    else (onComplete || onClose)(answers);
  };
  return (
    <div className="cabinetpage munjinpage">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="ap-header munjin-header">
        <button className="ap-back" onClick={() => (step > 1 ? setStep(step - 1) : onBack())} aria-label="뒤로">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1.5 9L9 17" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="ap-title">내 피부 컨디션</h1>
        <button className="munjin-x" onClick={onClose} aria-label="닫기">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M5 5L19 19M19 5L5 19" stroke="#1C1B1F" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="munjin-scroll">
        {/* 프로세스 바 (원본 700-16306): STEP 활성=코랄 알약, 나머지=회색 원, 중앙 정렬 */}
        <div className="munjin-steps">
          {MUNJIN_QUESTIONS.map((_, i) => {
            const n = i + 1;
            return n === step ? (
              <span className="munjin-step on" key={n}>
                STEP {n}
              </span>
            ) : (
              <span className="munjin-step" key={n}>
                {n}
              </span>
            );
          })}
        </div>
        <h2 className="munjin-q">{q.q}</h2>
        <p className="munjin-sub">{q.sub}</p>
        <div className="munjin-opts">
          {q.opts.map((o, i) => (
            <button
              key={i}
              className={"munjin-opt" + (sel === i ? " on" : "")}
              onClick={() => setAnswers((a) => ({ ...a, [step]: i }))}
            >
              <span className="munjin-emoji">
                <img src={o.img} alt="" draggable="false" style={{ width: o.w, height: o.h }} />
              </span>
              <span className="munjin-opt-txt">{o.txt}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="munjin-bottom">
        <button
          className={"munjin-next" + (sel != null ? " on" : "") + (last ? " final" : "")}
          disabled={sel == null}
          onClick={next}
        >
          {last ? "완료" : "다음"}
        </button>
        <span className="sheet-home" />
      </div>
    </div>
  );
}

// 문진 완료 → "피부 컨디션 분석중" 로딩 (등록 로딩화면 재사용, 육각 그래프는 고정·값만 변화)
function SkinAnalyzing({ onDone }) {
  const [vals, setVals] = useState(() => RADAR_DATA.map((d) => ({ ...d, score: 45 })));
  useEffect(() => {
    const swap = setInterval(
      () => setVals(RADAR_DATA.map((d) => ({ ...d, score: 28 + Math.floor(Math.random() * 58) }))),
      330 /* 값 변하는 속도 살짝 느리게 */
    );
    const done = setTimeout(onDone, 3200);
    return () => {
      clearInterval(swap);
      clearTimeout(done);
    };
  }, []);
  return (
    <div className="flowpage">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="flow-bar">
        <div className="flow-bar-fill loading" />
      </div>
      <div className="skin-analyzing-graph">
        <SkinRadar data={vals} active />
      </div>
      <div className="flow-text">
        피부 컨디션을
        <br />
        분석중이에요
      </div>
    </div>
  );
}

// ── 피부 컨디션 결과 페이지 (Figma 236-33949) ──
const SKIN_REC_TOP = [
  { brand: "일리윤", name: "히알루론 모이스처 수분크림", tags: [["크림", "cream"]], img: "/img/skin/top_illiyoon.png", badge: "3개월" },
  { brand: "토리든", name: "저분자 히알루론산 앰플", tags: [["앰플", "ampoule"]], img: "/img/skin/top_torriden.png", badge: "2개월" },
];
// 그래프 상세정보 토글 — 오늘 사용 추천(SkinToggle) 스타일 그대로, 결과페이지 순서(수분·피지·모공·주름·유분·각질)
const SKIN_METRICS = [
  {
    key: "수분",
    emoji: "💧",
    score: 43,
    peer: 66,
    avatar: "drop",
    title: "피부가 건조하고 갈라져요",
    body: (
      <>
        최근 피부 당김, 건조함, 각질 등의 징후가 확인되었어요. 피부 속 <u>수분이 부족</u>해 장벽 기능이 <u>약해</u>지고 있을 가능성이 있습니다.
      </>
    ),
    manage: (
      <>
        <u>보습 에센스</u>와 크림을 충분히 사용하고 수분 손실을 막아주는 <u>장벽 케어</u>를 병행해보세요
      </>
    ),
    products: [_P.illiyoon, _P.gongskin],
  },
  {
    key: "피지",
    emoji: "✨",
    score: 43,
    peer: 61,
    title: "피지 분비가 불안정해요",
    body: (
      <>
        T존 위주로 <u>피지 분비가 늘고</u> 있어요. 세안 후에도 번들거림이 반복된다면 수분·유분 균형이 무너졌을 수 있습니다.
      </>
    ),
    manage: (
      <>
        <u>가벼운 수분 토너</u>로 유수분 밸런스를 잡고 <u>피지 케어 세럼</u>을 소량 사용해보세요
      </>
    ),
    products: [_P.torriden, _P.roundlab],
  },
  {
    key: "모공",
    emoji: "🔍",
    score: 50,
    peer: 58,
    title: "모공이 조금씩 눈에 띄어요",
    body: (
      <>
        볼과 코 주변으로 <u>모공이 넓어</u> 보이는 편이에요. 각질과 피지가 쌓이면 모공이 더 도드라질 수 있습니다.
      </>
    ),
    manage: (
      <>
        주 1~2회 <u>약산성 필링</u>으로 각질을 정리하고 <u>모공 수렴 토너</u>를 사용해보세요
      </>
    ),
    products: [_P.esnature, _P.roundlab],
  },
  {
    key: "주름",
    emoji: "👵",
    score: 50,
    peer: 57,
    title: "잔주름이 생기기 시작했어요",
    body: (
      <>
        눈가·입가에 <u>미세한 잔주름</u>이 보여요. 건조함이 지속되면 표정 주름이 더 깊어질 수 있습니다.
      </>
    ),
    manage: (
      <>
        <u>탄력 앰플</u>과 <u>보습 크림</u>을 함께 사용하고 자외선 차단을 꾸준히 병행해보세요
      </>
    ),
    products: [_P.illiyoon, _P.estra],
  },
  {
    key: "유분",
    emoji: "🧴",
    score: 50,
    peer: 55,
    title: "유수분 밸런스는 보통이에요",
    body: (
      <>
        유분 상태는 <u>비교적 안정적</u>이에요. 다만 계절이 바뀌면 쉽게 무너질 수 있으니 꾸준한 관리가 필요합니다.
      </>
    ),
    manage: (
      <>
        <u>산뜻한 젤 크림</u>으로 유분을 조절하고 수분 공급을 놓치지 않도록 해보세요
      </>
    ),
    products: [_P.esnature, _P.torriden],
  },
  {
    key: "각질",
    emoji: "🧼",
    score: 70,
    peer: 62,
    title: "각질 관리는 잘 되고 있어요",
    body: (
      <>
        각질층이 <u>매끄럽게 정돈</u>되어 있어요. 지금의 클렌징·보습 루틴을 잘 유지해주세요.
      </>
    ),
    manage: (
      <>
        과한 각질 제거는 피하고 <u>순한 클렌저</u>와 <u>보습</u>으로 현재 상태를 유지해보세요
      </>
    ),
    products: [_P.roundlab, _P.illiyoon],
  },
];
const SKIN_REFILL = [
  { brand: "에스네이처", name: "아쿠아 스쿠알란 수분크림", badge: "3개월", tags: [["크림", "cream"], ["기능성", "func"]], img: "/img/skin/refill_esnature.png" },
  { brand: "에스트라", name: "아토베리아 365 하이드로 수딩크림", badge: "9일", tags: [["크림", "cream"]], img: "/img/skin/refill_estra.png" },
  { brand: "라운드랩", name: "자작나무 수분 토너", badge: "8개월", tags: [["토너", "toner"], ["크림", "cream"]], img: "/img/skin/refill_roundlab.png" },
];
const SKIN_SHOP = [
  { brand: "아이소이", name: "알로에 모이스처 닥터 크림", off: "17%", price: "37,160", img: "/img/skin/shop_isoi.png" },
  { brand: "웰라쥬", name: "리얼 히알루로닉 수딩 크림", off: "17%", price: "37,160", img: "/img/skin/shop_wellage.png" },
  { brand: "닥터지", name: "레드 블리미쉬 시카 수딩 크림", off: "17%", price: "37,160", img: "/img/skin/shop_drg.png" },
];
// 문진 응답 → 6개 지표 점수 (응답에 납득 가능한 방향으로 가감)
const MUNJIN_DELTAS = [
  // STEP1 세안 후 피부: 팽팽 / 따갑붉 / 번들 / 보송
  [{ 수분: -22, 각질: -8, 피지: 3 }, { 수분: -15, 각질: -15, 유분: -3 }, { 유분: -18, 피지: -18, 수분: 8 }, { 수분: 8, 유분: 5, 각질: 5 }],
  // STEP2 트러블: 깨끗 / 약간 / 최근많음 / 거의매일
  [{ 피지: 12, 모공: 10 }, { 피지: -6, 모공: -5 }, { 피지: -15, 모공: -10 }, { 피지: -22, 모공: -16 }],
  // STEP3 고민: 주름 / 좁쌀 / 화농 / 블랙헤드 / 없음
  [{ 주름: -22, 수분: -5 }, { 피지: -10, 모공: -8 }, { 피지: -16, 모공: -12 }, { 모공: -16, 피지: -8 }, { 주름: 8, 모공: 6, 피지: 4 }],
  // STEP4 화장 유지력: 보송유지 / 자주수정 / 번들 / 밀림
  [{ 유분: 10, 수분: 6 }, { 수분: -10, 유분: -6 }, { 유분: -16, 피지: -10 }, { 각질: -12, 수분: -8 }],
  // STEP5 자극정도: 별변화없음 / 환절기 / 자주 / 매우
  [{ 각질: 10, 수분: 5 }, { 각질: -8, 수분: -6 }, { 각질: -14, 수분: -10 }, { 각질: -20, 수분: -16 }],
];
const SKIN_PEER = { 수분: 66, 유분: 55, 모공: 58, 각질: 62, 주름: 57, 피지: 61 };
const SKIN_CARE_INFO = {
  수분: { label: "수분부족", recommend: "수분크림", subj: "수분감이", products: [_P.illiyoon, _P.torriden] },
  유분: { label: "유분과다", recommend: "피지 케어 토너", subj: "유분이", products: [_P.roundlab, _P.gongskin] },
  모공: { label: "모공고민", recommend: "모공 세럼", subj: "모공이", products: [_P.roundlab, _P.torriden] },
  각질: { label: "장벽손상", recommend: "진정 크림", subj: "각질이", products: [_P.illiyoon, _P.purito] },
  주름: { label: "탄력저하", recommend: "탄력 앰플", subj: "탄력이", products: [_P.gongskin, _P.estra] },
  피지: { label: "피지불균형", recommend: "수분 토너", subj: "피지가", products: [_P.torriden, _P.roundlab] },
};
function objParticle(word) {
  // 받침 있으면 "을", 없으면 "를"
  const c = (word || "").charCodeAt((word || "").length - 1);
  if (c < 0xac00 || c > 0xd7a3) return "을";
  return (c - 0xac00) % 28 !== 0 ? "을" : "를";
}
function computeSkinScores(answers) {
  // 응답 없으면 기본 캔버스 값
  if (!answers || Object.keys(answers).length === 0) {
    return { 수분: 43, 유분: 50, 모공: 50, 각질: 70, 주름: 50, 피지: 43 };
  }
  const s = { 수분: 60, 유분: 58, 모공: 60, 각질: 66, 주름: 62, 피지: 58 };
  for (let step = 1; step <= 5; step++) {
    const opt = answers[step];
    if (opt == null) continue;
    const d = (MUNJIN_DELTAS[step - 1] || [])[opt] || {};
    for (const k in d) s[k] += d[k];
  }
  for (const k in s) s[k] = Math.max(22, Math.min(88, Math.round(s[k])));
  return s;
}
function SkinResultPage({ onBack, onDone, onProductClick, answers }) {
  const scores = computeSkinScores(answers);
  const RADAR_ORDER = ["수분", "유분", "모공", "각질", "주름", "피지"];
  const radarData = RADAR_ORDER.map((k) => ({ label: k, score: scores[k] }));
  const maxScore = Math.max(...radarData.map((d) => d.score));
  const minScore = Math.min(...radarData.map((d) => d.score));
  // 가장 낮은 지표 = 가장 중요한 케어요소
  const topKey = Object.keys(scores).reduce((a, b) => (scores[b] < scores[a] ? b : a));
  const care = SKIN_CARE_INFO[topKey];
  const recTop = care.products;
  const peerScore = SKIN_PEER[topKey];
  const gap = peerScore - scores[topKey];
  // 가장 케어가 필요한(점수 낮은) 요소부터 나열
  const metrics = SKIN_METRICS.map((m) => ({ ...m, score: scores[m.key], peer: SKIN_PEER[m.key] })).sort((a, b) => a.score - b.score);
  const [topOpen, setTopOpen] = useState(true); // 해당 제품 카드 (기본 열림)
  const [openMetric, setOpenMetric] = useState(0); // 그래프 밑 토글 — 기본: 맨 위(가장 케어 필요) 하나 열림
  const [radarOn, setRadarOn] = useState(false);
  const radarRef = useRef(null);
  useEffect(() => {
    const el = radarRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (ents) => ents.forEach((e) => e.isIntersecting && (setRadarOn(true), io.disconnect())),
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className="cabinetpage skinresult">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="ap-header">
        <button className="ap-back" onClick={onBack} aria-label="뒤로">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1.5 9L9 17" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="ap-title">내 피부 컨디션</h1>
      </div>
      <div className="cabinet-scroll sr-scroll">
        {/* 코랄 히어로 (풀블리드, 하단 r23) + 해당 제품 카드 */}
        <div className="sr-hero">
          <img className="sr-hero-card" src="/img/munjin/hero_card.png" alt="" draggable="false" />
          <div className="sr-hero-date">등록일 | 2026. 05.17</div>
          <h2 className="sr-hero-txt">
            주빈님은 <span className="sr-hero-hl">{care.label}</span>
            <br />
            오늘밤 {care.recommend}
            {objParticle(care.recommend)} 추천해요!
          </h2>
          <div className="sr-topcard">
            <button className="sr-topcard-head" onClick={() => setTopOpen((v) => !v)}>
              <span className="sr-topcard-title">
                <img className="sr-topcard-ic" src="/ic_haedang.svg" alt="" draggable="false" /> 해당 제품
              </span>
              <ChevronDown className={topOpen ? "up" : ""} />
            </button>
            {topOpen && (
              <>
                <div className="sr-topdiv" />
                <div className="sr-toplist">
                  {recTop.map((p, i) => (
                    <div className="sr-toprow" key={i}>
                      <div className="sr-toprow-thumb">
                        <img src={p.img} alt="" draggable="false" />
                      </div>
                      <div className="sr-toprow-info">
                        <div className="sr-toprow-brand">
                          {p.brand} <span className={"tag " + p.tags[0][1]}>{p.tags[0][0]}</span>
                        </div>
                        <div className="sr-toprow-name">{p.name}</div>
                      </div>
                      <button className="sr-add-btn">＋ 루틴에 추가</button>
                    </div>
                  ))}
                </div>
                <div className="sr-topdiv" />
                <button className="sr-topall">전체보기</button>
              </>
            )}
          </div>
        </div>

        <div className="sr-pad">
          {/* 점수 산출 안내 — 기존 InfoBar 재사용 (상하 15px 여백) */}
          <InfoBar>간단한 피부 컨디션 체크를 통해 피부점수를 산출했어요</InfoBar>
          {/* 육각형 레이더 */}
          <div className="skin-radar-wrap" ref={radarRef}>
            <SkinRadar data={radarData} active={radarOn} />
            {radarData.map((d, i) => {
              // 가장 높은 점수 = 초록칩, 가장 낮은 점수 = 빨간칩, 나머지는 텍스트
              const isMax = d.score === maxScore;
              const isMin = d.score === minScore && !isMax;
              return (
                <span key={d.label} className={"radar-label pos" + i}>
                  {isMax || isMin ? (
                    <span className="radar-pill" style={{ background: isMax ? "#1DBF7E" : "#FF5160", color: "#fff" }}>
                      {d.label} {d.score}점
                    </span>
                  ) : (
                    <span className="radar-plain">
                      {d.label} {d.score}점
                    </span>
                  )}
                </span>
              );
            })}
          </div>
          {/* 그래프 밑 토글(전부 닫힘) */}
          <div className="sr-metrics">
            {metrics.map((m, i) => (
              <SkinToggle
                key={m.key}
                item={m}
                open={openMetric === i}
                onToggle={() => setOpenMetric(openMetric === i ? -1 : i)}
                active={openMetric === i}
                onProductClick={onProductClick}
              />
            ))}
          </div>

          {/* 또래 비교 — 기존 VsCard 재사용 (395-18732 / 363-10024), 문답 기반 */}
          <div className="sr-peer-head">
            <h3 className="sr-peer-title">
              평균 또래보다 {care.subj}
              <br />
              {Math.abs(gap)}점 {gap >= 0 ? "낮아요" : "높아요"}
            </h3>
            <button className="sr-detail">
              상세보기
              <ChevronRight />
            </button>
          </div>
          <VsCard me={scores[topKey]} peer={peerScore} avatar="drop" active={radarOn} />

          {/* 수분충전 제품 */}
          <div className="section-head sr-sec">
            <h2 className="section-title">수분충전 제품</h2>
            <button className="see-all">
              더보기 <ChevronRight />
            </button>
          </div>
          <div className="sr-refill-scroll">
            {SKIN_REFILL.map((p, i) => (
              <div className="cab-card sr-refill-card" key={i}>
                <div className={"cab-thumb" + (isAmpoule(p) ? " amp" : "")}>
                  <img src={p.img} alt="" draggable="false" />
                  <ExpiryBadge label={p.badge} />
                </div>
                <div className="cab-brand">{p.brand}</div>
                <div className="cab-name">{p.name}</div>
                <div className="cab-tags">
                  {p.tags.map(([l, t]) => (
                    <span className={"tag " + t} key={t}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 수분제품 다 썼나요 */}
          <div className="section-head sr-sec">
            <h2 className="section-title">수분제품 다 썼나요?</h2>
            <button className="see-all">
              쇼핑 <ChevronRight />
            </button>
          </div>
          <div className="sameline-grid">
            {SKIN_SHOP.map((p, i) => (
              <div className="sameline-card" key={i}>
                <div className="sameline-thumb">
                  <img src={p.img} alt="" draggable="false" />
                </div>
                <div className="sameline-brand">{p.brand}</div>
                <div className="sameline-name">{p.name}</div>
                <div className="sameline-price">
                  <span className="sameline-off">{p.off}</span> {p.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="sc-cta-bar">
        <button className="sc-cta sr-done" onClick={onDone}>
          완료
        </button>
        <span className="sheet-home" />
      </div>
    </div>
  );
}

// ── 쇼핑 페이지 (Figma 236-33213) ──
const SHOP_CATS = ["전체", "수분충전", "지성피부", "약산성토너", "비타민", "선크림", "페이셜 마스크", "스팟 트리트먼트"];
const SHOP_ICONS = [
  { label: "최적의 루틴", img: "/img/shop/ic_routine.png", badge: "BEST" },
  { label: "유통기한 임박", img: "/img/shop/ic_expiry.png" },
  { label: "미세먼지 차단", img: "/img/shop/ic_dust.png" },
  { label: "환절기 추천", img: "/img/shop/ic_season.png", badge: "NEW" },
  { label: "피부 진단", img: "/img/shop/ic_diagnose.png" },
];
// 쇼핑 상단 프로모 배너 (자동 스와이프 · 5개 무한루프) — 1번은 원본 이미지 배너, 2~5번은 그라데이션+제품컷
const SHOP_BANNERS = [
  { type: "img", bg: "/img/shop/promo.png", title: ["여단오 PICK!", "유분 잡는 수분", "#쑥히알"], sub: "한율 X 여단오 콜라보 기획", titleColor: "#264166", subColor: "#ffffff", link: { q: "한율" } },
  { bg: "linear-gradient(115deg,#d9f4ec 0%,#a6e2ce 100%)", illus: "snow", title: ["겨울 필수템", "고보습 크림 30%"], sub: "건조한 계절, 장벽 케어 특가", titleColor: "#12684f", subColor: "#2f8f70", img: "/img/skin/refill_estra.png", link: { detail: true } },
  { bg: "linear-gradient(115deg,#ffe3e8 0%,#ffbfcd 100%)", title: ["민감 피부 진정", "시카 라인 1+1"], sub: "이달의 한정 기획전", titleColor: "#b5344b", subColor: "#c85a6d", img: "/img/skin/refill_roundlab.png", link: { q: "라운드랩" } },
  { bg: "linear-gradient(115deg,#fff1d0 0%,#ffd888 100%)", title: ["매일 자외선 차단", "데일리 선케어"], sub: "미리 준비하는 여름 채비", titleColor: "#8a5a12", subColor: "#a9752a", img: "/img/skin/met_illiyoon.png", link: { q: "일리윤" } },
  { bg: "linear-gradient(115deg,#e9e2ff 0%,#c6b8fb 100%)", title: ["수분 폭탄 세일", "인기 앰플 특가"], sub: "오늘만 이 가격", titleColor: "#5333a8", subColor: "#6f52c0", img: "/img/search/r_torriden.png", imgH: 172, link: { q: "토리든" } },
];
// 배너 배경 일러스트 — 겨울(눈)만 사용. 날씨 카드처럼 soft-light로 블렌드된 반투명 도형
function PromoIllus({ kind }) {
  if (kind !== "snow") return null;
  return (
    <svg className="shop-promo-illus" viewBox="0 0 391 175" preserveAspectRatio="none" fill="none">
      <g stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity="0.85">
        {[[300, 34, 15], [252, 96, 11], [340, 118, 9]].map(([cx, cy, r], i) => (
          <g key={i}>
            <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} />
            <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} />
            <line x1={cx - r * 0.7} y1={cy - r * 0.7} x2={cx + r * 0.7} y2={cy + r * 0.7} />
            <line x1={cx - r * 0.7} y1={cy + r * 0.7} x2={cx + r * 0.7} y2={cy - r * 0.7} />
          </g>
        ))}
      </g>
      <g fill="#ffffff" opacity="0.7">
        {[[210, 40, 3], [360, 60, 4], [275, 140, 3], [318, 92, 2.4], [235, 150, 2.6]].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
      </g>
    </svg>
  );
}
const SHOP_REC = [
  { brand: "포밤", name: "퍼펙션 베이비 아토크림", off: "17%", price: "19,160", img: "/img/shop/s1_pobam.png", tags: [["크림", "cream"]] },
  { brand: "웰라쥬", name: "리얼 히알루로닉 슈닝 크림", off: "8%", price: "37,160", img: "/img/shop/s1_wellage.png", tags: [["크림", "cream"]] },
  { brand: "닥터지", name: "레드 블리미쉬 시카 슈팅 크림", off: "10%", price: "37,160", img: "/img/shop/s1_drg.png", tags: [["크림", "cream"]] },
  { brand: "아이소이", name: "알로에 모이스처 닥터 크림", off: "26%", price: "37,160", img: "/img/shop/s1_isoi.png", tags: [["크림", "cream"]] },
  { brand: "넘버즈인", name: "글루타치온 비타 C 앰플", off: "10%", price: "27,160", img: "/img/shop/s1_numbuzin.png", tags: [["앰플", "ampoule"]] },
  { brand: "메디필", name: "히알루론산 레이어 물톡스 앰플", off: "23%", price: "38,700", img: "/img/shop/s1_medifil.png", tags: [["앰플", "ampoule"]] },
];
// 만족한 제품 풀 (크림/토너)
const SAT_POOL = [
  { brand: "닥터지", name: "레드 블리미쉬 시카 수딩 크림", off: "10%", price: "37,160", img: "/img/shop/s2_drg.png", tags: [["크림", "cream"]] },
  { brand: "브링그린", name: "티트리 시카 수딩 크림", off: "25%", price: "30,160", img: "/img/shop/s2_bringgreen.png", tags: [["크림", "cream"]] },
  { brand: "토리든", name: "다이브인 수딩 크림", off: "50%", price: "29,200", img: "/img/shop/s2_torriden.png", tags: [["크림", "cream"]] },
  { brand: "에스네이처", name: "아쿠아 스쿠알란 수분크림", off: "8%", price: "37,160", img: "/img/skin/refill_esnature.png", tags: [["크림", "cream"]] },
  { brand: "라운드랩", name: "자작나무 수분 토너", off: "12%", price: "29,200", img: "/img/skin/refill_roundlab.png", tags: [["토너", "toner"]] },
  { brand: "아이소이", name: "알로에 모이스처 닥터 크림", off: "26%", price: "37,160", img: "/img/skin/shop_isoi.png", tags: [["크림", "cream"]] },
];
const SHOP_SAT_ITEMS = [
  { feat: { brand: "에스트라", tags: [["크림", "cream"]], name: "아토베리아 365 하이드로 수딩크림", chips: ["수분충전", "장벽개선", "피부진정"], img: "/img/shop/feat_estra.png" }, grid: [0, 1, 2] },
  { feat: { brand: "일리윤", tags: [["크림", "cream"]], name: "히알루론 모이스처 수분크림", chips: ["수분충전", "보습장벽", "저자극"], img: "/img/skin/top_illiyoon.png" }, grid: [3, 4, 5] },
  { feat: { brand: "라운드랩", tags: [["토너", "toner"]], name: "자작나무 수분 토너", chips: ["각질케어", "진정", "수분공급"], img: "/img/skin/refill_roundlab.png" }, grid: [1, 5, 0] },
  { feat: { brand: "토리든", tags: [["앰플", "ampoule"]], name: "다이브인 저분자 히알루론산 앰플", chips: ["수분충전", "흡수력", "진정"], img: "/img/skin/top_torriden.png" }, grid: [2, 3, 4] },
  { feat: { brand: "닥터지", tags: [["크림", "cream"]], name: "레드 블리미쉬 시카 수딩 크림", chips: ["진정", "장벽케어", "저자극"], img: "/img/shop/s2_drg.png" }, grid: [0, 4, 5] },
];
// 폐기예정 풀 (색조 0-5 / 기초 6-11)
const EXP_POOL = [
  { brand: "헤라", name: "리치 컬링 마스카라", price: "17,160", img: "/img/shop/s3_hera.png", tags: [["색조", "color"]] },
  { brand: "키스미", name: "히로인 마스카라", off: "12%", price: "27,160", img: "/img/shop/s3_kissme.png", tags: [["색조", "color"]] },
  { brand: "미샤", name: "4D 볼륨핏 마스카라", off: "6%", price: "17,160", img: "/img/shop/s3_missha.png", tags: [["색조", "color"]] },
  { brand: "캔메이크", name: "메탈룩 마스카라", off: "10%", price: "14,860", img: "/img/shop/s3_canmake.png", tags: [["색조", "color"]] },
  { brand: "클리오", name: "슬림 픽싱 킬래쉬 마스카라", off: "12%", price: "12,160", img: "/img/shop/s3_clio1.png", tags: [["색조", "color"]] },
  { brand: "클리오", name: "킬래쉬 슈퍼프루푸 마스카라", price: "15,200", img: "/img/shop/s3_clio2.png", tags: [["색조", "color"]] },
  { brand: "에스트라", name: "아토베리아 365 하이드로 수딩크림", off: "12%", price: "18,400", img: "/img/skin/refill_estra.png", tags: [["크림", "cream"]] },
  { brand: "토리든", name: "다이브인 저분자 히알루론 세럼", off: "30%", price: "20,300", img: "/img/skin/top_torriden.png", tags: [["앰플", "ampoule"]] },
  { brand: "라운드랩", name: "자작나무 수분 토너", off: "12%", price: "29,200", img: "/img/skin/refill_roundlab.png", tags: [["토너", "toner"]] },
  { brand: "에스네이처", name: "아쿠아 스쿠알란 수분크림", off: "8%", price: "37,160", img: "/img/skin/refill_esnature.png", tags: [["크림", "cream"]] },
  { brand: "일리윤", name: "히알루론 모이스처 수분크림", off: "17%", price: "37,160", img: "/img/skin/top_illiyoon.png", tags: [["크림", "cream"]] },
  { brand: "닥터지", name: "레드 블리미쉬 시카 수딩 크림", off: "10%", price: "37,160", img: "/img/shop/s2_drg.png", tags: [["크림", "cream"]] },
];
const SHOP_EXP_ITEMS = [
  { feat: { brand: "에뛰드", tags: [["색조", "color"]], name: "컬핏 24 마스카라", badge: "11일", use: "6개월 사용", img: "/img/shop/feat_etude.png" }, grid: [0, 1, 2, 3, 4, 5] },
  { feat: { brand: "에스트라", tags: [["크림", "cream"]], name: "아토베리아 365 하이드로 수딩크림", badge: "9일", use: "6개월 사용", img: "/img/skin/refill_estra.png" }, grid: [6, 7, 8, 9, 10, 11] },
  { feat: { brand: "미샤", tags: [["색조", "color"]], name: "4D 볼륨핏 마스카라", badge: "14일", use: "7개월 사용", img: "/img/shop/s3_missha.png" }, grid: [2, 0, 4, 1, 5, 3] },
  { feat: { brand: "토리든", tags: [["앰플", "ampoule"]], name: "다이브인 저분자 히알루론 세럼", badge: "12일", use: "5개월 사용", img: "/img/skin/top_torriden.png" }, grid: [7, 9, 11, 6, 8, 10] },
  { feat: { brand: "키스미", tags: [["색조", "color"]], name: "히로인 마스카라", badge: "11일", use: "6개월 사용", img: "/img/shop/s3_kissme.png" }, grid: [1, 2, 3, 4, 5, 0] },
];
// 할인 카테고리 — 쇼핑 진입할 때마다 다른 카테고리 노출 (모듈 카운터로 순환)
const SHOP_DISCOUNT = [
  { cat: "썬크림", items: [
    { brand: "낫츠", name: "UV 프로텍셔 썬크림", off: "17%", price: "14,940", was: "18,000", img: "/img/shop/s4_natse.png" },
    { brand: "닥터유엔케이", name: "퓨어 퍼펙션 썬크림", off: "17%", price: "13,940", was: "19,000", img: "/img/shop/s4_druncanky.png" },
    { brand: "더샘", name: "에코 어스 라이트 썬크림", off: "20%", price: "12,800", was: "16,000", img: "/img/shop/s4_thesaem.png" },
  ] },
  { cat: "토너", items: [
    { brand: "라운드랩", name: "자작나무 수분 토너", off: "12%", price: "29,200", was: "33,000", img: "/img/skin/refill_roundlab.png" },
    { brand: "닥터지", name: "레드 블리미쉬 클리어 수딩토너", off: "15%", price: "18,700", was: "22,000", img: "/img/search/r_drg.png" },
    { brand: "메디힐", name: "티트리 카밍 토너", off: "20%", price: "16,000", was: "20,000", img: "/img/search/r_ap7.png" },
  ] },
  { cat: "앰플", items: [
    { brand: "토리든", name: "다이브인 저분자 히알루론 세럼", off: "30%", price: "20,300", was: "29,000", img: "/img/skin/top_torriden.png" },
    { brand: "넘버즈인", name: "글루타치온 비타 C 앰플", off: "10%", price: "27,160", was: "30,000", img: "/img/shop/s1_numbuzin.png" },
    { brand: "아이소이", name: "불가리안 로즈 히알루론 앰플", off: "23%", price: "38,700", was: "50,000", img: "/img/search/r_dropampoule.png" },
  ] },
  { cat: "크림", items: [
    { brand: "에스네이처", name: "아쿠아 스쿠알란 수분크림", off: "8%", price: "37,160", was: "40,000", img: "/img/skin/refill_esnature.png" },
    { brand: "포밤", name: "퍼펙션 베이비 아토크림", off: "17%", price: "19,160", was: "23,000", img: "/img/shop/s1_pobam.png" },
    { brand: "일리윤", name: "히알루론 모이스처 수분크림", off: "12%", price: "22,100", was: "25,000", img: "/img/skin/top_illiyoon.png" },
  ] },
];
let _shopEnter = 0; // 진입 카운터
// 카테고리 칩 → 추천 제품 재구성
const SHOP_CAT_REC = {
  전체: SHOP_REC,
  수분충전: [
    { brand: "에스네이처", name: "아쿠아 스쿠알란 수분크림", off: "8%", price: "37,160", img: "/img/skin/refill_esnature.png", tags: [["크림", "cream"]] },
    { brand: "라운드랩", name: "자작나무 수분 토너", off: "12%", price: "29,200", img: "/img/skin/refill_roundlab.png", tags: [["토너", "toner"]] },
    { brand: "일리윤", name: "히알루론 모이스처 수분크림", off: "17%", price: "37,160", img: "/img/skin/top_illiyoon.png", tags: [["크림", "cream"]] },
  ],
  지성피부: [
    { brand: "토리든", name: "다이브인 저분자 히알루론 세럼", off: "30%", price: "20,300", img: "/img/skin/top_torriden.png", tags: [["앰플", "ampoule"]] },
    { brand: "닥터지", name: "레드 블리미쉬 시카 수딩 크림", off: "10%", price: "37,160", img: "/img/shop/s2_drg.png", tags: [["크림", "cream"]] },
    { brand: "넘버즈인", name: "글루타치온 비타 C 앰플", off: "10%", price: "27,160", img: "/img/shop/s1_numbuzin.png", tags: [["앰플", "ampoule"]] },
  ],
  약산성토너: [
    { brand: "라운드랩", name: "자작나무 수분 토너", off: "12%", price: "29,200", img: "/img/skin/refill_roundlab.png", tags: [["토너", "toner"]] },
    { brand: "닥터지", name: "레드 블리미쉬 클리어 수딩토너", off: "15%", price: "18,700", img: "/img/search/r_drg.png", tags: [["토너", "toner"]] },
    { brand: "메디힐", name: "티트리 카밍 토너", off: "20%", price: "16,000", img: "/img/search/r_ap7.png", tags: [["토너", "toner"]] },
  ],
  비타민: [
    { brand: "넘버즈인", name: "글루타치온 비타 C 앰플", off: "10%", price: "27,160", img: "/img/shop/s1_numbuzin.png", tags: [["앰플", "ampoule"]] },
    { brand: "토리든", name: "다이브인 저분자 히알루론 세럼", off: "30%", price: "20,300", img: "/img/skin/top_torriden.png", tags: [["앰플", "ampoule"]] },
    { brand: "아이소이", name: "불가리안 로즈 히알루론 앰플", off: "23%", price: "38,700", img: "/img/search/r_dropampoule.png", tags: [["앰플", "ampoule"]] },
  ],
  선크림: SHOP_DISCOUNT[0].items,
  "페이셜 마스크": [
    { brand: "메디힐", name: "티트리 카밍 마스크", off: "20%", price: "16,000", img: "/img/search/r_ap7.png", tags: [["기타", "etc"]] },
    { brand: "에스트라", name: "아토베리아 365 하이드로 수딩크림", off: "12%", price: "18,400", img: "/img/skin/refill_estra.png", tags: [["크림", "cream"]] },
    { brand: "포밤", name: "퍼펙션 베이비 아토크림", off: "17%", price: "19,160", img: "/img/shop/s1_pobam.png", tags: [["크림", "cream"]] },
  ],
  "스팟 트리트먼트": [
    { brand: "닥터지", name: "레드 블리미쉬 시카 수딩 크림", off: "10%", price: "37,160", img: "/img/shop/s2_drg.png", tags: [["크림", "cream"]] },
    { brand: "브링그린", name: "티트리 시카 수딩 크림", off: "25%", price: "30,160", img: "/img/shop/s2_bringgreen.png", tags: [["크림", "cream"]] },
    { brand: "토리든", name: "다이브인 수딩 크림", off: "50%", price: "29,200", img: "/img/shop/s2_torriden.png", tags: [["크림", "cream"]] },
  ],
};
// 브라우즈 검색 카테고리 → 태그 필터 (기초 3종 포함, 색조/선크림 제외)
const BROWSE_CAT_TAGS = {
  전체: null,
  수분충전: ["cream", "toner", "ampoule"],
  지성피부: ["ampoule", "toner", "cream"],
  건성피부: ["cream", "toner", "ampoule"],
  수부지: ["cream", "ampoule", "toner"],
};
// 쇼핑 제품 상세 (Figma 236-33333) — 아토베리아 365 하이드로 수딩크림 전용
const SPD_LIKED = [
  { brand: "에스트라", name: "아토베리아 365 하이드로 수딩크림", tags: [["앰플", "ampoule"], ["기능성", "func"]], badge: "9일", img: "/img/shop/spd_like1.png" },
  { brand: "에스트라", name: "아토베리아 365 하이드로 수딩크림", tags: [["토너", "toner"], ["기능성", "func"]], badge: "9일", img: "/img/shop/spd_like2.png" },
  { brand: "에스트라", name: "아토베리아 365 하이드로 수딩크림", tags: [["토너", "toner"], ["크림", "cream"]], badge: "9일", img: "/img/shop/spd_like3.png" },
];
const SPD_COMBO_INIT = [
  { brand: "에버린", name: "클리어 AHA 앰플", tags: [["앰플", "ampoule"]], img: "/img/shop/spd_combo1.png", on: false },
  { brand: "공스킨", name: "EGF 앰플", tags: [["앰플", "ampoule"]], img: "/img/shop/spd_combo2.png", on: false },
  { brand: "라네즈", name: "립 글로시 베리밤", tags: [["기타", "etc"]], img: "/img/shop/spd_combo3.png", on: false },
];
const canShopDetail = (p) => !!p && p.brand === "에스트라" && (p.name || "").includes("아토베리아 365 하이드로");

// ── 쇼핑 결제 플로우 공용 데이터 ──
const priceNum = (s) => parseInt(String(s).replace(/[^0-9]/g, ""), 10) || 0;
const won = (n) => n.toLocaleString("en-US");
const AESTURA_ITEM = {
  group: "일반 배송상품",
  brand: "에스트라",
  name: "아토베리아 365 하이드로 수딩크림",
  opt: "500ml + 100ml 기획전",
  optChoices: ["500ml + 100ml 기획전", "500ml 단품", "300ml 미니", "500ml x2 세트"],
  tag: ["기타", "etc"],
  off: "12%",
  price: "18,400",
  img: "/img/skin/refill_estra.png",
  qty: 1,
};
// 장바구니 기본 구성 (375-14681) — 기본값 전부 미선택
const CART_INIT = [
  { ...AESTURA_ITEM, selected: false },
  { group: "일반 배송상품", brand: "낫츠", name: "UV 프로텍터 썬크림", opt: "1+1 리필 기획", optChoices: ["1+1 리필 기획", "단품", "2+1 기획"], tag: ["선크림", "sun"], off: "12%", price: "28,160", img: "/img/skin/shop_isoi.png", qty: 1, selected: false },
  { group: "일리윤 배송상품", brand: "일리윤", name: "울트라 리페어 로션", opt: "단품", optChoices: ["단품", "2개 세트 기획", "대용량 기획"], tag: ["로션", "lotion"], off: "6%", price: "22,100", img: "/img/skin/met_illiyoon.png", qty: 1, selected: false },
  { group: "바이오더마 배송상품", brand: "바이오더마", name: "아토덤 울트라 크림", opt: "단품", optChoices: ["단품", "2개 세트 기획", "대용량 기획"], tag: ["크림", "cream"], off: "6%", price: "37,160", img: "/img/skin/shop_drg.png", qty: 1, selected: false },
];
// 옵션 드롭다운 (장바구니/결제 상품 옵션 선택)
function OptionSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const list = options && options.length ? options : [value];
  return (
    <div className={"opt-select" + (open ? " open" : "")}>
      <button className="opt-select-head" onClick={() => setOpen((o) => !o)}>
        {value} <ChevronDown className={open ? "up" : ""} />
      </button>
      {open && (
        <div className="opt-select-menu">
          {list.map((o) => (
            <button key={o} className={"opt-select-item" + (o === value ? " on" : "")} onClick={() => { onChange(o); setOpen(false); }}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
// 구매하기 바텀시트 5종 (710-16389~16393) — 아토베리아 기준 내용
const BUY_MODALS = [
  {
    key: "similar", pre: "잠깐만요! ", hi: "비슷한 제품", post: "이 있어요", type: "product",
    product: { brand: "바이오더마", greenTag: "크림", name: "아토점 울트라 크림 200ml", tags: ["수분충전", "장벽개선", "피부진정"], img: "/img/shop/spd_similar.png" },
  },
  {
    key: "recent", pre: "잠깐만요! ", hi: "최근에 크림", post: "을 샀어요", type: "recent",
    product: { brand: "에스트라", name: "아토베리아 365 하이드로 수딩크림", img: "/img/skin/refill_estra.png", months: "6개월", date: "2026. 11. 25 구매" },
  },
  {
    key: "new", pre: "잠깐만요! ", hi: "처음 보는 성분", post: "이 있어요", type: "ingredient",
    ings: [
      { n: 1, name: "판테놀", open: false },
      { n: 2, name: "세라마이드", open: true, tags: ["수분충전", "장벽강화", "저자극"], desc: "피부 장벽을 이루는 핵심 지질 성분으로, 속수분을 오래 잡아주고 외부 자극으로부터 피부를 보호하는 데 도움을 줄 수 있어요. 민감·건성 피부에도 순하게 사용하기 좋아요. 💛" },
    ],
  },
  { key: "confirm", pre: "이렇게 구매할게요", type: "confirm", product: AESTURA_ITEM },
  {
    key: "caution", pre: "잠깐만요! ", hi: "이 성분은 조심", post: "해요!", type: "caution",
    product: { brand: "에스트라", name: "아토베리아 365 하이드로 수딩크림", img: "/img/skin/refill_estra.png", tag: ["기타", "etc"] },
    ing: { n: 2, name: "다이메티콘", tags: ["유분감", "모공 주의", "지성 피부 주의"], desc: "매끄러운 발림과 보호막을 만들어주는 실리콘 계열 성분이에요. 다만 유분감을 느끼거나 모공이 막힐 수 있어 지성·트러블 피부는 사용 후 피부 반응을 확인하는 것을 권장해요. 😢" },
  },
];
const PAY_ENTRY = ["비밀번호", "경비실 호출", "자유출입가능", "기타사항"];
const PAY_METHODS = ["신용카드", "카카오페이", "토스페이", "페이코", "휴대폰결제", "무통장 입금"];
const PAY_TERMS = [
  "(필수) 만 14세 이상이며 주문 내용을 확인했어요",
  "(필수) 개인정보 수집·이용 및 제3자 제공 동의",
  "(필수) 결제대행 서비스 이용약관 동의",
  "(선택) 마케팅 정보 수신 동의",
];

function ShopProductDetail({ onBack, onCart, cartCount = 0, onBuy, onSearch, onRoutine }) {
  const [tab, setTab] = useState("상세정보");
  const [expanded, setExpanded] = useState(false);
  const [comboItems, setComboItems] = useState(SPD_COMBO_INIT);
  const [comboSel, setComboSel] = useState(() => SPD_COMBO_INIT.map((p) => !!p.on));
  const [picker, setPicker] = useState(false);
  const [buyModal, setBuyModal] = useState(null); // 구매하기 바텀시트 변형
  const [comboGen, setComboGen] = useState(false); // 조합 AI 분석중 인터랙션
  const comboCount = comboSel.filter(Boolean).length;
  const comboReport = RT_COMBO_REPORTS[comboSel.reduce((a, v, i) => a + (v ? i + 1 : 0), 0) % RT_COMBO_REPORTS.length];
  const comboPair = comboItems.filter((_, i) => comboSel[i]).slice(0, 2);
  // 2개 이상 선택 시 루틴탭과 동일하게 짧은 생성 인터랙션 후 브리핑 노출
  useEffect(() => {
    if (comboCount >= 2) {
      setComboGen(true);
      const t = setTimeout(() => setComboGen(false), 1300);
      return () => clearTimeout(t);
    }
    setComboGen(false);
  }, [comboCount]);
  return (
    <div className="cabinetpage shopdetail">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="ap-header spd-header">
        <button className="ap-back" onClick={onBack} aria-label="뒤로">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1.5 9L9 17" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="spd-header-right">
          <button className="spd-search-btn" onClick={onSearch} aria-label="검색">
            <SearchIcon />
          </button>
          <button className="spd-cart" onClick={onCart} aria-label="장바구니">
            <CartIcon />
            {cartCount > 0 && <span className="shop-cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>
      <div className="cabinet-scroll spd-scroll">
        {/* 히어로 배너 이미지 (원본 236-33355) */}
        <div className="spd-hero">
          <img className="spd-hero-img" src="/img/shop/spd_hero.png" alt="" draggable="false" />
          <span className="spd-hero-page">1/5</span>
        </div>
        <div className="spd-pad spd-info">
          <div className="spd-shop">
            <span className="spd-shop-brand">에스트라</span> <ChevronRight />
            <span className="spd-like">♥ 257.7만</span>
          </div>
          <div className="spd-info-line" />
          <h1 className="spd-name">아토베리아 365 하이드로 수딩크림</h1>
          <div className="spd-price">
            <span className="spd-off">12%</span>
            <span className="spd-now">18,400</span>
            <span className="spd-was">20,900</span>
          </div>
        </div>
        <div className="spd-tabs">
          {["상세정보", "리뷰", "Q&A"].map((t) => (
            <button key={t} className={"spd-tab" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="spd-pad">
          {/* 상세 이미지 — 긴 이미지 끊어보기 / 더보기 ↔ 간략히 보기 */}
          <div className={"spd-detail-img" + (expanded ? " open" : "")}>
            <img src="/img/shop/long.png" alt="" draggable="false" />
            {!expanded && (
              <button className="spd-more2" onClick={() => setExpanded(true)}>
                더보기 <ChevronDown />
              </button>
            )}
          </div>
          {expanded && (
            <button className="spd-more2 spd-less" onClick={() => setExpanded(false)}>
              간략히 보기 <ChevronDown className="up" />
            </button>
          )}

          {/* 보유한 이 제품이랑 어울려요 */}
          <h2 className="section-title spd-h2">보유한 이 제품이랑 어울려요</h2>
          <div className="sameline-grid shop-grid">
            {SPD_LIKED.map((p, i) => (
              <div className="sameline-card" key={i}>
                <div className={"sameline-thumb" + (isAmpoule(p) ? " amp" : "")}>
                  <ExpiryBadge label={p.badge} />
                  <img src={p.img} alt="" draggable="false" />
                </div>
                <div className="sameline-brand">{p.brand}</div>
                <div className="sameline-name">{p.name}</div>
                <div className="cab-tags">
                  {p.tags.map(([l, t]) => (
                    <span className={"tag " + t} key={t}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 보유한 제품만으로는 부족할까 (707-16388: 회색 박스 + 25px) */}
          <button className="spd-bookmark" onClick={onRoutine}>
            <span className="spd-bookmark-box">
              <img className="spd-bookmark-ic" src="/img/shop/spd_bookmark.png" alt="" draggable="false" />
            </span>
            <span className="spd-bookmark-txt">
              <span className="spd-bookmark-t1">보유한 제품만으로는 부족할까?</span>
              <span className="spd-bookmark-t2">보유한 제품으로 최적의 루틴 만들기</span>
            </span>
            <ChevronRight />
          </button>

          {/* 다른제품도 조합해보기 — 루틴 조합 기능 재사용 */}
          <div className="section-head spd-sec">
            <h2 className="section-title">다른제품도 조합해보기</h2>
            <button className="see-all" onClick={onSearch}>
              제품목록 <ChevronRight />
            </button>
          </div>
          <div className="rt-combo-list spd-combo-list">
            {comboItems.map((p, i) => (
              <button key={i} className="rt-combo-row" onClick={() => setComboSel((s) => s.map((v, j) => (j === i ? !v : v)))}>
                <div className={"rt-combo-thumb" + (isAmpoule(p) ? " amp" : "")}>
                  <img src={p.img} alt="" draggable="false" />
                </div>
                <div className="rt-combo-info">
                  <span className="rt-combo-brand">
                    {p.brand} <span className={"tag " + p.tags[0][1]}>{p.tags[0][0]}</span>
                  </span>
                  <span className="rt-combo-name">{p.name}</span>
                </div>
                <RtCheck on={comboSel[i]} />
              </button>
            ))}
          </div>
          <button className="rt-combo-add" onClick={() => setPicker(true)}>
            <svg className="rt-combo-add-plus" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.4V12.6M1.4 7H12.6" stroke="#212121" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="rt-combo-add-label">조합할 제품 추가하기</span>
            <span className="rt-combo-count">{comboCount}/10</span>
          </button>
          {comboCount >= 2 &&
            (comboGen ? (
              <div className="pd-ai rt-ai rt-combo-ai">
                <div className="ai-reason rt-gen">
                  <div className="ai-reason-head">
                    <span className="ai-reason-title">
                      <AiBadge /> 조합 점수 분석 중
                    </span>
                  </div>
                  <div className="rt-gen-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <p className="rt-gen-txt">선택한 제품 조합을 AI가 분석하고 있어요</p>
                </div>
              </div>
            ) : (
              <div className="pd-ai rt-ai rt-combo-ai">
                <div className="ai-reason">
                  <div className="ai-reason-head">
                    <span className="ai-reason-title">
                      <AiBadge /> 조합 점수 ({comboReport.score} /10)
                    </span>
                    <ChevronDown className="up" />
                  </div>
                  <div className="rt-combo-pair">
                    {comboPair.map((p, k) => (
                      <Fragment key={k}>
                        {k > 0 && (
                          <span className="rt-combo-plus">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M7 1V13M1 7H13" stroke="#B0B4BA" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          </span>
                        )}
                        <span className="rt-combo-pair-thumb">
                          <img src={p.img} alt="" draggable="false" />
                        </span>
                      </Fragment>
                    ))}
                  </div>
                  <div className="ai-reason-tags">
                    {comboReport.tags.map((t) => (
                      <span className="ai-rtag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="ai-reason-text">{comboReport.text}</p>
                  <div className="ai-reason-date">2025.05.22</div>
                </div>
              </div>
            ))}

          {/* 주빈님 피부를 위한 추천 */}
          <div className="section-head spd-sec">
            <h2 className="section-title">주빈님 피부를 위한 추천</h2>
            <button className="see-all shop-see-all" onClick={onSearch}>
              전체보기 <ChevronRight />
            </button>
          </div>
          <div className="sameline-grid spd-rec-grid">
            {SHOP_REC.slice(0, 6).map((rp, i) => (
              <div className="sameline-card" key={i}>
                <div className="sameline-thumb">
                  <img src={rp.img} alt="" draggable="false" />
                </div>
                <div className="sameline-brand">{rp.brand}</div>
                <div className="sameline-name">{rp.name}</div>
                <div className="sameline-price">
                  <span className="sameline-off">{rp.off}</span> {rp.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="spd-buybar">
        <div className="spd-buy-btns">
          <button className="spd-buy-cart" onClick={onCart}>장바구니</button>
          <button className="spd-buy-now" onClick={() => { const w = BUY_MODALS.filter((m) => m.type !== "confirm"); setBuyModal(w[Math.floor(Math.random() * w.length)]); }}>구매하기</button>
        </div>
        <span className="sheet-home" />
      </div>
      <BuyModal
        variant={buyModal}
        onClose={() => setBuyModal(null)}
        onProceed={() => setBuyModal(BUY_MODALS.find((m) => m.type === "confirm"))}
        onBuy={() => {
          setBuyModal(null);
          onBuy && onBuy();
        }}
      />
      <ProductPickerModal
        open={picker}
        title="조합할 제품 추가"
        onClose={() => setPicker(false)}
        onPick={(prod) => {
          setPicker(false);
          setComboItems((items) => [...items, prod]);
          setComboSel((s) => [...s, true]);
        }}
      />
    </div>
  );
}

// 구매하기 바텀시트 (710-16389~16393) — 5종 변형
function BuyModal({ variant, onClose, onBuy, onProceed }) {
  const [qty, setQty] = useState(1);
  const [openIdx, setOpenIdx] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  useEffect(() => {
    if (variant) {
      setQty(1);
      setAiOpen(false);
      setOpenIdx(variant.ings ? variant.ings.findIndex((i) => i.open) : null);
    }
  }, [variant]);
  if (!variant) return null;
  const p = variant.product;
  const unit = p ? priceNum(p.price || AESTURA_ITEM.price) : 0;
  return (
    <div className="buy-overlay" onClick={onClose}>
      <div className={"buy-sheet" + (variant.type === "confirm" ? " confirm" : "")} onClick={(e) => e.stopPropagation()}>
        <span className="buy-handle" />
        <h2 className="buy-title">
          {variant.pre}
          {variant.hi && <span className="buy-hi">{variant.hi}</span>}
          {variant.post}
        </h2>
        <div className="buy-body">
          {variant.type === "product" && (
            <>
              {/* 비슷한 제품 카드 (717-16415): 이미지+제목(위) / 태그(아래 풀폭) */}
              <div className="buy-simcard">
                <div className="buy-simcard-top">
                  <div className="buy-simcard-thumb">
                    <img src={p.img} alt="" draggable="false" />
                  </div>
                  <div className="buy-simcard-info">
                    <div className="buy-simcard-brand">
                      {p.brand}
                      {p.greenTag && <span className="buy-simcard-green">{p.greenTag}</span>}
                    </div>
                    <div className="buy-simcard-name">{p.name}</div>
                  </div>
                </div>
                <div className="buy-simcard-tags">
                  {p.tags.map((t) => (
                    <span className="buy-ptag" key={t}>{t}</span>
                  ))}
                </div>
              </div>
              <div className={"ai-reason buy-ai-reason" + (aiOpen ? "" : " collapsed")}>
                <div className="ai-reason-head">
                  <span className="ai-reason-title">
                    <AiBadge /> 해당 제품에 대한 평가 (8.7 /10)
                  </span>
                  <button className="ai-reason-chev" onClick={() => setAiOpen((v) => !v)} aria-label="AI 평가 펼치기/접기">
                    <ChevronDown className={aiOpen ? "up" : ""} />
                  </button>
                </div>
                {aiOpen && (
                  <>
                    <div className="ai-reason-tags">
                      <span className="ai-rtag">수분충전</span>
                      <span className="ai-rtag">장벽강화</span>
                      <span className="ai-rtag">진정</span>
                    </div>
                    <p className="ai-reason-text">
                      저분자 히알루론산과 세라마이드가 속수분을 채우고 피부 장벽을 탄탄하게 잡아줘, 건조하고 예민해진 수부지 피부에 잘 맞아요. 유수분 밸런스를 맞추며 자극 없이 순하게 쓸 수 있는 제품이에요. 💧
                    </p>
                    <div className="ai-reason-date">2025.05.22</div>
                  </>
                )}
              </div>
            </>
          )}
          {variant.type === "recent" && (
            <>
              <div className="buy-recent">
                <div className="buy-recent-thumbwrap">
                  <div className="buy-recent-thumb">
                    <ExpiryBadge label={p.months} />
                    <img src={p.img} alt="" draggable="false" />
                  </div>
                </div>
                <div className="buy-recent-info">
                  <div className="buy-prod-brand">{p.brand}</div>
                  <div className="buy-prod-name">{p.name}</div>
                  <span className="buy-date-chip">{p.date}</span>
                </div>
              </div>
              <div className={"ai-reason buy-ai-reason" + (aiOpen ? "" : " collapsed")}>
                <div className="ai-reason-head">
                  <span className="ai-reason-title">
                    <AiBadge /> 해당 제품에 대한 평가 (8.7 /10)
                  </span>
                  <button className="ai-reason-chev" onClick={() => setAiOpen((v) => !v)} aria-label="AI 평가 펼치기/접기">
                    <ChevronDown className={aiOpen ? "up" : ""} />
                  </button>
                </div>
                {aiOpen && (
                  <>
                    <div className="ai-reason-tags">
                      <span className="ai-rtag">수분충전</span>
                      <span className="ai-rtag">장벽강화</span>
                      <span className="ai-rtag">진정</span>
                    </div>
                    <p className="ai-reason-text">
                      저분자 히알루론산과 세라마이드가 속수분을 채우고 피부 장벽을 탄탄하게 잡아줘, 건조하고 예민해진 수부지 피부에 잘 맞아요. 유수분 밸런스를 맞추며 자극 없이 순하게 쓸 수 있는 제품이에요. 💧
                    </p>
                    <div className="ai-reason-date">2025.05.22</div>
                  </>
                )}
              </div>
            </>
          )}
          {variant.type === "ingredient" && (
            <div className="buy-ings">
              {variant.ings.map((ing, i) => {
                const open = openIdx === i;
                return (
                  <div className={"buy-ing" + (open ? " open" : "")} key={i}>
                    <button className="buy-ing-head" onClick={() => setOpenIdx(open ? null : i)}>
                      <span className={"buy-ing-num" + (ing.n === 1 ? " dark" : "")}>{ing.n}</span>
                      <span className="buy-ing-name">{ing.name}</span>
                      <ChevronDown className={"buy-ing-chev" + (open ? " up" : "")} />
                    </button>
                    {open && (
                      <div className="buy-ing-body">
                        <div className="buy-ing-tags">
                          {ing.tags.map((t) => (
                            <span className="buy-ing-tag" key={t}>{t}</span>
                          ))}
                        </div>
                        <p className="buy-ing-desc">{ing.desc}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {variant.type === "caution" && (
            <>
              {/* 제품 정보(위) — 576-22233 */}
              <div className="buy-prodcard caution">
                <div className="buy-prod-thumb">
                  <img src={variant.product.img} alt="" draggable="false" />
                </div>
                <div className="buy-prod-info">
                  <div className="buy-prod-brand">
                    {variant.product.brand} <span className={"tag " + variant.product.tag[1]}>{variant.product.tag[0]}</span>
                  </div>
                  <div className="buy-prod-name">{variant.product.name}</div>
                </div>
              </div>
              {/* 성분 정보(아래) — 717-16414 (플랫) */}
              <div className="buy-caution-ing">
                <div className="buy-caution-head">
                  <span className="buy-ing-num">{variant.ing.n}</span>
                  <span className="buy-ing-name">{variant.ing.name}</span>
                  <ChevronRight />
                </div>
                <div className="buy-caution-tags">
                  {variant.ing.tags.map((t) => (
                    <span className="buy-ing-tag" key={t}>{t}</span>
                  ))}
                </div>
                <p className="buy-caution-desc">{variant.ing.desc}</p>
              </div>
            </>
          )}
          {variant.type === "confirm" && (
            <>
              <div className="buy-prodcard">
                <div className="buy-prod-thumb">
                  <img src={p.img} alt="" draggable="false" />
                </div>
                <div className="buy-prod-info">
                  <div className="buy-prod-brand">
                    {p.brand} <span className={"tag " + p.tag[1]}>{p.tag[0]}</span>
                  </div>
                  <div className="buy-prod-name">{p.name}</div>
                </div>
              </div>
              <div className="buy-qtyrow">
                <span className="buy-stepper">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                  <em>{qty}</em>
                  <button onClick={() => setQty((q) => q + 1)}>+</button>
                </span>
                <span className="buy-unit">{won(unit * qty)} 원</span>
              </div>
              <div className="buy-total-line" />
              <div className="buy-totalrow">
                <span className="buy-qty-label">구매수량 {qty}개</span>
                <span className="buy-total">총 {won(unit * qty)} 원</span>
              </div>
            </>
          )}
        </div>
        <div className="buy-bar">
          <div className="buy-bar-btns">
            <button className="buy-cancel" onClick={onClose}>취소</button>
            {variant.type === "confirm" ? (
              <button className="buy-go" onClick={() => onBuy(qty)}>구매하기</button>
            ) : (
              <button className="buy-go" onClick={onProceed}>괜찮아요</button>
            )}
          </div>
          <span className="sheet-home" />
        </div>
      </div>
    </div>
  );
}
// 초록 블롭 뱃지 (6개월)
function BlobGreen() {
  return (
    <svg width="53" height="30" viewBox="0 0 53 30" fill="none">
      <ellipse cx="15" cy="15" rx="15" ry="15" fill="#1DBF7E" />
      <ellipse cx="26" cy="15" rx="15" ry="15" fill="#1DBF7E" />
      <ellipse cx="38" cy="15" rx="15" ry="15" fill="#1DBF7E" />
    </svg>
  );
}
// ── 장바구니 (375-14681) ──
function CartPage({ items, setItems, onBack, onOrder }) {
  // 장바구니 진입 시 전체선택을 기본값으로 고정
  useEffect(() => {
    setItems((s) => s.map((it) => ({ ...it, selected: true })));
  }, []);
  const selCount = items.filter((i) => i.selected).length;
  const allOn = selCount === items.length && items.length > 0;
  const toggle = (idx) => setItems((s) => s.map((it, i) => (i === idx ? { ...it, selected: !it.selected } : it)));
  const toggleAll = () => setItems((s) => s.map((it) => ({ ...it, selected: !allOn })));
  const setQty = (idx, d) => setItems((s) => s.map((it, i) => (i === idx ? { ...it, qty: Math.max(1, it.qty + d) } : it)));
  const del = () => setItems((s) => s.filter((it) => !it.selected));
  const delOne = (idx) => setItems((s) => s.filter((_, i) => i !== idx));
  const sel = items.filter((i) => i.selected);
  const goods = sel.reduce((a, i) => a + priceNum(i.price) * i.qty, 0);
  const ship = sel.length ? 1500 : 0;
  const total = goods + ship;
  // 배송 그룹별로 묶기
  const groups = [];
  items.forEach((it, i) => {
    let g = groups.find((x) => x.name === it.group);
    if (!g) { g = { name: it.group, rows: [] }; groups.push(g); }
    g.rows.push({ ...it, _i: i });
  });
  return (
    <div className="cabinetpage cartpage">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="ap-header">
        <button className="ap-back" onClick={onBack} aria-label="뒤로">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1.5 9L9 17" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="ap-title">장바구니</h1>
      </div>
      <div className="cabinet-scroll cart-scroll">
        <div className="cart-selbar">
          <button className="cart-all" onClick={toggleAll}>
            <SqCheck on={allOn} /> 전체선택 ({selCount}/{items.length})
          </button>
          <button className="cart-del" onClick={del}>선택삭제</button>
        </div>
        {groups.map((g, gi) => (
          <div className="cart-group" key={g.name}>
            {gi > 0 && <div className="cart-gdiv" />}
            <div className="cart-group-title">{g.name}</div>
            {g.rows.map((it) => (
              <div className="cart-row" key={it._i}>
                <button className="cart-check" onClick={() => toggle(it._i)}><SqCheck on={it.selected} /></button>
                <div className="cart-body">
                  <div className="cart-top">
                    <div className={"cart-thumb" + (isAmpoule(it) ? " amp" : "")}>
                      <img src={it.img} alt="" draggable="false" />
                    </div>
                    <div className="cart-namewrap">
                      <div className="cart-brand">{it.brand}</div>
                      <div className="cart-name">{it.name}</div>
                    </div>
                    <button className="cart-x" onClick={() => delOne(it._i)} aria-label="삭제">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M5 5l10 10M15 5L5 15" stroke="#c1c1c1" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  <OptionSelect
                    value={it.opt}
                    options={it.optChoices}
                    onChange={(v) => setItems((s) => s.map((x, i) => (i === it._i ? { ...x, opt: v } : x)))}
                  />
                  <div className="cart-botrow">
                    <span className="cart-stepper">
                      <button onClick={() => setQty(it._i, -1)}>−</button>
                      <em>{it.qty}</em>
                      <button onClick={() => setQty(it._i, 1)}>+</button>
                    </span>
                    <span className="cart-priceline">
                      <span className="cart-off">{it.off}</span>
                      <span className="cart-price">{it.price}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div className="cart-coupon-box">
          <span className="cart-coupon-title">쿠폰할인</span>
          <span className="cart-coupon-amt">0원</span>
        </div>
        <div className="pay-summary">
          <h2 className="pay-summary-title">예상 결제금액</h2>
          <div className="pay-row"><span>총 상품금액</span><span>{won(goods)}원</span></div>
          <div className="pay-row"><span>쿠폰할인금액</span><span className="cart-coral">0원</span></div>
          <div className="pay-row"><span>총 배송비</span><span>{won(ship)}원</span></div>
          <div className="pay-row final"><span>최종 결제금액</span><span className="pay-final cart-coral">{won(total)}원</span></div>
        </div>
      </div>
      <div className="cart-orderbar">
        <div className="cart-orderbar-sum">
          <span>총 {sel.length}개의 상품</span>
          <span>배송비 {won(ship)}</span>
        </div>
        <button className="cart-order-btn" disabled={!sel.length} onClick={() => onOrder(sel)}>
          {won(total)}원 주문하기
        </button>
        <span className="sheet-home" />
      </div>
    </div>
  );
}

// ── 주문/결제 (367-12338) ──
function PaymentPage({ items, onBack, onPay }) {
  const [entry, setEntry] = useState(null);
  const [method, setMethod] = useState(null);
  const [agree, setAgree] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [agreeOpen, setAgreeOpen] = useState(false);
  const [entryPwd, setEntryPwd] = useState("");
  const [payItems, setPayItems] = useState(() => (items && items.length ? items : [AESTURA_ITEM]));
  const list = payItems;
  const totalQty = list.reduce((a, i) => a + i.qty, 0);
  const goods = list.reduce((a, i) => a + priceNum(i.price) * i.qty, 0);
  const ship = 1500;
  const total = goods + ship;
  const ready = entry !== null && method !== null && agree;
  return (
    <div className="cabinetpage paypage">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="ap-header">
        <button className="ap-back" onClick={onBack} aria-label="뒤로">
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1.5 9L9 17" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="ap-title">주문 / 결제</h1>
      </div>
      <div className="cabinet-scroll pay-scroll">
        {/* 배송지 */}
        <div className="pay-addr">
          <div className="pay-addr-top">
            <span className="pay-addr-name">집 (이주빈)</span>
            <span className="pay-addr-badge">기본배송지</span>
            <button className="pay-addr-edit">변경</button>
          </div>
          <div className="pay-addr-line">서울 미래구 상상로 404, 드림타워 1203호</div>
          <div className="pay-addr-line">010-1234-5678</div>
        </div>
        <div className="pay-divider" />
        {/* 주문상품 — 테두리 카드(주문상품 헤더 + 상품들 + 라인 구분) */}
        <div className="pay-block">
          <div className="pay-order-card">
            <div className="pay-order-head">
              <h2 className="pay-sec-title">주문상품</h2>
              <span className="pay-block-count">총 수량 {totalQty}개</span>
            </div>
            {list.map((it, i) => (
              <div className={"pay-oprod" + (i > 0 ? " div" : "")} key={i}>
                <div className="pay-oprod-top">
                  <div className={"pay-oprod-thumb" + (isAmpoule(it) ? " amp" : "")}>
                    <img src={it.img} alt="" draggable="false" />
                  </div>
                  <div className="pay-oprod-info">
                    <div className="pay-oprod-brand">{it.brand}</div>
                    <div className="pay-oprod-name">{it.name}</div>
                    <div className="pay-oprod-price">
                      <span className="pay-oprod-off">{it.off}</span> {it.price}
                    </div>
                  </div>
                  <span className="pay-oprod-qty">수량 {it.qty}</span>
                </div>
                {it.opt && (
                  <div className="pay-oprod-opt">
                    <OptionSelect
                      value={it.opt}
                      options={it.optChoices}
                      onChange={(v) => setPayItems((s) => s.map((x, j) => (j === i ? { ...x, opt: v } : x)))}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="pay-divider" />
        {/* 배송 요청사항 — 토글 열면 메세지 선택 + 공동현관 출입방법 (569-20413) */}
        <div className="pay-block">
          <h2 className="pay-sec-title">배송 요청사항</h2>
          <button className="pay-dropdown" onClick={() => setDeliveryOpen((v) => !v)}>
            배송 메세지를 선택해주세요 <ChevronDown className={deliveryOpen ? "up" : ""} />
          </button>
          {deliveryOpen && (
            <div className="pay-delivery-box">
              <h3 className="pay-delivery-sub">공동현관 출입방법 <span className="pay-req">*</span></h3>
              <div className="pay-entry-list">
                {PAY_ENTRY.map((e, i) => (
                  <div className="pay-entry-item" key={e}>
                    <button className="pay-entry-row" onClick={() => setEntry(i)}>
                      <SqCheck on={entry === i} /> {e}
                    </button>
                    {i === 0 && entry === 0 && (
                      <input
                        className="pay-pwd-input"
                        type="text"
                        placeholder="비밀번호를 입력해주세요"
                        value={entryPwd}
                        onChange={(ev) => setEntryPwd(ev.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="pay-divider" />
        {/* 쿠폰할인 */}
        <div className="pay-sec pay-coupon">
          <span className="pay-sec-title">쿠폰할인</span>
          <span className="pay-coupon-val">0원</span>
        </div>
        <div className="pay-divider" />
        {/* 금액 및 결제수단 */}
        <div className="pay-block">
          <h2 className="pay-summary-title">금액 및 결제수단</h2>
          <div className="pay-row"><span>총 상품금액</span><span>{won(goods)}원</span></div>
          <div className="pay-row"><span>쿠폰할인금액</span><span className="cart-coral">0원</span></div>
          <div className="pay-row"><span>총 배송비</span><span>{won(ship)}원</span></div>
          <div className="pay-row final"><span>최종 결제금액</span><span className="pay-final cart-coral">{won(total)}원</span></div>
          <div className="pay-methods">
            {PAY_METHODS.map((m, i) => (
              <button className={"pay-method" + (method === i ? " on" : "")} key={m} onClick={() => setMethod(i)}>{m}</button>
            ))}
          </div>
        </div>
        {/* 모두 동의 박스 — 토글 열면 구매 약관 동의 */}
        <div className="pay-agree-box">
          <div className="pay-agree-head">
            <button className="pay-agree-check" onClick={() => setAgree((v) => !v)}>
              <SqCheck on={agree} /> <span className="pay-agree-sub">(개인정보약관동의)</span> 모두 동의합니다
            </button>
            <button className="pay-agree-toggle" onClick={() => setAgreeOpen((v) => !v)} aria-label="약관 펼치기">
              <ChevronDown className={agreeOpen ? "up" : ""} />
            </button>
          </div>
          {agreeOpen && (
            <div className="pay-agree-terms">
              {PAY_TERMS.map((t) => (
                <div className="pay-term-row" key={t}>
                  <SqCheck on={agree} /> {t}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="pay-buybar">
        <button className={"pay-go" + (ready ? " on" : "")} disabled={!ready} onClick={() => onPay(list)}>
          {won(total)}원 결제하기
        </button>
        <span className="sheet-home" />
      </div>
    </div>
  );
}

// ── 주문 중 로딩 (프로세스 바 + "주문중" 점 1→2→3 반복) ──
function OrderLoadingPage({ onDone }) {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const tick = setInterval(() => setDots((d) => (d % 3) + 1), 450);
    const done = setTimeout(() => onDone && onDone(), 2500);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, []);
  return (
    <div className="flowpage orderloading">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="flow-bar">
        <div className="ol-bar-fill" />
      </div>
      <div className="ol-center">
        <div className="ol-text">
          주문중<span className="ol-dots">{".".repeat(dots)}</span>
        </div>
      </div>
    </div>
  );
}

// ── 주문내역서 (375-15364) ──
function OrderCompletePage({ items, onContinue, onHome, onRegister }) {
  const list = items && items.length ? items : [AESTURA_ITEM];
  const [payOpen, setPayOpen] = useState(false);
  const [ordOpen, setOrdOpen] = useState(false);
  const goods = list.reduce((a, i) => a + priceNum(i.price) * i.qty, 0);
  const ship = 1500;
  const total = goods + ship;
  const subtitle = list.length > 1 ? `${list[0].name} 외 ${list.length - 1}` : list[0].name;
  return (
    <div className="cabinetpage receiptpage">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="ap-header">
        <h1 className="ap-title">주문내역서</h1>
      </div>
      <div className="cabinet-scroll oc-scroll">
        <div className="oc-head">
          <h2 className="oc-title">주문이 완료되었어요</h2>
          <p className="oc-sub">출고 후 배송이 시작되면 알림을 보내드려요.</p>
        </div>
        <div className="pay-order-card oc-order">
          <div className="oc-order-head">
            <h3 className="pay-sec-title">주문상품</h3>
            <span className="oc-order-sub">{subtitle}</span>
            <ChevronDown />
          </div>
          {list.map((it, i) => (
            <div className="oc-oprod" key={i}>
              <div className={"oc-oprod-thumb" + (isAmpoule(it) ? " amp" : "")}>
                <img src={it.img} alt="" draggable="false" />
              </div>
              <div className="oc-oprod-info">
                <div className="pay-oprod-brand">{it.brand}</div>
                <div className="pay-oprod-name">{it.name}</div>
              </div>
              <div className="oc-oprod-right">
                <span className="oc-oprod-qty">수량 {it.qty}</span>
                <span className="oc-oprod-price">{won(priceNum(it.price) * it.qty)}</span>
              </div>
            </div>
          ))}
        </div>
        <button className="oc-acc" onClick={() => setPayOpen((v) => !v)}>
          결제정보 <ChevronDown className={payOpen ? "up" : ""} />
        </button>
        {payOpen && (
          <div className="oc-acc-body">
            <div className="pay-row"><span>총 상품금액</span><span>{won(goods)}원</span></div>
            <div className="pay-row"><span>총 배송비</span><span>{won(ship)}원</span></div>
            <div className="pay-row final"><span>결제금액</span><span className="pay-final">{won(total)}원</span></div>
          </div>
        )}
        <button className="oc-acc" onClick={() => setOrdOpen((v) => !v)}>
          주문자 정보 <ChevronDown className={ordOpen ? "up" : ""} />
        </button>
        {ordOpen && (
          <div className="oc-acc-body">
            <div className="pay-row"><span>이름</span><span>이주빈</span></div>
            <div className="pay-row"><span>연락처</span><span>010-1234-5678</span></div>
          </div>
        )}
        <button className="spd-bookmark oc-register" onClick={onRegister}>
          <span className="spd-bookmark-box">
            <img className="spd-bookmark-ic" src="/img/shop/spd_vanity.png" alt="" draggable="false" />
          </span>
          <span className="spd-bookmark-txt">
            <span className="spd-bookmark-t1">방금 구매한 제품 바로 등록해요</span>
            <span className="spd-bookmark-t2">내 화장대에 등록 및 사용기한 설정</span>
          </span>
          <ChevronRight />
        </button>
      </div>
      <div className="oc-buybar">
        <div className="oc-buy-btns">
          <button className="oc-home" onClick={onHome}>홈으로</button>
          <button className="oc-continue" onClick={onContinue}>계속 쇼핑하기</button>
        </div>
        <span className="sheet-home" />
      </div>
    </div>
  );
}
// 장바구니 아이콘 (원본 236-33222)
function CartIcon() {
  return (
    <svg width="26" height="26" viewBox="12 12 24 24" fill="none">
      <path d="M28.3052 19.6226C29.2334 19.6231 30.0943 19.1149 30.357 18.2366C31.0234 16.0084 30.5214 14.2689 28.9474 14.0308C26.9369 13.7269 23.9389 15.9872 22.2511 19.0794C22.1189 19.3217 22.311 19.6191 22.5919 19.6192L28.3052 19.6226Z" fill="#FF5160" />
      <path d="M25.3052 19.6226C26.2334 19.6231 27.0943 19.1149 27.357 18.2366C28.0234 16.0084 27.5214 14.2689 25.9474 14.0308C23.9369 13.7269 20.9389 15.9872 19.2511 19.0794C19.1189 19.3217 19.311 19.6191 19.5919 19.6192L25.3052 19.6226Z" fill="#FF5160" />
      <path d="M22.8959 19.6226C23.8423 19.6231 24.7161 19.094 24.9654 18.1925C25.5758 15.9854 25.0913 14.2672 23.6042 14.0308C21.6922 13.727 18.8462 15.9873 17.2477 19.0797C17.121 19.3248 17.3155 19.6193 17.5963 19.6195L22.8959 19.6226Z" fill="#FF5160" />
      <path d="M17.5875 33.4125C17.1958 33.0208 17 32.55 17 32C17 31.45 17.1958 30.9792 17.5875 30.5875C17.9792 30.1958 18.45 30 19 30C19.55 30 20.0208 30.1958 20.4125 30.5875C20.8042 30.9792 21 31.45 21 32C21 32.55 20.8042 33.0208 20.4125 33.4125C20.0208 33.8042 19.55 34 19 34C18.45 34 17.9792 33.8042 17.5875 33.4125ZM27.5875 33.4125C27.1958 33.0208 27 32.55 27 32C27 31.45 27.1958 30.9792 27.5875 30.5875C27.9792 30.1958 28.45 30 29 30C29.55 30 30.0208 30.1958 30.4125 30.5875C30.8042 30.9792 31 31.45 31 32C31 32.55 30.8042 33.0208 30.4125 33.4125C30.0208 33.8042 29.55 34 29 34C28.45 34 27.9792 33.8042 27.5875 33.4125ZM15 16H14C13.7167 16 13.4792 15.9042 13.2875 15.7125C13.0958 15.5208 13 15.2833 13 15C13 14.7167 13.0958 14.4792 13.2875 14.2875C13.4792 14.0958 13.7167 14 14 14H15.65C15.8333 14 16.0083 14.05 16.175 14.15C16.3417 14.25 16.4667 14.3917 16.55 14.575L17.5684 16.5103H25.7861L31.15 16.5C31.2333 16.3333 31.35 16.2083 31.5 16.125C31.65 16.0417 31.8167 16 32 16C32.3833 16 32.6708 16.1625 32.8625 16.4875C33.0542 16.8125 33.0583 17.1417 32.875 17.475L29.3 23.95C29.1167 24.2833 28.8708 24.5417 28.5625 24.725C28.2542 24.9083 27.9167 25 27.55 25H20.1L19 27H30C30.2833 27 30.5208 27.0958 30.7125 27.2875C30.9042 27.4792 31 27.7167 31 28C31 28.2833 30.9042 28.5208 30.7125 28.7125C30.5208 28.9042 30.2833 29 30 29H19C18.25 29 17.6792 28.675 17.2875 28.025C16.8958 27.375 16.8833 26.7167 17.25 26.05L18.6 23.6L15 16Z" fill="black" />
      <path d="M17.5875 33.4125C17.1958 33.0208 17 32.55 17 32C17 31.45 17.1958 30.9792 17.5875 30.5875C17.9792 30.1958 18.45 30 19 30C19.55 30 20.0208 30.1958 20.4125 30.5875C20.8042 30.9792 21 31.45 21 32C21 32.55 20.8042 33.0208 20.4125 33.4125C20.0208 33.8042 19.55 34 19 34C18.45 34 17.9792 33.8042 17.5875 33.4125ZM27.5875 33.4125C27.1958 33.0208 27 32.55 27 32C27 31.45 27.1958 30.9792 27.5875 30.5875C27.9792 30.1958 28.45 30 29 30C29.55 30 30.0208 30.1958 30.4125 30.5875C30.8042 30.9792 31 31.45 31 32C31 32.55 30.8042 33.0208 30.4125 33.4125C30.0208 33.8042 29.55 34 29 34C28.45 34 27.9792 33.8042 27.5875 33.4125Z" fill="#FF5160" />
    </svg>
  );
}
// BEST/NEW 블롭 뱃지 (원본: 3개 코랄 타원 + 흰 글자)
function BlobBadge({ label }) {
  return (
    <span className="shop-blob-badge">
      <svg width="44" height="25" viewBox="0 0 44 25" fill="none">
        <ellipse cx="11.1679" cy="6.43866" rx="11.1679" ry="6.43866" transform="matrix(0.778029 -0.628229 0.567819 0.823153 0 14.032)" fill="#FF5160" />
        <ellipse cx="11.1679" cy="6.43866" rx="11.1679" ry="6.43866" transform="matrix(0.778029 -0.628229 0.567819 0.823153 10.1289 14.032)" fill="#FF5160" />
        <ellipse cx="11.1679" cy="6.43866" rx="11.1679" ry="6.43866" transform="matrix(0.778029 -0.628229 0.567819 0.823153 18.3555 14.032)" fill="#FF5160" />
      </svg>
      <span className="shop-blob-txt">{label}</span>
    </span>
  );
}
// 쇼핑 프로모 배너 캐러셀 — 3.5초마다 자동 전환, 끝에서 첫 슬라이드 복제본으로 이어 무한루프
function ShopPromoCarousel({ onBanner }) {
  const n = SHOP_BANNERS.length;
  const [idx, setIdx] = useState(0);
  const [noTrans, setNoTrans] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => i + 1), 3500);
    return () => clearInterval(t);
  }, []);
  // 복제본(idx===n)에 도달하면 트랜지션 끝난 뒤 애니메이션 없이 0으로 스냅 → 이음새 없는 루프
  useEffect(() => {
    if (!noTrans) return;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setNoTrans(false)));
    return () => cancelAnimationFrame(r);
  }, [noTrans]);
  const onEnd = (e) => {
    if (e.propertyName !== "transform" || e.target !== e.currentTarget) return;
    if (idx >= n) {
      setNoTrans(true);
      setIdx(0);
    }
  };
  const slides = [...SHOP_BANNERS, SHOP_BANNERS[0]]; // 첫 슬라이드 복제본 append
  return (
    <div className="shop-promo">
      <div
        className={"shop-promo-track" + (noTrans ? " notrans" : "")}
        style={{ transform: `translateX(-${idx * 100}%)` }}
        onTransitionEnd={onEnd}
      >
        {slides.map((b, i) => (
          <div
            className="shop-promo-slide"
            key={i}
            style={b.type === "img" ? undefined : { background: b.bg }}
            onClick={() => onBanner && onBanner(b.link)}
          >
            {b.type === "img" && <img className="shop-promo-bg" src={b.bg} alt="" draggable="false" />}
            {b.illus && <PromoIllus kind={b.illus} />}
            {b.img && <img className="shop-promo-prod" style={b.imgH ? { height: b.imgH } : undefined} src={b.img} alt="" draggable="false" />}
            <div className="shop-promo-txt" style={{ color: b.titleColor }}>
              {b.title.map((line, k) => (
                <Fragment key={k}>
                  {k > 0 && <br />}
                  {line}
                </Fragment>
              ))}
            </div>
            <div className="shop-promo-sub" style={{ color: b.subColor }}>
              {b.sub}
            </div>
          </div>
        ))}
      </div>
      <span className="shop-promo-page">{(idx % n) + 1}/{n}</span>
    </div>
  );
}
// 만족/폐기 피처드 캐러셀 (스와이프 시 아래 그리드 갱신)
function ShopFeatSection({ title, items, pool, kind, onSeeAll, onProductClick }) {
  const [idx, setIdx] = useState(0);
  const onScroll = (e) => {
    const w = e.target.firstChild ? e.target.firstChild.offsetWidth : e.target.clientWidth;
    setIdx(Math.min(items.length - 1, Math.round(e.target.scrollLeft / (w + 12))));
  };
  const gridItems = items[idx].grid.map((gi) => pool[gi]);
  return (
    <>
      <div className="section-head shop-sec-head">
        <h2 className="section-title">{title}</h2>
      </div>
      <div className="shop-feat-scroll" onScroll={onScroll}>
        {items.map((it, i) => {
          const clickable = canShopDetail(it.feat);
          return (
            <div className={"shop-feat" + (kind === "exp" ? " exp" : "") + (clickable ? " link" : "")} key={i} onClick={() => clickable && onProductClick(it.feat)}>
              <div className="shop-feat-top">
                <div className="shop-feat-thumb">
                  {kind === "exp" && it.feat.badge && <ExpiryBadge label={it.feat.badge} />}
                  <img src={it.feat.img} alt="" draggable="false" />
                </div>
                <div className="shop-feat-info">
                  <div className="shop-feat-brand">
                    {it.feat.brand} <span className={"tag " + it.feat.tags[0][1]}>{it.feat.tags[0][0]}</span>
                  </div>
                  <div className="shop-feat-name">{it.feat.name}</div>
                </div>
              </div>
              {kind === "sat" ? (
                <div className="shop-feat-chips">
                  {it.feat.chips.map((c) => (
                    <span className="shop-feat-chip" key={c}>
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="shop-feat-use">{it.feat.use}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="shop-feat-dots">
        {items.map((_, i) => (
          <span className={idx === i ? "on" : ""} key={i} />
        ))}
      </div>
      <div className="sameline-grid shop-grid">
        {gridItems.map((p, k) => (
          <button className="sameline-card shop-card" key={k} onClick={() => canShopDetail(p) && onProductClick && onProductClick(p)}>
            <div className="sameline-thumb">
              <img src={p.img} alt="" draggable="false" />
            </div>
            <div className="sameline-brand">{p.brand}</div>
            <div className="sameline-name">{p.name}</div>
            <div className="sameline-price">
              {p.off && <span className="sameline-off">{p.off}</span>} {p.price}
              {p.was && <span className="shop-was">{p.was}</span>}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
function ShoppingPage({ onNav, onProductClick, onSearch, onSeeAll, onCart, cartCount = 0, onQuick, onBanner }) {
  const [cat, setCat] = useState("전체");
  const [disc] = useState(() => {
    // 진입마다 다른 카테고리 (localStorage로 새로고침에도 순환)
    let n = 0;
    try {
      n = parseInt(localStorage.getItem("shopEnter") || "0", 10) || 0;
      localStorage.setItem("shopEnter", String((n + 1) % SHOP_DISCOUNT.length));
    } catch {
      n = _shopEnter++;
    }
    return SHOP_DISCOUNT[n % SHOP_DISCOUNT.length];
  });
  const card = (p, key) => (
    <button className="sameline-card shop-card" key={key} onClick={() => canShopDetail(p) && onProductClick && onProductClick(p)}>
      <div className="sameline-thumb">
        <img src={p.img} alt="" draggable="false" />
      </div>
      <div className="sameline-brand">{p.brand}</div>
      <div className="sameline-name">{p.name}</div>
      <div className="sameline-price">
        {p.off && <span className="sameline-off">{p.off}</span>} {p.price}
        {p.was && <span className="shop-was">{p.was}</span>}
      </div>
    </button>
  );
  const sectionHead = (title) => (
    <div className="section-head shop-sec-head">
      <h2 className="section-title">{title}</h2>
      <button className="see-all shop-see-all" onClick={onSeeAll}>
        전체보기 <ChevronRight />
      </button>
    </div>
  );
  return (
    <div className="cabinetpage shoppage">
      <img className="ap-statusbar" src="/statusbar.svg" alt="" draggable="false" />
      <div className="ap-header shop-header">
        <h1 className="ap-title">쇼핑</h1>
        <button className="shop-cart" aria-label="장바구니" onClick={onCart}>
          <CartIcon />
          {cartCount > 0 && <span className="shop-cart-badge">{cartCount}</span>}
        </button>
      </div>
      <div className="cabinet-scroll shop-scroll">
        {/* 검색바 → 검색 페이지 */}
        <button className="shop-search" onClick={onSearch}>
          <span className="shop-search-ph">제품명, 브랜드를 입력하세요</span>
          <SearchIcon />
        </button>
        {/* 카테고리 칩 */}
        <div className="shop-chips">
          {SHOP_CATS.map((c) => (
            <button key={c} className={"rt-chip shop-chip" + (cat === c ? " on" : "")} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
        {/* 프로모 배너 — 자동 스와이프 5개 무한루프 */}
        <ShopPromoCarousel onBanner={onBanner} />
        {/* 아이콘 숏컷 */}
        <div className="shop-icons">
          {SHOP_ICONS.map((s) => (
            <button className="shop-icon" key={s.label} onClick={() => onQuick && onQuick(s.label)}>
              <span className="shop-icon-circle">
                {s.badge && <BlobBadge label={s.badge} />}
                <img src={s.img} alt="" draggable="false" />
              </span>
              <span className="shop-icon-label">{s.label}</span>
            </button>
          ))}
        </div>
        <div className="shop-divider" />
        <div className="shop-pad">
          {/* 주빈님 피부를 위한 추천 */}
          {sectionHead("주빈님 피부를 위한 추천")}
          <div className="sameline-grid shop-grid">{(SHOP_CAT_REC[cat] || SHOP_REC).map((p, i) => card(p, i))}</div>

          {/* 만족한 제품이랑 비슷해요 — 캐러셀(스와이프 시 그리드 갱신) */}
          <ShopFeatSection title="만족한 제품이랑 비슷해요" items={SHOP_SAT_ITEMS} pool={SAT_POOL} kind="sat" onSeeAll={onSeeAll} onProductClick={onProductClick} />

          {/* 폐기예정인 제품이랑 비슷해요 — 캐러셀 */}
          <ShopFeatSection title="폐기예정인 제품이랑 비슷해요" items={SHOP_EXP_ITEMS} pool={EXP_POOL} kind="exp" onSeeAll={onSeeAll} onProductClick={onProductClick} />

          {/* [카테고리] 지금 사면 할인해요 — 진입마다 다른 카테고리, 코랄 강조 */}
          <div className="section-head shop-sec-head">
            <h2 className="section-title">
              <span className="shop-cat-hl">{disc.cat}</span> 지금 사면 할인해요
            </h2>
          </div>
          <div className="sameline-grid shop-grid">{disc.items.map((p, i) => card(p, i))}</div>

          {/* 하단 배너 (707-16388: 회색 박스 + 25px) — 위 50px / 아래(네비바) 50px */}
          <button className="shop-banner shop-banner-gap">
            <span className="shop-banner-box">
              <img className="shop-banner-ic" src="/img/shop/banner_ic.png" alt="" draggable="false" />
            </span>
            <span className="shop-banner-txt">
              <span className="shop-banner-t1">해당제품이 효과적이였다면?</span>
              <span className="shop-banner-t2">히스토리에 제품 효과 작성하기</span>
            </span>
            <ChevronRight />
          </button>
        </div>
      </div>
      <BottomNav active="left" onNav={onNav} />
    </div>
  );
}

export default function App() {
  const [saved] = useState(loadSavedState); // 세션 저장 상태 1회 로드
  // 온보딩: 새 세션(껐다 켬)일 때만 노출. 새로고침 시엔 저장된 화면을 그대로 복원.
  const [onboarding, setOnboarding] = useState(saved ? !!saved.onboarding : true);
  const [page, setPage] = useState(saved?.page ?? "main"); // main | add | search | register | confirm
  const [searchPicked, setSearchPicked] = useState(saved?.searchPicked ?? []); // 검색 선택(검색어 바뀌어도 유지)
  const [searchQuery, setSearchQuery] = useState(saved?.searchQuery ?? ""); // 검색 페이지 초기 검색어
  const [searchBcat, setSearchBcat] = useState("전체"); // 검색(브라우즈) 카테고리 — 상세 왕복 시 유지
  const [searchPageNum, setSearchPageNum] = useState(1); // 검색 페이지네이션 — 상세 왕복 시 유지
  const [regResult, setRegResult] = useState(saved?.regResult ?? []); // 등록 완료된 제품 rows
  const [albumPicked, setAlbumPicked] = useState([]); // 앨범에서 선택한 사진 셀 인덱스
  const [reqReturn, setReqReturn] = useState("search"); // 상품 등록 요청 페이지에서 뒤로 갈 화면
  const [albumFrom, setAlbumFrom] = useState("add"); // 앨범(최근 항목) 진입 출처: add | request
  const [cabinetInit, setCabinetInit] = useState(null); // 내 화장대 진입 초기 상태 {tab, scroll}
  const [detailProduct, setDetailProduct] = useState(null); // 제품 상세 대상
  const [munjinAnswers, setMunjinAnswers] = useState(null); // 문진 응답 → 결과 산출
  const [detailReturn, setDetailReturn] = useState("cabinet"); // 상세페이지에서 뒤로 갈 페이지
  const [searchReturn, setSearchReturn] = useState("add"); // 검색페이지에서 뒤로 갈 페이지
  const openProduct = (p, from) => {
    setDetailProduct(p);
    setDetailReturn(from);
    setPage("pdetail");
  };
  const [shopDetailProduct, setShopDetailProduct] = useState(null); // 쇼핑 제품 상세
  const [shopDetailReturn, setShopDetailReturn] = useState("shop");
  const openShopDetail = (p, from) => {
    setShopDetailProduct(p);
    setShopDetailReturn(from || "shop");
    setPage("shopdetail");
  };
  // 쇼핑 결제 플로우
  const [cartItems, setCartItems] = useState(CART_INIT); // 장바구니
  const [checkoutItems, setCheckoutItems] = useState([]); // 결제 대상 상품
  const [paidItems, setPaidItems] = useState([]); // 결제 완료 상품
  const [cartReturn, setCartReturn] = useState("shop"); // 장바구니 진입 출처
  const [payReturn, setPayReturn] = useState("shopdetail"); // 결제 진입 출처
  const [regProducts, setRegProducts] = useState(null); // 개봉일 입력 대상 제품(구매완료 후 등록)
  const [regReturn, setRegReturn] = useState("search"); // 개봉일 입력 페이지에서 뒤로 갈 화면
  const [reqBrand, setReqBrand] = useState(""); // 상품 등록 요청: 브랜드 (앨범 왕복에도 유지)
  const [reqName, setReqName] = useState(""); // 상품 등록 요청: 상품 이름
  const [reqImageCells, setReqImageCells] = useState([]); // 상품 등록 요청: 선택한 앨범 셀들
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAi, setModalAi] = useState(false); // AI 추천 모드로 열기
  const [modalEdit, setModalEdit] = useState(null); // 루틴 편집 프리필 데이터
  const openEditRoutine = (data) => { setModalEdit(data); setModalOpen(true); };
  const [modalSeed, setModalSeed] = useState(null); // AI 추천에 사용할 시드 제품
  const [view, setView] = useState("schedule"); // schedule | agenda
  const [timeTab, setTimeTab] = useState(currentSection); // 서버 시간대 기본값
  const [routines, setRoutines] = useState(makeTodayRoutines);
  const [scheduleCards, setScheduleCards] = useState([]); // AI로 추가한 루틴 → 시계 뷰 카드
  const [menuOpen, setMenuOpen] = useState(false); // 전체 메뉴(햄버거) 드로어

  // 화면/선택 상태가 바뀔 때마다 세션에 저장 → 새로고침해도 그 자리에 머묾
  useEffect(() => {
    try {
      sessionStorage.setItem(
        CK_KEY,
        JSON.stringify({ onboarding, page, searchPicked, searchQuery, regResult })
      );
    } catch {}
  }, [onboarding, page, searchPicked, searchQuery, regResult]);

  // 오늘 사용 추천 진입 전 메인 스크롤 위치 저장 → 복귀 시 복원
  const mainScrollRef = useRef(null);
  const savedMainScroll = useRef(null);
  useLayoutEffect(() => {
    if (page === "main" && savedMainScroll.current != null && mainScrollRef.current) {
      const el = mainScrollRef.current;
      const y = savedMainScroll.current;
      savedMainScroll.current = null;
      el.scrollTop = y;
      // 이미지 로드로 스크롤 높이가 늘어나면 clamp 되므로 몇 차례 재적용
      requestAnimationFrame(() => { el.scrollTop = y; });
      const t1 = setTimeout(() => { el.scrollTop = y; }, 90);
      const t2 = setTimeout(() => { el.scrollTop = y; }, 260);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [page]);

  const toggleRoutine = (tab, i) =>
    setRoutines((r) => ({
      ...r,
      [tab]: r[tab].map((it, j) => (j === i ? { ...it, done: !it.done } : it)),
    }));

  const saveRoutine = ({ name, timeChips, products }) => {
    const tabs = timeChips && timeChips.length ? timeChips : ["아침"]; // 미선택 시 아침
    setRoutines((r) => {
      const next = { ...r };
      tabs.forEach((tab) => {
        next[tab] = [...next[tab], { text: name, done: false }];
      });
      return next;
    });
    // 시계(스케줄) 뷰용 카드도 추가 → 리스트/시계 양쪽에 반영
    setScheduleCards((cards) => [...cards, { title: name, tabs, products: products || [] }]);
    setTimeTab(tabs[0]);
    setView("agenda"); // 저장 후 스택형에서 방금 추가한 루틴이 보이게
    setModalOpen(false);
  };

  const deleteRoutines = (tab, indices) =>
    setRoutines((r) => ({
      ...r,
      [tab]: r[tab].filter((_, i) => !indices.includes(i)),
    }));

  if (onboarding) {
    return (
      <div className="phone">
        <Onboarding onDone={() => setOnboarding(false)} />
      </div>
    );
  }

  const goHome = () => {
    setRegResult([]);
    setSearchPicked([]);
    setPage("main");
  };

  // 전체 메뉴(햄버거) → 각 기능 페이지로 이동
  const onMenuNav = (nav) => {
    if (nav === "add") setPage("add");
    else if (nav === "cabinet") { setCabinetInit(null); setPage("cabinet"); }
    else if (nav === "expiry") { setCabinetInit({ tab: "유통기한", scroll: true }); setPage("cabinet"); }
    else if (nav === "routine") { setCabinetInit({ tab: "루틴" }); setPage("cabinet"); }
    else if (nav === "combo") { setCabinetInit({ tab: "루틴", chip: "제품조합" }); setPage("cabinet"); }
    else if (nav === "bottle") { setCabinetInit({ tab: "루틴", chip: "공병 만들기" }); setPage("cabinet"); }
    else if (nav === "skincond") setPage("skincond");
    else if (nav === "weather") setPage("weather");
    else if (nav === "shop") setPage("shop");
    else if (nav === "search") {
      setSearchReturn("shop");
      setSearchQuery("");
      setSearchBcat("전체");
      setSearchPageNum(1);
      setPage("search");
    }
  };

  // 최근 등록 제품 클릭 → 제품 찾기로 (카테고리 검색 + 해당 제품 선택된 채)
  const pickRecent = (product) => {
    const category = product.tags[0][0]; // 라벨 (예: 크림)
    const type = product.tags[0][1]; // 타입 (예: cream)
    // 같은 브랜드+카테고리 우선, 없으면 같은 카테고리 첫 항목
    let idx = SEARCH_RESULTS.findIndex(
      (s) => s.brand === product.brand && s.tags[0][1] === type
    );
    if (idx < 0) idx = SEARCH_RESULTS.findIndex((s) => s.tags[0][1] === type);
    setSearchPicked(idx >= 0 ? [idx] : []);
    setSearchQuery(category);
    setSearchBcat("전체");
    setSearchPageNum(1);
    setSearchReturn("add");
    setPage("search");
  };

  return (
    <div className="phone">
      {page === "album" ? (
        <AlbumPage
          initialSel={albumFrom === "request" ? reqImageCells : []}
          onBack={() => setPage(albumFrom === "request" ? "reqproduct" : "add")}
          onRegister={(sel) => {
            if (albumFrom === "request") {
              // 상품 등록 요청의 이미지 선택 → 선택 저장 후 요청 페이지로 복귀 (갤러리 역할)
              setReqImageCells(sel);
              setPage("reqproduct");
            } else {
              setAlbumPicked(sel);
              setPage("importflow");
            }
          }}
        />
      ) : page === "importflow" ? (
        <ImportFlow
          picked={albumPicked}
          onBack={() => setPage("album")}
          onDone={() => goHome()}
          onRegister={(prods) => {
            setRegProducts(prods);
            setRegReturn("importflow");
            setPage("register");
          }}
          onRequest={() => {
            setReqReturn("importflow");
            setPage("reqproduct");
          }}
        />
      ) : page === "register" ? (
        <RegisterPage
          picked={searchPicked}
          products={regProducts}
          onBack={() => { setRegProducts(null); setPage(regReturn); }}
          onRegister={(rows) => {
            setRegResult(rows);
            setRegProducts(null);
            setPage("confirm");
          }}
        />
      ) : page === "confirm" ? (
        <ConfirmPage rows={regResult} onHome={goHome} onCabinet={goHome} />
      ) : page === "cabinet" ? (
        <CabinetPage
          initialTab={cabinetInit?.tab ?? "제품"}
          initialChip={cabinetInit?.chip}
          autoScroll={cabinetInit?.scroll ?? false}
          onAddProduct={() => setPage("add")}
          onNav={(w) => (w === "left" ? setPage("shop") : w === "center" ? goHome() : null)}
          onCreateRoutine={() => setModalOpen(true)}
          onProductClick={(p) => openProduct(p, "cabinet")}
        />
      ) : page === "pdetail" ? (
        <ProductDetail
          product={detailProduct}
          onBack={() => setPage(detailReturn)}
          onDelete={() => setPage(detailReturn)}
          onCreateRoutine={(seed) => {
            setModalSeed(seed);
            setModalAi(true);
            setModalOpen(true);
          }}
        />
      ) : page === "shop" ? (
        <ShoppingPage
          onNav={(w) => {
            if (w === "right") {
              setCabinetInit(null);
              setPage("cabinet");
            } else if (w === "center") {
              setPage("main");
            }
          }}
          onProductClick={(p) => openShopDetail(p, page)}
          onCart={() => { setCartReturn("shop"); setPage("cart"); }}
          cartCount={cartItems.length}
          onSearch={() => {
            setSearchReturn("shop");
            setSearchQuery("");
            setSearchBcat("전체");
            setSearchPageNum(1);
            setPage("search");
          }}
          onSeeAll={() => {
            setSearchReturn("shop");
            setSearchQuery("");
            setSearchBcat("전체");
            setSearchPageNum(1);
            setPage("search");
          }}
          onQuick={(label) => {
            if (label === "최적의 루틴") {
              setCabinetInit({ tab: "루틴", chip: "제품조합" });
              setPage("cabinet");
            } else if (label === "유통기한 임박") {
              setCabinetInit({ tab: "유통기한", scroll: true });
              setPage("cabinet");
            } else if (label === "미세먼지 차단" || label === "환절기 추천") {
              setPage("weather");
            } else if (label === "피부 진단") {
              setPage("skincond");
            }
          }}
          onBanner={(link) => {
            if (link && link.detail) {
              openShopDetail(AESTURA_ITEM, "shop");
            } else {
              setSearchReturn("shop");
              setSearchQuery(link && link.q ? link.q : "");
              setSearchBcat("전체");
              setSearchPageNum(1);
              setPage("search");
            }
          }}
        />
      ) : page === "shopdetail" ? (
        <ShopProductDetail
          onBack={() => setPage(shopDetailReturn)}
          onCart={() => { setCartReturn("shopdetail"); setPage("cart"); }}
          cartCount={cartItems.length}
          onBuy={() => {
            setCheckoutItems([{ ...AESTURA_ITEM, selected: true }]);
            setPayReturn("shopdetail");
            setPage("payment");
          }}
          onSearch={() => {
            setSearchReturn("shopdetail");
            setSearchQuery("");
            setSearchBcat("전체");
            setSearchPageNum(1);
            setPage("search");
          }}
          onRoutine={() => {
            setCabinetInit({ tab: "루틴", chip: "제품조합" });
            setPage("cabinet");
          }}
        />
      ) : page === "cart" ? (
        <CartPage
          items={cartItems}
          setItems={setCartItems}
          onBack={() => setPage(cartReturn)}
          onOrder={(sel) => {
            setCheckoutItems(sel);
            setPayReturn("cart");
            setPage("payment");
          }}
        />
      ) : page === "payment" ? (
        <PaymentPage
          items={checkoutItems}
          onBack={() => setPage(payReturn)}
          onPay={(list) => {
            setPaidItems(list);
            setPage("orderloading");
          }}
        />
      ) : page === "orderloading" ? (
        <OrderLoadingPage onDone={() => setPage("ordercomplete")} />
      ) : page === "ordercomplete" ? (
        <OrderCompletePage
          items={paidItems}
          onContinue={() => setPage("shop")}
          onHome={() => goHome()}
          onRegister={() => {
            setRegProducts(paidItems && paidItems.length ? paidItems : [AESTURA_ITEM]);
            setRegReturn("ordercomplete");
            setPage("register");
          }}
        />
      ) : page === "weather" ? (
        <WeatherPage
          onBack={() => setPage("main")}
          onNav={(w) => {
            if (w === "right") {
              setCabinetInit(null);
              setPage("cabinet");
            } else if (w === "left") {
              setPage("shop");
            } else {
              setPage("main");
            }
          }}
          onProductClick={(p) => openProduct(p, "weather")}
        />
      ) : page === "noti" ? (
        <NotificationsPage
          onBack={() => setPage("main")}
          onItem={(nav) => onMenuNav(nav)}
        />
      ) : page === "skincond" ? (
        <SkinConditionPage
          onBack={() => setPage("main")}
          onStart={() => setPage("munjin")}
          onRegister={() => setPage("add")}
        />
      ) : page === "munjin" ? (
        <MunjinPage
          onBack={() => setPage("skincond")}
          onClose={() => setPage("skincond")}
          onComplete={(a) => {
            setMunjinAnswers(a);
            setPage("skinanalyzing");
          }}
        />
      ) : page === "skinanalyzing" ? (
        <SkinAnalyzing onDone={() => setPage("skinresult")} />
      ) : page === "skinresult" ? (
        <SkinResultPage
          onBack={() => setPage("skincond")}
          onDone={() => setPage("main")}
          onProductClick={(p) => openProduct(p, "skinresult")}
          answers={munjinAnswers}
        />
      ) : page === "reqproduct" ? (
        <RequestPage
          brand={reqBrand}
          setBrand={setReqBrand}
          name={reqName}
          setName={setReqName}
          imageCells={reqImageCells}
          onBack={() => setPage(reqReturn)}
          onPickImage={() => {
            setAlbumFrom("request");
            setPage("album");
          }}
          onSubmit={() => setPage("reqdone")}
        />
      ) : page === "reqdone" ? (
        <RequestDonePage
          onDone={() => {
            // 폼 초기화 후 "상품 정보 등록하기" 누르기 전 화면으로 복귀
            setReqBrand("");
            setReqName("");
            setReqImageCells([]);
            setPage(reqReturn);
          }}
        />
      ) : (
        <>
          <div
            ref={mainScrollRef}
            className={
              "screen" +
              (page === "main" ? "" : " no-nav") +
              (page === "search" && searchPicked.length ? " sel-active" : "")
            }
            key={page}
          >
        {page === "search" ? (
          <SearchPage
            onBack={() => setPage(searchReturn)}
            picked={searchPicked}
            initialQuery={searchQuery}
            onQueryChange={setSearchQuery}
            initialBcat={searchBcat}
            onBcatChange={setSearchBcat}
            initialPage={searchPageNum}
            onPageChange={setSearchPageNum}
            browse={searchReturn === "shop" || searchReturn === "shopdetail"}
            onProductClick={(p) => openShopDetail(p, page)}
            onNav={(w) => {
              if (w === "right") {
                setCabinetInit(null);
                setPage("cabinet");
              } else if (w === "center") {
                setPage("main");
              } else {
                setPage("shop");
              }
            }}
            onRequest={() => {
              setReqReturn("search");
              setPage("reqproduct");
            }}
            onTogglePick={(i) =>
              setSearchPicked((s) =>
                s.includes(i) ? s.filter((x) => x !== i) : [...s, i]
              )
            }
          />
        ) : page === "add" ? (
          <AddProductPage
            onBack={() => setPage("main")}
            onOpenSearch={() => {
              setSearchPicked([]); // 검색 진입 시 선택 초기화 (검색어 변경 중엔 유지)
              setSearchQuery("");
              setSearchBcat("전체");
              setSearchPageNum(1);
              setSearchReturn("add");
              setPage("search");
            }}
            onPickRecent={pickRecent}
            onImport={() => {
              setAlbumFrom("add");
              setPage("album");
            }}
          />
        ) : (
          <>
            <Hero
              onSeeAll={() => {
                setCabinetInit({ tab: "유통기한", scroll: true });
                setPage("cabinet");
              }}
              onMenu={() => setMenuOpen(true)}
              onBell={() => setPage("noti")}
            />
            <EntryCards onAddProduct={() => setPage("add")} onSkinCondition={() => setPage("skincond")} />
            <TodayRoutine
              view={view}
              setView={setView}
              timeTab={timeTab}
              setTimeTab={setTimeTab}
              routines={routines}
              onToggleRoutine={toggleRoutine}
              onDeleteRoutines={deleteRoutines}
              onCreateRoutine={() => setModalOpen(true)}
              onEditRoutine={openEditRoutine}
              scheduleCards={scheduleCards}
            />
            <div className="section-divider" />
            <Weather
              onSeeAll={() => {
                savedMainScroll.current = mainScrollRef.current?.scrollTop ?? 0;
                setPage("weather");
              }}
            />
            <div className="section-divider" />
            <FirstUse
              onSeeAll={() => {
                setCabinetInit({ tab: "유통기한", scroll: true });
                setPage("cabinet");
              }}
            />
            <PromoCarousel />
          </>
        )}
      </div>
      {/* 뒤로가기 있는 서브 페이지는 하단 네비 숨김 (홈 인디케이터만 유지) */}
      {page === "main" ? (
        <BottomNav
          active="center"
          onNav={(w) => {
            if (w === "right") {
              setCabinetInit(null);
              setPage("cabinet");
            } else if (w === "left") {
              setPage("shop");
            }
          }}
        />
      ) : (
        <div className="home-indicator" />
      )}
      {/* 검색 선택 시 하단: 선택 썸네일 + 확인 바 */}
      {page === "search" && searchPicked.length > 0 && (
        <div className="sel-panel">
          <div className="sel-picked">
            {searchPicked.map((i) => (
              <button
                className="sel-thumb"
                key={i}
                onClick={() => setSearchPicked((s) => s.filter((x) => x !== i))}
                aria-label="선택 해제"
              >
                <img src={SEARCH_RESULTS[i].img} alt="" />
                <span className="sel-thumb-check">
                  <svg width="11" height="8" viewBox="0 0 13 10" fill="none">
                    <path d="M1.5 5.2L4.8 8.4L11.2 1.6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
          <div className="sel-bar">
            <button className="sel-clear" onClick={() => setSearchPicked([])}>
              전체해제
            </button>
            <button className="sel-confirm" onClick={() => setPage("register")}>
              확인 ({searchPicked.length})
            </button>
          </div>
        </div>
          )}
        </>
      )}
      <RoutineModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalAi(false);
          setModalSeed(null);
          setModalEdit(null);
        }}
        onSave={saveRoutine}
        initialAi={modalAi}
        seedProduct={modalSeed}
        editData={modalEdit}
      />
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={onMenuNav} />
    </div>
  );
}
