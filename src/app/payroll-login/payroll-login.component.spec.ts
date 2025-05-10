import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayrollLoginComponent } from './payroll-login.component';

describe('PayrollLoginComponent', () => {
  let component: PayrollLoginComponent;
  let fixture: ComponentFixture<PayrollLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PayrollLoginComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayrollLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
