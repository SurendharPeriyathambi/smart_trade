import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Callus } from './callus';

describe('Callus', () => {
  let component: Callus;
  let fixture: ComponentFixture<Callus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Callus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Callus);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
