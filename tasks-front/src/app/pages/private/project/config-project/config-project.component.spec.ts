import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigProjectComponent } from './config-project.component';

describe('CreateProjectComponent', () => {
  let component: ConfigProjectComponent;
  let fixture: ComponentFixture<ConfigProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigProjectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
