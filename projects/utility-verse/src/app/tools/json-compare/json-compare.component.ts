import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

type DiffKind =
  | 'missing_in_left'
  | 'missing_in_right'
  | 'type_mismatch'
  | 'value_mismatch';

type LineChange = 'none' | 'added' | 'removed' | 'modified';

interface CompareOptions {
  ignoreArrayOrder: boolean;
  ignoredKeys: Set<string>;
}

export interface DiffResult {
  kind: DiffKind;
  path: string;
  leftValue: unknown;
  rightValue: unknown;
  message: string;
}

interface JsonRenderedLine {
  number: number;
  text: string;
  path: string;
  change: LineChange;
}

interface Summary {
  totalDifferences: number;
  missingKeys: number;
  valueMismatches: number;
}

interface VirtualLines {
  totalHeight: number;
  offset: number;
  lines: JsonRenderedLine[];
}

@Component({
  selector: 'app-json-compare',
  imports: [CommonModule],
  templateUrl: './json-compare.component.html',
  styleUrl: './json-compare.component.scss',
})
export class JsonCompareComponent {
  private readonly lineHeight = 22;
  private readonly viewportHeight = 420;
  private readonly bufferLines = 40;

  readonly leftJson = signal('');
  readonly rightJson = signal('');
  readonly parseError = signal<string | null>(null);
  readonly compareTimeMs = signal(0);
  readonly ignoreArrayOrder = signal(false);
  readonly ignoreKeysInput = signal('');
  readonly diffs = signal<DiffResult[]>([]);

  private readonly leftScrollTop = signal(0);
  private readonly rightScrollTop = signal(0);

  readonly ignoredKeys = computed(() =>
    new Set(
      this.ignoreKeysInput()
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
    ),
  );

  readonly summary = computed<Summary>(() => {
    const currentDiffs = this.diffs();
    const missingKeys = currentDiffs.filter(
      (d) => d.kind === 'missing_in_left' || d.kind === 'missing_in_right',
    ).length;

    return {
      totalDifferences: currentDiffs.length,
      missingKeys,
      valueMismatches: currentDiffs.length - missingKeys,
    };
  });

  readonly leftLines = computed(() => {
    const parsed = this.safeParse(this.leftJson());
    if (!parsed.ok) return [];

    const normalized = sortObjectKeys(parsed.value);
    return renderJsonWithPathLines(normalized, buildChangeMap(this.diffs(), 'left'));
  });

  readonly rightLines = computed(() => {
    const parsed = this.safeParse(this.rightJson());
    if (!parsed.ok) return [];

    const normalized = sortObjectKeys(parsed.value);
    return renderJsonWithPathLines(normalized, buildChangeMap(this.diffs(), 'right'));
  });

  readonly leftVirtualLines = computed(() =>
    this.virtualizeLines(this.leftLines(), this.leftScrollTop()),
  );

  readonly rightVirtualLines = computed(() =>
    this.virtualizeLines(this.rightLines(), this.rightScrollTop()),
  );

  beautifyBoth(): void {
    const leftParsed = this.safeParse(this.leftJson());
    const rightParsed = this.safeParse(this.rightJson());

    if (!leftParsed.ok || !rightParsed.ok) {
      let message = 'Invalid JSON';
      if (!leftParsed.ok) {
        message = `Left JSON invalid: ${leftParsed.error}`;
      } else if (!rightParsed.ok) {
        message = `Right JSON invalid: ${rightParsed.error}`;
      }
      this.parseError.set(message);
      return;
    }

    this.leftJson.set(JSON.stringify(sortObjectKeys(leftParsed.value), null, 2));
    this.rightJson.set(JSON.stringify(sortObjectKeys(rightParsed.value), null, 2));
    this.parseError.set(null);
  }

  compare(): void {
    const started = performance.now();

    const leftParsed = this.safeParse(this.leftJson());
    const rightParsed = this.safeParse(this.rightJson());

    if (!leftParsed.ok || !rightParsed.ok) {
      let message = 'Invalid JSON';
      if (!leftParsed.ok) {
        message = `Left JSON invalid: ${leftParsed.error}`;
      } else if (!rightParsed.ok) {
        message = `Right JSON invalid: ${rightParsed.error}`;
      }
      this.parseError.set(message);
      this.diffs.set([]);
      return;
    }

    const leftBeautified = sortObjectKeys(leftParsed.value);
    const rightBeautified = sortObjectKeys(rightParsed.value);

    this.leftJson.set(JSON.stringify(leftBeautified, null, 2));
    this.rightJson.set(JSON.stringify(rightBeautified, null, 2));

    const options: CompareOptions = {
      ignoreArrayOrder: this.ignoreArrayOrder(),
      ignoredKeys: this.ignoredKeys(),
    };

    const normalizedLeft = normalizeForCompare(leftBeautified, options);
    const normalizedRight = normalizeForCompare(rightBeautified, options);

    this.diffs.set(compareJson(normalizedLeft, normalizedRight));
    this.compareTimeMs.set(Number((performance.now() - started).toFixed(2)));
    this.parseError.set(null);
  }

