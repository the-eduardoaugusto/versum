#!/usr/bin/env bun

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

interface ValidationError {
  file: string;
  line?: number;
  message: string;
  severity: "error" | "warning";
}

const errors: ValidationError[] = [];

const VAULT_PATH = join(import.meta.dir, "..", "Obsidian Vault/Docs");
const VAULT_ROOT = join(import.meta.dir, "..", "Obsidian Vault");
const REQUIRED_TAGS = ["versum", "docs"];
const REQUIRED_FRONTMATTER = ["title", "section", "tags", "up"];
const allFiles = new Set<string>();

function resolveLink(link: string, currentFile: string): string | null {
  // Remove anchor and pipe syntax
  const cleanLink = link.split("|")[0].split("#")[0];
  if (!cleanLink) return null;

  // Normalize path separators
  const normalizedLink = cleanLink.replace(/\\/g, "/");

  // Try different path resolutions - order matters!
  const candidates = [
    join(VAULT_ROOT, normalizedLink + ".md"),  // For Docs/... links
    join(VAULT_PATH, normalizedLink + ".md"),   // For files inside Docs path
  ];

  for (const candidate of candidates) {
    // Normalize candidate path for consistent comparison
    const normalized = candidate.replace(/\\/g, "/");
    for (const file of allFiles) {
      const normalizedFile = file.replace(/\\/g, "/");
      if (normalized === normalizedFile) {
        return candidate;
      }
    }
  }

  return null;
}

function validateMarkdownFile(filePath: string): void {
  try {
    const content = readFileSync(filePath, "utf-8");
    const relativePath = relative(VAULT_PATH, filePath);

    // Check for frontmatter
    if (!content.startsWith("---")) {
      errors.push({
        file: relativePath,
        message: "Missing frontmatter (must start with ---)",
        severity: "error",
      });
      return;
    }

    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      errors.push({
        file: relativePath,
        message: "Invalid frontmatter format",
        severity: "error",
      });
      return;
    }

    const frontmatterStr = frontmatterMatch[1];
    const frontmatter: Record<string, any> = {};

    // Parse YAML frontmatter
    for (const line of frontmatterStr.split("\n")) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        frontmatter[key] = value.trim();
      }
    }

    // Validate required fields
    for (const required of REQUIRED_FRONTMATTER) {
      if (!frontmatter[required]) {
        errors.push({
          file: relativePath,
          message: `Missing required frontmatter: ${required}`,
          severity: "error",
        });
      }
    }

    // Validate tags
    if (frontmatter.tags) {
      const tagsStr = frontmatter.tags;
      let tags: string[] = [];

      if (tagsStr.startsWith("[") && tagsStr.endsWith("]")) {
        tags = tagsStr
          .slice(1, -1)
          .split(",")
          .map((t) => t.trim());
      }

      // Require 'versum' tag at minimum
      // 'docs' is optional if other specific tags are present
      if (!tags.includes("versum")) {
        errors.push({
          file: relativePath,
          message: `Tags must include: versum. Found: ${tags.join(", ")}`,
          severity: "error",
        });
      }

      // Warning if missing both required tags
      const hasDocsTag = tags.includes("docs");
      const hasSpecialTag = tags.some(
        (t) =>
          !["versum", "docs", "moc"].includes(t) &&
          (t.includes("api") ||
            t.includes("client") ||
            t.includes("app") ||
            t.includes("feature") ||
            t.includes("adr") ||
            t.includes("rule"))
      );

      if (!hasDocsTag && !hasSpecialTag) {
        errors.push({
          file: relativePath,
          message: `Consider adding specific tags or 'docs' tag. Found: ${tags.join(", ")}`,
          severity: "warning",
        });
      }
    }

    // Check title format
    if (frontmatter.title) {
      const title = frontmatter.title.slice(1, -1); // Remove quotes
      if (title.length === 0) {
        errors.push({
          file: relativePath,
          message: "Title cannot be empty",
          severity: "error",
        });
      }
    }

    // Validate internal links [[...]]
    const linkMatches = content.matchAll(/\[\[(.*?)\]\]/g);
    for (const match of linkMatches) {
      const linkText = match[1];
      const lineNum = content.substring(0, match.index || 0).split("\n").length;

      // Skip external links
      if (linkText.startsWith("http")) continue;

      // Extract the path part (before |)
      const linkPath = linkText.split("|")[0].split("#")[0];

      // Only validate paths with / (full paths), as single words need context
      if (!linkPath.includes("/")) continue;

      // Try to resolve the link
      const resolved = resolveLink(linkText, filePath);
      if (!resolved) {
        errors.push({
          file: relativePath,
          line: lineNum,
          message: `Broken link: [[${linkText}]] - file not found`,
          severity: "error",
        });
      }
    }

    // Check navigation breadcrumb
    if (
      !content.includes("[[_Index|Home]]") &&
      !content.includes("[[Docs/_Index|Docs]]")
    ) {
      errors.push({
        file: relativePath,
        message:
          "Missing breadcrumb navigation - should contain [[_Index|Home]] or [[Docs/_Index|Docs]]",
        severity: "warning",
      });
    }
  } catch (err) {
    errors.push({
      file: relativePath || filePath,
      message: `Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
      severity: "error",
    });
  }
}

function collectAllFiles(dir: string): void {
  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (!entry.startsWith(".") && entry !== "node_modules") {
          collectAllFiles(fullPath);
        }
      } else if (entry.endsWith(".md")) {
        allFiles.add(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error collecting files in ${dir}:`, err);
  }
}

function walkDirectory(dir: string): void {
  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip hidden directories and node_modules
        if (!entry.startsWith(".") && entry !== "node_modules") {
          walkDirectory(fullPath);
        }
      } else if (entry.endsWith(".md")) {
        validateMarkdownFile(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error walking directory ${dir}:`, err);
  }
}

function printResults(): void {
  const errorCount = errors.filter((e) => e.severity === "error").length;
  const warningCount = errors.filter((e) => e.severity === "warning").length;

  if (errors.length === 0) {
    console.log("✅ Vault validation passed - all files follow the standard!");
    process.exit(0);
  }

  console.log(
    `\n📋 Vault Validation Results: ${errorCount} errors, ${warningCount} warnings\n`
  );

  // Group by severity
  const errorsList = errors.filter((e) => e.severity === "error");
  const warningsList = errors.filter((e) => e.severity === "warning");

  if (errorsList.length > 0) {
    console.log("❌ ERRORS:");
    for (const error of errorsList) {
      console.log(
        `  ${error.file}${error.line ? `:${error.line}` : ""}: ${error.message}`
      );
    }
  }

  if (warningsList.length > 0) {
    console.log("\n⚠️  WARNINGS:");
    for (const warning of warningsList) {
      console.log(
        `  ${warning.file}${warning.line ? `:${warning.line}` : ""}: ${warning.message}`
      );
    }
  }

  if (errorCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Main execution
console.log(`🔍 Validating Obsidian Vault at: ${VAULT_PATH}\n`);
// First, collect all available files
collectAllFiles(VAULT_ROOT);
// Then validate
walkDirectory(VAULT_PATH);
printResults();
