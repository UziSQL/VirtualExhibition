import { exhibition } from "./config";
import { photographs, photoSources } from "./media";
export type HallId =
  "history" | "symbols" | "heritage" | "people" | "region" | "future";
export type Source = {
  id: string;
  label: string;
  url: string;
  note?: string;
  licenseUrl?: string;
};
export type Exhibit = {
  id: string;
  hall: HallId;
  title: string;
  caption: string;
  paragraphs: string[];
  sources: string[];
  image?: string;
  imageCredit?: string;
  imageCaption?: string;
  imageKind?: "photo" | "archive" | "illustration" | "symbol" | "timeline";
  model?: "dombra" | "yurt";
  motif?: string;
};
export type Question = {
  text: string;
  options: string[];
  correct: number;
  explanation: string;
};
export type HallNames = { kk: string; ru: string };
export type NamedPlace = {
  id: HallId | "atrium";
  names: HallNames;
  number?: string;
};
export const atrium: NamedPlace = {
  id: "atrium",
  names: { kk: "Орталық атриум", ru: "Центральный атриум" },
};
export type Hall = NamedPlace & {
  id: HallId;
  number: string;
  description: string;
  color: string;
  side: -1 | 1;
  z: number;
  question?: Question;
};
export const sources: Source[] = [
  ...photoSources,
  {
    id: "history",
    label: "Gov.kz · Хронология независимости",
    url: "https://www.gov.kz/memleket/entities/culture-kokshetau/press/news/details/1125430?lang=ru",
  },
  {
    id: "flag",
    label: "Ақорда · Государственный флаг",
    url: "https://mirror.akorda.kz/public/ru/state_symbols/kazakhstan_flag",
  },
  {
    id: "emblem",
    label: "Ақорда · Государственный герб",
    url: "https://mirror.akorda.kz/public/ru/state_symbols/kazakhstan_emblem",
  },
  {
    id: "anthem",
    label: "Ақорда · Государственные символы",
    url: "https://www.akorda.kz/ru/state_symbols/about_state_symbols",
  },
  {
    id: "dombra",
    label: "ЮНЕСКО · Искусство домбрового кюя",
    url: "https://ich.unesco.org/en/RL/kazakh-traditional-art-of-dombra-kuy-00996",
  },
  {
    id: "yurt",
    label: "ЮНЕСКО · Традиции изготовления юрты",
    url: "https://ich.unesco.org/en/RL/traditional-knowledge-and-skills-in-making-kyrgyz-kazakh-and-karakalpak-yurts-turkic-nomadic-dwellings-02284",
  },
  {
    id: "abai",
    label: "Gov.kz · Абай Кунанбаев",
    url: "https://www.gov.kz/memleket/entities/mfa-riga/press/article/details/17137",
  },
  {
    id: "shokan",
    label: "История Казахстана · Наука и просвещение XIX века",
    url: "https://e-history.kz/ru/kazakhstanika/show/10544",
  },
  {
    id: "satpayev",
    label: "Satbayev University · Музей Каныша Сатпаева",
    url: "https://museum.satbayev.university/ru/muzey-kanysha-satpaeva",
  },
  {
    id: "education",
    label: "ЮНЕСКО · Образование для устойчивого развития",
    url: "https://www.unesco.org/en/sustainable-development/education/need-know",
  },
  {
    id: "flag-image",
    label: "Wikimedia Commons · Флаг",
    url: "https://commons.wikimedia.org/wiki/File:Flag_of_Kazakhstan.svg",
    note: "Public domain, PD-KZ-exempt. Автор флага — Шакен Ниязбеков.",
  },
  {
    id: "emblem-image",
    label: "Wikimedia Commons · Герб",
    url: "https://commons.wikimedia.org/wiki/File:Emblem_of_Kazakhstan_latin.svg",
    note: "Public domain, PD-KZ-exempt. Жандарбек Малибеков, Шот-Аман Уалиханов; SVG: Bingread, Glide08. Версия с надписью Qazaqstan.",
  },
  {
    id: "abai-image",
    label: "Wikimedia Commons · Портрет Абая",
    url: "https://commons.wikimedia.org/wiki/File:Abai_Kunanbaev.jpg",
    note: "Public domain / PD-old. Автор не указан; цифровая обработка Materialscientist.",
  },
  {
    id: "shokan-image",
    label: "Wikimedia Commons · Портрет Шоқана",
    url: "https://commons.wikimedia.org/wiki/File:Chokan_Valikhanov_portrait.jpg",
    note: "Public domain / PD-old. Неизвестный автор, до 1865 года.",
  },
  {
    id: "satpayev-image",
    label: "Wikimedia Commons · Портрет Сатпаева",
    url: "https://commons.wikimedia.org/wiki/File:Kanysh_Satpayev_from_Kazakhstanskaya_Pravda_19_May_1949.jpg",
    note: "Public domain по карточке Commons. Неизвестный автор, «Казахстанская правда», 19 мая 1949 года.",
  },
];
export const halls: Hall[] = [
  {
    id: "history",
    number: "01",
    names: { kk: "Менің елімнің тарихы", ru: "История моей страны" },
    description: "Два события, с которых начинается новая глава.",
    color: "#9a7651",
    side: -1,
    z: -8,
    question: {
      text: "Какое событие мы вспоминаем 25 октября?",
      options: [
        "Принятие Декларации о суверенитете",
        "Принятие закона о независимости",
        "Создание Академии наук",
      ],
      correct: 0,
      explanation:
        "25 октября 1990 года приняли Декларацию о государственном суверенитете. Закон о независимости приняли 16 декабря 1991 года.",
    },
  },
  {
    id: "symbols",
    number: "02",
    names: { kk: "Мемлекеттік рәміздер", ru: "Государственные символы" },
    description: "Цвет, образ и музыка, которые объединяют.",
    color: "#217d86",
    side: 1,
    z: -8,
    question: {
      text: "Что находится в центре государственного герба?",
      options: ["Домбра", "Шанырак", "Горная вершина"],
      correct: 1,
      explanation:
        "Шанырак — верхняя часть юрты. На гербе он символизирует общий дом и единую Родину.",
    },
  },
  {
    id: "heritage",
    number: "03",
    names: { kk: "Мәдени мұра", ru: "Культурное наследие" },
    description: "Услышать степь. Понять дом. Сохранить традицию.",
    color: "#9c634b",
    side: -1,
    z: 0,
    question: {
      text: "Как называется инструмент, на котором исполняют домбровый кюй?",
      options: ["Скрипка", "Фортепиано", "Домбра"],
      correct: 2,
      explanation:
        "Домбра — двухструнный щипковый инструмент. Кюй может рассказывать историю без слов.",
    },
  },
  {
    id: "people",
    number: "04",
    names: { kk: "Қазақстан тұлғалары", ru: "Лица Казахстана" },
    description: "Три судьбы. Три способа изменить мир.",
    color: "#626953",
    side: 1,
    z: 0,
    question: {
      text: "С какой областью знаний связано имя Каныша Сатпаева?",
      options: ["Геология", "Астрономия", "Медицина"],
      correct: 0,
      explanation:
        "Каныш Сатпаев — учёный-геолог и первый президент Академии наук Казахской ССР.",
    },
  },
  {
    id: "region",
    number: "05",
    names: { kk: "Менің туған өлкем", ru: "Моя малая родина" },
    description: exhibition.region,
    color: "#788575",
    side: -1,
    z: 8,
    question: {
      text: "Как назывался посёлок, ставший городом Шахтинском?",
      options: ["Тентек", "Каркаралинск", "Алма-Ата"],
      correct: 0,
      explanation:
        "15 августа 1961 года посёлок Тентек получил имя Шахтинск и статус города.",
    },
  },
  {
    id: "future",
    number: "06",
    names: { kk: "Болашақ Қазақстан", ru: "Казахстан будущего" },
    description: "Будущее начинается с того, что мы делаем сегодня.",
    color: "#487b74",
    side: 1,
    z: 8,
    question: {
      text: "Какой школьный проект помогает сохранить наследие?",
      options: [
        "Удалить старые фотографии",
        "Записать рассказ старшего поколения с его согласия",
        "Придумать историю и выдать её за факт",
      ],
      correct: 1,
      explanation:
        "Бережная запись воспоминаний сохраняет живую историю. Важно получить согласие человека и указать, кто и когда рассказал её.",
    },
  },
];
export const exhibits: Exhibit[] = [
  {
    id: "declaration",
    ...photographs.declaration,
    imageKind: "archive",
    hall: "history",
    title: "Первый шаг к суверенитету",
    caption: "25 октября 1990 · День Республики",
    motif: "1990",
    sources: ["history", "declaration-photo"],
    paragraphs: [
      "25 октября 1990 года Верховный Совет Казахской ССР принял Декларацию о государственном суверенитете. Документ обозначил право республики самостоятельно решать важнейшие вопросы своей жизни. Казахстан тогда ещё находился в составе СССР.",
      "Архивный снимок показывает следующий этап становления государственности: присягу Н. Назарбаева 10 декабря 1991 года.",
      "Принятию Декларации посвящён День Республики. Декларация стала важным шагом на пути к независимости, но два события нельзя считать одним и тем же. Представьте историческую дорогу: заявление о суверенитете — одна её веха, а обретение независимости — следующая.",
    ],
  },
  {
    id: "independence",
    ...photographs.independence,
    imageKind: "archive",
    hall: "history",
    title: "Новая глава",
    caption: "16 декабря 1991 · День независимости",
    motif: "1991",
    sources: ["history", "independence-photo"],
    paragraphs: [
      "16 декабря 1991 года был принят Конституционный закон «О государственной независимости Республики Казахстан». Казахстан стал независимым государством. Эта дата связана с Днём независимости.",
      "На архивной фотографии — встреча лидеров СНГ в Алма-Ате 21 декабря 1991 года, спустя пять дней после принятия закона о независимости.",
      "День Республики, 25 октября, напоминает о Декларации 1990 года. День независимости, 16 декабря, — о законе 1991 года. Оба праздника говорят о государственности, но посвящены разным историческим решениям. Попробуйте объяснить это различие другу одним предложением.",
    ],
  },
  {
    id: "timeline",
    image: "timeline.svg",
    imageKind: "timeline",
    imageCaption: "Три даты на пути к независимости",
    hall: "history",
    title: "Лента перемен",
    caption: "1990 → 1991 · Путь к независимости",
    motif: "→",
    sources: ["history"],
    paragraphs: [
      "25 октября 1990 — принятие Декларации о государственном суверенитете. 10 декабря 1991 — утверждение названия «Республика Казахстан». 16 декабря 1991 — принятие закона о государственной независимости.",
      "Историческая лента помогает увидеть последовательность событий. Даты становятся понятнее, когда мы связываем каждую из них с конкретным изменением. Какое из этих событий произошло раньше остальных?",
    ],
  },
  {
    id: "flag",
    hall: "symbols",
    title: "Под единым небом",
    caption: "Государственный флаг Казахстана",
    image: "flag.svg",
    imageCredit: "Шакен Ниязбеков · Wikimedia Commons · Public domain",
    sources: ["flag", "flag-image"],
    paragraphs: [
      "Небесно-голубое полотнище, золотое солнце, парящий орёл и вертикальная полоса национального орнамента — элементы государственного флага. Автор флага — художник Шакен Ниязбеков. Отношение ширины полотнища к длине составляет 1:2.",
      "Голубой цвет связан с миром, благополучием и единством. Солнце напоминает о жизни и энергии, орёл — о свободе и стремлении к высоте. Орнамент у древка говорит о культурных традициях. Рассмотрите, как несколько образов складываются в единый символ страны.",
    ],
  },
  {
    id: "emblem",
    hall: "symbols",
    title: "Наш общий дом",
    caption: "Государственный герб Казахстана",
    image: "emblem.svg",
    imageCredit:
      "Ж. Малибеков, Ш.-А. Уалиханов · SVG: Bingread, Glide08 · Public domain",
    sources: ["emblem", "emblem-image"],
    paragraphs: [
      "В центре герба расположен шанырак — верхняя часть юрты. От него расходятся опоры, похожие на лучи. По сторонам находятся крылатые кони — тулпары, сверху — звезда, снизу — надпись Qazaqstan. Авторы герба — Жандарбек Малибеков и Шот-Аман Уалиханов.",
      "Шанырак символизирует общий дом и единую Родину. Как опоры поддерживают юрту, так благополучие каждого человека важно для всей страны. Крылатые кони связаны с храбростью и стремлением к развитию. Найдите в гербе знакомый архитектурный мотив атриума.",
    ],
  },
  {
    id: "anthem",
    image: "anthem.svg",
    imageKind: "illustration",
    imageCaption: "Типографическая композиция · Государственный гимн",
    hall: "symbols",
    title: "Голос страны",
    caption: "«Менің Қазақстаным» · Государственный гимн",
    motif: "♪",
    sources: ["anthem"],
    paragraphs: [
      "Гимн — музыкальный государственный символ. Современный гимн Казахстана основан на песне «Менің Қазақстаным» и утверждён в 2006 году. Музыку написал Шәмші Қалдаяқов, авторы слов — Жұмекен Нәжімеденов и Нұрсұлтан Назарбаев.",
      "Гимн звучит на торжественных государственных событиях и объединяет людей общей мелодией. Подумайте, почему музыка может выражать чувство принадлежности к стране без изображения её границ.",
    ],
  },
  {
    id: "dombra",
    ...photographs.dombra,
    imageKind: "photo",
    hall: "heritage",
    title: "Две струны — целый мир",
    caption: "Домбра и искусство кюя",
    model: "dombra",
    motif: "♫",
    sources: ["dombra", "dombra-photo"],
    paragraphs: [
      "Домбра — щипковый музыкальный инструмент с длинным грифом, грушевидным корпусом и двумя струнами. Домбровый кюй — инструментальная пьеса, которая передаёт настроение, образы природы и человеческие истории.",
      "Мастерство передают от учителя ученику: важны не только движения пальцев, но и понимание истории музыки. Искусство домбрового кюя вошло в список нематериального культурного наследия ЮНЕСКО в 2014 году. Поверните модель и найдите корпус, гриф и струны.",
    ],
  },
  {
    id: "yurt",
    ...photographs.yurt,
    imageKind: "photo",
    hall: "heritage",
    title: "Дом, который путешествует",
    caption: "Юрта · Продуманное пространство жизни",
    model: "yurt",
    motif: "⌂",
    sources: ["yurt", "yurt-photo"],
    paragraphs: [
      "Юрта — переносное жилище с разборным деревянным каркасом и войлочным покрытием. Круглая форма, решётчатые стены и верхнее кольцо-шанырак образуют прочную конструкцию, которую можно разобрать и собрать на новом месте.",
      "Изготовление юрты объединяет знания о дереве, войлоке, ткачестве и украшении пространства. Эти умения передаются в семьях и от мастеров ученикам. Вращая модель, рассмотрите её силуэт и вход.",
    ],
  },
  {
    id: "ornament",
    ...photographs.ornament,
    imageKind: "photo",
    hall: "heritage",
    title: "Традиция в руках мастера",
    caption: "Орнамент, ремесло и передача знаний",
    motif: "◇",
    sources: ["yurt", "dombra", "ornament-photo"],
    paragraphs: [
      "Украшение юрты соединяет геометрические и природные мотивы. Войлочные покрытия, тканые ленты и вышивка создаются разными ремесленными приёмами. Важен не только готовый предмет, но и знания людей, которые умеют его изготовить.",
      "Культурное наследие живёт, когда кто-то учится играть, шить, плести или рассказывать историю. Предлагаемое задание: найдите повторяющийся узор в знакомом предмете, зарисуйте его и спросите мастера о его происхождении.",
    ],
  },
  {
    id: "abai",
    hall: "people",
    title: "Абай Құнанбайұлы",
    caption: "1845–1904 · Поэт и мыслитель",
    image: "abai.jpg",
    imageCredit: "Wikimedia Commons · Public domain · Автор не указан",
    sources: ["abai", "abai-image"],
    paragraphs: [
      "Абай Кунанбаев — казахский поэт, мыслитель, композитор и просветитель. Его стихи, переводы и проза стали важной частью казахской литературы. В «Словах назидания» он размышлял об учении, труде, характере и ответственности человека.",
      "Абай видел в стремлении к знаниям путь к развитию. Его наследие предлагает не просто запомнить готовый ответ, а задуматься о собственных поступках. Вопрос для читателя: чему вы хотели бы научиться не ради оценки, а потому, что это изменит вашу жизнь?",
    ],
  },
  {
    id: "shokan",
    hall: "people",
    title: "Шоқан Уәлиханов",
    caption: "1835–1865 · Исследователь и этнограф",
    image: "shokan.jpg",
    imageCredit:
      "Неизвестный автор, до 1865 · Wikimedia Commons · Public domain",
    sources: ["shokan", "shokan-image"],
    paragraphs: [
      "Шоқан Уәлиханов, известный в русскоязычных источниках как Чокан Валиханов, исследовал историю, географию и культуру народов Центральной Азии. Он участвовал в экспедициях, изучал рукописи и записывал наблюдения о жизни людей.",
      "Особое место в его работе занимает поездка в Кашгарию в 1858–1859 годах. Исследователь превращал увиденное в знания, которыми могли пользоваться другие. Попробуйте взглянуть на знакомую улицу его глазами: что нужно записать, зарисовать и проверить, чтобы рассказ о ней был точным?",
    ],
  },
  {
    id: "satpayev",
    hall: "people",
    title: "Қаныш Сәтбаев",
    caption: "1899–1964 · Геолог и организатор науки",
    image: "satpayev.jpg",
    imageCredit:
      "«Казахстанская правда», 19.05.1949 · Автор неизвестен · Public domain",
    sources: ["satpayev", "satpayev-image"],
    paragraphs: [
      "Каныш Сатпаев — учёный-геолог и первый президент Академии наук Казахской ССР. Его деятельность связана с изучением минеральных ресурсов, развитием научных исследований и подготовкой специалистов.",
      "Работа учёного продолжается в учениках, лабораториях и университетах. Сатпаев помогал создавать условия, в которых новые поколения могли заниматься наукой. Предлагаемое наблюдение: обычный камень тоже можно исследовать. Опишите его цвет, поверхность и форму, а затем подумайте, каких данных не хватает для научного вывода.",
    ],
  },
  ...exhibition.regionalExhibits.map((e) => {
    sources.push({
      id: `local-${e.id}`,
      label: e.sourceLabel,
      url: e.sourceUrl,
    });
    const photo = photographs[e.id as keyof typeof photographs];
    return {
      ...e,
      ...photo,
      imageKind: "photo" as const,
      hall: "region" as const,
      sources: [`local-${e.id}`, `${e.id}-photo`],
    };
  }),
  {
    id: "learn",
    image: "future-science.svg",
    imageKind: "illustration",
    imageCaption: "Авторская иллюстрация · Учиться и исследовать",
    hall: "future",
    title: "Будущее начинается с вопроса",
    caption: "Образование, наука и любопытство",
    motif: "?",
    sources: ["education"],
    paragraphs: [
      "Образование для устойчивого развития помогает принимать обоснованные решения и учитывать их влияние на людей и окружающий мир. Наука начинается с вопросов, наблюдений и проверки предположений.",
      "Идея для школьного проекта: измеряйте расход воды, сравнивайте результаты и предложите способ сократить потери. Записывайте условия опыта, чтобы другой человек мог его повторить. Какую задачу своего города или села вы хотели бы исследовать?",
    ],
  },
  {
    id: "care",
    image: "future-nature.svg",
    imageKind: "illustration",
    imageCaption: "Авторская иллюстрация · Беречь живой мир",
    hall: "future",
    title: "Сохранить и передать",
    caption: "Природа, память и личный вклад",
    motif: "↗",
    sources: ["education", "yurt"],
    paragraphs: [
      "Забота о будущем соединяет экологию и культуру. Можно беречь воду, ремонтировать вещи, изучать родной язык, сохранять семейные фотографии и учиться традиционному ремеслу. Устойчивое развитие требует внимания к последствиям наших решений.",
      "Наше задание: выберите одно небольшое дело, которое можете сделать за неделю. Например, запишите с согласия родственника рассказ о семейной традиции и подпишите дату беседы.",
    ],
  },
];
export const hallExhibits = (id: HallId) =>
  exhibits.filter((e) => e.hall === id);
export const asset = (file: string) =>
  `${import.meta.env.BASE_URL}images/${file}`;
