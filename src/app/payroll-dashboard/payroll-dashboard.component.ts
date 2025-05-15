import { KeyValue, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { onAuth, auth, app, signOut } from '../../firebase';
import { getDatabase, ref, set, onValue, child, push, update, DataSnapshot, get, remove } from "firebase/database";
import { DETAILS, sample_details, HISTORY_ITEM, PENDING_DAY } from "../../payroll_details";
import { Modal } from 'bootstrap';
import { FormsModule } from '@angular/forms'
import { MonthPipe } from '../month.pipe';

@Component({
  selector: 'app-payroll-dashboard',
  templateUrl: './payroll-dashboard.component.html',
  styleUrls: ['./payroll-dashboard.component.css'],
  imports: [ FormsModule, MonthPipe, DatePipe, TitleCasePipe ]
})
export class PayrollDashboardComponent implements OnInit {
  
  objectKeys = Object.keys;

  current_year: number = new Date().getFullYear();

  employee_details : DETAILS = sample_details;

  activated : boolean = false;

  loaded : boolean = false;
  
  extras_collapsed: boolean = true;
  extras_editing: boolean = false;

  db = getDatabase(app);
  uid : string = "";
  email : string = "";

  constructor(private router: Router, private changeDetection: ChangeDetectorRef) { }

  days_history_modal: Modal | null = null;
  days_history: HISTORY_ITEM[] = [];

  sick_days_modal: Modal | null = null;
  days_date: string = "";
  days_reason: string = "";

  pending_days_modal: Modal | null = null;
  pending_days: PENDING_DAY = {};
  pending_days_ids: string[] = [];

  ngOnInit(): void {
    this.authListener();
  }
  
  authListener() {
    onAuth(auth, (user) => {
      if (user) {
        onValue(ref(this.db, 'employees/'+user.uid), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.activated) {
              this.activated = true;
              this.employee_details = Object.assign([], data);
              this.uid = user.uid;
              this.email = user.email ?? 'No email';
              this.current_year = parseInt(Object.keys(this.employee_details.salary).sort( this.compareFn )[0]);
              this.changeDetection.detectChanges();
            }
          } else {
            alert("Access Denied");
            this.logout();
          }
          this.loaded = true;
          
        }
        // , (error) => {
        //   alert(user);
        //   alert(error.message); //may need to comment this out: see when you logout
        //   this.logout();
        // }
        );
        
      } else {
        this.router.navigateByUrl('/login');
      }
    })
  }


  view_history() : void {
    if (!this.days_history_modal) {
      this.days_history_modal = new Modal("#days_history_modal", {
        focus: false
      });
    }

    if (this.days_history_modal) {
      get(ref(this.db, 'sick_days_history/'+this.uid)).then((snapshot) => {
        if (snapshot.exists()) {
          this.days_history = snapshot.val();
        }
      }).catch((error) => {
        alert("Error, please contact admin");
        console.log(error.message);
      });

      this.days_history_modal?.show();
    }
    
  }

  request_day() : void { //sick: false, vacation:false
    if (this.employee_details.sick_days > 0 || this.employee_details.vacation_days > 0) {
      if (!this.sick_days_modal) {
        this.sick_days_modal = new Modal("#sick_days_modal", {
          focus: false
        });
      }

      if (this.sick_days_modal) {
        this.days_date = "";
        this.days_reason = "";
        this.sick_days_modal?.show();
      }
    }
  }

  request_sick_day() : void {
    let sick_in = (document.getElementsByName("day_type")[0] as HTMLInputElement);
    let vaca_in = (document.getElementsByName("day_type")[1] as HTMLInputElement);
    let day_type = sick_in.checked ? 'sick' : (vaca_in.checked ? 'vacation' : '');
    if (this.days_date.length > 0 && this.days_reason.length > 0 && day_type != '') {
      let selected_date = new Date(this.days_date);
      if (selected_date) {
        let sel_date = selected_date.toISOString().substring(0,10);

        for (let i = 0; i < this.days_history.length; i++) {
          const e = this.days_history[i];
          if (e.date == sel_date && e.approved) {
            return;
          }
        }
        
        for (let i = 0; i < this.pending_days_ids.length; i++) {
          const e = this.pending_days[this.pending_days_ids[i]];
          if (e.proposed_date == sel_date) {
            return;
          }
        }

        if (!(day_type == 'vacation' || day_type == 'sick')) {
          return;
        } else {
          let j = day_type == 'vacation' ? this.employee_details.vacation_days : this.employee_details.sick_days;
          if (j <= 0) { return; }
        }

        let postData = {
          proposed_date: sel_date,
          reason: this.days_reason,
          request_date: new Date().toISOString().substring(0,10),
          uid: this.uid,
          name: this.employee_details.demographics.first_name + " " + this.employee_details.demographics.last_name,
          type: day_type
        };

        const newPostKey = push(child(ref(this.db), 'pending_days')).key;

        if(newPostKey) {
          const updates : {[index: string]: {}}  = {};
          updates['/pending_days/' + newPostKey] = postData;
  
          update(ref(this.db), updates);
          
          this.days_date = "";
          this.days_reason = "";
          this.sick_days_modal?.hide();
  
          get(ref(this.db, 'employees/'+this.uid+'/pending_days')).then((snapshot) => {
            let arr : string[] = [];
            if (snapshot.exists()) {
              arr = snapshot.val();
            }
            arr.push(newPostKey);
            set(ref(this.db, 'employees/'+this.uid+'/pending_days'), arr);
          }).catch((error) => {
            alert("Error, please contact admin");
            console.log(error.message);
          });
        }

        
      }
    }
    
    
  }

  view_pending_days() : void {
    if (!this.pending_days_modal) {
      this.pending_days_modal = new Modal("#pending_days_modal", {
        focus: false
      });
    }

    if (this.pending_days_modal) {
      get(ref(this.db, 'employees/'+this.uid+'/pending_days')).then((snapshot) => {
        if (snapshot.exists()) {
          this.pending_days_ids = snapshot.val();
          get(ref(this.db, 'pending_days')).then((snapshot2) => {

            for (let i = 0; i < this.pending_days_ids.length; i++) {
              const element = this.pending_days_ids[i];
              this.pending_days[element] = snapshot2.val()[element];
            }
            
          }).catch((error) => {
            alert("Error, please contact admin");
            console.log(error.message);
          });
          
        }
      }).catch((error) => {
        alert("Error, please contact admin");
        console.log(error.message);
      });

      this.pending_days_modal?.show();
    }
  }

  cancel_pending_day(id: string) : void {
    this.pending_days_ids.splice(this.pending_days_ids.indexOf(id), 1);
    delete this.pending_days[id];
    remove(ref(this.db, 'pending_days/'+id));
    set(ref(this.db, 'employees/'+this.uid+'/pending_days'), this.pending_days_ids);
  }

  plural_fill(num: number, type: string) {
    let main = '' + num;
    let days = ' day' + (num == 1 ? '' : 's');
    if (type == 'info' || type == 'sick') {
      type = ' sick';
    } else if (type == 'info_vacation' || type == 'vacation') {
      type = ' vacation';
    } else {
      type = '';
    }
    return main + type + days;
  }





  

  total(monthStr: string):number {
    let month:number = parseInt(monthStr);

    let deets : { [index:string]: number} = this.employee_details.salary[this.current_year].months[month].details;
    let keys : string[] = Object.keys(deets);
    
    let result : number = 0;

    for (let i = 0; i < keys.length; i++) {
      result += deets[keys[i]];
    }

    return result;
  }

  originalOrder = (a: KeyValue<string,object>, b: KeyValue<string,object>): number => {
    return 0;
  }

  keyAscOrder = (a: KeyValue<string,object>, b: KeyValue<string,object>): number => {
    let a2 = parseInt(a.key);
    let b2 = parseInt(b.key);
    return a2 > b2 ? 1 : (b2 > a2 ? -1 : 0);
  }

  keyDescOrder = (a: KeyValue<string,object>, b: KeyValue<string,object>): number => {
    let a2 = parseInt(a.key);
    let b2 = parseInt(b.key);
    return a2 > b2 ? -1 : (b2 > a2 ? 1 : 0);
  }

  //descending
  compareFn(a: string, b: string): number {
    return parseInt(b) - parseInt(a);
  }

  

  logout() {
    signOut(auth).then(() => {
      //
      //this.router.navigateByUrl('/login');
    }).catch((error) => {
      alert("Error");
    });
  }



  print() {
    let prevYear = this.current_year;
    let print_prep = document.getElementById("print_prep");
    let print_frame = window.frames[0];

    if (print_frame && print_prep) {
      print_prep.innerHTML+='<h1 style="text-decoration: underline">Salary Details</h1><br /><br />';

      let salary = this.employee_details.salary;
      let keys = Object.keys(salary);
      for (let i = 0; i < keys.length; i++) {
        this.current_year = parseInt(keys[i]);
        this.changeDetection.detectChanges()

        
        print_prep.innerHTML += 
                document.getElementById("pay_table")?.innerHTML
                .replace("Salary Details", keys[i]);
        print_prep.innerHTML += "<br />";
      }
      
      print_prep.innerHTML+='<style>table {' +
        'border: 1px solid black; width:70%;}tr{border:1px solid black;}</style>';


      print_frame.document.body.innerHTML = print_prep.innerHTML;
      print_frame.window.focus();
      print_frame.window.print();
      print_prep.innerHTML = "";

      this.current_year = prevYear;
    }

  }

  csv() {
    let csv = "Year,Month,Link,Base,Lunch,Transport,Healthcare,Other\r\n";

    let salary = this.employee_details.salary;
    let years = Object.keys(salary);
    for (let i = 0; i < years.length; i++) {
      let months = salary[parseInt(years[i])].months;
      let mKeys = Object.keys(months);

      for (let j = 0; j < mKeys.length; j++) {
        let k = parseInt(mKeys[j])
        csv += years[i] + ',' + mKeys[j] + ',' + months[k].link + ',' + months[k].details.base + ',' +
              months[k].details.lunch + ',' + months[k].details.transport + ',' + months[k].details.healthcare + ',' +
              months[k].details.other + '\r\n'
      }
    }

    console.log(csv);

    try {
      var fileSaverSupport = !!new Blob;
      
      var filename = "salary_csv.csv";
      var file = new File([csv], filename, {type: "text/plain;charset=utf-8"});
      
      let link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download = filename;
      link.click();
      link.remove();
    } catch (e) {
        alert("Error Creating/Saving file");
    }

  }

  edit_extras() {

    if (this.extras_editing) { //saving
      let addr = document.getElementById("ext_addr") as HTMLInputElement;
      let phone = document.getElementById("ext_phone") as HTMLInputElement;
      let emer_contact = document.getElementById("ext_emcon") as HTMLInputElement;
      let emer_phone = document.getElementById("ext_emphone") as HTMLInputElement;

      if (addr && phone && emer_contact && emer_phone) {
        if (phone.value != emer_phone.value || phone.value == '') {
          let obj = {
            address: addr.value,
            phone: phone.value,
            emer_contact: emer_contact.value,
            emer_phone: emer_phone.value
          };

          this.employee_details.demographics['extras'] = obj;
          this.extras_editing = !this.extras_editing;

          set(ref(this.db, 'employees/'+this.uid+'/demographics/extras'), obj);
        } else {
          alert ("Your phone number and emergency contact phone number cannot be the same.")
        }
      } else {
        
      }
    } else { //editing

      this.extras_editing = !this.extras_editing;
    }

  }



}
