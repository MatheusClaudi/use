import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CameracaptureComponent } from './cameracapture.component';

describe('CameracaptureComponent', () => {
  let component: CameracaptureComponent;
  let fixture: ComponentFixture<CameracaptureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CameracaptureComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CameracaptureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
