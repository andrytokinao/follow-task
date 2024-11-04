import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMasterComponent } from './show-master.component';

describe('ShowMasterComponent', () => {
  let component: ShowMasterComponent;
  let fixture: ComponentFixture<ShowMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowMasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
