import { Component, computed, signal } from '@angular/core';

type TextOperation =
  | 'uppercase'
  | 'lowercase'
  | 'trim-lines'
  | 'remove-extra-spaces'
  | 'slugify'
  | 'sort-lines'
  | 'unique-lines'
  | 'reverse';

@Component({
  selector: 'app-text-utils',
  imports: [],
  templateUrl: './text-utils.component.html',
  styleUrl: './text-utils.component.scss',
})
export class TextUtilsComponent {
  readonly inputText = signal('');
  readonly selectedOperation = signal<TextOperation>('trim-lines');

  readonly outputText = computed(() => this.applyOperation(this.inputText(), this.selectedOperation()));

  readonly stats = computed(() => {
    const text = this.inputText();
    const trimmed = text.trim();

    return {
      chars: text.length,
      words: trimmed ? trimmed.split(/\s+/).length : 0,
      lines: text ? text.split(/\r?\n/).length : 0,
    };
  });

  readonly operations: { value: TextOperation; label: string }[] = [
    { value: 'trim-lines', label: 'Trim each line' },
    { value: 'remove-extra-spaces', label: 'Collapse spaces' },
    { value: 'uppercase', label: 'Uppercase' },
    { value: 'lowercase', label: 'Lowercase' },
    { value: 'slugify', label: 'Slugify' },
    { value: 'sort-lines', label: 'Sort lines (A-Z)' },
    { value: 'unique-lines', label: 'Unique lines' },
    { value: 'reverse', label: 'Reverse text' },
  ];

  onInputChange(event: Event): void {
    this.inputText.set((event.target as HTMLTextAreaElement).value);
  }

  onOperationChange(event: Event): void {
    this.selectedOperation.set((event.target as HTMLSelectElement).value as TextOperation);
  }

  useOutputAsInput(): void {
    this.inputText.set(this.outputText());
  }

  clear(): void {
    this.inputText.set('');
  }

  async copyOutput(): Promise<void> {
    if (!this.outputText()) return;
    await navigator.clipboard.writeText(this.outputText());
  }

  private applyOperation(value: string, operation: TextOperation): string {
    switch (operation) {
      case 'uppercase':
        return value.toUpperCase();
      case 'lowercase':
        return value.toLowerCase();
      case 'trim-lines':
        return value
          .split(/\r?\n/)
          .map((line) => line.trim())
          .join('\n');
      case 'remove-extra-spaces':
        return value.replace(/\s+/g, ' ').trim();
      case 'slugify':
        return value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      case 'sort-lines':
        return value
          .split(/\r?\n/)
          .sort((a, b) => a.localeCompare(b))
          .join('\n');
      case 'unique-lines': {
        const seen = new Set<string>();
        return value
          .split(/\r?\n/)
          .filter((line) => {
            if (seen.has(line)) return false;
            seen.add(line);
            return true;
          })
          .join('\n');
      }
      case 'reverse':
        return value.split('').reverse().join('');
      default:
        return value;
    }
  }
}
