export type BibleBookEntry = {
  slug: string;
  testament: "OLD" | "NEW";
};

export const BASE_RAW_URL =
  "https://raw.githubusercontent.com/Dancrf/biblia-db/refs/heads/main";

export const EXPECTED_BOOK_COUNT = 73;

export const BIBLE_BOOKS: BibleBookEntry[] = [
  // Antigo Testamento (46) — ordem canônica católica
  // Pentateuco
  { slug: "gn", testament: "OLD" },
  { slug: "ex", testament: "OLD" },
  { slug: "lv", testament: "OLD" },
  { slug: "nm", testament: "OLD" },
  { slug: "dt", testament: "OLD" },
  // Livros Históricos
  { slug: "js", testament: "OLD" },
  { slug: "ju", testament: "OLD" },
  { slug: "rt", testament: "OLD" },
  { slug: "1sm", testament: "OLD" },
  { slug: "2sm", testament: "OLD" },
  { slug: "1rs", testament: "OLD" },
  { slug: "2rs", testament: "OLD" },
  { slug: "1pa", testament: "OLD" },
  { slug: "2pa", testament: "OLD" },
  { slug: "esd", testament: "OLD" },
  { slug: "ne", testament: "OLD" },
  { slug: "tob", testament: "OLD" },
  { slug: "jdi", testament: "OLD" },
  { slug: "est", testament: "OLD" },
  { slug: "1ma", testament: "OLD" },
  { slug: "2ma", testament: "OLD" },
  // Livros Sapienciais
  { slug: "job", testament: "OLD" },
  { slug: "ps", testament: "OLD" },
  { slug: "pv", testament: "OLD" },
  { slug: "ees", testament: "OLD" },
  { slug: "cc", testament: "OLD" },
  { slug: "sa", testament: "OLD" },
  { slug: "eus", testament: "OLD" },
  // Livros Proféticos
  { slug: "is", testament: "OLD" },
  { slug: "je", testament: "OLD" },
  { slug: "lm", testament: "OLD" },
  { slug: "ba", testament: "OLD" },
  { slug: "ez", testament: "OLD" },
  { slug: "dn", testament: "OLD" },
  { slug: "os", testament: "OLD" },
  { slug: "jl", testament: "OLD" },
  { slug: "am", testament: "OLD" },
  { slug: "ab", testament: "OLD" },
  { slug: "jn", testament: "OLD" },
  { slug: "mic", testament: "OLD" },
  { slug: "na", testament: "OLD" },
  { slug: "hc", testament: "OLD" },
  { slug: "so", testament: "OLD" },
  { slug: "ag", testament: "OLD" },
  { slug: "zc", testament: "OLD" },
  { slug: "ml", testament: "OLD" },
  // Novo Testamento (27) — ordem canônica
  // Evangelhos e Atos
  { slug: "mt", testament: "NEW" },
  { slug: "mc", testament: "NEW" },
  { slug: "lc", testament: "NEW" },
  { slug: "jo", testament: "NEW" },
  { slug: "act", testament: "NEW" },
  // Epístolas Paulinas
  { slug: "rm", testament: "NEW" },
  { slug: "1co", testament: "NEW" },
  { slug: "2co", testament: "NEW" },
  { slug: "gl", testament: "NEW" },
  { slug: "ef", testament: "NEW" },
  { slug: "fp", testament: "NEW" },
  { slug: "cl", testament: "NEW" },
  { slug: "1ts", testament: "NEW" },
  { slug: "2ts", testament: "NEW" },
  { slug: "1tm", testament: "NEW" },
  { slug: "2tm", testament: "NEW" },
  { slug: "tt", testament: "NEW" },
  { slug: "fm", testament: "NEW" },
  // Epístola aos Hebreus
  { slug: "hb", testament: "NEW" },
  // Epístolas Católicas
  { slug: "tg", testament: "NEW" },
  { slug: "1pe", testament: "NEW" },
  { slug: "2pe", testament: "NEW" },
  { slug: "1jo", testament: "NEW" },
  { slug: "2jo", testament: "NEW" },
  { slug: "3jo", testament: "NEW" },
  { slug: "jda", testament: "NEW" },
  // Apocalipse
  { slug: "ap", testament: "NEW" },
];
