import { Component, signal } from '@angular/core';
import { ButtonComponent, CardComponent } from 'shared-ui';

@Component({
  selector: 'app-base64-converter',
  imports: [ButtonComponent, CardComponent],
  templateUrl: './base64-converter.component.html',
  styleUrl: './base64-converter.component.scss',
})
export class Base64ConverterComponent {
  readonly plainText = signal('');
  readonly base64Text = signal('');
  readonly error = signal<string | null>(null);
  readonly urlSafe = signal(false);

  encode(): void {
    try {
      const encoded = utf8ToBase64(this.plainText());
      const result = this.urlSafe() ? toUrlSafeBase64(encoded) : encoded;
      this.base64Text.set(result);
      this.error.set(null);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to encode input');
    }
  }

  decode(): void {
    try {
      const normalized = this.urlSafe() ? fromUrlSafeBase64(this.base64Text()) : this.base64Text();
      this.plainText.set(base64ToUtf8(normalized));
      this.error.set(null);
    } catch {
      this.error.set('Invalid Base64 input. Please verify your payload.');
    }
  }

  clear(): void {
    this.plainText.set('');
    this.base64Text.set('');
    this.error.set(null);
  }

  swap(): void {
    const nextPlain = this.base64Text();
    this.base64Text.set(this.plainText());
    this.plainText.set(nextPlain);
    this.error.set(null);
  }

  onPlainInput(event: Event): void {
    this.plainText.set((event.target as HTMLTextAreaElement).value);
  }

  onBase64Input(event: Event): void {
    this.base64Text.set((event.target as HTMLTextAreaElement).value);
  }

  async copyOutput(): Promise<void> {
    if (!this.base64Text()) return;
    await navigator.clipboard.writeText(this.base64Text());
  }
}

function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToUtf8(value: string): string {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new TextDecoder().decode(bytes);
}

function toUrlSafeBase64(value: string): string {
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromUrlSafeBase64(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  return normalized + '='.repeat(paddingLength);
}
