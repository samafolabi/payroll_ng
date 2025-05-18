import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { app, analytics, onAuth, auth, signIn, signOut, signUp } from '../../firebase';
import { getDatabase, ref, child, get, set, DataSnapshot } from "firebase/database";
import { DETAILS, sample_details } from "../../payroll_details";

@Component({
  selector: 'app-payroll-login',
  templateUrl: './payroll-login.component.html',
  styleUrls: ['./payroll-login.component.css']
})
export class PayrollLoginComponent implements OnInit {

  constructor(private router: Router) { }

  db = getDatabase(app);

  @Input()
  set sign_up(bool: string) {
    if (bool) {
      const login_link = (document.getElementById("login-tab-link") as HTMLInputElement);
      const signup_link = (document.getElementById("signup-tab-link") as HTMLInputElement);
      const login_tab = (document.getElementById("login-tab") as HTMLInputElement);
      const signup_tab = (document.getElementById("signup-tab") as HTMLInputElement);

      login_link.classList.remove("active");
      login_tab.classList.remove("active");   
      signup_link.classList.add("active");
      signup_tab.classList.add("active");
    }
  }

  ngOnInit(): void {
    this.authListener();
  }
  
  authListener() {
    onAuth(auth, (user) => {
      if (user) {
        get(child(ref(getDatabase(app)), 'employees/'+user.uid)).then((snapshot) => {
          if (snapshot.exists()) {
            this.router.navigateByUrl('/dashboard');
          } else {
            alert("Access Denied");
            signOut(auth);
          }
        }).catch((error) => {
          alert("Error");
          signOut(auth);
        });
      }
    })
  }

  signup() {
    const email = (document.getElementById("s_email") as HTMLInputElement).value;
    const password = (document.getElementById("s_password") as HTMLInputElement).value;
    const c_password = (document.getElementById("s_cpassword") as HTMLInputElement).value;
    const fname = (document.getElementById("s_fname") as HTMLInputElement).value;
    const lname = (document.getElementById("s_lname") as HTMLInputElement).value;
    const dob = (document.getElementById("s_dob") as HTMLInputElement).value;

    if (password == c_password && email && password && fname && lname && dob) {
      signUp(auth, email, password).then((userCredential) => {

        let details = sample_details;
        details.demographics.first_name = fname;
        details.demographics.last_name = lname;
        details.demographics.dob = dob;
        
        set(ref(this.db, 'employees/'+userCredential.user.uid), details).then(() => {
          this.router.navigateByUrl('/dashboard');
        });

      })
      .catch((error) => {
        alert("Error");
      });
    } else {
      alert("Please fill in the fields");
    }
  }

  login() {
    const email = (document.getElementById("email") as HTMLInputElement).value;
    const password = (document.getElementById("password") as HTMLInputElement).value;

    if (email != "" && email && password != "" && password != null) {
      signIn(email, password);
      //
    } else {
      alert("Please fill in the fields");
    }
  }

}

