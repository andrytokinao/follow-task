import { TestBed } from '@angular/core/testing';

import { IssueResolverService } from './issue-resolver.service';

describe('IssueResolverService', () => {
  let service: IssueResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IssueResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
