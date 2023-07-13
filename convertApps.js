import murmurhash from "murmurhash";
import { deduplicateArrayByKey } from "./utils.js";

const nameKeyMap = {
  app: "name",
  article: "title",
  book: "title",
  blog: "title",
  crisisResource: "name",
  podcast: "name",
  podcastEpisode: "title",
  story: "title",
  forum: "name",
  peerSupportResource: "name",
  therapyResource: "name",
  memorial: "name",
};

// const pattern = /\[([^\]]+)\]\(([^)]+)\)([^[]+)\(from\s+([^)]+)\)/g;
const pattern = /\[([^\]]+)\]\(([^)]+)\)\n([^[]+)/g;

function transform(jsonObj, type, websites) {
  const { title, url, description, source } = jsonObj;

  const apple = url.includes("apps.apple.com") ? url : undefined;
  const play = url.includes("play.google.com") ? url : undefined;
  const fallbackUrl = !apple && !play && url;

  return {
    _id: `imported-${murmurhash.v2(url)}`,
    _type: type,
    [nameKeyMap[type]]: title,
    description,
    appleUrl: apple,
    playStoreUrl: play,
    resourceDetails: {
      _type: "resourceBase",
      resourceUrl: fallbackUrl,
      source: undefined,
    },
  };
}

function convertMarkdownToJSON(markdown) {
  const matches = [...markdown.matchAll(pattern)];
  const jsonObjects = matches.map((match) => {
    const [_, title, url, descriptionRaw, sourceRaw] = match;

    const description = descriptionRaw.replace(/\n/g, " ");
    const source = sourceRaw && sourceRaw.replace(/\n/g, " ");

    return { title, description, url, source };
  });
  return jsonObjects;
}

/**
 *
 * @param {string} markdown
 * @param {string} type
 * @param {Object[]} websites
 * @returns {Object[]}
 */
export function convertMDAppsToDocuments(markdown, type, websites) {
  const jsonObjects = convertMarkdownToJSON(markdown);
  const deduped = deduplicateArrayByKey(jsonObjects, "url");
  const transformed = deduped.map((x) => transform(x, type, websites));

  return transformed;
}
