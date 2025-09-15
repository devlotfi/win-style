import fs from "fs";
import path from "path";
import sharp from "sharp";
import toIco from "to-ico";
import readline from "readline";

const inputDir = path.resolve("./svg");
const outputDir = path.resolve("./__generated__");

// ICO sizes we want to include
const sizes = [16, 24, 32, 48, 64, 128, 256];

/**
 * Replace all `fill="#88C0D0"` with the new color
 */
function replaceColor(svgContent: string, color: string): string {
  return svgContent.replace(/fill="#88C0D0"/g, `fill="${color}"`);
}

async function convertSvgToIco(svgPath: string, icoPath: string, color: string) {
  let svgContent = await fs.promises.readFile(svgPath, "utf8");
  svgContent = replaceColor(svgContent, color);
  const svgBuffer = Buffer.from(svgContent);

  const pngBuffers = await Promise.all(
    sizes.map((size) => sharp(svgBuffer).resize(size, size).png().toBuffer())
  );

  const icoBuffer = await toIco(pngBuffers);
  await fs.promises.writeFile(icoPath, icoBuffer);
}

async function askColor(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("🎨 Enter the color for your icons (e.g., #88C0D0): ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const newColor = await askColor();

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const files = await fs.promises.readdir(inputDir);

  for (const file of files) {
    if (file.endsWith(".svg")) {
      const svgPath = path.join(inputDir, file);
      const icoName = path.basename(file, ".svg") + ".ico";
      const icoPath = path.join(outputDir, icoName);

      console.log(`🎨 Converting ${file} → ${icoName} with color ${newColor}`);
      await convertSvgToIco(svgPath, icoPath, newColor);
    }
  }

  console.log("✅ All icons converted!");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