  clear(): void {
    this.leftJson.set('');
    this.rightJson.set('');
    this.parseError.set(null);
    this.compareTimeMs.set(0);
    this.diffs.set([]);
    this.leftScrollTop.set(0);
    this.rightScrollTop.set(0);
  }

  onDiffScroll(side: 'left' | 'right', event: Event): void {
    const target = event.target as HTMLElement;
    if (side === 'left') {
      this.leftScrollTop.set(target.scrollTop);
      return;
    }
    this.rightScrollTop.set(target.scrollTop);
  }

  async copy(side: 'left' | 'right'): Promise<void> {
    const text = side === 'left' ? this.leftJson() : this.rightJson();
    if (!text) return;
    await navigator.clipboard.writeText(text);
  }

  async copyDiffSummary(): Promise<void> {
    if (!this.diffs().length) return;
    const payload = this.diffs()
      .map((d) => `${d.kind} @ ${d.path} | left=${formatValue(d.leftValue)} | right=${formatValue(d.rightValue)}`)
      .join('\n');

    await navigator.clipboard.writeText(payload);
  }

  trackByLineNumber = (_: number, line: JsonRenderedLine) => line.number;
  trackByPath = (_: number, diff: DiffResult) => `${diff.kind}:${diff.path}`;

  private safeParse(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
    try {
      return { ok: true, value: JSON.parse(text) };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Invalid JSON',
      };
    }
  }

  private virtualizeLines(lines: JsonRenderedLine[], scrollTop: number): VirtualLines {
    if (!lines.length) {
      return {
        totalHeight: 0,
        offset: 0,
        lines: [],
      };
    }

    const visibleCount = Math.ceil(this.viewportHeight / this.lineHeight);
    const start = Math.max(Math.floor(scrollTop / this.lineHeight) - this.bufferLines, 0);
    const end = Math.min(start + visibleCount + this.bufferLines * 2, lines.length);

    return {
      totalHeight: lines.length * this.lineHeight,
      offset: start * this.lineHeight,
      lines: lines.slice(start, end),
    };
  }
}

export function compareJson(left: unknown, right: unknown): DiffResult[] {
  const results: DiffResult[] = [];
  compareNode(left, right, '', results);
  return results;
}

function compareNode(left: unknown, right: unknown, path: string, out: DiffResult[]): void {
  if (left === right) return;

  const leftType = detectType(left);
  const rightType = detectType(right);

  if (leftType !== rightType) {
    out.push({
      kind: 'type_mismatch',
      path: path || '(root)',
      leftValue: left,
      rightValue: right,
      message: `Type mismatch at ${path || '(root)'}`,
    });
    return;
  }

  if (leftType === 'array') {
    const leftArray = left as unknown[];
    const rightArray = right as unknown[];
    const max = Math.max(leftArray.length, rightArray.length);

    for (let i = 0; i < max; i += 1) {
      const nextPath = joinPath(path, `[${i}]`);

      if (i >= leftArray.length) {
        out.push({
          kind: 'missing_in_left',
          path: nextPath,
          leftValue: undefined,
          rightValue: rightArray[i],
          message: `Missing in left at ${nextPath}`,
        });
        continue;
      }

      if (i >= rightArray.length) {
        out.push({
          kind: 'missing_in_right',
          path: nextPath,
          leftValue: leftArray[i],
          rightValue: undefined,
          message: `Missing in right at ${nextPath}`,
        });
        continue;
      }

      compareNode(leftArray[i], rightArray[i], nextPath, out);
    }
    return;
  }

  if (leftType === 'object') {
    const leftObj = left as Record<string, unknown>;
    const rightObj = right as Record<string, unknown>;
    const keys = new Set([...Object.keys(leftObj), ...Object.keys(rightObj)]);

    for (const key of keys) {
      const nextPath = joinPath(path, key);

      if (!(key in leftObj)) {
        out.push({
          kind: 'missing_in_left',
          path: nextPath,
          leftValue: undefined,
          rightValue: rightObj[key],
          message: `Missing in left at ${nextPath}`,
        });
        continue;
      }

      if (!(key in rightObj)) {
        out.push({
          kind: 'missing_in_right',
          path: nextPath,
          leftValue: leftObj[key],
          rightValue: undefined,
          message: `Missing in right at ${nextPath}`,
        });
        continue;
      }

      compareNode(leftObj[key], rightObj[key], nextPath, out);
    }
    return;
  }

  out.push({
    kind: 'value_mismatch',
    path: path || '(root)',
    leftValue: left,
    rightValue: right,
    message: `Value mismatch at ${path || '(root)'}`,
  });
}

