import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';

type Variant = 'assistant' | 'user';

type Props = {
  text: string;
  variant: Variant;
};

type Block =
  | { type: 'text'; content: string }
  | { type: 'code'; content: string; language?: string };

function splitByCodeFences(input: string): Block[] {
  const text = input.replace(/\r\n/g, '\n');
  const blocks: Block[] = [];
  const fence = /```([^\n`]*)\n([\s\S]*?)```/g;

  let cursor = 0;
  for (const match of text.matchAll(fence)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      const before = text.slice(cursor, start);
      if (before) blocks.push({ type: 'text', content: before });
    }

    const language = (match[1] ?? '').trim() || undefined;
    const code = (match[2] ?? '').replace(/\n$/, '');
    blocks.push({ type: 'code', content: code, language });
    cursor = start + match[0].length;
  }

  const rest = text.slice(cursor);
  if (rest) blocks.push({ type: 'text', content: rest });

  return blocks.length > 0 ? blocks : [{ type: 'text', content: text }];
}

export default function ChatMarkdown({ text, variant }: Props) {
  const theme = useMemo(() => {
    if (variant === 'assistant') {
      return {
        textColor: Colors.text,
        codeBg: Colors.backgroundLight,
        codeBorder: Colors.border,
        codeText: Colors.text,
        inlineCodeBg: Colors.backgroundLight,
        inlineCodeBorder: Colors.border,
        inlineCodeText: Colors.text,
      };
    }
    return {
      textColor: Colors.background,
      codeBg: 'rgba(255,255,255,0.85)',
      codeBorder: 'rgba(0,0,0,0.12)',
      codeText: Colors.background,
      inlineCodeBg: 'rgba(255,255,255,0.85)',
      inlineCodeBorder: 'rgba(0,0,0,0.12)',
      inlineCodeText: Colors.background,
    };
  }, [variant]);

  const blocks = useMemo(() => splitByCodeFences(text), [text]);

  let keyIndex = 0;
  const nextKey = () => `md_${keyIndex++}`;

  const renderInline = (input: string, isBold: boolean): React.ReactNode[] => {
    const out: React.ReactNode[] = [];
    let i = 0;

    while (i < input.length) {
      const boldIdx = input.indexOf('**', i);
      const codeIdx = input.indexOf('`', i);
      const candidates = [boldIdx, codeIdx].filter((v) => v !== -1);
      const next = candidates.length ? Math.min(...candidates) : -1;

      if (next === -1) {
        const tail = input.slice(i);
        if (tail) out.push(tail);
        break;
      }

      if (next > i) out.push(input.slice(i, next));

      if (codeIdx !== -1 && codeIdx === next) {
        const end = input.indexOf('`', codeIdx + 1);
        if (end === -1) {
          out.push(input.slice(codeIdx));
          break;
        }
        const code = input.slice(codeIdx + 1, end);
        out.push(
          <Text
            key={nextKey()}
            style={[
              styles.inlineCode,
              {
                backgroundColor: theme.inlineCodeBg,
                borderColor: theme.inlineCodeBorder,
                color: theme.inlineCodeText,
              },
            ]}
          >
            {code}
          </Text>
        );
        i = end + 1;
        continue;
      }

      if (boldIdx !== -1 && boldIdx === next) {
        const end = input.indexOf('**', boldIdx + 2);
        if (end === -1) {
          out.push(input.slice(boldIdx));
          break;
        }
        const inner = input.slice(boldIdx + 2, end);
        out.push(
          <Text key={nextKey()} style={[styles.bold, { color: theme.textColor }]}>
            {renderInline(inner, true)}
          </Text>
        );
        i = end + 2;
        continue;
      }

      out.push(input.slice(next));
      break;
    }

    if (!isBold) return out;
    return out;
  };

  return (
    <View style={styles.container}>
      {blocks.map((block) => {
        if (block.type === 'code') {
          return (
            <View
              key={nextKey()}
              style={[
                styles.codeBlock,
                { backgroundColor: theme.codeBg, borderColor: theme.codeBorder },
              ]}
            >
              <Text style={[styles.codeText, { color: theme.codeText }]} selectable>
                {block.content}
              </Text>
            </View>
          );
        }

        return (
          <Text key={nextKey()} style={[styles.text, { color: theme.textColor }]} selectable>
            {renderInline(block.content, false)}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    alignSelf: 'stretch',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '800' as const,
  },
  inlineCode: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
  },
  codeBlock: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
});

