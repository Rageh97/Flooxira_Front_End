"use client";
import ReactMarkdown from 'react-markdown';
import { Copy, CheckCheck, Code } from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const codeBlockCounter = useRef(0);

  const handleCopyCode = async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(codeId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <div className="markdown-content text-white min-w-0 max-w-full overflow-hidden">
      <ReactMarkdown
        components={{
          // Headings
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 text-white border-b border-gray-700 pb-2" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mt-5 mb-3 text-white border-b border-gray-700 pb-2" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2 text-white" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base font-semibold mt-3 mb-2 text-white" {...props} />
          ),
          h5: ({ node, ...props }) => (
            <h5 className="text-sm font-semibold mt-3 mb-2 text-white" {...props} />
          ),
          h6: ({ node, ...props }) => (
            <h6 className="text-xs font-semibold mt-2 mb-2 text-white opacity-80" {...props} />
          ),

          // Paragraphs
          p: ({ node, ...props }) => (
            <p className="mb-4 leading-7 text-gray-100 whitespace-pre-wrap break-words overflow-wrap-anywhere" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }} {...props} />
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-outside mb-4 space-y-2 ml-6 text-gray-100" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-outside mb-4 space-y-2 ml-6 text-gray-100" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="mb-1 leading-6 pl-2" {...props} />
          ),

          // Links
          a: ({ node, ...props }: any) => (
            <a
              className="text-blue-400 hover:text-blue-300 underline break-words transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          // Code blocks
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');
            codeBlockCounter.current += 1;
            const codeId = `code-block-${codeBlockCounter.current}`;

            if (!inline && codeString) {
              return (
                <div className="relative my-4 rounded-lg overflow-hidden border border-gray-700 bg-gray-900/50 max-w-full">
                  <div className="flex items-center justify-between bg-gray-800/70 px-4 py-2 border-b border-gray-700">
                    <div className="flex items-center gap-2 min-w-0">
                      <Code className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-400 uppercase font-medium truncate">
                        {language || 'Code'}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleCopyCode(codeString, codeId)}
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 hover:bg-gray-700 shrink-0"
                    >
                      {copiedCode === codeId ? (
                        <CheckCheck className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  <pre className="overflow-x-auto max-w-full" {...props}>
                    <code className={`language-${language || 'text'}`}>{codeString}</code>
                  </pre>
                </div>
              );
            }

            return (
              <code
                className="bg-gray-800/60 text-orange-400 px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-r-4 border-blue-500 bg-gray-800/30 pl-4 pr-4 py-2 my-4 italic text-gray-300 rounded-r"
              {...props}
            />
          ),

          // Tables
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-gray-700 max-w-full">
              <table className="min-w-full max-w-full" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-800/50" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-gray-800/30 transition-colors border-b border-gray-700" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-3 text-sm text-gray-100" {...props} />
          ),

          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-gray-700" {...props} />
          ),

          // Strong/Bold
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-white" {...props} />
          ),

          // Emphasis/Italic
          em: ({ node, ...props }) => (
            <em className="italic text-gray-200" {...props} />
          ),

          // Images
          img: ({ node, ...props }: any) => (
            <img
              className="max-w-full h-auto rounded-lg my-4 border border-gray-700 shadow-lg w-full object-contain"
              alt={props.alt || ''}
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

