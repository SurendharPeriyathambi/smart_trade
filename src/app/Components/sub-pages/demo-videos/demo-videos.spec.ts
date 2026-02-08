import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoVideos } from './demo-videos';

describe('DemoVideos', () => {
  let component: DemoVideos;
  let fixture: ComponentFixture<DemoVideos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemoVideos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DemoVideos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
