import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMasterListComponent } from './show-master-list.component';

describe('ShowMasterListComponent', () => {
  let component: ShowMasterListComponent;
  let fixture: ComponentFixture<ShowMasterListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowMasterListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShowMasterListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
