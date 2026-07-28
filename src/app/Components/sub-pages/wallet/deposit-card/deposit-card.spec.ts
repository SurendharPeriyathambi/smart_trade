import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepositCard } from './deposit-card';

describe('DepositCard', () => {
  let component: DepositCard;
  let fixture: ComponentFixture<DepositCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepositCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DepositCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
