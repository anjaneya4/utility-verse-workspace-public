import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'lib-shell-layout',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.css',
})
export class ShellLayoutComponent {
  @Input() collapsed = true;
  @Input() sidebarWidth = 320;
  @Input() collapsedWidth = 72;
  @Input() hoverExpand = true;
  @Input() pinned = false;
  @Output() pinnedChange = new EventEmitter<boolean>();

  hovering = false;

  get templateColumns(): string {
    const width = this.isExpanded ? this.sidebarWidth : this.collapsedWidth;
    return `${width}px minmax(0, 1fr)`;
  }

  get isExpanded(): boolean {
    if (this.pinned) return true;
    if (!this.collapsed) return true;
    return this.hoverExpand ? this.hovering : false;
  }

  onEnter(): void {
    if (this.hoverExpand) this.hovering = true;
  }

  onLeave(): void {
    if (this.hoverExpand) this.hovering = false;
  }

  togglePin(): void {
    this.pinnedChange.emit(!this.pinned);
  }
}
