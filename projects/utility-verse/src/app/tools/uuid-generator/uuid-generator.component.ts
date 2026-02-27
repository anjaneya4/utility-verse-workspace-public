import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-uuid-generator',
  imports: [],
  templateUrl: './uuid-generator.component.html',
  styleUrl: './uuid-generator.component.scss',
})
export class UuidGeneratorComponent {
  readonly count = signal(5);
  readonly upperCase = signal(false);
  readonly values = signal<string[]>([]);

  onCountChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const safe = Number.isFinite(value) ? Math.min(50, Math.max(1, value)) : 1;
    this.count.set(safe);
  }

  generate(): void {
    const list: string[] = [];
    for (let i = 0; i < this.count(); i += 1) {
      const value = crypto.randomUUID();
      list.push(this.upperCase() ? value.toUpperCase() : value);
    }
    this.values.set(list);
  }

  clear(): void {
    this.values.set([]);
  }

  async copyAll(): Promise<void> {
    if (!this.values().length) return;
    await navigator.clipboard.writeText(this.values().join('\n'));
  }
}
