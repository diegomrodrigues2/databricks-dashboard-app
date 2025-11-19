import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const parsedMarkdown = useMemo(() => {
    if (!content) return '';
    try {
      return marked.parse(content) as string;
    } catch (error) {
      // Fallback to plain text if markdown parsing fails
      console.error('Markdown parsing error:', error);
      return content;
    }
  }, [content]);

  return (
    <div
      className="markdown-content text-sm text-gray-100 [&>p]:mb-2 [&>p:last-child]:mb-0 [&>h1]:text-lg [&>h1]:font-bold [&>h1]:mb-2 [&>h1]:mt-2 [&>h1:first-child]:mt-0 [&>h2]:text-base [&>h2]:font-semibold [&>h2]:mb-2 [&>h2]:mt-2 [&>h2:first-child]:mt-0 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:mb-1 [&>h3]:mt-2 [&>h3:first-child]:mt-0 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-2 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:mb-2 [&>ol]:space-y-1 [&>li]:mb-0.5 [&>code]:bg-gray-800 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>code]:font-mono [&>pre]:bg-gray-800 [&>pre]:border [&>pre]:border-gray-700 [&>pre]:rounded [&>pre]:p-3 [&>pre]:overflow-x-auto [&>pre]:mb-2 [&>pre>code]:bg-transparent [&>pre>code]:p-0 [&>pre>code]:border-0 [&>a]:text-blue-400 [&>a]:hover:text-blue-300 [&>a]:underline [&>blockquote]:border-l-4 [&>blockquote]:border-gray-600 [&>blockquote]:pl-4 [&>blockquote]:ml-2 [&>blockquote]:italic [&>blockquote]:text-gray-300 [&>blockquote]:mb-2 [&>hr]:border-gray-700 [&>hr]:my-2 [&>table]:w-full [&>table]:border-collapse [&>table]:mb-2 [&>table>thead>tr>th]:border [&>table>thead>tr>th]:border-gray-700 [&>table>thead>tr>th]:bg-gray-800 [&>table>thead>tr>th]:px-2 [&>table>thead>tr>th]:py-1 [&>table>thead>tr>th]:text-left [&>table>tbody>tr>td]:border [&>table>tbody>tr>td]:border-gray-700 [&>table>tbody>tr>td]:px-2 [&>table>tbody>tr>td]:py-1 [&>strong]:font-semibold [&>em]:italic"
      dangerouslySetInnerHTML={{ __html: parsedMarkdown }}
    />
  );
};

export default MarkdownRenderer;

