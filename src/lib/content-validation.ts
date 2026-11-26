import type { MatchEvent, MediaAsset, NewsArticle, SiteSettings, Team } from "./content-types";
import { isValidEventDate } from "./content-query";

const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const normalizedKey = (value: string): string => value.trim().toLocaleLowerCase("it-IT");

const isValidDate = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && Number.isFinite(Date.parse(value));

export function validateArticle(article: NewsArticle): string[] {
  const issues: string[] = [];
  if (!nonEmpty(article.id)) issues.push("Missing article id.");
  if (!nonEmpty(article.slug)) issues.push("Missing article slug.");
  if (!nonEmpty(article.title)) issues.push("Missing article title.");
  if (nonEmpty(article.slug) && article.slug !== article.slug.trim())
    issues.push("Article slug must not have surrounding whitespace.");
  if (!nonEmpty(article.body)) issues.push("Missing article body.");
  if (!["official", "match-report", "interview", "youth", "club-life"].includes(article.category))
    issues.push("Unknown article category.");
  if (!["draft", "published", "archived"].includes(article.status))
    issues.push("Unknown publication status.");
  if (!isValidDate(article.createdAt)) issues.push("Invalid createdAt date.");
  if (!isValidDate(article.updatedAt)) issues.push("Invalid updatedAt date.");
  if (article.status === "published" && !isValidDate(article.publishedAt))
    issues.push("Published articles require a valid publishedAt date.");
  return issues;
}

export function validateTeam(team: Team): string[] {
  const issues: string[] = [];
  if (!nonEmpty(team.id)) issues.push("Missing team id.");
  if (!nonEmpty(team.name)) issues.push("Missing team name.");
  if (!nonEmpty(team.slug)) issues.push("Missing team slug.");
  if (nonEmpty(team.slug) && team.slug !== team.slug.trim())
    issues.push("Team slug must not have surrounding whitespace.");
  if (!["senior", "youth"].includes(team.category)) issues.push("Unknown team category.");
  const numbers = team.roster?.flatMap((player) =>
    player.jerseyNumber === undefined ? [] : [player.jerseyNumber],
  ) ?? [];
  if (numbers.some((number) => !Number.isInteger(number) || number < 0))
    issues.push("Roster jersey numbers must be non-negative integers.");
  const assignedNumbers = numbers.filter((number) => Number.isInteger(number) && number >= 0);
  if (new Set(assignedNumbers).size !== assignedNumbers.length)
    issues.push("Roster jersey numbers must be unique within a team.");
  if (team.roster) {
    checkRosterIds(team.roster.map((player) => player.id), issues, "player");
    team.roster.forEach((player, index) => {
      if (!nonEmpty(player.name)) issues.push(`Roster entry ${index + 1}: missing player name.`);
    });
  }
  if (team.staff) {
    checkRosterIds(team.staff.map((member) => member.id), issues, "staff");
    team.staff.forEach((member, index) => {
      if (!nonEmpty(member.name)) issues.push(`Staff entry ${index + 1}: missing name.`);
      if (!nonEmpty(member.role)) issues.push(`Staff entry ${index + 1}: missing role.`);
    });
  }
  return issues;
}

export function validateEvent(event: MatchEvent): string[] {
  const issues: string[] = [];
  if (!nonEmpty(event.id)) issues.push("Missing event id.");
  if (!isValidEventDate(event.dateTime)) issues.push("Invalid event date/time.");
  if (!nonEmpty(event.homeTeam)) issues.push("Missing home team.");
  if (!nonEmpty(event.awayTeam)) issues.push("Missing away team.");
  if (nonEmpty(event.homeTeam) && nonEmpty(event.awayTeam) && normalizedKey(event.homeTeam) === normalizedKey(event.awayTeam)) issues.push("Home and away teams must differ.");
  if (!["scheduled", "postponed", "cancelled", "completed"].includes(event.status))
    issues.push("Unknown event status.");
  if (event.status === "completed" &&
    (!Number.isInteger(event.homeScore) || !Number.isInteger(event.awayScore) ||
      (event.homeScore ?? -1) < 0 || (event.awayScore ?? -1) < 0))
    issues.push("Completed events require non-negative integer scores.");
  return issues;
}

