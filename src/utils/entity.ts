/**
 * One identity for Luca Berton and for Open Empower in structured data.
 *
 * lucaberton.com is the entity home of the Person, openempower.com the home
 * of the Organization. Luca's other sites (openempower.com, udienza.com,
 * kubernetes.recipes, copypastelearn.com, ...) reference the same @ids, so
 * keep these values identical everywhere. Layout.astro emits the full nodes
 * once per page; posts, videos, books and products point at the Person with
 * PERSON_REF instead of describing him again with a different job title or
 * sameAs list (two such records used to share the same @id).
 *
 * sameAs lists only profiles that Luca's own sites link to (see footer.astro).
 * Bluesky: the handle is lucaberton.bsky.social; "lucaberton.com" is not a
 * Bluesky handle (the profile URL with it does not resolve).
 */
export const PERSON_ID = "https://lucaberton.com/#person";
export const ORGANIZATION_ID = "https://www.openempower.com/#organization";
export const WEBSITE_ID = "https://lucaberton.com/#website";

export const organization = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "Open Empower",
  url: "https://www.openempower.com/",
};

export const person = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: "Luca Berton",
  url: "https://lucaberton.com/",
  jobTitle: "Founder and CEO",
  worksFor: { "@id": ORGANIZATION_ID },
  description: "The Production AI Expert",
  sameAs: [
    "https://www.linkedin.com/in/lucaberton/",
    "https://github.com/lucab85",
    "https://bsky.app/profile/lucaberton.bsky.social",
    "https://www.youtube.com/@BertonLuca",
    "https://x.com/TheLucaBerton",
  ],
};

/**
 * Reference to the Person for author / publisher / brand. Same @id, name and
 * url as the full node, nothing that could contradict it.
 */
export const PERSON_REF = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: "Luca Berton",
  url: "https://lucaberton.com/",
};
