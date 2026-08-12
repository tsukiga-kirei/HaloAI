import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const docsDirectory = join(process.cwd(), "docs");
const englishDirectory = join(docsDirectory, "en-US");
const chineseDirectory = join(docsDirectory, "zh-CN");

async function listMarkdownFiles(directory: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const relativePath = join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(join(directory, entry.name), relativePath)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(relativePath);
    }
  }

  return files.sort();
}

const [englishFiles, chineseFiles, rootEntries] = await Promise.all([
  listMarkdownFiles(englishDirectory),
  listMarkdownFiles(chineseDirectory),
  readdir(docsDirectory, { withFileTypes: true }),
]);

/**
 * 两个语言目录使用相同的相对路径，既让读者能按语言浏览，也让 CI 可以从
 * 两个方向发现漏译。docs 根目录只保留语言目录，避免再次回到混排结构。
 */
const englishSet = new Set(englishFiles);
const chineseSet = new Set(chineseFiles);
const missingPairs = [
  ...englishFiles
    .filter((file) => !chineseSet.has(file))
    .map((file) => `en-US/${file} -> zh-CN/${file}`),
  ...chineseFiles
    .filter((file) => !englishSet.has(file))
    .map((file) => `zh-CN/${file} -> en-US/${file}`),
];
const markdownAtRoot = rootEntries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
  .map((entry) => relative(process.cwd(), join(docsDirectory, entry.name)));

if (missingPairs.length > 0 || markdownAtRoot.length > 0) {
  if (missingPairs.length > 0) {
    console.error("以下文档缺少同名中英文版本：");
    for (const pair of missingPairs) console.error(`- ${pair}`);
  }
  if (markdownAtRoot.length > 0) {
    console.error("以下文档应移动到 docs/zh-CN 或 docs/en-US：");
    for (const file of markdownAtRoot) console.error(`- ${file}`);
  }
  process.exitCode = 1;
} else {
  console.log(`文档配对检查通过：${englishFiles.length} 组中英文文档。`);
}
