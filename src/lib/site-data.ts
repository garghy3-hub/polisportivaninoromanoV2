import type { SiteSettings } from "./content-types";

/**
 * Local editable-content seed for the V2 scaffold.
 * A future protected editorial adapter will replace this module without
 * changing the page components. Keep public copy out of route components.
 */
export const siteSettings: SiteSettings = {
  site: { title: "Polisportiva Nino Romano | Milazzo", description: "Sito ufficiale della Polisportiva Nino Romano di Milazzo: pallavolo, squadre, news e calendario.", ogTitle: "Polisportiva Nino Romano | Milazzo", ogDescription: "Passione, squadra e territorio. Segui la pallavolo rossoblù a Milazzo." },
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
,
  news: {
    backLabel: "← Torna alla home", eyebrow: "Dentro la stagione", title: "News &", accent: "aggiornamenti.",
    description: "La voce della Nino Romano: comunicati, cronache, storie e contenuti per vivere la pallavolo anche fuori dal campo.",\n    seoTitle: "News | Polisportiva Nino Romano", seoDescription: "Comunicati ufficiali, cronache, storie e aggiornamenti della Polisportiva Nino Romano di Milazzo.",
    emptyEyebrow: "Archivio editoriale", emptyTitle: "Nessun articolo pubblicato al momento.",
    emptyDescription: "Le notizie ufficiali saranno pubblicate qui. I contenuti in bozza non vengono mostrati.",
    topics: [
      { id: "comunicati", title: "Comunicati ufficiali", label: "Società", description: "Comunicazioni, avvisi e informazioni condivise dalla Polisportiva.", visible: true, order: 0 },
      { id: "partite", title: "Il racconto delle partite", label: "Match report", description: "Cronache, momenti chiave e approfondimenti, dopo la verifica dei risultati.", visible: true, order: 1 },
      { id: "storie", title: "Voci rossoblù", label: "Storie", description: "Interviste, protagonisti, staff e vita quotidiana della squadra.", visible: true, order: 2 },
    ],
  },
  teams: {
    backLabel: "← Torna alla home", eyebrow: "Il volley · Nino Romano", title: "Le nostre", accent: "squadre.",
    description: "Il volto sportivo della Polisportiva: persone, gruppi, percorsi e passione condivisa.",\n    seoTitle: "Squadre | Polisportiva Nino Romano", seoDescription: "Scopri le squadre e i percorsi sportivi della Polisportiva Nino Romano di Milazzo.",
    categories: [
      { id: "senior", title: "Prima squadra", eyebrow: "Campionati · attività agonistica", emptyDescription: "Le informazioni ufficiali di questa sezione saranno inserite appena disponibili.", category: "senior", visible: true, order: 0 },
      { id: "youth", title: "Settore giovanile", eyebrow: "Percorso · crescita · volley", emptyDescription: "Le informazioni ufficiali di questa sezione saranno inserite appena disponibili.", category: "youth", visible: true, order: 1 },
    ],
    asideTitle: "Vuoi conoscere le attività?", asideDescription: "Le informazioni sulle squadre e sulle attività societarie saranno pubblicate e aggiornate in questa sezione.",
    asideActionLabel: "Segui gli aggiornamenti ↗", asideActionHref: "/news",
  },
  calendar: {
    backLabel: "← Torna alla home", eyebrow: "La stagione · appuntamenti", title: "Calendario", accent: "rossoblù.",
    description: "Partite, appuntamenti e attività della Polisportiva Nino Romano: il calendario ufficiale sarà il riferimento per seguire la stagione.",\n    seoTitle: "Calendario e risultati | Polisportiva Nino Romano", seoDescription: "Calendario delle partite, appuntamenti e risultati ufficiali della Polisportiva Nino Romano.",
    eventTypes: ["Partite", "Attività societarie", "Eventi"], upcomingTitle: "Prossimi appuntamenti",
    upcomingEmpty: "Non ci sono appuntamenti confermati da mostrare al momento.", resultsTitle: "Ultimi risultati",
    resultsEmpty: "I risultati saranno inseriti solo dopo la verifica ufficiale. Nessun risultato disponibile.",
  },
  society: {
    backLabel: "← Torna alla home", eyebrow: "La società · Milazzo", title: "Una storia", accent: "rossoblù.",
    description: "La pagina dedicata alla Polisportiva Nino Romano: identità, progetto sportivo, persone e legame con il territorio. I contenuti saranno completati con informazioni verificate.",\n    seoTitle: "La società | Polisportiva Nino Romano", seoDescription: "Identità, valori, organizzazione e legame con Milazzo della Polisportiva Nino Romano.",
    pillars: [
      { id: "identita", title: "Identità e valori", description: "Una sezione per raccontare i principi, la visione e il progetto sportivo della Polisportiva.", visible: true, order: 0 },
      { id: "persone", title: "Persone e organizzazione", description: "Dirigenti, staff, collaboratori e ruoli societari, con nomi e informazioni da validare.", visible: true, order: 1 },
      { id: "milazzo", title: "Il legame con Milazzo", description: "Il territorio, la comunità e il contesto in cui la società vive e svolge le proprie attività.", visible: true, order: 2 },
      { id: "contatti", title: "Contatti ufficiali", description: "Un punto di riferimento per richieste, informazioni e comunicazioni verso la società.", visible: true, order: 3 },
    ],
    asideTitle: "La pagina è in fase di completamento",
    asideDescription: "La struttura è pronta per accogliere storia, organigramma, recapiti e informazioni istituzionali. I dettagli saranno pubblicati solo dopo conferma.",
  },
  footer: { copyright: "© Polisportiva Nino Romano · Milazzo", projectLabel: "V2 · Nuovo progetto digitale" }
};
