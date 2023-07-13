import murmurhash from "murmurhash";
import { deduplicateArrayByKey } from "./utils.js";

const pattern = /\[(.*?)\]\((.*?)\)[\r\n]+(.*?)(?=\n\n|\n?$)/gs;

function transform(websiteJsonObj) {
  const { name, description, websiteUrl } = websiteJsonObj;

  return {
    _id: `imported-${murmurhash.v2(websiteUrl)}`,
    _type: "website",
    name,
    description,
    websiteUrl,
  };
}

function convertMarkdownToJSON(markdown) {
  const matches = [...markdown.matchAll(pattern)];
  const jsonObjects = matches.map((match) => {
    const [_, name, websiteUrl, descriptionRaw] = match;

    const description = descriptionRaw.replace(/\n/g, " ");

    return { name, description, websiteUrl };
  });
  return jsonObjects;
}

export function convertWebsitesMDToDocuments(markdown) {
  const jsonObjects = convertMarkdownToJSON(markdown);
  const deduped = deduplicateArrayByKey(jsonObjects, "websiteUrl");
  const transformed = deduped.map((x) => transform(x));

  return transformed;
}
