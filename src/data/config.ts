export const exhibition = {
  title: "Ұлы дала",
  subtitle: "Виртуальный музей Казахстана",
  authors: [] as string[],
  organization: "",
  region: "",
  // Добавьте реальные местные материалы. Пустой список не даёт отметку в паспорте.
  regionalExhibits: [] as {
    id: string;
    title: string;
    caption: string;
    paragraphs: string[];
    image?: string;
    imageCredit?: string;
    sourceUrl: string;
    sourceLabel: string;
  }[],
};
