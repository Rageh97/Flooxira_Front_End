import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, CheckCheck } from 'lucide-react';
import { useState } from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="markdown-content text-gray-100 leading-normal break-words overflow-hidden w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Paragraphs - Remove excessive spacing
          p: ({ node, ...props }) => (
             <div className="mb-2 last:mb-0 leading-relaxed text-[15px]" {...props} />
          ),

          // Headings - Tight margins
          h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-4 mb-2 text-white" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-md font-bold mt-3 mb-1.5 text-white" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-sm font-bold mt-2 mb-1 text-white opacity-90" {...props} />,

          // Lists - Compact spacing
          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 mt-1 space-y-0.5 pr-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 mt-1 space-y-0.5 pr-1" {...props} />,
          li: ({ node, ...props }) => <li className="text-gray-200 inline-block w-full" {...props} />,

          // Links
          a: ({ node, ...props }) => (
            <a className="text-blue-400 hover:text-blue-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...props} />
          ),

          // Code blocks - Refined for "Real Gemini" look
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : null;
            const codeString = String(children).replace(/\n$/, '');
            const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

            if (!inline && language) {
              return (
                <div className="my-3 rounded-lg overflow-hidden bg-[#0a0a0a] border border-white/10 shadow-xl">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5">
                    <span className="text-[10px] text-gray-500 font-mono uppercase font-bold">{language}</span>
                    <button
                      onClick={() => handleCopyCode(codeString, codeId)}
                      className="text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                    >
                      {copiedCode === codeId ? (
                        <span className="text-green-500 text-[9px] flex items-center gap-1">
                          <CheckCheck className="h-3 w-3" /> تم النسخ
                        </span>
                      ) : (
                        <span className="text-[9px] flex items-center gap-1 uppercase font-bold tracking-tighter">
                          <Copy className="h-3 w-3" /> نسخ
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="p-3 overflow-x-auto custom-scrollbar">
                    <pre className="text-[13px] font-mono leading-5 text-gray-300">
                      <code>{codeString}</code>
                    </pre>
                  </div>
                </div>
              );
            }

            // Normal block code without language
            if (!inline && !language) {
               return (
                <div className="my-2 p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-[13px] leading-5 text-gray-300 overflow-x-auto">
                  <code>{codeString}</code>
                </div>
              );
            }

            // Inline code - subtle
            return (
              <code className="text-blue-300 font-mono font-semibold bg-blue-500/10 px-1 rounded mx-0.5" {...props}>
                {children}
              </code>
            );
          },

          // Tables
          table: ({ node, ...props }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-[13px] text-right border-collapse" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-white/5 text-gray-300" {...props} />,
          th: ({ node, ...props }) => <th className="px-3 py-2 border-b border-white/10 font-bold" {...props} />,
          td: ({ node, ...props }) => <td className="px-3 py-2 border-b border-white/5 text-gray-200" {...props} />,

          // Quote
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-r-2 border-blue-500/50 bg-blue-500/5 pr-4 py-1.5 my-3 text-gray-300 italic rounded-sm" {...props} />
          ),
          
          hr: ({ node, ...props }) => <hr className="my-4 border-white/5" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-white mx-0.5" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
