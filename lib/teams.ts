export type Team = {
  id: string;
  name: string;
  shortName: string;
  flagCode: string;
  captain: string;
  group: string;
  aliases?: string[];
};

export const teams: Team[] = [
  { id: "czechia", name: "Czech Republic", shortName: "CZE", flagCode: "cz", captain: "Tomas Soucek", group: "A", aliases: ["Czechia"] },
  { id: "mexico", name: "Mexico", shortName: "MEX", flagCode: "mx", captain: "Edson Alvarez", group: "A" },
  { id: "south-africa", name: "South Africa", shortName: "RSA", flagCode: "za", captain: "Ronwen Williams", group: "A" },
  { id: "south-korea", name: "South Korea", shortName: "KOR", flagCode: "kr", captain: "Son Heung-min", group: "A", aliases: ["Korea Republic"] },
  { id: "bosnia", name: "Bosnia and Herzegovina", shortName: "BIH", flagCode: "ba", captain: "Edin Dzeko", group: "B", aliases: ["Bosnia-Herzegovina"] },
  { id: "canada", name: "Canada", shortName: "CAN", flagCode: "ca", captain: "Alphonso Davies", group: "B" },
  { id: "qatar", name: "Qatar", shortName: "QAT", flagCode: "qa", captain: "Akram Afif", group: "B" },
  { id: "switzerland", name: "Switzerland", shortName: "SUI", flagCode: "ch", captain: "Granit Xhaka", group: "B" },
  { id: "brazil", name: "Brazil", shortName: "BRA", flagCode: "br", captain: "Marquinhos", group: "C" },
  { id: "haiti", name: "Haiti", shortName: "HAI", flagCode: "ht", captain: "Johny Placide", group: "C" },
  { id: "morocco", name: "Morocco", shortName: "MAR", flagCode: "ma", captain: "Achraf Hakimi", group: "C" },
  { id: "scotland", name: "Scotland", shortName: "SCO", flagCode: "gb-sct", captain: "Andy Robertson", group: "C" },
  { id: "australia", name: "Australia", shortName: "AUS", flagCode: "au", captain: "Mat Ryan", group: "D" },
  { id: "paraguay", name: "Paraguay", shortName: "PAR", flagCode: "py", captain: "Gustavo Gomez", group: "D" },
  { id: "turkey", name: "Turkey", shortName: "TUR", flagCode: "tr", captain: "Hakan Calhanoglu", group: "D", aliases: ["Türkiye"] },
  { id: "usa", name: "United States", shortName: "USA", flagCode: "us", captain: "Christian Pulisic", group: "D", aliases: ["USA"] },
  { id: "curacao", name: "Curacao", shortName: "CUW", flagCode: "cw", captain: "Leandro Bacuna", group: "E", aliases: ["Curaçao"] },
  { id: "ecuador", name: "Ecuador", shortName: "ECU", flagCode: "ec", captain: "Enner Valencia", group: "E" },
  { id: "germany", name: "Germany", shortName: "GER", flagCode: "de", captain: "Joshua Kimmich", group: "E" },
  { id: "ivory-coast", name: "Ivory Coast", shortName: "CIV", flagCode: "ci", captain: "Franck Kessie", group: "E", aliases: ["Côte d’Ivoire", "Cote d'Ivoire"] },
  { id: "japan", name: "Japan", shortName: "JPN", flagCode: "jp", captain: "Wataru Endo", group: "F" },
  { id: "netherlands", name: "Netherlands", shortName: "NED", flagCode: "nl", captain: "Virgil van Dijk", group: "F" },
  { id: "sweden", name: "Sweden", shortName: "SWE", flagCode: "se", captain: "Victor Lindelof", group: "F" },
  { id: "tunisia", name: "Tunisia", shortName: "TUN", flagCode: "tn", captain: "Youssef Msakni", group: "F" },
  { id: "belgium", name: "Belgium", shortName: "BEL", flagCode: "be", captain: "Kevin De Bruyne", group: "G" },
  { id: "egypt", name: "Egypt", shortName: "EGY", flagCode: "eg", captain: "Mohamed Salah", group: "G" },
  { id: "iran", name: "Iran", shortName: "IRN", flagCode: "ir", captain: "Alireza Jahanbakhsh", group: "G", aliases: ["IR Iran"] },
  { id: "new-zealand", name: "New Zealand", shortName: "NZL", flagCode: "nz", captain: "Chris Wood", group: "G" },
  { id: "cape-verde", name: "Cape Verde", shortName: "CPV", flagCode: "cv", captain: "Ryan Mendes", group: "H", aliases: ["Cabo Verde"] },
  { id: "saudi-arabia", name: "Saudi Arabia", shortName: "KSA", flagCode: "sa", captain: "Salem Al-Dawsari", group: "H" },
  { id: "spain", name: "Spain", shortName: "ESP", flagCode: "es", captain: "Alvaro Morata", group: "H" },
  { id: "uruguay", name: "Uruguay", shortName: "URU", flagCode: "uy", captain: "Federico Valverde", group: "H" },
  { id: "france", name: "France", shortName: "FRA", flagCode: "fr", captain: "Kylian Mbappe", group: "I" },
  { id: "iraq", name: "Iraq", shortName: "IRQ", flagCode: "iq", captain: "Jalal Hassan", group: "I" },
  { id: "norway", name: "Norway", shortName: "NOR", flagCode: "no", captain: "Martin Odegaard", group: "I" },
  { id: "senegal", name: "Senegal", shortName: "SEN", flagCode: "sn", captain: "Kalidou Koulibaly", group: "I" },
  { id: "algeria", name: "Algeria", shortName: "ALG", flagCode: "dz", captain: "Riyad Mahrez", group: "J" },
  { id: "argentina", name: "Argentina", shortName: "ARG", flagCode: "ar", captain: "Lionel Messi", group: "J" },
  { id: "austria", name: "Austria", shortName: "AUT", flagCode: "at", captain: "David Alaba", group: "J" },
  { id: "jordan", name: "Jordan", shortName: "JOR", flagCode: "jo", captain: "Ehsan Haddad", group: "J" },
  { id: "colombia", name: "Colombia", shortName: "COL", flagCode: "co", captain: "James Rodriguez", group: "K" },
  { id: "dr-congo", name: "DR Congo", shortName: "COD", flagCode: "cd", captain: "Chancel Mbemba", group: "K", aliases: ["Congo DR"] },
  { id: "portugal", name: "Portugal", shortName: "POR", flagCode: "pt", captain: "Cristiano Ronaldo", group: "K" },
  { id: "uzbekistan", name: "Uzbekistan", shortName: "UZB", flagCode: "uz", captain: "Eldor Shomurodov", group: "K" },
  { id: "croatia", name: "Croatia", shortName: "CRO", flagCode: "hr", captain: "Luka Modric", group: "L" },
  { id: "england", name: "England", shortName: "ENG", flagCode: "gb-eng", captain: "Harry Kane", group: "L" },
  { id: "ghana", name: "Ghana", shortName: "GHA", flagCode: "gh", captain: "Jordan Ayew", group: "L" },
  { id: "panama", name: "Panama", shortName: "PAN", flagCode: "pa", captain: "Anibal Godoy", group: "L" }
];

