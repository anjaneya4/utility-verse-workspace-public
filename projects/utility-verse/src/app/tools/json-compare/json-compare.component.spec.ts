import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonCompareComponent } from './json-compare.component';

describe('JsonCompareComponent', () => {
  let component: JsonCompareComponent;
  let fixture: ComponentFixture<JsonCompareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonCompareComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JsonCompareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