function checkRosterIds(ids: readonly unknown[], issues: string[], label = "roster") {
  const seen = new Set<string>();
  for (const id of ids) {
    if (typeof id !== "string" || !id.trim()) {
      issues.push(`Missing ${label} identifier.`);
      continue;
    }
    const key = normalizedKey(id);
    if (seen.has(key)) issues.push(`Duplicate ${label} identifier (case-insensitive): ${id}.`);
    seen.add(key);
  }
}

/** Validate collections for collisions before a batch is published or imported. */
export function validateContentCollections(input: {
  articles?: readonly NewsArticle[];
  teams?: readonly Team[];
  events?: readonly MatchEvent[];
}): string[] {
  const issues: string[] = [];
  const checkUnique = (values: readonly unknown[], label: string) => {
    const seen = new Set<string>();
    values.forEach((value) => {
      if (typeof value !== "string" || !value.trim()) return;
      const key = normalizedKey(value);
      if (seen.has(key)) issues.push(`Duplicate ${label} (case-insensitive): ${value}.`);
      seen.add(key);
    });
  };
  const articles = input.articles ?? [];
  const teams = input.teams ?? [];
  const events = input.events ?? [];
  checkUnique(articles.map(item => item.id), "article id");
  checkUnique(articles.map(item => item.slug), "article slug");
  checkUnique(teams.map(item => item.id), "team id");
  checkUnique(teams.map(item => item.slug), "team slug");
  checkUnique(events.map(item => item.id), "event id");
  articles.forEach((article, index) => validateArticle(article).forEach(issue => issues.push(`Article ${index + 1}: ${issue}`)));
  teams.forEach((team, index) => validateTeam(team).forEach(issue => issues.push(`Team ${index + 1}: ${issue}`)));
  events.forEach((event, index) => validateEvent(event).forEach(issue => issues.push(`Event ${index + 1}: ${issue}`)));
  for (const team of teams) {
    if (team.roster) checkUnique(team.roster.map(player => player.id), `player id in team ${team.slug}`);
    if (team.staff) checkUnique(team.staff.map(member => member.id), `staff id in team ${team.slug}`);
  }
  return issues;
}

