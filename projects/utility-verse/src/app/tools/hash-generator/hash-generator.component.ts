import { Component, computed, signal } from '@angular/core';

type HashAlgorithmName = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

@Component({
  selector: 'app-hash-generator',
  imports: [],
  templateUrl: './hash-generator.component.html',
  styleUrl: './hash-generator.component.scss',
})
export class HashGeneratorComponent {
  readonly input = signal('');
  readonly algorithm = signal<HashAlgorithmName>('SHA-256');
  readonly output = signal('');
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);

  readonly algorithms: HashAlgorithmName[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

  readonly inputBytes = computed(() => new TextEncoder().encode(this.input()).length);

  onInput(event: Event): void {
    this.input.set((event.target as HTMLTextAreaElement).value);
  }

  onAlgorithmChange(event: Event): void {
    this.algorithm.set((event.target as HTMLSelectElement).value as HashAlgorithmName);
  }

  async generate(): Promise<void> {
    try {
      this.busy.set(true);
      this.error.set(null);

      const bytes = new TextEncoder().encode(this.input());
      const digest = await crypto.subtle.digest(this.algorithm(), bytes);
      const hashArray = Array.from(new Uint8Array(digest));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      this.output.set(hashHex);
    } catch {
      this.error.set('Unable to generate hash in this environment.');
    } finally {
      this.busy.set(false);
    }
  }

  clear(): void {
    this.input.set('');
    this.output.set('');
    this.error.set(null);
  }

  async copyOutput(): Promise<void> {
    if (!this.output()) return;
    await navigator.clipboard.writeText(this.output());
  }
}
