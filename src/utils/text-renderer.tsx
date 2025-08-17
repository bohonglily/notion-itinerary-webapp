import React from 'react';

/**
 * 解析包含 URL 的文字並渲染為可點擊的連結
 * 格式：(https://example.com) 或 (http://example.com)
 * 渲染為：🔗 連結
 */
export function renderTextWithLinks(text: string): React.ReactNode {
  if (!text) return null;

  // 正則表達式匹配 (http://...) 或 (https://...)，支援 URL 中包含括號
  const urlRegex = /\((https?:\/\/[^\s]+)\s*\)/g;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // 添加 URL 前的文字
    if (match.index > lastIndex) {
      const textBeforeUrl = text.slice(lastIndex, match.index);
      parts.push(renderTextWithNewlines(textBeforeUrl, `text-${lastIndex}`));
    }

    // 添加連結元素
    const url = match[1];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
        title={url}
      >
        🔗 連結
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  // 添加剩餘的文字
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    parts.push(renderTextWithNewlines(remainingText, `text-${lastIndex}`));
  }

  // 如果沒有找到任何 URL，返回原始文字（保持換行）
  if (parts.length === 0) {
    return renderTextWithNewlines(text, 'text-full');
  }

  return <>{parts}</>;
}

/**
 * 將文字中的換行符號轉換為 <br /> 元素
 */
function renderTextWithNewlines(text: string, keyPrefix: string): React.ReactNode {
  if (!text) return null;
  
  const lines = text.split('\n');
  return lines.map((line, index) => (
    <React.Fragment key={`${keyPrefix}-${index}`}>
      {line}
      {index < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}

/**
 * 檢查文字中是否包含 URL 連結
 */
export function hasLinks(text: string): boolean {
  if (!text) return false;
  const urlRegex = /\((https?:\/\/[^\s]+)\s*\)/g;
  return urlRegex.test(text);
}

/**
 * 從文字中提取所有 URL
 */
export function extractUrls(text: string): string[] {
  if (!text) return [];
  
  const urlRegex = /\((https?:\/\/[^\s]+)\s*\)/g;
  const urls: string[] = [];
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}