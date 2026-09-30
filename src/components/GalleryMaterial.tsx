export const gallery = {
  wall: "#FAFAF7",
  ceiling: "#FFFFFF",
  floor: "#F0EFEB",
  joint: "#DEDCD5",
  gold: "#C9A44C",
  panel: "#FFFFFF",
  text: "#292929",
  secondary: "#62625D",
};

export function GalleryMaterial({
  color = gallery.wall,
  gold = false,
}: {
  color?: string;
  gold?: boolean;
}) {
  return (
    <meshStandardMaterial
      color={gold ? gallery.gold : color}
      roughness={gold ? 0.4 : 0.86}
      metalness={gold ? 0.16 : 0}
      // A small neutral fill keeps indirect faces bright without clipping direct light.
      emissive={gold ? gallery.gold : color}
      emissiveIntensity={gold ? 0.08 : 0.12}
    />
  );
}
