import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ErrorInfo, ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  House,
  Info,
  Map,
  Menu,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Ticket,
  X,
} from "lucide-react";
import { exhibition } from "./data/config";
import { atrium, exhibits, halls, sources, type HallId } from "./data/museum";
import { HallTitle } from "./components/HallTitle";
import {
  advanceTour,
  emptyProgress,
  parseProgress,
  stampedHalls,
  STORAGE_KEY,
  visit,
  type TourState,
} from "./lib/state";
import {
  MobileControls,
  Modal,
  Quiz,
  SafeImage,
  SourceLinks,
} from "./components/UI";
import type { Controls, Navigation } from "./components/MuseumScene";
import type { ImageStatus } from "./components/ExhibitPanel";
const MuseumScene = lazy(() => import("./components/MuseumScene"));
const ModelViewer = lazy(() => import("./components/ModelViewer"));
class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onError?: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.error("3D:", error);
    this.props.onError?.();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
type Panel =
  | "catalog"
  | "passport"
  | "sources"
  | "about"
  | "help"
  | "map"
  | "menu"
  | "settings"
  | null;
function supportsWebGL() {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}
function SunMark() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="13" />
      <circle cx="24" cy="24" r="5" />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i * Math.PI) / 8;
        return (
          <path
            key={i}
            d={`M ${24 + Math.cos(a) * 16} ${24 + Math.sin(a) * 16} L ${24 + Math.cos(a) * 21} ${24 + Math.sin(a) * 21}`}
          />
        );
      })}
      <path d="M11 24h26M24 11v26" />
    </svg>
  );
}
export default function App() {
  const [imageRetry, setImageRetry] = useState(0);
  const [imageErrors, setImageErrors] = useState<string[]>([]);
  const onImageStatus = useCallback((id: string, status: ImageStatus) => {
    setImageErrors((previous) =>
      status === "error"
        ? previous.includes(id)
          ? previous
          : [...previous, id]
        : previous.includes(id)
          ? previous.filter((item) => item !== id)
          : previous,
    );
  }, []);
  const retryImages = () => {
    setImageErrors([]);
    setImageRetry((value) => value + 1);
  };
  const [intro, setIntro] = useState(true),
    [walking, setWalking] = useState(false),
    [panel, setPanel] = useState<Panel>(null),
    [selected, setSelected] = useState<string | null>(null);
  const [room, setRoom] = useState<HallId | "atrium">("atrium"),
    [target, setTarget] = useState<string | null>(null),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(() => !supportsWebGL()),
    [attempt, setAttempt] = useState(0);
  const [quality, setQuality] = useState("auto"),
    [navigation, setNavigation] = useState<Navigation>({
      id: 0,
      room: "atrium",
    }),
    [tour, setTour] = useState<TourState>(null),
    [arrived, setArrived] = useState(false);
  const [progress, setProgress] = useState(() => {
      try {
        return parseProgress(localStorage.getItem(STORAGE_KEY));
      } catch {
        return emptyProgress();
      }
    }),
    [storageError, setStorageError] = useState(false);
  const [filter, setFilter] = useState<HallId | "all">("all"),
    [modelExpanded, setModelExpanded] = useState(false),
    [reset, setReset] = useState(false),
    [wish, setWish] = useState(progress.wish),
    [wishSaved, setWishSaved] = useState(false);
  const controls = useRef<Controls>({
    forward: 0,
    strafe: 0,
    yaw: 0,
    pitch: 0,
  });
  const tourRef = useRef(tour);
  tourRef.current = tour;
  const stamps = stampedHalls(progress),
    activeHall = halls.find((h) => h.id === room),
    exhibit = exhibits.find((e) => e.id === selected),
    tourExhibit = tour ? exhibits[tour.index] : null;
  const blocked = !!panel || !!selected;
  useEffect(() => {
    document.title = `${exhibition.title} — ${exhibition.subtitle.toLocaleLowerCase()}`;
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [progress]);
  const unlock = () => {
    if (document.pointerLockElement) document.exitPointerLock();
  };
  const openExhibit = useCallback((id: string) => {
    setModelExpanded(false);
    setSelected(id);
    setPanel(null);
    setProgress((p) => visit(p, id));
  }, []);
  const showPanel = (p: Panel) => {
    setPanel(p);
    setSelected(null);
  };
  const closeModal = () => {
    setPanel(null);
    setSelected(null);
    setReset(false);
  };
  const navigate = (id: HallId | "atrium") => {
    setIntro(false);
    setTour(null);
    setWalking(true);
    setPanel(null);
    setSelected(null);
    setNavigation((n) => ({ id: n.id + 1, room: id }));
  };
  const startWalk = () => {
    setIntro(false);
    setTour(null);
    setWalking(true);
    setPanel(null);
    setNavigation((n) => ({ id: n.id + 1, room: "atrium" }));
  };
  const startTour = () => {
    unlock();
    setIntro(false);
    setWalking(false);
    setPanel(null);
    setSelected(null);
    setTour({ index: 0, paused: false });
  };
  useEffect(() => {
    if (!tour) return;
    const e = exhibits[tour.index];
    setArrived(false);
    setNavigation((n) => ({ id: n.id + 1, room: e.hall, exhibit: e.id }));
  }, [tour?.index]);
  const onArrive = useCallback(() => {
    setArrived(true);
    const currentTour = tourRef.current;
    if (currentTour) {
      // The tour may end before React applies this queued progress update.
      const exhibitId = exhibits[currentTour.index].id;
      setProgress((p) => visit(p, exhibitId));
    }
  }, []);
  const advance = (direction: number) => {
    setArrived(false);
    setTour((t) => advanceTour(t, direction, exhibits.length));
  };
  useEffect(() => {
    if (!tour || tour.paused || !arrived || blocked) return;
    const timer = setTimeout(() => {
      setArrived(false);
      setTour((t) => advanceTour(t, 1, exhibits.length));
    }, 21000);
    return () => clearTimeout(timer);
  }, [tour, arrived, blocked]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !blocked && !intro) {
        e.preventDefault();
        setPanel("menu");
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [blocked, intro]);
  useEffect(() => {
    if (blocked) unlock();
  }, [blocked]);
  const retry = () => {
    // Reload also retries a rejected lazy-module download, which React.lazy caches.
    window.location.reload();
  };
  const fallback = (
    <div className="scene-error">
      <Compass size={38} />
      <h2>Музей доступен в каталоге</h2>
      <p>
        Не удалось открыть 3D-сцену. Все истории, вопросы и паспорт по-прежнему
        доступны.
      </p>
      <button className="primary" onClick={() => showPanel("catalog")}>
        Открыть каталог <ArrowRight size={17} />
      </button>
      <button className="text-button" onClick={retry}>
        Повторить загрузку 3D
      </button>
    </div>
  );
  const catalogue = (
    <>
      <p className="lead">
        Исследуйте музей в своём темпе. Открывайте экспонаты, чтобы собирать
        отметки в паспорте.
      </p>
      {imageErrors.length > 0 && (
        <button className="secondary image-retry" onClick={retryImages}>
          Повторить загрузку изображений
        </button>
      )}
      <div className="filter-row" role="group" aria-label="Фильтр залов">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          Все залы
        </button>
        {halls.map((h) => (
          <button
            key={h.id}
            className={filter === h.id ? "active" : ""}
            onClick={() => setFilter(h.id)}
          >
            <HallTitle place={h} />
          </button>
        ))}
      </div>
      <div className="catalog-grid">
        {exhibits
          .filter((e) => filter === "all" || filter === e.hall)
          .map((e) => (
            <button
              className="catalog-card"
              key={e.id}
              onClick={() => openExhibit(e.id)}
            >
              <SafeImage
                exhibit={e}
                retryToken={imageRetry}
                onFailure={() => onImageStatus(e.id, "error")}
              />
              {e.imageKind === "illustration" && (
                <span className="media-label">Иллюстрация</span>
              )}
              <div>
                <HallTitle place={halls.find((h) => h.id === e.hall)!} />
                {progress.visited.includes(e.id) && (
                  <span className="eyebrow">ПРОСМОТРЕНО</span>
                )}
                <h3>{e.title}</h3>
                <p>{e.caption}</p>
                <span className="card-arrow">
                  <ArrowUpRight size={19} />
                </span>
              </div>
            </button>
          ))}
      </div>
    </>
  );
  const title = selected
    ? exhibit?.title
    : (
        {
          catalog: "Коллекция музея",
          passport: "Паспорт путешественника",
          sources: "Источники и материалы",
          about: "Об авторе выставки",
          help: "Как исследовать музей",
          map: "Шесть залов. Одна история.",
          menu: "Продолжим путешествие?",
          settings: "Настройки музея",
        } as Record<string, string>
      )[panel || ""];
  return (
    <div className={`app ${intro ? "is-intro" : ""}`}>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            setIntro(true);
            setWalking(false);
            setTour(null);
            setPanel(null);
            setSelected(null);
            setAttempt((n) => n + 1);
            setReady(false);
          }}
          aria-label={`${exhibition.title} — главная`}
        >
          <span className="brand-icon">
            <SunMark />
          </span>
          <span>
            <strong>{exhibition.title}</strong>
            <small>ВИРТУАЛЬНЫЙ МУЗЕЙ</small>
          </span>
        </button>
        <nav className="top-nav" aria-label="Основная навигация">
          <button onClick={() => showPanel("map")}>Залы музея</button>
          <button onClick={() => showPanel("catalog")}>Каталог</button>
          <button onClick={() => showPanel("about")}>Об авторе</button>
        </nav>
        <div className="header-actions">
          <span className="language" title="Язык интерфейса: русский">
            RU
          </span>
          <button
            className="passport-button"
            onClick={() => showPanel("passport")}
          >
            <Ticket size={18} />
            <span>Мой паспорт</span>
            <b>{stamps.length}/6</b>
          </button>
          <button
            className="icon-button mobile-menu"
            aria-label="Открыть меню"
            onClick={() => showPanel("menu")}
          >
            <Menu />
          </button>
        </div>
      </header>
      <main className="museum-stage" aria-label="Виртуальный музей">
        <div className="scene-container">
          {failed ? (
            fallback
          ) : (
            <SceneBoundary
              key={attempt}
              fallback={fallback}
              onError={() => setFailed(true)}
            >
              <Suspense
                fallback={
                  <div className="loading">
                    <span />
                    Загружаем пространство музея…
                  </div>
                }
              >
                <MuseumScene
                  intro={intro}
                  walking={walking && !tour}
                  blocked={blocked}
                  navigation={navigation}
                  paused={!!tour?.paused}
                  quality={quality}
                  imageRetry={imageRetry}
                  onImageStatus={onImageStatus}
                  controls={controls}
                  onRoom={setRoom}
                  onTarget={setTarget}
                  onOpen={openExhibit}
                  onArrive={onArrive}
                  onReady={() => setReady(true)}
                  onFailure={() => setFailed(true)}
                  onEscape={() => setPanel((p) => p || "menu")}
                />
              </Suspense>
            </SceneBoundary>
          )}
        </div>
        {!failed && intro && (
          <>
            <div className="intro-shade" />
            <section className="welcome">
              <div className="holiday-badge">
                <span />
                25 ҚАЗАН <i /> ДЕНЬ РЕСПУБЛИКИ
              </div>
              <div className="welcome-title">
                <span className="eyebrow">ИСТОРИЯ. КУЛЬТУРА. МЫ.</span>
                <h1>
                  {exhibition.title}
                  <span>
                    Великая степь.
                    <br />
                    Живая история.
                  </span>
                </h1>
              </div>
              <p className="welcome-description">
                Откройте Казахстан через его наследие,
                <br className="desktop-break" /> людей и мечты о будущем.
                <br className="desktop-break" /> Ваше путешествие начинается
                здесь.
              </p>
              <div className="welcome-actions">
                <button
                  className="primary"
                  onClick={startWalk}
                  disabled={!ready}
                >
                  Войти в музей <ArrowRight size={19} />
                </button>
                <button
                  className="secondary"
                  onClick={startTour}
                  disabled={!ready}
                >
                  <Play size={16} />
                  Начать экскурсию
                </button>
              </div>
              <div className="intro-facts">
                <span>
                  <b>06</b>тематических залов
                </span>
                <i />
                <span>
                  <b>6–8</b>минут на экскурсию
                </span>
              </div>
              <button
                className="catalog-link"
                onClick={() => showPanel("catalog")}
              >
                <BookOpen size={15} />
                Предпочитаете читать? Открыть каталог <ArrowUpRight size={14} />
              </button>
            </section>
            <div className="scene-caption">
              <span className="live-dot" />
              ИНТЕРАКТИВНОЕ 3D-ПРОСТРАНСТВО
              <span>
                <HallTitle place={atrium} /> <ArrowUpRight size={14} />
              </span>
            </div>
          </>
        )}
        {imageErrors.length > 0 && !blocked && (
          <div className="image-load-notice" role="status">
            <span>Некоторые изображения не загрузились.</span>
            <button onClick={retryImages}>
              Повторить загрузку изображений
            </button>
          </div>
        )}
        {!intro && !failed && (
          <>
            <div className="location-tag">
              <span className="live-dot" />
              <HallTitle place={activeHall || atrium} as="h2" />
            </div>
            {!tour && (
              <>
                <div
                  className={`crosshair ${target ? "has-target" : ""}`}
                  aria-hidden="true"
                />
                {target && (
                  <button
                    className="interaction-hint"
                    onClick={() => openExhibit(target)}
                  >
                    <kbd>E</kbd>
                    {exhibits.find((e) => e.id === target)?.title}
                    <ArrowUpRight size={16} />
                  </button>
                )}
                <div className="walk-hint">
                  <span>W A S D — движение</span>
                  <span>Клик по сцене — обзор</span>
                  <span>Esc — меню</span>
                </div>
                {walking && !blocked && (
                  <MobileControls
                    controls={controls}
                    canOpen={!!target}
                    onOpen={() => target && openExhibit(target)}
                  />
                )}
              </>
            )}
            {!tour && !walking && (
              <button
                className="resume-walk primary"
                onClick={() => setWalking(true)}
              >
                Продолжить прогулку <ArrowRight size={17} />
              </button>
            )}
          </>
        )}
        {!intro && tour && tourExhibit && !failed && (
          <section className="tour-card" aria-label="Экскурсия">
            <div className="tour-meta">
              <span>
                <Compass size={15} /> ЭКСКУРСИЯ · {tour.index + 1}/
                {exhibits.length}
              </span>
              <button
                className="icon-button"
                aria-label="Завершить экскурсию"
                onClick={() => {
                  setTour(null);
                  setWalking(true);
                }}
              >
                <X size={19} />
              </button>
            </div>
            <div className="tour-progress">
              <span
                style={{
                  width: `${((tour.index + 1) / exhibits.length) * 100}%`,
                }}
              />
            </div>
            <span className="eyebrow">
              {tour.paused
                ? "ПАУЗА"
                : arrived
                  ? "ОСТАНОВКА · 21 СЕКУНДА НА ЧТЕНИЕ"
                  : "ПЕРЕХОДИМ К ЭКСПОНАТУ"}
            </span>
            <HallTitle
              place={halls.find((h) => h.id === tourExhibit.hall)!}
              as="h2"
            />
            <h3 className="tour-exhibit-title">{tourExhibit.title}</h3>
            <p>{tourExhibit.caption}</p>
            {arrived && (
              <div className="tour-text">
                {tourExhibit.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            )}
            <button
              className="text-button"
              disabled={!arrived}
              onClick={() => openExhibit(tourExhibit.id)}
            >
              Рассмотреть и ответить на вопрос <ArrowUpRight size={15} />
            </button>
            <div className="tour-actions">
              <button
                aria-label="Назад"
                disabled={tour.index === 0}
                onClick={() => advance(-1)}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() =>
                  setTour((t) => (t ? { ...t, paused: !t.paused } : null))
                }
              >
                {tour.paused ? <Play size={16} /> : <Pause size={16} />}{" "}
                {tour.paused ? "Продолжить" : "Пауза"}
              </button>
              <button onClick={() => advance(1)}>
                {tour.index === exhibits.length - 1 ? "Завершить" : "Далее"}
                <ChevronRight size={18} />
              </button>
            </div>
          </section>
        )}
        <div className="viewer-tools">
          <button
            className="icon-button"
            aria-label="Вернуться в атриум"
            title={`${atrium.names.kk} / ${atrium.names.ru}`}
            onClick={() => navigate("atrium")}
            disabled={failed}
          >
            <House size={19} />
          </button>
          <button
            className="icon-button"
            aria-label="Инструкция"
            title="Управление"
            onClick={() => showPanel("help")}
          >
            <Info size={19} />
          </button>
          <button
            className="icon-button"
            aria-label="Настройки качества"
            title="Качество"
            onClick={() => showPanel("settings")}
          >
            <Settings2 size={19} />
          </button>
        </div>
      </main>
      <section className="rooms-bar" aria-label="Быстрый переход по залам">
        <button className="rooms-label" onClick={() => showPanel("map")}>
          <Map size={19} />
          <span>
            ВЫБЕРИТЕ
            <br />
            СВОЙ МАРШРУТ
          </span>
        </button>
        <div className="room-buttons">
          {halls.map((h) => (
            <button
              key={h.id}
              className={`room-button ${room === h.id && !intro ? "current" : ""}`}
              onClick={() =>
                failed
                  ? (setFilter(h.id), showPanel("catalog"))
                  : navigate(h.id)
              }
            >
              <HallTitle place={h} />
              {stamps.includes(h.id) ? (
                <Check size={16} aria-label="Зал исследован" />
              ) : (
                <ArrowUpRight size={14} />
              )}
            </button>
          ))}
        </div>
      </section>
      <footer className="footer">
        <button className="school-credit" onClick={() => showPanel("about")}>
          {exhibition.organizationShort}
        </button>
        <button onClick={() => showPanel("sources")}>
          Источники и материалы <ArrowUpRight size={13} />
        </button>
      </footer>
      {storageError && (
        <div className="storage-warning" role="status">
          Браузер не разрешил сохранение. Прогресс доступен до закрытия
          страницы.
        </div>
      )}
      {(panel || selected) && (
        <Modal
          title={title || "Экспонат"}
          onClose={closeModal}
          wide={panel === "catalog" || panel === "map"}
        >
          {panel === "catalog" && catalogue}
          {exhibit && (
            <article className="exhibit-detail" key={exhibit.id}>
              <button
                className="text-button back-link"
                onClick={() => {
                  setSelected(null);
                  setPanel("catalog");
                }}
              >
                <ChevronLeft size={16} />В каталог
              </button>
              <span className="exhibit-caption">{exhibit.caption}</span>
              <figure className="exhibit-figure">
                <SafeImage
                  exhibit={exhibit}
                  retryToken={imageRetry}
                  onFailure={() => onImageStatus(exhibit.id, "error")}
                />
                {exhibit.imageCaption && (
                  <figcaption>{exhibit.imageCaption}</figcaption>
                )}
              </figure>
              {imageErrors.includes(exhibit.id) && (
                <button className="secondary image-retry" onClick={retryImages}>
                  Повторить загрузку изображений
                </button>
              )}
              {exhibit.model && (
                <details
                  className="model-details"
                  onToggle={(event) =>
                    setModelExpanded(event.currentTarget.open)
                  }
                >
                  <summary>Рассмотреть объёмную модель</summary>
                  <SceneBoundary
                    fallback={
                      <div className="empty-state">
                        Объёмный просмотр недоступен. Описание экспоната — ниже.
                      </div>
                    }
                  >
                    {modelExpanded && (
                      <Suspense fallback={<p>Загружаем объёмный экспонат…</p>}>
                        <ModelViewer kind={exhibit.model} />
                      </Suspense>
                    )}
                  </SceneBoundary>
                </details>
              )}
              <div className="prose">
                {exhibit.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              {exhibit.imageCredit && (
                <p className="fineprint">Изображение: {exhibit.imageCredit}</p>
              )}
              <div className="stamp-note">
                <Check size={17} />
                Отметка зала добавлена в ваш паспорт
              </div>
              <SourceLinks ids={exhibit.sources} />
              {exhibit.hall === "future" && (
                <form
                  className="wish-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setProgress((p) => ({ ...p, wish: wish.trim() }));
                    setWishSaved(true);
                  }}
                >
                  <label htmlFor="wish">Моё пожелание Казахстану</label>
                  <p id="wish-privacy" className="fineprint">
                    Ваше пожелание видно только вам.
                  </p>
                  <textarea
                    id="wish"
                    aria-describedby="wish-privacy"
                    maxLength={400}
                    value={wish}
                    onChange={(e) => {
                      setWish(e.target.value);
                      setWishSaved(false);
                    }}
                    placeholder="Я мечтаю, чтобы…"
                  />
                  <div>
                    <small>{wish.length}/400</small>
                    <button className="primary" type="submit">
                      Сохранить пожелание
                    </button>
                  </div>
                  {wishSaved && (
                    <p role="status">
                      {storageError
                        ? "Сохранено только на время этого посещения."
                        : "Ваше пожелание сохранено."}
                    </p>
                  )}
                </form>
              )}
              <Quiz
                hall={halls.find((h) => h.id === exhibit.hall)!}
                saved={progress.answers[exhibit.hall]}
                onCorrect={(answer) =>
                  setProgress((p) => ({
                    ...p,
                    answers: { ...p.answers, [exhibit.hall]: answer },
                  }))
                }
              />
            </article>
          )}
          {panel === "passport" && (
            <>
              <div className="passport-summary">
                <SunMark />
                <div>
                  <span className="eyebrow">ПАМЯТЬ О ВАШЕМ ПУТЕШЕСТВИИ</span>
                  <h3>
                    {stamps.length} <span>из 6 отметок</span>
                  </h3>
                  <p>Откройте хотя бы один экспонат в каждом зале.</p>
                </div>
              </div>
              <div className="stamp-grid">
                {halls.map((h) => {
                  const done = stamps.includes(h.id);
                  return (
                    <div
                      key={h.id}
                      className={`stamp ${done ? "collected" : ""}`}
                    >
                      <span className="stamp-icon" aria-hidden="true">
                        {done ? <Check size={25} /> : <Compass size={25} />}
                      </span>
                      <HallTitle place={h} as="h3" />
                      <p>{done ? "Зал исследован" : "Ждёт открытия"}</p>
                      {progress.answers[h.id] !== undefined && (
                        <small>Вопрос решён ✓</small>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="fineprint">
                Читайте истории экспонатов и собирайте отметки о путешествии по
                всем шести залам.
              </p>
              {reset ? (
                <div className="confirm-reset">
                  <p>Удалить все отметки, ответы и личное пожелание?</p>
                  <button
                    className="danger"
                    onClick={() => {
                      setProgress(emptyProgress());
                      setWish("");
                      setWishSaved(false);
                      setReset(false);
                    }}
                  >
                    Да, сбросить всё
                  </button>
                  <button className="secondary" onClick={() => setReset(false)}>
                    Отмена
                  </button>
                </div>
              ) : (
                <button className="text-button" onClick={() => setReset(true)}>
                  <RotateCcw size={15} />
                  Сбросить прогресс
                </button>
              )}
            </>
          )}
          {panel === "map" && (
            <>
              <p className="lead">
                Все залы соединены с центральным атриумом. Выберите зал —
                маршрут пройдёт через открытые проходы.
              </p>
              <div className="museum-map">
                <button
                  className="map-atrium"
                  onClick={() => navigate("atrium")}
                >
                  <SunMark />
                  <HallTitle place={atrium} as="h3" />
                  <small>Начало путешествия</small>
                </button>
                {halls.map((h) => (
                  <button
                    key={h.id}
                    className={`map-room ${h.side === -1 ? "left" : "right"}`}
                    onClick={() =>
                      failed
                        ? (setFilter(h.id), showPanel("catalog"))
                        : navigate(h.id)
                    }
                  >
                    <HallTitle place={h} as="h3" />
                    <p>{h.description}</p>
                    <ArrowRight size={17} />
                  </button>
                ))}
              </div>
            </>
          )}
          {panel === "about" && (
            <div className="prose">
              <div className="about-mark">
                <SunMark />
                <div>
                  <h3>{exhibition.title}</h3>
                  <p>{exhibition.subtitle}</p>
                </div>
              </div>
              <dl className="credits-list">
                <dt>Автор выставки</dt>
                <dd className="author-name">{exhibition.authors.join(", ")}</dd>
                <dt>Педагог</dt>
                <dd>{exhibition.authorRole}</dd>
                <dt>Образовательная организация</dt>
                <dd>{exhibition.organization}</dd>
                <dt>Регион</dt>
                <dd>{exhibition.region}</dd>
              </dl>
              <p>
                Выставка ко Дню Республики для всех, кому интересны история,
                культура и будущее Казахстана.
              </p>
              <button
                className="secondary"
                onClick={() => showPanel("sources")}
              >
                Источники и материалы <ArrowUpRight size={15} />
              </button>
            </div>
          )}
          {panel === "sources" && (
            <>
              <p className="lead">
                Узнайте больше об истории и культуре Казахстана: архивы,
                музейные коллекции и материалы ЮНЕСКО.
              </p>
              <div className="sources-list">
                {sources.map((s) => (
                  <div key={s.id}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.label}
                      <ArrowUpRight size={16} />
                    </a>
                    {s.note && <p>{s.note}</p>}
                    {s.licenseUrl && (
                      <a
                        className="license-link"
                        href={s.licenseUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Условия лицензии <ArrowUpRight size={13} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          {(panel === "help" || panel === "menu") && (
            <>
              <div className="help-grid">
                <div>
                  <span className="help-symbol">W A S D</span>
                  <h3>Идите своим путём</h3>
                  <p>
                    WASD или стрелки — движение. Нажмите на 3D-сцену, чтобы
                    включить обзор мышью. Esc освобождает курсор и открывает
                    меню.
                  </p>
                </div>
                <div>
                  <span className="help-symbol">E ↗</span>
                  <h3>Присмотритесь к деталям</h3>
                  <p>
                    Подойдите к экспонату, наведите прицел и нажмите E или
                    кликните. Золотой прицел означает, что экспонат доступен.
                  </p>
                </div>
                <div>
                  <span className="help-symbol">↔</span>
                  <h3>На телефоне</h3>
                  <p>
                    Левый джойстик перемещает вас, правая область «Обзор»
                    поворачивает камеру. Нажмите на близкий экспонат или кнопку
                    «Открыть».
                  </p>
                </div>
              </div>
              <div className="menu-actions">
                <button
                  className="primary"
                  onClick={() => {
                    closeModal();
                    if (intro) startWalk();
                    else if (!tour) setWalking(true);
                  }}
                >
                  {intro ? "Войти в музей" : "Продолжить"}
                  <ArrowRight size={17} />
                </button>
                <button className="secondary" onClick={startTour}>
                  <Play size={16} />
                  Начать экскурсию
                </button>
                <button
                  className="secondary"
                  onClick={() => showPanel("catalog")}
                >
                  <BookOpen size={16} />
                  Каталог
                </button>
                <button className="secondary" onClick={() => showPanel("map")}>
                  <Map size={16} />
                  Залы музея
                </button>
                <button
                  className="secondary"
                  onClick={() => showPanel("about")}
                >
                  Об авторе
                </button>
                {tour && (
                  <button
                    className="text-button"
                    onClick={() => {
                      setTour(null);
                      setWalking(true);
                      closeModal();
                    }}
                  >
                    Завершить экскурсию
                  </button>
                )}
              </div>
            </>
          )}
          {panel === "settings" && (
            <>
              <p className="lead">
                Выберите качество, подходящее вашему устройству.
              </p>
              <fieldset className="quality-options">
                <legend>Качество 3D</legend>
                {[
                  ["auto", "Авто", "Учитывает размер экрана"],
                  ["low", "Низкое", "Быстрее на слабых устройствах"],
                  ["high", "Высокое", "Больше деталей"],
                ].map(([v, t, d]) => (
                  <label key={v}>
                    <input
                      type="radio"
                      name="quality"
                      value={v}
                      checked={quality === v}
                      onChange={() => setQuality(v)}
                    />
                    <span>
                      <strong>{t}</strong>
                      <small>{d}</small>
                    </span>
                  </label>
                ))}
              </fieldset>
              <p className="fineprint">
                Системная настройка уменьшения движения учитывается
                автоматически: переходы между залами становятся мгновенными.
              </p>
              <button
                className="secondary"
                onClick={() => showPanel("catalog")}
              >
                Перейти в обычный каталог
              </button>
            </>
          )}
        </Modal>
      )}
      <span className="sr-only" role="status">
        {ready ? "Музей загружен" : ""}
        {activeHall ? `. ${activeHall.names.kk}. ${activeHall.names.ru}` : ""}
      </span>
    </div>
  );
}
