export type GeoFaq = {
  question: string;
  answer: string;
};

/** Conversational Q&A for FAQPage schema, homepage, and /faq. */
export const GEO_FAQS: GeoFaq[] = [
  {
    question: "What is a free Age of Sigmar army builder?",
    answer:
      "Order of Battle is one. It's a 4th edition list builder in the browser: no payment, no account. You pick a faction, add regiments, add a Regiment of Renown if the list allows it, and keep the list on your device.",
  },
  {
    question: "Does Order of Battle require an account?",
    answer:
      "No. No email, no login. Army lists live in your browser (IndexedDB on the device). They are not uploaded to Order of Battle servers.",
  },
  {
    question: "Is Order of Battle an official Games Workshop app?",
    answer:
      "No. It's an unofficial fan project, not affiliated with, endorsed by, or sponsored by Games Workshop. Points and rules in the app are helpers. Confirm lists with official publications and your opponent or tournament organizer before you play.",
  },
  {
    question: "How do I build an Age of Sigmar 4th edition army list?",
    answer:
      "Pick a faction, a points limit (2,000 is common), a battle formation, a general, and one or more regiments led by heroes. Order of Battle follows that structure, then a Regiment of Renown if the list allows it.",
  },
  {
    question: "Can I build a Path to Glory army in Order of Battle?",
    answer:
      "Yes. Create a list, pick a faction, then choose Path to Glory in the army menu. Tick battlepacks (Ascension, Ravaged Coast, Blighted Wilds). The default cap is 1,000 points. Heroes can take a path, renown, Anvil of Apotheosis, artefacts, and learned spells. Lists stay on your device.",
  },
  {
    question: "Can I track wounds during an Age of Sigmar game?",
    answer:
      "Yes. Open a saved list in Play mode. Track wounds on units, lasting spells and prayers, and abilities for the current phase: hero, movement, shooting, charge, combat, end of turn.",
  },
  {
    question: "Which Age of Sigmar factions can I build in Order of Battle?",
    answer:
      "The factions page lists the 4th edition catalogues in the app, from Stormcast Eternals and Cities of Sigmar through Skaven, Nighthaunt, and the rest. Coverage follows the community BSData project, not an official Games Workshop feed.",
  },
  {
    question: "Where does Order of Battle get its points and warscroll data?",
    answer:
      "From the community BSData Age of Sigmar 4th edition project on GitHub. Order of Battle does not host Games Workshop data files. Double-check points and rules against official sources before a game or event.",
  },
  {
    question: "Is my army list private?",
    answer:
      "Lists stay on your device unless you export or share them. Clearing site data or the browser can delete them.",
  },
  {
    question: "Can I pay for Order of Battle?",
    answer:
      "No. This app is free and stays free. The maker cannot sell this unofficial fan project. If you want the list builder, or you want one made, email contact@zheat.xyz or visit https://zheat.xyz. Commission the work or buy it. The point is the community keeps a helper, not that the app gets closed down.",
  },
];

export const PATH_TO_GLORY_FAQS: GeoFaq[] = [
  {
    question: "Can I build a Path to Glory army in Order of Battle?",
    answer:
      "Yes. Create a list, pick a faction, then choose Path to Glory in the army menu. Tick battlepacks (Ascension, Ravaged Coast, Blighted Wilds). The default cap is 1,000 points. Heroes can take a path, renown, Anvil of Apotheosis, artefacts, and learned spells. Lists stay on your device.",
  },
  {
    question: "What is Path to Glory in Age of Sigmar?",
    answer:
      "Path to Glory is Games Workshop's campaign format for Age of Sigmar 4th edition. You grow a roster over games with paths, scars, extra kit, and an optional custom hero. Official battlepacks include Ascension, Ravaged Coast, and Blighted Wilds.",
  },
  {
    question: "How is Path to Glory different from matched play in this builder?",
    answer:
      "Matched play defaults to 2,000 points, a Scourge season, and battle tactics. Path to Glory defaults to 1,000 points, battlepacks instead of season, and campaign fields on units. Spearhead stays a fixed box list.",
  },
];

export const PATH_TO_GLORY_HOW_TO_STEPS = [
  {
    name: "Open My lists",
    text: "Open My lists. Tap New list. You don't need an account.",
  },
  {
    name: "Pick a faction",
    text: "Choose an Age of Sigmar 4th edition faction.",
  },
  {
    name: "Choose Path to Glory",
    text: "In Army, choose Path to Glory.",
  },
  {
    name: "Tick battlepacks",
    text: "Tick the battlepacks you are using. Ascension is on by default. Official packs include Ascension, Ravaged Coast, and Blighted Wilds.",
  },
  {
    name: "Set the points cap",
    text: "Name the list. 1,000 points is the default cap. Change it if your campaign uses another size.",
  },
  {
    name: "Add the roster",
    text: "Add a general and regiments. Campaign extras sit on the unit card: path, renown, battle wounds, scars, and Anvil of Apotheosis.",
  },
] as const;

export const HOW_TO_STEPS = [
  {
    name: "Open the app",
    text: "Open Order of Battle in a browser. You don't need an account. Tap Try Order of Battle or My lists.",
  },
  {
    name: "Create a list and pick a faction",
    text: "Create a new list and choose an Age of Sigmar 4th edition faction. The catalogue loads heroes, units, formations, and lores for that army.",
  },
  {
    name: "Set a points limit",
    text: "Set the points cap (2,000 is the default in most matched play). The builder totals regiment and enhancement costs as you add units.",
  },
  {
    name: "Choose a battle formation",
    text: "Pick a battle formation. The app lists the options from the faction catalogue.",
  },
  {
    name: "Add a general and regiments",
    text: "Add a hero as a regiment leader, then attach eligible units. Repeat for more regiments. Add a Regiment of Renown if the list allows it.",
  },
  {
    name: "Play the list at the table",
    text: "Open Play mode on your phone to track wounds, lasting magic and prayers, and abilities by phase.",
  },
] as const;
