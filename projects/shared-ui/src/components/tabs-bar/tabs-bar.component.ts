import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface SharedTabItem {
  id: string;
  title: string;
  icon?: string;
}

@Component({
  selector: 'lib-tabs-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabs-bar.component.html',
  styleUrl: './tabs-bar.component.css',
})
export class TabsBarComponent {
  @Input() tabs: SharedTabItem[] = [];
  @Input() activeId = '';
  @Input() emptyMessage = 'Select a tool to begin.';
  @Input() showCloseAll = false;

  @Output() tabSelected = new EventEmitter<string>();
  @Output() tabClosed = new EventEmitter<string>();
  @Output() closeAllRequested = new EventEmitter<void>();

  select(tabId: string): void {
    this.tabSelected.emit(tabId);
  }

  close(tabId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.tabClosed.emit(tabId);
  }

  closeAll(event: MouseEvent): void {
    event.stopPropagation();
    this.closeAllRequested.emit();
  }

  trackById = (_: number, tab: SharedTabItem) => tab.id;
}
