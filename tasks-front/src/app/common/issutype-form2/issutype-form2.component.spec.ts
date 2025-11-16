import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssutypeForm2Component } from './issutype-form2.component';

describe('IssutypeForm2Component', () => {
  let component: IssutypeForm2Component;
  let fixture: ComponentFixture<IssutypeForm2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssutypeForm2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssutypeForm2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
