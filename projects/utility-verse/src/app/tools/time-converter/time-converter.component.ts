import { Component, computed, signal } from '@angular/core';

interface ZoneOption {
  label: string;
  zone: string;
}

interface ConvertedZone {
  label: string;
  zone: string;
  localDateTime: string;
  offsetLabel: string;
  relativeDay: string;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

@Component({
  selector: 'app-time-converter',
  imports: [],
  templateUrl: './time-converter.component.html',
  styleUrl: './time-converter.component.scss',
})
export class TimeConverterComponent {
  readonly zones: ZoneOption[] = [
    { label: 'India (IST)', zone: 'Asia/Kolkata' },
    { label: 'UTC', zone: 'UTC' },
    { label: 'New York', zone: 'America/New_York' },
    { label: 'London', zone: 'Europe/London' },
    { label: 'Dubai', zone: 'Asia/Dubai' },
    { label: 'Singapore', zone: 'Asia/Singapore' },
    { label: 'Tokyo', zone: 'Asia/Tokyo' },
    { label: 'Sydney', zone: 'Australia/Sydney' },
  ];

  readonly sourceZone = signal('Asia/Kolkata');
  readonly sourceDate = signal(this.getCurrentDateInZone('Asia/Kolkata'));
  readonly sourceTime = signal(this.getCurrentTimeInZone('Asia/Kolkata'));

  readonly conversionState = computed(() => {
    const sourceParts = this.parseInput(this.sourceDate(), this.sourceTime());
    if (!sourceParts) {
      return {
        valid: false as const,
        error: 'Enter a valid date and time.',
        utcInstant: null,
        sourceOffset: '',
      };
    }

    const utcInstant = this.zonedDateTimeToUtc(sourceParts, this.sourceZone());
    if (!utcInstant) {
      return {
        valid: false as const,
        error: 'Unable to resolve this local time in the selected timezone.',
        utcInstant: null,
        sourceOffset: '',
      };
    }

    return {
      valid: true as const,
      error: '',
      utcInstant,
      sourceOffset: this.getOffsetLabel(utcInstant, this.sourceZone()),
    };
  });

  readonly convertedResults = computed<ConvertedZone[]>(() => {
    const state = this.conversionState();
    if (!state.valid || !state.utcInstant) return [];

    const sourceDayKey = this.getDayKey(state.utcInstant, this.sourceZone());

    return this.zones
      .filter((zone) => zone.zone !== this.sourceZone())
      .map((zone) => {
        const targetDayKey = this.getDayKey(state.utcInstant, zone.zone);

        return {
          ...zone,
          localDateTime: this.formatDateTime(state.utcInstant, zone.zone),
          offsetLabel: this.getOffsetLabel(state.utcInstant, zone.zone),
          relativeDay: this.describeDayShift(sourceDayKey, targetDayKey),
        };
      });
  });

  onSourceZoneChange(event: Event): void {
    const nextZone = (event.target as HTMLSelectElement).value;
    this.sourceZone.set(nextZone);
    this.sourceDate.set(this.getCurrentDateInZone(nextZone));
    this.sourceTime.set(this.getCurrentTimeInZone(nextZone));
  }

  onDateChange(event: Event): void {
    this.sourceDate.set((event.target as HTMLInputElement).value);
  }

  onTimeChange(event: Event): void {
    this.sourceTime.set((event.target as HTMLInputElement).value);
  }

  useNow(): void {
    const zone = this.sourceZone();
    this.sourceDate.set(this.getCurrentDateInZone(zone));
    this.sourceTime.set(this.getCurrentTimeInZone(zone));
  }

  private zonedDateTimeToUtc(parts: DateParts, zone: string): Date | null {
    let utcGuess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);

    for (let i = 0; i < 4; i += 1) {
      const guessParts = this.getDatePartsInZone(new Date(utcGuess), zone);
      if (!guessParts) return null;

      const desiredAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
      const guessAsUtc = Date.UTC(
        guessParts.year,
        guessParts.month - 1,
        guessParts.day,
        guessParts.hour,
        guessParts.minute,
      );

      const diffMs = desiredAsUtc - guessAsUtc;
      utcGuess += diffMs;

      if (diffMs === 0) {
        return new Date(utcGuess);
      }
    }

    const finalGuess = new Date(utcGuess);
    const finalParts = this.getDatePartsInZone(finalGuess, zone);
    if (!finalParts) return null;

    const isExact =
      finalParts.year === parts.year &&
      finalParts.month === parts.month &&
      finalParts.day === parts.day &&
      finalParts.hour === parts.hour &&
      finalParts.minute === parts.minute;

    return isExact ? finalGuess : null;
  }

  private getDatePartsInZone(date: Date, zone: string): DateParts | null {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const year = Number(parts.find((p) => p.type === 'year')?.value);
    const month = Number(parts.find((p) => p.type === 'month')?.value);
    const day = Number(parts.find((p) => p.type === 'day')?.value);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value);

    if ([year, month, day, hour, minute].some((n) => Number.isNaN(n))) {
      return null;
    }

    return { year, month, day, hour, minute };
  }

  private parseInput(dateValue: string, timeValue: string): DateParts | null {
    if (!dateValue || !timeValue) return null;

    const [year, month, day] = dateValue.split('-').map(Number);
    const [hour, minute] = timeValue.split(':').map(Number);

    if ([year, month, day, hour, minute].some((n) => Number.isNaN(n))) {
      return null;
    }

    return { year, month, day, hour, minute };
  }

  private formatDateTime(date: Date, zone: string): string {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }

  private getOffsetLabel(date: Date, zone: string): string {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      timeZoneName: 'shortOffset',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const value = formatter
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')
      ?.value;

    return value ?? 'GMT';
  }

  private getCurrentDateInZone(zone: string): string {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);

    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    return `${year}-${month}-${day}`;
  }

  private getCurrentTimeInZone(zone: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());
  }

  private getDayKey(date: Date, zone: string): string {
    const parts = this.getDatePartsInZone(date, zone);
    if (!parts) return '';
    return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  }

  private describeDayShift(sourceDay: string, targetDay: string): string {
    if (!sourceDay || !targetDay) return '';
    if (sourceDay === targetDay) return 'Same day';

    const source = new Date(`${sourceDay}T00:00:00Z`).getTime();
    const target = new Date(`${targetDay}T00:00:00Z`).getTime();
    const delta = Math.round((target - source) / 86_400_000);

    if (delta === 1) return 'Next day';
    if (delta === -1) return 'Previous day';
    return delta > 0 ? `+${delta} days` : `${delta} days`;
  }
}
