'use client';

import React from 'react';

type MarkdownTextProps = {
  text?: string;
  className?: string;
};

function renderPlainText(segment: string, keyPrefix: string) {
  const lines = segment.split('\n');
  return lines.map((line, index) => (
    <React.Fragment key={`${keyPrefix}-line-${index}`}>
      {line}
      {index < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}

export function MarkdownText({ text, className }: MarkdownTextProps) {
  if (!text) return null;

  const parts = text.split('`');

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          return (
            <code
              key={`code-${index}`}
              className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[12px] text-gray-700"
            >
              {part}
            </code>
          );
        }

        return (
          <React.Fragment key={`text-${index}`}>
            {renderPlainText(part, `text-${index}`)}
          </React.Fragment>
        );
      })}
    </span>
  );
}
