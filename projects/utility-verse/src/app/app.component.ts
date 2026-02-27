import { Type, Component, computed, signal } from '@angular/core';
import { NgComponentOutlet, NgFor, NgIf } from '@angular/common';
import { TimeConverterComponent } from './tools/time-converter/time-converter.component';
import { Base64ConverterComponent } from './tools/base64-converter/base64-converter.component';
import { JsonCompareComponent } from './tools/json-compare/json-compare.component';
import { TextUtilsComponent } from './tools/text-utils/text-utils.component';
import { UrlEncoderComponent } from './tools/url-encoder/url-encoder.component';
import { JwtDecoderComponent } from './tools/jwt-decoder/jwt-decoder.component';
import { HashGeneratorComponent } from './tools/hash-generator/hash-generator.component';
import { UuidGeneratorComponent } from './tools/uuid-generator/uuid-generator.component';
import {
  BadgeComponent,
  BubbleFeedbackComponent,
  ButtonComponent,
  CardComponent,
  InputComponent,
  ShellLayoutComponent,
  SharedTabItem,
  TabsBarComponent,
} from 'shared-ui';

interface ToolLink {
  key: string;
  label: string;
  description: string;
  icon: string;
  component: Type<unknown>;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    NgComponentOutlet,
    ButtonComponent,
    CardComponent,
    InputComponent,
    BadgeComponent,
    BubbleFeedbackComponent,
    ShellLayoutComponent,
    TabsBarComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly tools: ToolLink[] = [
    {
      key: 'time-converter',
      label: 'Time Converter',
      description: 'Convert IST to major global zones.',
      icon: 'TZ',
      component: TimeConverterComponent,
    },
    {
      key: 'base64-converter',
      label: 'Base64 Converter',
      description: 'Encode/decode text and JSON payloads.',
      icon: '64',
      component: Base64ConverterComponent,
    },
    {
      key: 'json-compare',
      label: 'JSON Compare',
      description: 'Deep, path-aware side-by-side diff.',
      icon: '{}',
      component: JsonCompareComponent,
    },
    {
      key: 'text-utils',
      label: 'Text Utilities',
      description: 'Transform, clean, and analyze text.',
      icon: 'Tx',
      component: TextUtilsComponent,
    },
    {
      key: 'url-encoder',
      label: 'URL Encoder',
      description: 'Encode/decode URL and query string values.',
      icon: 'URL',
      component: UrlEncoderComponent,
    },
    {
      key: 'jwt-decoder',
      label: 'JWT Decoder',
      description: 'Inspect JWT header and payload quickly.',
      icon: 'JWT',
      component: JwtDecoderComponent,
    },
    {
      key: 'hash-generator',
      label: 'Hash Generator',
      description: 'Generate SHA digests from plain text.',
      icon: '#',
      component: HashGeneratorComponent,
    },
    {
      key: 'uuid-generator',
      label: 'UUID Generator',
      description: 'Bulk-create RFC 4122 version 4 UUIDs.',
      icon: 'ID',
      component: UuidGeneratorComponent,
    },
  ];

  readonly openTabs = signal<WorkspaceTab[]>([]);
  readonly activeTabId = signal<string>('');
  readonly sidebarPinned = signal(false);
  readonly toolSearch = signal('');
  readonly bubbleX = signal(0);
  readonly bubbleY = signal(0);
  readonly bubbleTick = signal(0);
  readonly tabItems = computed<SharedTabItem[]>(() =>
    this.openTabs().map((tab) => ({
      id: tab.id,
      title: tab.title,
      icon: tab.icon,
    })),
  );
  readonly filteredTools = computed(() => {
    const term = this.toolSearch().trim().toLowerCase();
    if (!term) return this.tools;

    return this.tools.filter((tool) => {
      return (
        tool.label.toLowerCase().includes(term) ||
        tool.description.toLowerCase().includes(term) ||
        tool.key.toLowerCase().includes(term)
      );
    });
  });

  constructor() {}

  openTool(tool: ToolLink, originEvent?: Event | MouseEvent): void {
    const existing = this.openTabs().find((tab) => tab.toolKey === tool.key);
    if (existing) {
      this.activeTabId.set(existing.id);
      return;
    }

    const tab: WorkspaceTab = {
      id: crypto.randomUUID(),
      title: tool.label,
      toolKey: tool.key,
      icon: tool.icon,
      component: tool.component,
    };

    this.openTabs.set([...this.openTabs(), tab]);
    this.activeTabId.set(tab.id);
    this.spawnBubble(originEvent);
  }

  switchTab(tabId: string): void {
    this.activeTabId.set(tabId);
  }

  closeTab(tabId: string): void {
    const currentTabs = this.openTabs();
    const index = currentTabs.findIndex((tab) => tab.id === tabId);
    if (index === -1) return;

    const nextTabs = currentTabs.filter((tab) => tab.id !== tabId);
    this.openTabs.set(nextTabs);

    if (this.activeTabId() !== tabId) return;

    const fallback = nextTabs[index] ?? nextTabs[index - 1];
    this.activeTabId.set(fallback?.id ?? '');
  }

  closeAllTabs(): void {
    this.openTabs.set([]);
    this.activeTabId.set('');
  }

  isActiveTool(toolKey: string): boolean {
    const active = this.openTabs().find((tab) => tab.id === this.activeTabId());
    return active?.toolKey === toolKey;
  }

  onSearchInput(value: string): void {
    this.toolSearch.set(value);
  }

  onSidebarPinChange(next: boolean): void {
    this.sidebarPinned.set(next);
  }

  private spawnBubble(originEvent?: Event | MouseEvent): void {
    const mouseEvent = originEvent as MouseEvent | undefined;
    const eventTarget = mouseEvent?.currentTarget as HTMLElement | null;
    if (eventTarget) {
      const rect = eventTarget.getBoundingClientRect();
      this.bubbleX.set(rect.left + rect.width / 2);
      this.bubbleY.set(rect.top + rect.height / 2);
    } else {
      this.bubbleX.set(window.innerWidth / 2);
      this.bubbleY.set(window.innerHeight / 2);
    }

    this.bubbleTick.update((value) => value + 1);
  }

  trackByTool = (_: number, item: ToolLink) => item.key;
  trackByTab = (_: number, item: WorkspaceTab) => item.id;
}

interface WorkspaceTab {
  id: string;
  title: string;
  toolKey: string;
  icon: string;
  component: Type<unknown>;
}
