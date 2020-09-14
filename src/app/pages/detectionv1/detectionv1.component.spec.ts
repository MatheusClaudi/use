import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Detectionv1Component } from './detectionv1.component';

describe('Detectionv1Component', () => {
  let component: Detectionv1Component;
  let fixture: ComponentFixture<Detectionv1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Detectionv1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Detectionv1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
