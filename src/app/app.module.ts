import { NgModule } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PayrollLoginComponent } from './payroll-login/payroll-login.component';
import { PayrollDashboardComponent } from './payroll-dashboard/payroll-dashboard.component';
import { MonthPipe } from './month.pipe';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { HomeComponent } from './home/home.component';
import { FiltPipe } from './filt.pipe';

@NgModule({
  declarations: [
    AppComponent,
    PayrollLoginComponent,
    PayrollDashboardComponent,
    MonthPipe,
    AdminLoginComponent,
    AdminDashboardComponent,
    HomeComponent,
    FiltPipe
  ],
  imports: [
    BrowserModule,
    NgSelectModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
