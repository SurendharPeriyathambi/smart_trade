import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopularCourse } from './popular-course';

describe('PopularCourse', () => {
  let component: PopularCourse;
  let fixture: ComponentFixture<PopularCourse>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopularCourse]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopularCourse);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
