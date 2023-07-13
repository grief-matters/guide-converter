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

const resourcePattern = /\[([^\]]+)\]\(([^)]+)\)([^[]+)\(from\s+([^)]+)\)/g;

function transform(jsonObj, type, websites) {
  const { title, url, description, source, supportType } = jsonObj;

  const sourceWebsite = websites.find(
    (x) => x.name === source || url.includes(x.websiteUrl)
  );

  return {
    _id: `imported-${murmurhash.v2(url)}`,
    _type: type,
    [nameKeyMap[type]]: title,
    description,
    type: supportType,
    resourceDetails: {
      _type: "resourceBase",
      resourceUrl: url,
      source: sourceWebsite
        ? {
            _type: "reference",
            _ref: sourceWebsite._id,
          }
        : undefined,
    },
  };
}

function convertMarkdownToJSON(markdown, supportType) {
  const matches = [...markdown.matchAll(resourcePattern)];
  const jsonObjects = matches.map((match) => {
    const [_, title, url, descriptionRaw, sourceRaw] = match;

    const description = descriptionRaw.replace(/\n/g, " ");
    const source = sourceRaw.replace(/\n/g, " ");

    return { title, description, url, source, supportType };
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
export function convertMDPeerSupportResourcesToDocuments(
  markdown,
  type,
  websites
) {
  const pattern = /# One-to-one([\s\S]*?)# Support-groups([\s\S]*)/;

  const [_, oneToOneMatches, supportGroupsMatches] = markdown.match(pattern);

  const jsonObjects = [
    ...convertMarkdownToJSON(oneToOneMatches, "One-to-one"),
    ...convertMarkdownToJSON(supportGroupsMatches, "Support-groups"),
  ];
  const deduped = deduplicateArrayByKey(jsonObjects, "url");
  const transformed = deduped.map((x) => transform(x, type, websites));
  return transformed;
}
