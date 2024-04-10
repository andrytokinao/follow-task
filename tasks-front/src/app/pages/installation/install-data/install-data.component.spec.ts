import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstallDataComponent } from './install-data.component';

describe('InstallDataComponent', () => {
  let component: InstallDataComponent;
  let fixture: ComponentFixture<InstallDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstallDataComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InstallDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
