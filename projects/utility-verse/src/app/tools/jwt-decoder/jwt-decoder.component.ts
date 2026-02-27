import { Component, signal } from '@angular/core';

interface JwtSection {
  title: string;
  value: string;
}

@Component({
  selector: 'app-jwt-decoder',
  imports: [],
  templateUrl: './jwt-decoder.component.html',
  styleUrl: './jwt-decoder.component.scss',
})
export class JwtDecoderComponent {
  readonly token = signal('');
  readonly header = signal('');
  readonly payload = signal('');
  readonly signature = signal('');
  readonly error = signal<string | null>(null);

  readonly sections: JwtSection[] = [
    { title: 'Header', value: 'header' },
    { title: 'Payload', value: 'payload' },
    { title: 'Signature', value: 'signature' },
  ];

  onInput(event: Event): void {
    this.token.set((event.target as HTMLTextAreaElement).value.trim());
  }

  decode(): void {
    const parts = this.token().split('.');
    if (parts.length !== 3) {
      this.error.set('JWT must have exactly 3 parts separated by dots.');
      return;
    }

    try {
      this.header.set(this.prettyJson(base64UrlDecode(parts[0])));
      this.payload.set(this.prettyJson(base64UrlDecode(parts[1])));
      this.signature.set(parts[2]);
      this.error.set(null);
    } catch {
      this.error.set('Invalid JWT format or malformed Base64Url content.');
    }
  }

  clear(): void {
    this.token.set('');
    this.header.set('');
    this.payload.set('');
    this.signature.set('');
    this.error.set(null);
  }

  async copy(name: 'header' | 'payload' | 'signature'): Promise<void> {
    const value = name === 'header' ? this.header() : name === 'payload' ? this.payload() : this.signature();
    if (!value) return;
    await navigator.clipboard.writeText(value);
  }

  private prettyJson(value: string): string {
    return JSON.stringify(JSON.parse(value), null, 2);
  }
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new TextDecoder().decode(bytes);
}
