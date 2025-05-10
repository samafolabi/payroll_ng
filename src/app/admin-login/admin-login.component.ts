import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { auth, app, getCookie, setCookie } from '../../firebase';
import { getDatabase, ref, child, get, DataSnapshot } from "firebase/database";

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent implements OnInit {

  constructor(private router: Router) { }

  loaded : boolean = false;

  ngOnInit(): void {
    if (auth.currentUser) {
      this.router.navigateByUrl('/dashboard');
    } else {
      this.loaded = true;
      if (getCookie("logged_in") == "true") {
        this.router.navigateByUrl('/admin-dashboard');
      }
    }
  }

  login() {
    const email = (document.getElementById("email") as HTMLInputElement).value;
    const password = (document.getElementById("password") as HTMLInputElement).value;

    if (email != "" && email != null && password != "" && password != null) {

      get(child(ref(getDatabase(app)), 'admin/')).then((snapshot) => {

        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.email == email && data.password == password) {
            setCookie("logged_in", "true", 1);
            this.router.navigateByUrl('/admin-dashboard');
          } else {
            alert("Access Denied");
            this.router.navigateByUrl('/dashboard');
          }
        } else {
          alert("Error");
          this.router.navigateByUrl('/dashboard');
        }

      }).catch((error) => {
        alert("Error");
        this.router.navigateByUrl('/dashboard');
      });
      
    } else {
      alert("Please fill in the fields");
    }
  }

}
