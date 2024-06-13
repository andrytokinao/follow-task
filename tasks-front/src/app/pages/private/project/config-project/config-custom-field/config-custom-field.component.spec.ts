import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigCustomFieldComponent } from './config-custom-field.component';

describe('CustomFieldComponent', () => {
  let component: ConfigCustomFieldComponent;
  let fixture: ComponentFixture<ConfigCustomFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigCustomFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigCustomFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
