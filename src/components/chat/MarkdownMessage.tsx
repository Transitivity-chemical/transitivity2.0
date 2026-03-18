'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none break-words ${className ?? ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
              {children}
            </pre>
          ),
          code: ({ children, className: codeClass }) => {
            const isInline = !codeClass;
            if (isInline) {
              return (
                <code className="rounded bg-gray-200 px-1 py-0.5 text-xs dark:bg-gray-700">
                  {children}
                </code>
              );
            }
            return <code className={codeClass}>{children}</code>;
          },
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">{children}</table>
            </div>
          ),
        }}
      />
    </div>
  );
}
