import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Journals } from './journals';

describe('Journals', () => {
  let component: Journals;
  let fixture: ComponentFixture<Journals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Journals]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Journals);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
