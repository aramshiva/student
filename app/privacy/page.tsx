import { readFile } from "fs/promises";
import { join } from "path";
import Link from "next/link";
import type { ReactNode } from "react";

export const dynamic = "force-static";

async function getPolicy(): Promise<string> {
  return readFile(join(process.cwd(), "PRIVACY.md"), "utf8");
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b-${i}`}>{match[1]}</strong>);
    } else {
      const label = match[2];
      const href = match[3];
      const external = /^https?:\/\//i.test(href);
      nodes.push(
        <Link
          key={`${keyPrefix}-a-${i}`}
          href={href}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {label}
        </Link>,
      );
    }
    lastIndex = pattern.lastIndex;
    i++;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function renderMarkdown(md: string): ReactNode[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join(" ");
    blocks.push(
      <p key={`p-${key++}`}>{renderInline(text, `p-${key}`)}</p>,
    );
    paragraph = [];
  };

  const flushList = () => {
    if (list.length === 0) return;
    const items = list;
    blocks.push(
      <ul key={`ul-${key++}`} className="list-disc pl-5">
        {items.map((item, idx) => (
          <li key={idx}>{renderInline(item, `li-${key}-${idx}`)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push(
        <h3 key={`h3-${key++}`} className="font-medium">
          {renderInline(line.slice(4), `h3-${key}`)}
        </h3>,
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push(
        <h2 key={`h2-${key++}`} className="font-bold">
          {renderInline(line.slice(3), `h2-${key}`)}
        </h2>,
      );
      continue;
    }
    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      blocks.push(
        <h1 key={`h1-${key++}`} className="font-bold">
          {renderInline(line.slice(2), `h1-${key}`)}
        </h1>,
      );
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2));
      continue;
    }
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();
  return blocks;
}

export default async function Privacy() {
  const policy = await getPolicy();
  return (
    <div className="bg-white text-zinc-900 p-20 prose dark:bg-zinc-900 dark:text-zinc-200 min-h-screen [&_a]:underline">
      {renderMarkdown(policy)}
    </div>
  );
}