function normalizeForCompare(value: unknown, options: CompareOptions): unknown {
  if (Array.isArray(value)) {
    const next = value.map((item) => normalizeForCompare(item, options));
    if (!options.ignoreArrayOrder) return next;

    return next.sort((a, b) => {
      const aStr = stableStringify(a);
      const bStr = stableStringify(b);
      return aStr.localeCompare(bStr);
    });
  }

  if (value !== null && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    for (const key of Object.keys(source).sort()) {
      if (options.ignoredKeys.has(key)) continue;
      output[key] = normalizeForCompare(source[key], options);
    }

    return output;
  }

  return value;
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortObjectKeys(item));
  }

  if (value !== null && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};

    for (const key of Object.keys(source).sort()) {
      sorted[key] = sortObjectKeys(source[key]);
    }

    return sorted;
  }

  return value;
}

function buildChangeMap(diffs: DiffResult[], side: 'left' | 'right'): Map<string, LineChange> {
  const map = new Map<string, LineChange>();

  for (const diff of diffs) {
    if (diff.kind === 'missing_in_left' && side === 'right') {
      map.set(diff.path, 'added');
      continue;
    }

    if (diff.kind === 'missing_in_right' && side === 'left') {
      map.set(diff.path, 'removed');
      continue;
    }

    if ((diff.kind === 'type_mismatch' || diff.kind === 'value_mismatch') && diff.path !== '(root)') {
      map.set(diff.path, 'modified');
    }
  }

  return map;
}

function renderJsonWithPathLines(value: unknown, changes: Map<string, LineChange>): JsonRenderedLine[] {
  const lines: JsonRenderedLine[] = [];
  const writer = new LineWriter(lines, changes);
  writer.writeNode(value, '', 0, true, null);
  return lines;
}

class LineWriter {
  private lineNumber = 1;

  constructor(
    private readonly lines: JsonRenderedLine[],
    private readonly changes: Map<string, LineChange>,
  ) {}

  writeNode(
    value: unknown,
    path: string,
    depth: number,
    isLast: boolean,
    key: string | null,
  ): void {
    const indent = '  '.repeat(depth);
    const keyPrefix = key !== null ? `${JSON.stringify(key)}: ` : '';

    if (Array.isArray(value)) {
      this.push(`${indent}${keyPrefix}[`, path);
      value.forEach((item, index) => {
        this.writeNode(item, joinPath(path, `[${index}]`), depth + 1, index === value.length - 1, null);
      });
      this.push(`${indent}]${isLast ? '' : ','}`, path);
      return;
    }

    if (value !== null && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const keys = Object.keys(obj);

      this.push(`${indent}${keyPrefix}{`, path);
      keys.forEach((objKey, index) => {
        const childPath = joinPath(path, objKey);
        this.writeNode(obj[objKey], childPath, depth + 1, index === keys.length - 1, objKey);
      });
      this.push(`${indent}}${isLast ? '' : ','}`, path);
      return;
    }

    this.push(`${indent}${keyPrefix}${JSON.stringify(value)}${isLast ? '' : ','}`, path);
  }

  private push(text: string, path: string): void {
    this.lines.push({
      number: this.lineNumber,
      text,
      path,
      change: this.changes.get(path) ?? 'none',
    });
    this.lineNumber += 1;
  }
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function joinPath(basePath: string, nextToken: string): string {
  if (!basePath) {
    return nextToken.startsWith('[') ? nextToken : nextToken;
  }

  if (nextToken.startsWith('[')) {
    return `${basePath}${nextToken}`;
  }

  return `${basePath}.${nextToken}`;
}

function detectType(value: unknown): 'null' | 'array' | 'object' | 'primitive' {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return 'primitive';
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}
