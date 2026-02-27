import { Component, Input } from '@angular/core';

type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning';

@Component({
  selector: 'lib-badge',
  standalone: true,
  imports: [],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.css',
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'neutral';
}
