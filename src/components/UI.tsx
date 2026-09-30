import { useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { X, ArrowUpRight, Move, Check, RotateCcw } from "lucide-react";
import { asset, sources, type Exhibit, type Hall } from "../data/museum";
import { isCorrect } from "../lib/state";
import type { Controls } from "./MuseumScene";
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      previous?.focus?.();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        close.current();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close.current();
      }}
    >
      <header className="modal-header">
        <div>
          <span className="eyebrow">ҰЛЫ ДАЛА · МУЗЕЙ</span>
          <h2 id="dialog-title">{title}</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Закрыть"
          onClick={onClose}
          autoFocus
        >
          <X size={22} />
        </button>
      </header>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
export function SafeImage({ exhibit }: { exhibit: Exhibit }) {
  const [failed, setFailed] = useState(false);
  return exhibit.image && !failed ? (
    <img
      className={`exhibit-image ${exhibit.hall === "symbols" ? "symbol-image" : ""}`}
      src={asset(exhibit.image)}
      alt={exhibit.title}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  ) : (
    <div
      className="exhibit-art"
      style={{ background: exhibit.hall === "history" ? "#e9dfca" : undefined }}
    >
      <span>{exhibit.motif || "Ұлы дала"}</span>
      {failed && (
        <small>Изображение недоступно. Текст экспоната сохранён.</small>
      )}
    </div>
  );
}
export function SourceLinks({ ids }: { ids: string[] }) {
  return (
    <div className="source-links">
      {ids.map((id) => {
        const s = sources.find((s) => s.id === id);
        return s ? (
          <a key={id} href={s.url} target="_blank" rel="noreferrer">
            {s.label}
            <ArrowUpRight size={14} />
          </a>
        ) : null;
      })}
    </div>
  );
}
export function Quiz({
  hall,
  saved,
  onCorrect,
}: {
  hall: Hall;
  saved?: number;
  onCorrect: (answer: number) => void;
}) {
  const [answer, setAnswer] = useState<number | undefined>(saved);
  const q = hall.question;
  if (!q) return null;
  const correct = answer !== undefined && isCorrect(q, answer);
  return (
    <section className="quiz">
      <span className="eyebrow">МИНУТА НА РАЗМЫШЛЕНИЕ</span>
      <h3>{q.text}</h3>
      <div className="answers">
        {q.options.map((o, i) => (
          <button
            key={o}
            className={
              answer === i
                ? correct
                  ? "answer correct"
                  : "answer wrong"
                : "answer"
            }
            disabled={correct}
            onClick={() => {
              setAnswer(i);
              if (isCorrect(q, i)) onCorrect(i);
            }}
          >
            <span>{String.fromCharCode(65 + i)}</span>
            {o}
            {correct && answer === i && <Check size={18} />}
          </button>
        ))}
      </div>
      {answer !== undefined && (
        <p role="status" className={correct ? "feedback success" : "feedback"}>
          {correct ? "Верно! " : "Попробуйте ещё раз. "}
          {q.explanation}
        </p>
      )}
    </section>
  );
}
export function MobileControls({
  controls,
  onOpen,
  canOpen,
}: {
  controls: RefObject<Controls>;
  onOpen: () => void;
  canOpen: boolean;
}) {
  const [stick, setStick] = useState([0, 0]);
  const look = useRef<[number, number] | null>(null);
  const stop = () => {
    controls.current.forward = 0;
    controls.current.strafe = 0;
    setStick([0, 0]);
  };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const b = e.currentTarget.getBoundingClientRect();
    let x = (e.clientX - b.left - b.width / 2) / 36,
      y = (e.clientY - b.top - b.height / 2) / 36;
    const length = Math.max(1, Math.hypot(x, y));
    x /= length;
    y /= length;
    controls.current.strafe = x;
    controls.current.forward = -y;
    setStick([x * 29, y * 29]);
  };
  return (
    <div className="mobile-controls">
      <div
        className="joystick"
        aria-label="Джойстик движения"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          move(e);
        }}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={stop}
        onLostPointerCapture={stop}
      >
        <span style={{ transform: `translate(${stick[0]}px,${stick[1]}px)` }}>
          <Move size={23} />
        </span>
      </div>
      <div
        className="look-pad"
        aria-label="Область поворота камеры"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          look.current = [e.clientX, e.clientY];
        }}
        onPointerMove={(e) => {
          if (look.current) {
            controls.current.yaw += (e.clientX - look.current[0]) * 0.005;
            controls.current.pitch += (e.clientY - look.current[1]) * 0.005;
            look.current = [e.clientX, e.clientY];
          }
        }}
        onPointerUp={() => {
          look.current = null;
        }}
        onPointerCancel={() => {
          look.current = null;
        }}
        onLostPointerCapture={() => {
          look.current = null;
        }}
      >
        <RotateCcw size={22} />
        <span>Обзор</span>
      </div>
      <button className="mobile-open" disabled={!canOpen} onClick={onOpen}>
        Открыть
      </button>
    </div>
  );
}
