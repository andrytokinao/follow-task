import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueDocumentsViewerComponent } from './issue-documents-viewer.component';

describe('IssueDocumentsViewerComponent', () => {
  let component: IssueDocumentsViewerComponent;
  let fixture: ComponentFixture<IssueDocumentsViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueDocumentsViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssueDocumentsViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
