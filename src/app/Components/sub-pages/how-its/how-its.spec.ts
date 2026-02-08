import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HowIts } from './how-its';

describe('HowIts', () => {
  let component: HowIts;
  let fixture: ComponentFixture<HowIts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HowIts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HowIts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
