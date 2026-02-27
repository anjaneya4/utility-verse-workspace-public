import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

@Component({
  selector: 'lib-bubble-feedback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bubble-feedback.component.html',
  styleUrl: './bubble-feedback.component.css',
})
export class BubbleFeedbackComponent implements OnChanges, OnDestroy {
  @Input() x = 0;
  @Input() y = 0;
  @Input() trigger = 0;

  visible = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['trigger']) return;

    this.visible = true;
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.visible = false;
      this.timer = null;
    }, 520);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
}
