// client/build.js
// Simple static build script to copy client assets into ./dist

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DIST_DIR = path.join(ROOT, "dist");

const FOLDERS_TO_COPY = ["assets", "scripts", "styles", "pages"];

function emptyDist() {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

function copyFolder(srcDirRel) {
  const srcDir = path.join(ROOT, srcDirRel);
  const destDir = path.join(DIST_DIR, srcDirRel);

  if (!fs.existsSync(srcDir)) return;

  fs.mkdirSync(destDir, { recursive: true });

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyDirectoryRecursive(srcPath, destPath) {
  fs.mkdirSync(destPath, { recursive: true });
  for (const entry of fs.readdirSync(srcPath, { withFileTypes: true })) {
    const srcEntry = path.join(srcPath, entry.name);
    const destEntry = path.join(destPath, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcEntry, destEntry);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcEntry, destEntry);
    }
  }
}

function writeIndexRedirect() {
  const indexPath = path.join(DIST_DIR, "index.html");
  const html = `<!DOCTYPE html>\n<html lang="fr">\n<head>\n  <meta charset="UTF-8" />\n  <meta http-equiv="refresh" content="0; url=pages/login.html" />\n  <title>Redirection...</title>\n</head>\n<body>\n  <p>Redirection vers la page de connexion...</p>\n  <script>window.location.replace('pages/login.html');</script>\n</body>\n</html>\n`;

  fs.writeFileSync(indexPath, html, "utf8");
}

function build() {
  emptyDist();
  for (const folder of FOLDERS_TO_COPY) {
    copyFolder(folder);
  }
  writeIndexRedirect();
  console.log("Client build complete ➜ dist/");
}

build();
