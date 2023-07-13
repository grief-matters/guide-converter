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

function transform(jsonObj, type, websites) {
  const { title, url, description, source } = jsonObj;

  const sourceWebsite = websites.find(
    (x) => x.name === source || url.includes(x.websiteUrl)
  );

  return {
    _id: `imported-${murmurhash.v2(url)}`,
    _type: type,
    [nameKeyMap[type]]: title,
    description,
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

const pattern = /\[([^\]]+)\]\(([^)]+)\)((?:[^[]*?)(?:\(from\s+([^)]+)\))?)?/g;

function convertMarkdownToJSON(markdown) {
  const matches = [...markdown.matchAll(pattern)];
  const jsonObjects = matches.map((match) => {
    const [_, title, url, rest] = match;

    let description = "";
    let source = "";

    if (rest) {
      const parts = rest.split("(from");
      description = parts[0].replace(/\n/g, " ").trim();
      // source = (parts[1] || sourceRaw).replace(/\n/g, " ").trim();
      source = (parts[1] ? parts[1].replace(/\n/g, " ").trim() : "").trim();
    }

    return { title, description, url, source };
  });
  return jsonObjects;
}

// OLD CODE - kept for reference
// const pattern = /\[([^\]]+)\]\(([^)]+)\)([^[]+)\(from\s+([^)]+)\)/g;

// function convertMarkdownToJSON(markdown) {
//   const matches = [...markdown.matchAll(pattern)];
//   const jsonObjects = matches.map((match) => {
//     const [_, title, url, descriptionRaw, sourceRaw] = match;

//     const description = descriptionRaw.replace(/\n/g, " ");
//     const source = sourceRaw.replace(/\n/g, " ");

//     return { title, description, url, source };
//   });
//   return jsonObjects;
// }

/**
 *
 * @param {string} markdown
 * @param {string} type
 * @param {Object[]} websites
 * @returns {Object[]}
 */
export function convertMDResourcesToDocuments(markdown, type, websites) {
  const jsonObjects = convertMarkdownToJSON(markdown);
  const deduped = deduplicateArrayByKey(jsonObjects, "url");
  const transformed = deduped.map((x) => transform(x, type, websites));

  return transformed;
}
