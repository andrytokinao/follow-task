import { TestBed } from '@angular/core/testing';

import { DisplayCustomfielFactoryService } from './display-customfiel-factory.service';

describe('DisplayCustomfielFactoryService', () => {
  let service: DisplayCustomfielFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DisplayCustomfielFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
