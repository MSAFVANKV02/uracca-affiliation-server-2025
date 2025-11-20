import esbuild from "esbuild";
import fs from "fs";
import path from "path";

esbuild.build({
  entryPoints: ["src/index.js"],
  outfile: "dist/index.js",
  bundle: true,
  minify: true,
  format: "esm",
  platform: "browser",
  target: ["es2020"],
}).catch(() => process.exit(1));

// Copy all .d.ts files preserving folder structure
function copyTypes(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });

  for (const file of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);

    if (fs.statSync(srcPath).isDirectory()) {
      copyTypes(srcPath, destPath);
    } else if (file.endsWith(".d.ts")) {
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyTypes("src", "dist");
