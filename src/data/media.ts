// Documentary photographs: see public/images/credits.json for original metadata.
export const photographs = {
  declaration: {
    image: "archive-oath.jpg",
    imageCaption: "Н. Назарбаев приносит присягу · 10 декабря 1991",
    imageCredit: "Архив Egemen Kazakhstan / EgemenMedia · CC BY-SA 4.0",
    imagePage:
      "https://commons.wikimedia.org/wiki/File:Egemen_Archive_Nazarbayev_Innaugration.jpg",
  },
  independence: {
    image: "archive-cis.jpg",
    imageCaption: "Встреча лидеров СНГ в Алма-Ате · 21 декабря 1991",
    imageCredit: "Архив Egemen Kazakhstan / EgemenMedia · CC BY-SA 4.0",
    imagePage:
      "https://commons.wikimedia.org/wiki/File:Egemen_Archive_Nazarbayev_and_CIS_leaders.jpg",
  },
  dombra: {
    image: "dombra.jpg",
    imageCaption: "Музыкант с домброй · 22 марта 2010",
    imageCredit: "upyernoz · CC BY 2.0",
    imagePage:
      "https://commons.wikimedia.org/wiki/File:Dombra_Player_(5663178574)_(2).jpg",
  },
  yurt: {
    image: "yurt.jpg",
    imageCaption: "Казахская юрта в горах Алтая · 2013",
    imageCredit: "Alexandr frolov · CC BY-SA 4.0",
    imagePage: "https://commons.wikimedia.org/wiki/File:Казахская_юрта.jpg",
  },
  ornament: {
    image: "craft.jpg",
    imageCaption: "Ткачество на празднике Наурыз · 2024",
    imageCredit: "Игорь Улитин · CC BY-SA 4.0",
    imagePage:
      "https://commons.wikimedia.org/wiki/File:Казахская_женщина_ткёт.jpg",
  },
  shahtinsk: {
    image: "shahtinsk.png",
    imageCaption: "Вечерний Шахтинск · 2023",
    imageCredit: "Тұрар Қазанғалов · CC BY-SA 4.0",
    imagePage: "https://commons.wikimedia.org/wiki/File:Шахтинск_түн_2023.png",
  },
  dolinka: {
    image: "dolinka.jpg",
    imageCaption: "Музей памяти жертв репрессий, Долинка · 2013",
    imageCredit: "Yakov Fedorov · CC BY-SA 4.0",
    imagePage: "https://commons.wikimedia.org/wiki/File:Dolinka_Museum_1.JPG",
  },
  karkaraly: {
    image: "karkaraly.jpg",
    imageCaption: "Сосны и скалы Каркаралинского парка · 2019",
    imageCredit: "Marina Nugman · CC BY-SA 4.0",
    imagePage: "https://commons.wikimedia.org/wiki/File:Shaitankol.jpg",
  },
};

export const photoSources = Object.entries(photographs).map(([id, photo]) => ({
  id: `${id}-photo`,
  label: `Фотография · ${photo.imageCaption}`,
  url: photo.imagePage,
  note: `${photo.imageCredit}. Уменьшено без кадрирования.`,
  licenseUrl:
    id === "dombra"
      ? "https://creativecommons.org/licenses/by/2.0/"
      : "https://creativecommons.org/licenses/by-sa/4.0/",
}));
