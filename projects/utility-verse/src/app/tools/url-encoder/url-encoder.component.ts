import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-url-encoder',
  imports: [],
  templateUrl: './url-encoder.component.html',
  styleUrl: './url-encoder.component.scss',
})
export class UrlEncoderComponent {
  readonly input = signal('');
  readonly output = signal('');
  readonly error = signal<string | null>(null);
  readonly plusForSpace = signal(false);

  onInput(event: Event): void {
    this.input.set((event.target as HTMLTextAreaElement).value);
  }

  encode(): void {
    try {
      let encoded = encodeURIComponent(this.input());
      if (this.plusForSpace()) {
        encoded = encoded.replace(/%20/g, '+');
      }
      this.output.set(encoded);
      this.error.set(null);
    } catch {
      this.error.set('Unable to encode input.');
    }
  }

  decode(): void {
    try {
      const source = this.plusForSpace() ? this.input().replace(/\+/g, '%20') : this.input();
      this.output.set(decodeURIComponent(source));
      this.error.set(null);
    } catch {
      this.error.set('Invalid URL-encoded input.');
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
