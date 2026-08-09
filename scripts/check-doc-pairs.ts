import { readdir } from "node:fs/promises";
import { basename, join } from "node:path";

const docsDirectory = join(process.cwd(), "docs");
const files = await readdir(docsDirectory);
const markdownFiles = files.filter((file) => file.endsWith(".md"));

/**
 * 英文文档使用普通 `.md`，中文文档使用 `.zh-CN.md`。这里同时从两个方向检查，
 * 避免只新增其中一种语言后仍然通过 CI，造成长期不可见的内容漂移。
 */
const missingPairs: string[] = [];
for (const file of markdownFiles) {
  if (file.endsWith(".zh-CN.md")) {
    const englishName = file.replace(/\.zh-CN\.md$/u, ".md");
    if (!markdownFiles.includes(englishName)) {
      missingPairs.push(`${file} -> ${englishName}`);
    }
    continue;
  }

  const chineseName = file.replace(/\.md$/u, ".zh-CN.md");
  if (!markdownFiles.includes(chineseName)) {
    missingPairs.push(`${file} -> ${chineseName}`);
  }
}

if (missingPairs.length > 0) {
  console.error("以下文档缺少中英文对应版本：");
  for (const pair of missingPairs) console.error(`- ${pair}`);
  process.exitCode = 1;
} else {
  console.log(`文档配对检查通过：${basename(docsDirectory)} 中共有 ${markdownFiles.length} 份文档。`);
}
