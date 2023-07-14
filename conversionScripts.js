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

const transformFunctionMap = {
  app: transformObjectToAppDoc,
  article: transformObjectToResourceDoc,
  crisisResource: transformObjectToCrisisResourceDoc,
  forum: transformObjectToResourceDoc,
  memorial: transformObjectToResourceDoc,
  peerSupportResource: transformObjectToPeerSupportResourceDoc,
  story: transformObjectToResourceDoc,
  therapyResource: transformObjectToResourceDoc,
  website: transformObjectToWebsiteDoc,
};

export const docTypes = Object.keys(transformFunctionMap);

function transformObjectToWebsiteDoc(args) {
  const {
    object: { name, description, url },
  } = args;

  return {
    _id: `imported-website-${murmurhash.v2(url)}`,
    _type: "website",
    name,
    description,
    websiteUrl: url,
  };
}

function transformObjectToResourceDoc(args) {
  const {
    object: { name, url, description, source },
    docType,
    websiteDocs,
  } = args;

  const sourceWebsite = websiteDocs.find(
    (x) => x.name === source || url.includes(x.websiteUrl)
  );

  return {
    _id: `imported-${docType}-${murmurhash.v2(url)}`,
    _type: docType,
    [nameKeyMap[docType]]: name,
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

function transformObjectToAppDoc(args) {
  const {
    object: { name, url, description },
    docType,
  } = args;

  const apple = url.includes("apps.apple.com") ? url : undefined;
  const play = url.includes("play.google.com") ? url : undefined;
  // const fallbackUrl = !apple && !play && url;
  const fallbackUrl = !apple && !play ? url : undefined;

  return {
    _id: `imported-app-${murmurhash.v2(url)}`,
    _type: docType,
    [nameKeyMap[docType]]: name,
    description,
    appleUrl: apple,
    playStoreUrl: play,
    resourceDetails: fallbackUrl
      ? {
          _type: "resourceBase",
          resourceUrl: fallbackUrl,
          source: undefined,
        }
      : undefined,
  };
}

function transformObjectToPeerSupportResourceDoc(args) {
  const {
    object: { name, url, description, source, supportType },
    websiteDocs,
  } = args;

  const sourceWebsite = websiteDocs.find(
    (x) => x.name === source || url.includes(x.websiteUrl)
  );

  return {
    _id: `imported-psr-${murmurhash.v2(url)}`,
    _type: "peerSupportResource",
    name,
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

function transformObjectToCrisisResourceDoc(args) {
  const {
    object: { name, url, description, source },
    websiteDocs,
  } = args;

  const website = websiteDocs.find(
    (x) => x.name === source || url.includes(x.websiteUrl)
  );

  return {
    _id: `imported-crisisresource-${murmurhash.v2(url)}`,
    _type: "crisisResource",
    name,
    description,
    website: website
      ? {
          _type: "reference",
          _ref: website._id,
        }
      : undefined,
  };
}

function convertMarkdownToObjects(markdown) {
  const pattern =
    /\[([^\]]+)\]\(([^)]+)\)(?:\s*((?:\([^)]+\))?[\s\S]*?(?=\n{2}|$|\(from|\[([^\]]+)\]\((?:[^)]+)\))))?(?:\s*\((?:from\s+([^)]+))?\))?/g;

  const jsonObjects = [];
  let match;

  while ((match = pattern.exec(markdown)) !== null) {
    const [_, name, url, description, _1, source] = match;

    const jsonObject = {
      name,
      url,
      description: description ? description.replace(/\n/g, " ").trim() : "",
      source: source ? source.trim() : "",
    };

    // Adjustment: Check if the source is specified after the description
    if (!jsonObject.source && jsonObject.description.includes("(from")) {
      const descriptionParts = jsonObject.description.split("(from");
      jsonObject.description = descriptionParts[0].trim();
      jsonObject.source = descriptionParts[1].replace(")", "").trim();
    }

    jsonObjects.push(jsonObject);
  }

  return jsonObjects;
}

export function convertMarkdownToDocuments(markdown, docType, websiteDocs) {
  let objects;

  if (docType === "peerSupportResource") {
    const peerSupportHeadingPattern =
      /# One-to-one([\s\S]*?)# Support-groups([\s\S]*)/;

    const [_, oneToOneMatches, supportGroupsMatches] = markdown.match(
      peerSupportHeadingPattern
    );

    const oneToOneObjects = convertMarkdownToObjects(oneToOneMatches).map(
      (x) => ({ ...x, supportType: "One-to-one" })
    );
    const supportGroupsObjects = convertMarkdownToObjects(
      supportGroupsMatches
    ).map((x) => ({ ...x, supportType: "Support-groups" }));

    objects = [...oneToOneObjects, ...supportGroupsObjects];
  } else {
    objects = convertMarkdownToObjects(markdown);
  }

  const deduped = deduplicateArrayByKey(objects, "url");

  const transformed = deduped.map((x) =>
    transformFunctionMap[docType]({
      object: x,
      docType: docType,
      websiteDocs: websiteDocs,
    })
  );

  return transformed;
}
