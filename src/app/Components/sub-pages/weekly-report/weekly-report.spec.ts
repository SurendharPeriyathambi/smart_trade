import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeeklyReport } from './weekly-report';

describe('WeeklyReport', () => {
  let component: WeeklyReport;
  let fixture: ComponentFixture<WeeklyReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeeklyReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeeklyReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