export const teamById = new Map(teams.map((team) => [team.id, team]));

const countryFacts: Record<string, string> = {
  czechia: "Prague Castle is one of the largest ancient castle complexes in the world.",
  mexico: "Mexico's ancient cacao traditions helped shape the world's love of chocolate.",
  "south-africa": "South Africa has 11 official languages and three capital cities.",
  "south-korea": "South Korea's Hangul alphabet was created in the 15th century to make reading easier.",
  bosnia: "Sarajevo hosted the 1984 Winter Olympics.",
  canada: "Canada has the world's longest coastline.",
  qatar: "Qatar is a peninsula that juts into the Persian Gulf.",
  switzerland: "Switzerland has four national languages: German, French, Italian, and Romansh.",
  brazil: "Brazil is home to a huge share of the Amazon rainforest.",
  haiti: "Haiti shares the island of Hispaniola with the Dominican Republic.",
  morocco: "Morocco has coastlines on both the Atlantic Ocean and the Mediterranean Sea.",
  scotland: "Scotland is made up of the mainland plus hundreds of islands.",
  australia: "Australia covers most of the Australian continent.",
  paraguay: "Paraguay is one of only two landlocked countries in South America.",
  turkey: "Turkey spans Europe and Asia, with Istanbul sitting on both sides of the Bosporus.",
  usa: "The United States stretches across multiple time zones, from the Atlantic to Hawaii.",
  curacao: "Curacao is known for the colorful Dutch colonial waterfront of Willemstad.",
  ecuador: "Ecuador is named after the equator, which passes through the country.",
  germany: "Johannes Gutenberg developed his movable-type printing press in Mainz, Germany.",
  "ivory-coast": "Ivory Coast is one of the world's leading cocoa producers.",
  japan: "Japan is an archipelago made up of thousands of islands.",
  netherlands: "About a quarter of the Netherlands lies below sea level.",
  sweden: "Sweden has a right-to-roam tradition that lets people enjoy much of the countryside.",
  tunisia: "Tunisia contains the ruins of ancient Carthage near modern Tunis.",
  belgium: "Belgium has three official languages: Dutch, French, and German.",
  egypt: "Egypt's Great Pyramid of Giza is the last surviving wonder of the ancient Seven Wonders.",
  iran: "Iran is home to Persepolis, once a ceremonial capital of the Achaemenid Empire.",
  "new-zealand": "New Zealand was the first self-governing country to grant women the national vote.",
  "cape-verde": "Cape Verde is an Atlantic island nation made up of ten volcanic islands.",
  "saudi-arabia": "Saudi Arabia is home to Mecca and Medina, two of Islam's holiest cities.",
  spain: "Barcelona's Sagrada Familia has been under construction since 1882.",
  uruguay: "Uruguay is one of South America's smallest countries by area.",
  france: "France has coastlines on the Atlantic, the Mediterranean, and the English Channel.",
  iraq: "Iraq sits in ancient Mesopotamia, often called a cradle of civilization.",
  norway: "Norway's coastline is carved by dramatic fjords.",
  senegal: "Dakar sits on the Cap-Vert peninsula, near the westernmost point of mainland Africa.",
  algeria: "Algeria is Africa's largest country by area.",
  argentina: "Argentina stretches from subtropical regions in the north to Patagonia in the south.",
  austria: "The Alps cover much of Austria.",
  jordan: "Jordan is home to Petra, the ancient city carved into rose-colored rock.",
  colombia: "Colombia has coastlines on both the Caribbean Sea and the Pacific Ocean.",
  "dr-congo": "DR Congo is crossed by the Congo River, one of the world's largest river systems.",
  portugal: "Portugal is one of Europe's oldest nation-states.",
  uzbekistan: "Uzbekistan's Silk Road cities include Samarkand and Bukhara.",
  croatia: "Croatia's Dalmatian coast has more than a thousand islands and islets.",
  england: "England is home to Stonehenge, a prehistoric monument built thousands of years ago.",
  ghana: "Ghana's Lake Volta is one of the world's largest artificial lakes by surface area.",
  panama: "Panama links Central and South America and is famous for the Panama Canal.",
};

