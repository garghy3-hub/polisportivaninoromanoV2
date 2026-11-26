import type { ClubProfile, MatchEvent, MediaAsset, NewsArticle, SiteSettings, Team } from "./content-types";
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
  if (article.coverImageUrl !== undefined &&
    (!isSafePublicHref(article.coverImageUrl) || !nonEmpty(article.coverImageAlt)))
    issues.push("Article cover images require a safe URL and alternative text.");
  if (article.socialImageUrl !== undefined &&
    (!isSafePublicHref(article.socialImageUrl) || !nonEmpty(article.socialImageAlt)))
    issues.push("Article social images require a safe URL and alternative text.");
  if (article.seoTitle !== undefined && !nonEmpty(article.seoTitle))
    issues.push("Article SEO title must not be empty when provided.");
  if (article.seoDescription !== undefined && !nonEmpty(article.seoDescription))
    issues.push("Article SEO description must not be empty when provided.");
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
  if (team.order !== undefined && !Number.isInteger(team.order)) issues.push("Team order must be an integer.");
  if (team.visible !== undefined && typeof team.visible !== "boolean") issues.push("Team visibility must be boolean.");
  if (team.logoUrl !== undefined && (!isSafePublicHref(team.logoUrl) || !nonEmpty(team.logoAlt)))
    issues.push("Team logos require a safe URL and alternative text.");
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
      if (player.order !== undefined && !Number.isInteger(player.order)) issues.push(`Roster entry ${index + 1}: order must be an integer.`);
      if (player.visible !== undefined && typeof player.visible !== "boolean") issues.push(`Roster entry ${index + 1}: visibility must be boolean.`);
      if (player.photoUrl !== undefined && (!isSafePublicHref(player.photoUrl) || !nonEmpty(player.photoAlt))) issues.push(`Roster entry ${index + 1}: photo URL and alternative text must be valid.`);
    });
  }
  if (team.staff) {
    checkRosterIds(team.staff.map((member) => member.id), issues, "staff");
    team.staff.forEach((member, index) => {
      if (!nonEmpty(member.name)) issues.push(`Staff entry ${index + 1}: missing name.`);
      if (!nonEmpty(member.role)) issues.push(`Staff entry ${index + 1}: missing role.`);
      if (member.order !== undefined && !Number.isInteger(member.order)) issues.push(`Staff entry ${index + 1}: order must be an integer.`);
      if (member.visible !== undefined && typeof member.visible !== "boolean") issues.push(`Staff entry ${index + 1}: visibility must be boolean.`);
      if (member.photoUrl !== undefined && (!isSafePublicHref(member.photoUrl) || !nonEmpty(member.photoAlt))) issues.push(`Staff entry ${index + 1}: photo URL and alternative text must be valid.`);
    });
  }
  return issues;
}

