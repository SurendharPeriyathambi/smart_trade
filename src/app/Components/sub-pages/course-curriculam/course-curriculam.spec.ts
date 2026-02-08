import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseCurriculam } from './course-curriculam';

describe('CourseCurriculam', () => {
  let component: CourseCurriculam;
  let fixture: ComponentFixture<CourseCurriculam>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseCurriculam]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseCurriculam);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
