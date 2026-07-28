import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Coopen } from './coopen';

describe('Coopen', () => {
  let component: Coopen;
  let fixture: ComponentFixture<Coopen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Coopen]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Coopen);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