const isSafePublicHref = (value: unknown): value is string =>
  typeof value === "string" &&
  (value.startsWith("/") && !value.startsWith("//") ||
    /^https:\/\//i.test(value));

/** Validate public site configuration before it is saved or published. */
export function validateSiteSettings(settings: SiteSettings): string[] {
  const issues: string[] = [];
  const requiredText = (value: unknown, label: string) => {
    if (!nonEmpty(value)) issues.push(`Missing required setting: ${label}.`);
  };
  const checkHref = (value: unknown, label: string) => {
    if (!isSafePublicHref(value)) issues.push(`Unsafe or invalid public link: ${label}.`);
  };
  const checkOrderedItems = (
    items: readonly { id: string; visible: boolean; order: number }[],
    label: string,
  ) => {
    checkUnique(items.map((item) => item.id), `${label} id`);
    items.forEach((item, index) => {
      if (!Number.isInteger(item.order)) issues.push(`${label} ${index + 1}: order must be an integer.`);
      if (typeof item.visible !== "boolean") issues.push(`${label} ${index + 1}: visibility must be boolean.`);
    });
  };
  const checkUnique = (values: readonly unknown[], label: string) => {
    const seen = new Set<string>();
    values.forEach((value) => {
      if (typeof value !== "string" || !value.trim()) {
        issues.push(`${label} must not be empty.`);
        return;
      }
      const key = normalizedKey(value);
      if (seen.has(key)) issues.push(`Duplicate ${label} (case-insensitive): ${value}.`);
      seen.add(key);
    });
  };

  requiredText(settings.interface.skipToContent, "skip-to-content label");
  requiredText(settings.interface.navigationLabel, "navigation accessible label");
  requiredText(settings.interface.openMenu, "open-menu label");
  requiredText(settings.interface.closeMenu, "close-menu label");
  requiredText(settings.interface.publishedArticlesLabel, "published articles accessible label");
  requiredText(settings.interface.newsTopicsLabel, "news topics accessible label");
  requiredText(settings.interface.teamSectionsLabel, "team sections accessible label");
  requiredText(settings.interface.calendarTypesLabel, "calendar types accessible label");
  requiredText(settings.interface.societyInformationLabel, "society information accessible label");
  requiredText(settings.brand.monogram, "brand monogram");
  requiredText(settings.brand.name, "brand name");
  requiredText(settings.brand.descriptor, "brand descriptor");
  requiredText(settings.brand.ariaLabel, "brand accessible label");
  requiredText(settings.site.title, "site title");
  requiredText(settings.site.description, "site description");
  requiredText(settings.site.ogTitle, "Open Graph title");
  requiredText(settings.site.ogDescription, "Open Graph description");
  requiredText(settings.footer.copyright, "footer copyright");
  requiredText(settings.footer.projectLabel, "footer project label");

  checkOrderedItems(settings.navigation, "navigation item");
  settings.navigation.forEach((item, index) => {
    requiredText(item.label, `navigation item ${index + 1} label`);
    checkHref(item.href, `navigation item ${index + 1}`);
  });

  const home = settings.home;
  [
    ["homepage hero eyebrow", home.heroEyebrow], ["homepage hero title", home.heroTitle],
    ["homepage hero accent", home.heroAccent], ["homepage hero description", home.heroDescription],
    ["homepage primary action label", home.primaryActionLabel], ["homepage secondary action label", home.secondaryActionLabel],
    ["homepage visual title", home.visualTitle], ["homepage visual top label", home.visualTopLabel],
    ["homepage visual tag", home.visualTag], ["homepage visual monogram", home.visualMonogram],
    ["homepage visual counter", home.visualCounter], ["homepage social proof", home.heroSocialProof],
    ["homepage brand colors label", home.brandColorsLabel], ["homepage brand colors descriptor", home.brandColorsDescriptor],
    ["homepage artwork title", home.artworkTitle], ["homepage artwork description", home.artworkDescription],
    ["homepage project title", home.projectTitle],
    ["homepage closing title", home.closingTitle],
  ].forEach(([label, value]) => requiredText(value, String(label)));
  checkHref(home.primaryActionHref, "homepage primary action");
  checkHref(home.secondaryActionHref, "homepage secondary action");
  checkHref(home.projectActionHref, "homepage project action");
  checkHref(home.closingPrimaryHref, "homepage closing primary action");
  checkHref(home.closingSecondaryHref, "homepage closing secondary action");
  checkOrderedItems(home.features, "homepage feature");
  home.features.forEach((feature, index) => {
    requiredText(feature.title, `homepage feature ${index + 1} title`);
    requiredText(feature.description, `homepage feature ${index + 1} description`);
  });

  const pages = [
    ["news", settings.news], ["teams", settings.teams],
    ["calendar", settings.calendar], ["society", settings.society],
  ] as const;
  pages.forEach(([pageName, page]) => {
    requiredText(page.title, `${pageName} page title`);
    requiredText(page.accent, `${pageName} page accent`);
    requiredText(page.description, `${pageName} page description`);
    requiredText(page.seoTitle, `${pageName} SEO title`);
    requiredText(page.seoDescription, `${pageName} SEO description`);
  });

  checkOrderedItems(settings.news.topics, "news topic");
  settings.news.topics.forEach((topic, index) => requiredText(topic.title, `news topic ${index + 1} title`));
  checkOrderedItems(settings.teams.categories, "team page category");
  settings.teams.categories.forEach((category, index) => requiredText(category.title, `team category ${index + 1} title`));
  checkOrderedItems(settings.society.pillars, "society pillar");
  settings.society.pillars.forEach((pillar, index) => requiredText(pillar.title, `society pillar ${index + 1} title`));

  return issues;
}

/** Media metadata checks performed before an asset can be attached to public content. */
export function validateMediaAsset(asset: MediaAsset): string[] {
  const issues: string[] = [];
  if (!nonEmpty(asset.id)) issues.push("Missing media asset id.");
  if (!nonEmpty(asset.storageKey)) issues.push("Missing media storage key.");
  if (!nonEmpty(asset.fileName)) issues.push("Missing media file name.");
  if (!nonEmpty(asset.mimeType)) issues.push("Missing media MIME type.");
  if (!Number.isInteger(asset.sizeBytes) || asset.sizeBytes <= 0)
    issues.push("Media size must be a positive integer.");
  if (!nonEmpty(asset.altText))
    issues.push("Media assets require descriptive alternative text.");
  if (!nonEmpty(asset.uploadedBy)) issues.push("Missing media uploader.");
  if (!isValidDate(asset.uploadedAt)) issues.push("Invalid media upload date.");
  if (asset.publicUrl !== undefined && !isSafePublicHref(asset.publicUrl))
    issues.push("Media public URL must be a safe relative or HTTPS URL.");
  return issues;
}