export function countryFactForTeamId(teamId: string | null | undefined) {
  if (!teamId) return null;
  const team = teamById.get(teamId);
  const fact = countryFacts[teamId];
  if (!team || !fact) return null;
  return `${team.name}: ${fact}`;
}

export function countryFactForMatch(homeTeamId: string | null, awayTeamId: string | null, seed: string) {
  const ids = [homeTeamId, awayTeamId].filter((teamId): teamId is string => Boolean(teamId));
  if (!ids.length) return "Country trivia will appear when the teams are known.";

  const seedTotal = seed.split("").reduce((total, letter) => total + letter.charCodeAt(0), 0);
  const selectedId = ids[seedTotal % ids.length];
  return countryFactForTeamId(selectedId) ?? "Country trivia will appear when the teams are known.";
}

const normalize = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

const teamNames = teams.flatMap((team) =>
  [team.name, team.shortName, ...(team.aliases ?? [])].map((name) => [normalize(name), team.id] as const)
);

export const teamIdByExternalName = new Map(teamNames);

export function findTeamId(name: string | null | undefined) {
  if (!name) return null;
  return teamIdByExternalName.get(normalize(name)) ?? null;
}

export function flagUrl(flagCode: string) {
  return `https://flagcdn.com/${flagCode}.svg`;
}
