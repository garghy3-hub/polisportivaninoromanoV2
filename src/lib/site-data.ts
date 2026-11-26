import type { SiteSettings } from "./content-types";

/**
 * Local editable-content seed for the V2 scaffold.
 * A future protected editorial adapter will replace this module without
 * changing the page components. Keep public copy out of route components.
 */
export const siteSettings: SiteSettings = {
  navigation: [
    { id: "home", label: "Home", href: "/", visible: true, order: 0 },
    { id: "societa", label: "La società", href: "/societa", visible: true, order: 1 },
    { id: "squadre", label: "Le squadre", href: "/squadre", visible: true, order: 2 },
    { id: "news", label: "News", href: "/news", visible: true, order: 3 },
    { id: "calendario", label: "Calendario", href: "/calendario", visible: true, order: 4 },
  ],
  home: {
    heroEyebrow: "Milazzo · Pallavolo",
    heroTitle: "Il cuore",
    heroAccent: "è rossoblù.",
    heroDescription: "Passione, squadra e territorio. La casa digitale della Polisportiva Nino Romano, nel cuore di Milazzo.",
    primaryActionLabel: "Scopri le squadre",
    primaryActionHref: "/squadre",
    secondaryActionLabel: "Tutte le news",
    secondaryActionHref: "/news",
    visualEyebrow: "Nino Romano",
    visualTitle: "Dentro il gioco.",
    visualDescription: "Energia · Impegno · Comunità",
    features: [
      { id: "territorio", eyebrow: "01 · Territorio", title: "Milazzo, casa nostra", description: "Una realtà sportiva legata alla comunità e al territorio.", visible: true, order: 0 },
      { id: "squadra", eyebrow: "02 · Squadra", title: "Crescere insieme", description: "Lo sport come impegno condiviso, dentro e fuori dal campo.", visible: true, order: 1 },
      { id: "passione", eyebrow: "03 · Passione", title: "Sempre rossoblù", description: "Il senso di appartenenza che accompagna ogni stagione.", visible: true, order: 2 },
    ],
    projectEyebrow: "La società · Il progetto",
    projectTitle: "Non solo pallavolo. Una comunità.",
    projectDescription: "Uno spazio per raccontare la società, le persone, le attività e le novità con un'esperienza semplice, moderna e pensata anche per smartphone.",
    projectActionLabel: "Conosci la società",
    projectActionHref: "/societa",
    closingEyebrow: "News · Risultati · Calendario",
    closingTitle: "La stagione, da seguire.",
    closingDescription: "Gli aggiornamenti sportivi saranno pubblicati qui dopo il collegamento alle fonti ufficiali.",
    closingPrimaryLabel: "Vai alle news",
    closingPrimaryHref: "/news",
    closingSecondaryLabel: "Calendario",
    closingSecondaryHref: "/calendario",
  },
};
