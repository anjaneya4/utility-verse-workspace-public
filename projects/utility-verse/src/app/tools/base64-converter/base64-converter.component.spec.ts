import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Base64ConverterComponent } from './base64-converter.component';

describe('Base64ConverterComponent', () => {
  let component: Base64ConverterComponent;
  let fixture: ComponentFixture<Base64ConverterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Base64ConverterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Base64ConverterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
