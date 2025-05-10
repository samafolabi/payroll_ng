import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { PayrollLoginComponent } from './payroll-login/payroll-login.component';
import { PayrollDashboardComponent } from "./payroll-dashboard/payroll-dashboard.component";
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { AdminDashboardComponent } from "./admin-dashboard/admin-dashboard.component";
import { HomeComponent } from './home/home.component'

const routes: Routes = [
  {path: 'login', component: PayrollLoginComponent},
  {path: 'dashboard', component: PayrollDashboardComponent},
  {path: 'admin-login', component: AdminLoginComponent},
  {path: 'admin-dashboard', component: AdminDashboardComponent},
  {path: 'admin', redirectTo: '/admin-login', pathMatch: 'full'},
  {path: '', component: HomeComponent},
  {path: '**', redirectTo: '/', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
