import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';
import { routes } from './app.routes';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should expose all tool entries', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const keys = app.tools.map((tool) => tool.key);

    expect(app.tools.length).toBe(8);
    expect(keys).toContain('json-compare');
    expect(keys).toContain('text-utils');
    expect(keys).toContain('jwt-decoder');
    expect(keys).toContain('uuid-generator');
  });
});
