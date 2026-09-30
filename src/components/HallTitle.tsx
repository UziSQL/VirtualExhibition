import type { NamedPlace } from "../data/museum";

/** Shared hierarchy for every room name: Kazakh, then the full Russian name. */
export function HallTitle({
  place,
  as: Tag = "span",
  className = "",
}: {
  place: NamedPlace;
  as?: "span" | "h2" | "h3";
  className?: string;
}) {
  return (
    <Tag className={`hall-title ${className}`} data-hall-id={place.id}>
      <span className="hall-title-primary" lang="kk">
        {place.number && (
          <span className="hall-title-number">{place.number} </span>
        )}
        {place.names.kk}
      </span>
      <span className="hall-title-secondary" lang="ru">
        {place.names.ru}
      </span>
    </Tag>
  );
}
