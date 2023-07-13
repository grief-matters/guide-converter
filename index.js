import "dotenv/config";
import { readdir } from "node:fs/promises";
import { readFile, writeFile } from "node:fs/promises";
import { createClient } from "@sanity/client";
import { convertWebsitesMDToDocuments } from "./convertWebsites.js";
import { convertMDResourcesToDocuments } from "./convertResources.js";
import { convertMDPeerSupportResourcesToDocuments } from "./convertPeerSupportResource.js";
import { convertMDAppsToDocuments } from "./convertApps.js";

const args = process.argv.slice(2);
const isTest = args.includes("--test-data");
const dirUrl = isTest ? "./test-data" : "./data";

const markdownConversionFunctionMap = {
  app: convertMDAppsToDocuments,
  article: convertWebsitesMDToDocuments,
  crisisResource: () => undefined,
  forum: convertMDResourcesToDocuments,
  memorial: convertMDResourcesToDocuments,
  peerSupportResource: convertMDPeerSupportResourcesToDocuments,
  story: convertMDResourcesToDocuments,
  therapyResource: convertMDResourcesToDocuments,
  website: () => undefined,
};

const docTypes = Object.keys(markdownConversionFunctionMap);

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: "2023-07-04",
  token: process.env.SANITY_AUTH_TOKEN,
  useCdn: false,
});

let websiteDocs;
let resourceDocs = [];

try {
  const filePath = new URL(`${dirUrl}/website.md`, import.meta.url);
  const contents = await readFile(filePath, { encoding: "utf8" });

  if (contents) {
    websiteDocs = convertWebsitesMDToDocuments(contents);
  } else {
    throw new Error("No parsed websites");
  }
} catch (err) {
  console.error(err);
}

try {
  if (!websiteDocs) {
    console.error(
      "There are no websiteDocs to provide to conversion functions"
    );
  }

  const files = await readdir(dirUrl);
  const filteredFiles = files.filter((x) => x[0] !== ".");

  for (const file of filteredFiles) {
    // get the type
    const docType = file.split(".")[0];
    if (!docTypes.includes(docType)) {
      console.log(
        `There is no document type defined for '${docType}'\n\nValid document types are:\n\n${docTypes}`
      );
      continue;
    }

    if (docType === "website") {
      continue;
    }

    // read in the file
    const filePath = new URL(`${dirUrl}/${file}`, import.meta.url);
    const contents = await readFile(filePath, { encoding: "utf8" });

    const docs = markdownConversionFunctionMap[docType](
      contents,
      docType,
      websiteDocs
    );

    if (docs) {
      resourceDocs.push(...docs);
    } else {
      console.log(`No documents were generated for type: ${docType}\n`);
    }
  }
} catch (err) {
  console.error(err);
}

try {
  const documents = [...websiteDocs, ...resourceDocs];

  if (isTest) {
    writeDocumentsToJSONOutput(documents);
  } else {
    createDocuments(documents);
  }
} catch (e) {
  console.error(e);
}

function writeDocumentsToJSONOutput(documents) {
  writeFile("./test-output/output.json", JSON.stringify(documents, null, 4));
}

function createDocuments(documents) {
  console.log("createDocuments");
  // let transaction = client.transaction();

  // websiteDocs.forEach((doc) => {
  //   transaction.createOrReplace(doc);
  // });
  // storyDocs.forEach((doc) => {
  //   transaction.createOrReplace(doc);
  // });

  // return transaction.commit();
}
