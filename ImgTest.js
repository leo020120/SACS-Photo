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
  "ImageType",
  "Objects",
  "Tags",
];
const domainDetails = ["Celebrities", "Landmarks"];

const facesImageURL =
  "https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/ComputerVision/Images/celebrities.jpg";

async function analyzeImage() {
  const result = await computerVisionClient.analyzeImage(
    facesImageURL,
    { visualFeatures: features },
    { details: domainDetails }
  );
  console.log("RESULTS", result);

  // Detect Colors
  const color = result.color;
  printColorScheme(color);

  // Print a detected color scheme
  async function printColorScheme(colors) {
    console.log(`Image is in ${colors.isBwImg ? "black and white" : "color"}`);
    console.log(`Dominant colors: ${colors.dominantColors.join(", ")}`);
    console.log(`Dominant foreground color: ${colors.dominantColorForeground}`);
    console.log(`Dominant background color: ${colors.dominantColorBackground}`);
    console.log(`Suggested accent color: #${colors.accentColor}`);
  }
  console.log(color);
}

analyzeImage();
