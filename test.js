"use strict";

const async = require("async");
const fs = require("fs");
const https = require("https");
const path = require("path");
const createReadStream = require("fs").createReadStream;
const sleep = require("util").promisify(setTimeout);
const ComputerVisionClient =
  require("@azure/cognitiveservices-computervision").ComputerVisionClient;
const ApiKeyCredentials = require("@azure/ms-rest-js").ApiKeyCredentials;

/**
 * AUTHENTICATE
 * This single client is used for all examples.
 */
const key = process.env.VISION_KEY;
const endpoint = process.env.VISION_ENDPOINT;

const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({ inHeader: { "Ocp-Apim-Subscription-Key": key } }),
  endpoint
);
/**
 * END - Authenticate
 */

// Get the visual feature for analysis
const features = [
  "Categories",
  "Brands",
  "Adult",
  "Color",
  "Description",
  "Faces",
  "Image_type",
  "Objects",
  "Tags",
];
const domainDetails = ["Celebrities", "Landmarks"];

function computerVision() {
  async.series(
    [
      async function () {
        /**
         * DETECT TAGS
         * Detects tags for an image, which returns:
         *     all objects in image and confidence score.
         */
        console.log("-------------------------------------------------");
        console.log("DETECT TAGS");
        console.log();

        // Image of different kind of dog.
        const tagsURL =
          "https://upload.wikimedia.org/wikipedia/commons/1/18/Dog_Breeds.jpg";

        // Analyze URL image
        console.log("Analyzing tags in image...", tagsURL.split("/").pop());
        const tags = (
          await computerVisionClient.analyzeImage(tagsURL, {
            visualFeatures: ["Tags"],
          })
        ).tags;
        console.log(`Tags: ${formatTags(tags)}`);

        // Format tags for display
        function formatTags(tags) {
          return tags
            .map((tag) => `${tag.name} (${tag.confidence.toFixed(2)})`)
            .join(", ");
        }
        /**
         * END - Detect Tags
         */
        console.log();
        console.log("-------------------------------------------------");
        console.log("End of quick.");
      },
      function () {
        return new Promise((resolve) => {
          resolve();
        });
      },
    ],
    (err) => {
      throw err;
    }
  );
}

computerVision();
