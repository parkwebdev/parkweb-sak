/**
 * SvgFromString
 *
 * Minimal SVG -> @react-pdf/renderer Svg primitives converter.
 * Supports the subset of SVG elements typically emitted by Recharts.
 */

import React, { useMemo } from 'react';
import {
  Svg,
  G,
  Path,
  Rect,
  Circle,
  Line,
  Text as PdfText,
  Defs,
  LinearGradient,
  Stop,
} from '@react-pdf/renderer';

// react-pdf SVG primitives have strict prop requirements in their TS types.
// We feed dynamic props from parsed SVG, so we intentionally loosen typing.
const PathAny = Path as unknown as React.ComponentType<any>;
const RectAny = Rect as unknown as React.ComponentType<any>;
const CircleAny = Circle as unknown as React.ComponentType<any>;
const LineAny = Line as unknown as React.ComponentType<any>;
const LinearGradientAny = LinearGradient as unknown as React.ComponentType<any>;
const StopAny = Stop as unknown as React.ComponentType<any>;

type SvgNode = {
  name: string;
  attrs: Record<string, string>;
  children: SvgNode[];
  text?: string;
};

function toNumber(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function attrsToProps(attrs: Record<string, string>) {
  // react-pdf expects camelCased prop names for some attributes.
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(attrs)) {
    switch (k) {
      case 'stroke-width':
        out.strokeWidth = toNumber(v) ?? v;
        break;
      case 'stroke-linecap':
        out.strokeLinecap = v;
        break;
      case 'stroke-linejoin':
        out.strokeLinejoin = v;
        break;
      case 'font-size':
        out.fontSize = toNumber(v) ?? v;
        break;
      case 'text-anchor':
        // react-pdf uses textAnchor
        out.textAnchor = v;
        break;
      case 'stop-color':
        out.stopColor = v;
        break;
      case 'stop-opacity':
        out.stopOpacity = toNumber(v) ?? v;
        break;
      default:
        // Keep most attributes as-is (including fill, stroke, d, x, y, etc.)
        out[k] = v;
    }
  }
  return out;
}

function domToTree(node: Element): SvgNode {
  const attrs: Record<string, string> = {};
  try {
    for (const a of Array.from(node.attributes || [])) attrs[a.name] = a.value;
  } catch {
    // Attributes may be null/undefined in some edge cases
  }

  const children: SvgNode[] = [];
  try {
    const childNodes = node.childNodes ? Array.from(node.childNodes) : [];
    for (const c of childNodes) {
      if (c.nodeType === Node.ELEMENT_NODE) {
        children.push(domToTree(c as Element));
      } else if (c.nodeType === Node.TEXT_NODE) {
        const text = (c.textContent || '').trim();
        if (text) {
          children.push({ name: '#text', attrs: {}, children: [], text });
        }
      }
    }
  } catch {
    // ChildNodes may be null/undefined in some edge cases
  }

  return { name: node.tagName.toLowerCase(), attrs, children };
}

function renderNode(node: SvgNode, key: string): React.ReactNode {
  if (!node) return null;
  if (node.name === '#text') return node.text ?? null;

  const props = attrsToProps(node.attrs || {});
  const childrenArray = Array.isArray(node.children) ? node.children : [];
  const kids = childrenArray.map((c, idx) => renderNode(c, `${key}.${idx}`));
  switch (node.name) {
    case 'g':
      return (
        <G key={key} {...props}>
          {kids}
        </G>
      );
    case 'path':
      return <PathAny key={key} {...props} />;
    case 'rect':
      return <RectAny key={key} {...props} />;
    case 'circle':
      return <CircleAny key={key} {...props} />;
    case 'line':
      return <LineAny key={key} {...props} />;
    case 'text':
      return (
        <PdfText key={key} {...props}>
          {kids}
        </PdfText>
      );
    case 'defs':
      return (
        <Defs key={key}>
          {kids}
        </Defs>
      );
    case 'lineargradient':
      return (
        <LinearGradientAny key={key} {...props}>
          {kids}
        </LinearGradientAny>
      );
    case 'stop':
      return <StopAny key={key} {...props} />;

    // Common, but not needed for Recharts: ignore safely
    case 'clippath':
    case 'style':
      return null;

    default:
      // Unknown element: ignore to avoid crashing export.
      return null;
  }
}

export function SvgFromString({
  svgString,
  maxHeight,
  debugId,
}: {
  svgString: string;
  maxHeight?: number;
  debugId?: string;
}) {
  const parsed = useMemo(() => {
    if (!svgString || typeof svgString !== 'string') {
      console.warn(`[SvgFromString${debugId ? `:${debugId}` : ''}] Invalid svgString provided`);
      return null;
    }
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      
      // Check for parse errors
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        console.warn(`[SvgFromString${debugId ? `:${debugId}` : ''}] SVG parse error:`, parseError.textContent?.slice(0, 200));
        return null;
      }
      
      const svg = doc.querySelector('svg');
      if (!svg) {
        console.warn(`[SvgFromString${debugId ? `:${debugId}` : ''}] No <svg> element found`);
        return null;
      }

      const viewBox = svg.getAttribute('viewBox') || undefined;
      const width = toNumber(svg.getAttribute('width'));
      const height = toNumber(svg.getAttribute('height'));
      const tree = domToTree(svg);

      return {
        viewBox,
        width,
        height,
        tree,
      };
    } catch (error) {
      console.warn(`[SvgFromString${debugId ? `:${debugId}` : ''}] Failed to parse SVG:`, error);
      return null;
    }
  }, [svgString, debugId]);

  if (!parsed || !parsed.tree) return null;

  // Use a fixed maxHeight to keep layout stable. Width stretches to container.
  const height = maxHeight ?? 200;

  try {
    const rootChildren = Array.isArray(parsed.tree.children) ? parsed.tree.children : [];
    
    return (
      <Svg
        width="100%"
        height={height}
        viewBox={parsed.viewBox}
        preserveAspectRatio="xMidYMid meet"
      >
        {rootChildren.map((c, idx) => renderNode(c, `root.${idx}`))}
      </Svg>
    );
  } catch (error) {
    console.warn(`[SvgFromString${debugId ? `:${debugId}` : ''}] Failed to render SVG:`, error);
    return null;
  }
}
