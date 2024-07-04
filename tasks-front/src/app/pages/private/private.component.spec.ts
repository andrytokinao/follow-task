import { TestBed } from '@angular/core/testing';
import {PrivateComponent} from "./private.component";

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivateComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(PrivateComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'tasks-front' title`, () => {
    const fixture = TestBed.createComponent(PrivateComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('tasks-front');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(PrivateComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, tasks-front');
  });
});