/** Validate editable club identity, organization, contacts, sponsors and partners. */
export function validateClubProfile(profile: ClubProfile): string[] {
  const issues: string[] = [];
  if (!nonEmpty(profile.name)) issues.push("Missing club name.");
  const checkIds = (ids: string[], label: string) => {
    const seen = new Set<string>();
    ids.forEach((id) => {
      if (!nonEmpty(id)) issues.push(`Missing ${label} id.`);
      const key = normalizedKey(id);
      if (seen.has(key)) issues.push(`Duplicate ${label} id: ${id}.`);
      seen.add(key);
    });
  };
  (profile.contacts ?? []).forEach((item, index) => {
    if (!nonEmpty(item.label)) issues.push(`Club contact ${index + 1}: missing label.`);
    if (!nonEmpty(item.value)) issues.push(`Club contact ${index + 1}: missing value.`);
    if (item.href !== undefined && !(/^https:\/\//i.test(item.href) || /^mailto:/i.test(item.href) || /^tel:/i.test(item.href) || (item.href.startsWith("/") && !item.href.startsWith("//")))) issues.push(`Club contact ${index + 1}: unsafe link.`);
  });
  (profile.socialLinks ?? []).forEach((item, index) => {
    if (!nonEmpty(item.label) || !nonEmpty(item.value)) issues.push(`Social link ${index + 1}: label and value are required.`);
    if (item.href !== undefined && !/^https:\/\//i.test(item.href)) issues.push(`Social link ${index + 1}: destination must use HTTPS.`);
  });
  const people = profile.people ?? [];
  checkIds(people.map((item) => item.id), "club person");
  people.forEach((item, index) => {
    if (!nonEmpty(item.name) || !nonEmpty(item.role)) issues.push(`Club person ${index + 1}: name and role are required.`);
    if (!Number.isInteger(item.order) || typeof item.visible !== "boolean") issues.push(`Club person ${index + 1}: invalid order or visibility.`);
    if (item.photoUrl !== undefined && (!isSafePublicHref(item.photoUrl) || !nonEmpty(item.photoAlt))) issues.push(`Club person ${index + 1}: photo URL and alternative text must be valid.`);
  });
  const partners = profile.partners ?? [];
  checkIds(partners.map((item) => item.id), "club sponsor/partner");
  partners.forEach((item, index) => {
    if (!nonEmpty(item.name) || !["sponsor", "partner"].includes(item.relationship)) issues.push(`Sponsor/partner ${index + 1}: name or relationship is invalid.`);
    if (!Number.isInteger(item.order) || typeof item.visible !== "boolean") issues.push(`Sponsor/partner ${index + 1}: invalid order or visibility.`);
    if (item.logoUrl !== undefined && (!isSafePublicHref(item.logoUrl) || !nonEmpty(item.logoAlt))) issues.push(`Sponsor/partner ${index + 1}: logo URL and alternative text must be valid.`);
    if (item.websiteUrl !== undefined && !/^https:\/\//i.test(item.websiteUrl)) issues.push(`Sponsor/partner ${index + 1}: website must use HTTPS.`);
  });
  return issues;
}
export function validateEvent(event: MatchEvent): string[] {
  const issues: string[] = [];
  if (!nonEmpty(event.id)) issues.push("Missing event id.");
  if (!isValidEventDate(event.dateTime)) issues.push("Invalid event date/time.");
  for (const [field, value] of Object.entries({
    season: event.season,
    type: event.type,
    round: event.round,
    venue: event.venue,
    competition: event.competition,
    notes: event.notes,
  })) {
    if (value !== undefined && !nonEmpty(value))
      issues.push(`Event ${field} must not be empty when provided.`);
  }
  if (!nonEmpty(event.homeTeam)) issues.push("Missing home team.");
  if (!nonEmpty(event.awayTeam)) issues.push("Missing away team.");
  if (nonEmpty(event.homeTeam) && nonEmpty(event.awayTeam) && normalizedKey(event.homeTeam) === normalizedKey(event.awayTeam)) issues.push("Home and away teams must differ.");
  if (!["scheduled", "postponed", "cancelled", "completed"].includes(event.status))
    issues.push("Unknown event status.");
  if (event.status === "completed" &&
    (!Number.isInteger(event.homeScore) || !Number.isInteger(event.awayScore) ||
      (event.homeScore ?? -1) < 0 || (event.awayScore ?? -1) < 0))
    issues.push("Completed events require non-negative integer scores.");
  if (event.status !== "completed" && (event.homeScore !== undefined || event.awayScore !== undefined))
    issues.push("Scores may only be set for completed events.");
  if (event.order !== undefined && !Number.isInteger(event.order))
    issues.push("Event order must be an integer.");
  if (event.visible !== undefined && typeof event.visible !== "boolean")
    issues.push("Event visibility must be boolean.");
  if (event.outcome !== undefined && !["win", "loss", "draw"].includes(event.outcome))
    issues.push("Unknown match outcome.");
  if (event.outcome !== undefined && event.status === "completed" &&
    Number.isInteger(event.homeScore) && Number.isInteger(event.awayScore)) {
    const expected = event.homeScore! > event.awayScore! ? "win" :
      event.homeScore! < event.awayScore! ? "loss" : "draw";
    if (event.outcome !== expected) issues.push("Match outcome does not match the recorded score.");
  }
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
  requiredText(settings.brand.logoAlt, "brand logo alternative text");
  if (settings.brand.logoUrl !== undefined && !isSafePublicHref(settings.brand.logoUrl)) issues.push("Brand logo URL must be a safe relative or HTTPS URL.");
  if (!["rossoblu-classic", "rossoblu-dark"].includes(settings.brand.themePreset)) issues.push("Unknown brand theme preset.");
  requiredText(settings.site.language, "document language");
  requiredText(settings.site.locale, "date and number locale");
  requiredText(settings.site.openGraphLocale, "Open Graph locale");
  if (!/^[a-z]{2,3}(-[A-Z]{2})?$/.test(settings.site.language)) issues.push("Document language must be a valid language tag.");
  if (!/^[a-z]{2,3}(-[A-Z]{2})?$/.test(settings.site.locale)) issues.push("Site locale must be a valid language-region tag.");
  requiredText(settings.site.title, "site title");
  requiredText(settings.site.description, "site description");
  requiredText(settings.site.ogTitle, "Open Graph title");
  requiredText(settings.site.ogDescription, "Open Graph description");
  if (settings.site.canonicalUrl !== undefined && !/^https:\/\//i.test(settings.site.canonicalUrl)) issues.push("Site canonical URL must use HTTPS.");
  if (settings.site.ogImageUrl !== undefined && (!isSafePublicHref(settings.site.ogImageUrl) || !nonEmpty(settings.site.ogImageAlt))) issues.push("Open Graph image requires a safe URL and alternative text.");
  if (settings.site.twitterTitle !== undefined && !nonEmpty(settings.site.twitterTitle)) issues.push("Twitter title must not be empty.");
  if (settings.site.twitterDescription !== undefined && !nonEmpty(settings.site.twitterDescription)) issues.push("Twitter description must not be empty.");
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
    ["homepage visual tag", home.visualTag], ["homepage visual image alternative text", home.visualImageAlt],
    ["homepage visual monogram", home.visualMonogram],
    ["homepage visual counter", home.visualCounter], ["homepage social proof", home.heroSocialProof],
    ["homepage brand colors label", home.brandColorsLabel], ["homepage brand colors descriptor", home.brandColorsDescriptor],
    ["homepage artwork title", home.artworkTitle], ["homepage artwork description", home.artworkDescription],
    ["homepage project title", home.projectTitle],
    ["homepage closing title", home.closingTitle],
  ].forEach(([label, value]) => requiredText(value, String(label)));
  if (home.visualImageUrl !== undefined && !isSafePublicHref(home.visualImageUrl)) issues.push("Homepage visual image URL must be a safe relative or HTTPS URL.");
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
    if (page.canonicalUrl !== undefined && !/^https:\/\//i.test(page.canonicalUrl)) issues.push(`${pageName} canonical URL must use HTTPS.`);
    if (page.socialImageUrl !== undefined && (!isSafePublicHref(page.socialImageUrl) || !nonEmpty(page.socialImageAlt))) issues.push(`${pageName} social image requires a safe URL and alternative text.`);
  });
  pages.forEach(([pageName, page]) => {
    requiredText(page.title, `${pageName} page title`);
    requiredText(page.accent, `${pageName} page accent`);
    requiredText(page.description, `${pageName} page description`);
    requiredText(page.seoTitle, `${pageName} SEO title`);
    requiredText(page.seoDescription, `${pageName} SEO description`);
  });

  Object.entries(settings.news.categoryLabels).forEach(([key, value]) => requiredText(value, `news category ${key}`));
  checkOrderedItems(settings.news.topics, "news topic");
  settings.news.topics.forEach((topic, index) => requiredText(topic.title, `news topic ${index + 1} title`));
  requiredText(settings.teams.rosterCountLabel, "roster count label");
  requiredText(settings.teams.teamDescriptionLabel, "team description label");
  requiredText(settings.teams.rosterTitle, "team roster title");
  requiredText(settings.teams.staffTitle, "team staff title");
  requiredText(settings.teams.jerseyNumberLabel, "jersey number label");
  checkOrderedItems(settings.teams.categories, "team page category");
  settings.teams.categories.forEach((category, index) => requiredText(category.title, `team category ${index + 1} title`));
  Object.entries(settings.calendar.eventStatusLabels).forEach(([key, value]) => requiredText(value, `event status ${key}`));
  Object.entries(settings.calendar.outcomeLabels).forEach(([key, value]) => requiredText(value, `match outcome ${key}`));
  requiredText(settings.calendar.seasonLabel, "calendar season label");
  requiredText(settings.calendar.competitionLabel, "calendar competition label");
  requiredText(settings.calendar.venueLabel, "calendar venue label");
  requiredText(settings.calendar.roundLabel, "calendar round label");
  requiredText(settings.calendar.notesLabel, "calendar notes label");
  checkOrderedItems(settings.society.pillars, "society pillar");
  settings.society.pillars.forEach((pillar, index) => requiredText(pillar.title, `society pillar ${index + 1} title`));

  // Complete public-copy coverage: every rendered editorial field must be present.
  [
    ["homepage visual eyebrow", home.visualEyebrow],
    ["homepage visual description", home.visualDescription],
    ["homepage project eyebrow", home.projectEyebrow],
    ["homepage project description", home.projectDescription],
    ["homepage project action label", home.projectActionLabel],
    ["homepage closing eyebrow", home.closingEyebrow],
    ["homepage closing description", home.closingDescription],
    ["homepage closing primary action label", home.closingPrimaryLabel],
    ["homepage closing secondary action label", home.closingSecondaryLabel],
  ].forEach(([label, value]) => requiredText(value, String(label)));

  requiredText(home.secondaryActionLabel, "homepage secondary action label");
  requiredText(home.projectActionLabel, "homepage project action label");
  requiredText(home.closingPrimaryLabel, "homepage closing primary action label");
  requiredText(home.closingSecondaryLabel, "homepage closing secondary action label");

  pages.forEach(([pageName, page]) => {
    requiredText(page.backLabel, `${pageName} back navigation label`);
    requiredText(page.eyebrow, `${pageName} eyebrow`);
  });

  [
    ["news empty-state eyebrow", settings.news.emptyEyebrow],
    ["news empty-state title", settings.news.emptyTitle],
    ["news empty-state description", settings.news.emptyDescription],
    ["news article back label", settings.news.articleBackLabel],
    ["news published label", settings.news.publishedLabel],
    ["news not-found title", settings.news.notFoundTitle],
    ["news not-found description", settings.news.notFoundDescription],
  ].forEach(([label, value]) => requiredText(value, String(label)));
  Object.entries(settings.news.categoryLabels).forEach(([key, value]) =>
    requiredText(value, `news category label ${key}`),
  );
  settings.news.topics.forEach((topic, index) => {
    requiredText(topic.label, `news topic ${index + 1} label`);
    requiredText(topic.description, `news topic ${index + 1} description`);
  });

  home.features.forEach((feature, index) => {
    requiredText(feature.eyebrow, `homepage feature ${index + 1} eyebrow`);
    requiredText(feature.title, `homepage feature ${index + 1} title`);
    requiredText(feature.description, `homepage feature ${index + 1} description`);
  });
  settings.teams.categories.forEach((category, index) => {
    if (!["senior", "youth"].includes(category.category))
      issues.push(`team category ${index + 1}: unknown team category.`);
  });

  settings.teams.categories.forEach((category, index) => {
    requiredText(category.eyebrow, `team category ${index + 1} eyebrow`);
    requiredText(category.emptyDescription, `team category ${index + 1} empty-state description`);
  });
  requiredText(settings.teams.asideTitle, "teams aside title");
  requiredText(settings.teams.asideDescription, "teams aside description");
  requiredText(settings.teams.asideActionLabel, "teams aside action label");
  checkHref(settings.teams.asideActionHref, "teams aside action");

  settings.calendar.eventTypes.forEach((type, index) =>
    requiredText(type, `calendar event type ${index + 1}`),
  );
  if (settings.calendar.eventTypes.length === 0)
    issues.push("Calendar must define at least one event type.");
  requiredText(settings.calendar.upcomingTitle, "calendar upcoming section title");
  requiredText(settings.calendar.upcomingEmpty, "calendar upcoming empty-state text");
  requiredText(settings.calendar.resultsTitle, "calendar results section title");
  requiredText(settings.calendar.resultsEmpty, "calendar results empty-state text");

  settings.society.pillars.forEach((pillar, index) =>
    requiredText(pillar.description, `society pillar ${index + 1} description`),
  );
  requiredText(settings.society.asideTitle, "society aside title");
  requiredText(settings.society.asideDescription, "society aside description");
  [
    ["history section title", settings.society.historyTitle],
    ["mission section title", settings.society.missionTitle],
    ["address section title", settings.society.addressTitle],
    ["contacts section title", settings.society.contactsTitle],
    ["social links section title", settings.society.socialLinksTitle],
    ["people section title", settings.society.peopleTitle],
    ["sponsors section title", settings.society.sponsorsLabel],
    ["partners section title", settings.society.partnersLabel],
  ].forEach(([label, value]) => requiredText(value, `society ${label}`));

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

