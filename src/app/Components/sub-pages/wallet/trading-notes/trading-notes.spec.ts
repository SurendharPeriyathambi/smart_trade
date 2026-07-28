import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradingNotes } from './trading-notes';

describe('TradingNotes', () => {
  let component: TradingNotes;
  let fixture: ComponentFixture<TradingNotes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradingNotes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TradingNotes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
