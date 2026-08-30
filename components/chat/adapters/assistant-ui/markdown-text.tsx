"use client";

import {
  MarkdownTextPrimitive,
  unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
} from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";

const components = memoizeMarkdownComponents({
  p: ({ ...props }) => <p className="mb-3 last:mb-0" {...props} />,
  a: ({ ...props }) => (
    <a
      className="font-medium text-blue-600 underline underline-offset-2 hover:no-underline dark:text-blue-400"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  ul: ({ ...props }) => (
    <ul className="mb-3 list-disc pl-5 last:mb-0 [&>li]:mt-1" {...props} />
  ),
  ol: ({ ...props }) => (
    <ol className="mb-3 list-decimal pl-5 last:mb-0 [&>li]:mt-1" {...props} />
  ),
  strong: ({ ...props }) => <strong className="font-semibold" {...props} />,
  h1: ({ ...props }) => (
    <h1 className="mb-2 mt-4 text-base font-semibold first:mt-0" {...props} />
  ),
  h2: ({ ...props }) => (
    <h2 className="mb-2 mt-4 text-base font-semibold first:mt-0" {...props} />
  ),
  h3: ({ ...props }) => (
    <h3 className="mb-2 mt-4 text-sm font-semibold first:mt-0" {...props} />
  ),
  blockquote: ({ ...props }) => (
    <blockquote
      className="mb-3 border-l-2 border-zinc-300 pl-3 text-zinc-600 last:mb-0 dark:border-zinc-700 dark:text-zinc-400"
      {...props}
    />
  ),
  code: ({ ...props }) => (
    <code
      className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.85em] dark:bg-zinc-800"
      {...props}
    />
  ),
  pre: ({ ...props }) => (
    <pre
      className="mb-3 overflow-x-auto rounded-lg bg-zinc-100 p-3 text-xs last:mb-0 dark:bg-zinc-900 [&>code]:bg-transparent [&>code]:p-0"
      {...props}
    />
  ),
});

export function MarkdownText() {
  return <MarkdownTextPrimitive remarkPlugins={[remarkGfm]} components={components} />;
}
