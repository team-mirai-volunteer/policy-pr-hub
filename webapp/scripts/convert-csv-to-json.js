const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../../problems.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

const lines = csvContent.split('\n');
const header = lines[0]; // Skip header
const dataLines = lines.slice(1).filter(line => line.trim());

const problemMap = {};
let processedCount = 0;

dataLines.forEach((line, index) => {
  const lastCommaIndex = line.lastIndexOf(',');
  if (lastCommaIndex === -1) return;
  
  const text = line.substring(0, lastCommaIndex).trim();
  const url = line.substring(lastCommaIndex + 1).trim();
  
  if (text && url) {
    problemMap[text] = url;
    processedCount++;
  }
});

const outputPath = path.join(__dirname, '../src/data/problemMappings.json');
fs.writeFileSync(outputPath, JSON.stringify(problemMap, null, 2));

console.log(`Converted ${processedCount} mappings from CSV to JSON`);
console.log(`Output written to: ${outputPath}`);
console.log(`File size: ${fs.statSync(outputPath).size} bytes`);
