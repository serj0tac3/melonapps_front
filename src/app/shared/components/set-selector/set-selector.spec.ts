import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetSelector } from './set-selector';

describe('SetSelector', () => {
  let component: SetSelector;
  let fixture: ComponentFixture<SetSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
