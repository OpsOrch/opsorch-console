import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const projectRoot = new URL("../", import.meta.url);
const aliasExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts"];

function resolveAlias(specifier) {
  const relativePath = specifier.slice(2);
  for (const ext of aliasExtensions) {
    const candidate = new URL(`${relativePath}${ext}`, projectRoot);
    if (existsSync(fileURLToPath(candidate))) return candidate.href;
  }
  return new URL(relativePath, projectRoot).href;
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    return { url: resolveAlias(specifier), shortCircuit: true };
  }

  // Handle .js extensions that should resolve to .ts files
  if (specifier.endsWith(".js") && context.parentURL) {
    const parentPath = fileURLToPath(context.parentURL);
    const parentDir = parentPath.substring(0, parentPath.lastIndexOf("/"));
    const specifierWithoutExt = specifier.slice(0, -3);

    // Try to resolve as a relative path
    if (specifier.startsWith("./") || specifier.startsWith("../")) {
      for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
        const candidate = new URL(`${specifierWithoutExt}${ext}`, `file://${parentDir}/`);
        if (existsSync(fileURLToPath(candidate))) {
          return { url: candidate.href, shortCircuit: true };
        }
      }
    }
  }

  // Handle extensionless relative imports
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !specifier.endsWith(".js") && context.parentURL) {
    const parentPath = fileURLToPath(context.parentURL);
    const parentDir = parentPath.substring(0, parentPath.lastIndexOf("/"));

    for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
      const candidate = new URL(`${specifier}${ext}`, `file://${parentDir}/`);
      if (existsSync(fileURLToPath(candidate))) {
        return { url: candidate.href, shortCircuit: true };
      }
    }
  }

  return next(specifier, context);
}

export async function load(url, context, next) {
  if (!url.endsWith(".ts") && !url.endsWith(".tsx")) return next(url, context);
  const source = await readFile(fileURLToPath(url), "utf8");
  const transpiled = ts.transpileModule(source, {
    fileName: fileURLToPath(url),
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
  });
  return {
    format: "module",
    source: transpiled.outputText,
    shortCircuit: true,
  };
}
