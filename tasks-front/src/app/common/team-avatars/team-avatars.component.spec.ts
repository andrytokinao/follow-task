import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamAvatarsComponent } from './team-avatars.component';

describe('TeamAvatarsComponent', () => {
  let component: TeamAvatarsComponent;
  let fixture: ComponentFixture<TeamAvatarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamAvatarsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamAvatarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
