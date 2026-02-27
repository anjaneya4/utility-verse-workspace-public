import { TestBed } from '@angular/core/testing';

import { SharedUiService } from './shared-ui.service';

describe('SharedUiService', () => {
  let service: SharedUiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SharedUiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
