import { readFileSync, writeFileSync } from "fs";

const dataPath = "src/lib/data.ts";
const fleetPath = "scripts/output/demo-fleet.ts.txt";

const data = readFileSync(dataPath, "utf8");
const fleet = readFileSync(fleetPath, "utf8").trimEnd();

const startMarker = "export const vehicles: Vehicle[] = [\n";
const endMarker = "\n];\n\nexport const partnerUnits";

const startIdx = data.indexOf(startMarker);
const endIdx = data.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find markers to splice fleet data into data.ts");
  process.exit(1);
}

const before = data.slice(0, startIdx + startMarker.length);
const after = data.slice(endIdx);

const newData = before + fleet + after;
writeFileSync(dataPath, newData, "utf8");
console.log("Spliced", fleet.split("\n  {").length - 1, "vehicles into", dataPath);
