import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { getCookie, setCookie, app } from '../../firebase';
import { getDatabase, ref, set, onValue, get, remove } from "firebase/database";
import { DETAILS, sample_details, HISTORY_ITEM, starter_history_item, starter_history_item_v, PENDING_DAY, LABELS } from "../../payroll_details";
import { DatePipe, KeyValue, KeyValuePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms'
import { Modal } from 'bootstrap';
import { MonthPipe } from '../month.pipe'

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  imports: [ FormsModule, MonthPipe, DatePipe, TitleCasePipe, KeyValuePipe ]
})
export class AdminDashboardComponent implements OnInit {

  objectKeys = Object.keys;

  current_year = new Date().getFullYear();

  db = getDatabase(app);

  loaded : boolean = false;

  uids : string[] = [];
  employees : DETAILS[] = [];
  //sorted : DETAILS[] = [];

  employee_details : DETAILS = sample_details;

  changed_title:string = "";

  current_modal_idx : number = -1;
  current_sick_days_modal_idx : number = -1;

  current_modal_months : {[index: string]: {months: number[]}} = {[this.current_year]: {months: [1,2]}};
  current_modal_year : number = this.current_year;

  global_active:boolean = false;

  constructor(private router: Router, private changeDetection: ChangeDetectorRef) { }

  modal: Modal | null = null;
  sick_days_modal: Modal | null = null;
  days_history_modal: Modal | null = null;
  pending_days_modal: Modal | null = null;

  sick_days_change: number = 12;
  days_reason: string = "";

  days_history: HISTORY_ITEM[] = [];

  pending_days: PENDING_DAY = {};

  vaca_or_sick : string = 'sick';

  labels = LABELS;
  
  
  ngOnInit(): void {
    if (getCookie("logged_in") == "true") {
      onValue(ref(this.db, 'employees'), (snapshot) => {
        const data = snapshot.val();
        this.employees = Object.values(data);
        this.uids = Object.keys(data);
        //this.sorted = this.sortBy();

        this.IDPopulate();

        this.loaded = true;

      });

    } else {
      this.router.navigateByUrl('/admin-login');
    }
  }

  IDPopulate() {
    for (let i = 0; i < this.employees.length; i++) {
      this.employees[i].ID = 'id' + i + '|' + (new Date()).getTime();
    }
  }

  findIDindex(id : string) {
    var i = 0;
    while (this.employees[i].ID != id) {
      i++;
    }
    return i;
  }

  cleanID(det: DETAILS) {
    let details = deep(det);
    delete details.ID;
    return details;
  }

  

  



  readFileContent(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (!file) {
            resolve('');
        }

        const reader = new FileReader();

        reader.onload = (e) => {
          if (reader.result) {
            const text = reader.result.toString();
            resolve(text);
          }
        };

        reader.readAsText(file);
    });
}
  

  async upload(event : Event) {
    let target : HTMLInputElement = event.target as HTMLInputElement;
    if (target.files) {
      let file = target.files[0];
      let reader = new FileReader();

      const csv = await this.readFileContent(file);
      if (csv) {
        //console.log(csv);
        
        let json = csvToJson(csv)

        //console.log(json)

        const keyss = Object.keys(this.employee_details.salary);
        let newYears : string[] = [];

        for (let i = 0; i < json.length; i++) {
          const row = json[i];
          const monthStr = row['Month'];
          const yearStr = row['Year'];
          const month = parseInt(monthStr);
          const year = parseInt(yearStr);

          if (month >= 1 && month <= 12) {
            if (this.employee_details.salary[year] && Object.keys(this.employee_details.salary[year].months).includes(monthStr)) {
              let sure = confirm("Do you want to override the paycheck for " + row['Month'] + " " + row['Year'] + "?");
              if (!sure) {
                continue;
              }
            }

            if (!keyss.includes(yearStr) && !newYears.includes(yearStr)) {
              newYears.push(yearStr);
              this.current_modal_months[year] = {months: [1,2,3,4,5,6,7,8,9,10,11,12]};
              this.employee_details.salary[year] = {
                months: {
                  [month]: {
                    link: "",
                    details: {
                      base: 0,
                      lunch: 0,
                      transport: 0,
                      healthcare: 0,
                      other: 0
                    }
                  }
                }
              };
            }

            this.employee_details.salary[year].months[month] = {
              link: row['Link'],
              details: {
                base: parseInt(row['Base']),
                lunch: parseInt(row['Lunch']),
                transport: parseInt(row['Transport']),
                healthcare: parseInt(row['Healthcare']),
                other: parseInt(row['Other'])
              }
            };
            
            this.current_modal_months[year].months.splice(this.current_modal_months[year].months.indexOf(month), 1);
            
          } else {
            alert("The paycheck for " + row['Month'] + " " + row['Year'] + " can not be entered as the month is invalid")
          }
          
          

          
        }

        
        this.getNextYear();
      }

      target.value = '';


    }
  }


  add_year() : void {
    if (this.current_modal_year <= this.current_year) {
      const keyss = Object.keys(this.employee_details.salary);
      if (!keyss.includes(this.current_modal_year.toString())) {
        this.employee_details.salary[this.current_modal_year] = {
          months: {
            1: {
              link: "",
              details: {
                base: 0,
                lunch: 0,
                transport: 0,
                healthcare: 0,
                other: 0
              }
            }
          }
        };

        this.current_modal_months[this.current_modal_year] = {months: [2,3,4,5,6,7,8,9,10,11,12]};

        this.getNextYear();
      }
    }
  }

  delete_year(yearStr: string) : void {
    let year = parseInt(yearStr);

    if (Object.keys(this.employee_details.salary).length > 1) {
      let sure = confirm("Are you sure you want to delete the paycheck(s) for " + yearStr + "?");
      if (sure) {
        delete this.employee_details.salary[year];
        delete this.current_modal_months[yearStr];

        this.getNextYear();
      }
    } else {
      alert("There needs to be at least one year per employee.");
    }
  }

  add_month(year_num: string) : void {
    const month :number = parseInt((document.getElementById("months_"+year_num) as HTMLInputElement).value);

    this.employee_details.salary[parseInt(year_num)].months[month] = {
      link: "",
      details: {
        base: 0,
        lunch: 0,
        transport: 0,
        healthcare: 0,
        other: 0
      }
    };
    this.current_modal_months[year_num].months.splice(this.current_modal_months[year_num].months.indexOf(month), 1);
  }

  delete_month(year_num: string, month_num: string) : void {
    let month = parseInt(month_num);
    let year = parseInt(year_num);

    if (Object.keys(this.employee_details.salary[year].months).length > 1) {
      let sure = confirm("Are you sure you want to delete the paycheck for " + new Date(2000,month-1).toLocaleString('default', { month: 'long' }) + " " + year_num + "?");
      if (sure) {
        delete this.employee_details.salary[year].months[month];

        this.current_modal_months[year_num].months.push(month);
        this.current_modal_months[year_num].months.sort(function(a, b){return a - b});
      }
    } else {
      alert("There needs to be at least one month per year.");
    }
  }


  open(id?: string, active?: boolean): void {
    if (!this.modal) {
      this.modal = new Modal("#modal", {
        focus: false
      });
    }

    if (this.modal) {
      if (active) {this.global_active = true;} else {this.global_active= false;}

      var idx = -1;
      if (id != undefined && id.length > 0) {idx = this.findIDindex(id);} else {return;}

      this.employee_details = deep(this.employees[idx]);
      this.current_modal_idx = idx;
      let cur_year = this.current_year;
      this.current_modal_months = {[cur_year]: {months: [1,2]}};
      this.current_modal_year = cur_year;



      const keyss = Object.keys(this.employee_details.salary);
      for (let i = 0; i < keyss.length; i++) {
        const year: number = parseInt(keyss[i]);
        this.current_modal_months[year] = {months: [1,2,3,4,5,6,7,8,9,10,11,12]};

        const months = Object.keys(this.employee_details.salary[year].months);
        for(let i=0; i < months.length; i++) {
          const indx : number = this.current_modal_months[year].months.indexOf(parseInt(months[i]));
          if (indx >= 0) {
            this.current_modal_months[year].months.splice(indx, 1);
          }
        }
      }

      this.getNextYear();

      this.modal?.show();
    }
  }

  save() : void {
    if (this.checkNoneEmpty()) {
      this.modal?.hide();
      set(ref(this.db, 'employees/'+this.uids[this.current_modal_idx]+'/salary'), this.employee_details.salary).then(() => {
        this.resetModal();
      });
    } else {
      alert("Please fill in all the fields");
    }
  }

  activate(id?: string): void {
    let title = prompt("What job title do they need?");
    if (title && title.length >= 0) {
      this.changed_title = title;
      this.open(id, true);
    }
  }

  activate_save() : void {
    if (this.checkNoneEmpty()) {
      this.modal?.hide();
      this.employee_details.demographics.job_title = this.changed_title;
      this.employee_details.activated=true;

      set(ref(this.db, 'employees/'+this.uids[this.current_modal_idx]), this.cleanID(this.employee_details)).then(() => {
        
        set(ref(this.db, 'sick_days_history/'+this.uids[this.current_modal_idx]), [starter_history_item, starter_history_item_v]);

        this.resetModal();
      });
    } else {
      alert("Please fill in all the fields");
    }
  }


  resetModal(sick : boolean = false) {
    if (!sick) {
      this.current_modal_idx = -1;
      this.employee_details = sample_details;
      let cur_year = this.current_year;
      this.current_modal_months = {[cur_year]: {months: [1,2]}};
      this.current_modal_year = cur_year;
    } else {
      this.sick_days_modal?.hide();
      this.current_sick_days_modal_idx = -1;
      this.sick_days_change = 12;
      this.days_reason = "";
      this.days_history = [];
      this.vaca_or_sick = 'sick';
    }
    
  }





  month_other_note(year: string, month: string) {
    let note = this.employee_details.salary[parseInt(year)].months[parseInt(month)].notes;
    let answer = prompt("Enter your 'Other' notes", note);

    if (answer != null) {
      this.employee_details.salary[parseInt(year)].months[parseInt(month)].notes = answer;
    }
  }




  edit_title(id?: string) : void {
    var idx = -1;
    if (id != undefined && id.length > 0) {idx = this.findIDindex(id);} else {return;}

    let new_title = prompt("Change current job title", this.employees[idx].demographics.job_title);
    if (new_title && new_title?.length > 0) {
      set(ref(this.db, 'employees/'+this.uids[idx]+'/demographics/job_title'), new_title);
    }
  }




  edit_sick_days(id?: string): void {
    var idx = -1;
    if (id != undefined && id.length > 0) {idx = this.findIDindex(id);} else {return;}
    if (!this.sick_days_modal) {
      this.sick_days_modal = new Modal("#sick_days_modal", {
        focus: false
      });
    }

    if (this.sick_days_modal) {
      this.vaca_or_sick = 'sick';
      this.sick_days_change = this.employees[idx].sick_days;
      this.current_sick_days_modal_idx = idx;
      this.days_reason = "";

      this.sick_days_modal?.show();
    }
  }

  save_edit_sick_days() : void {
    let idx = this.current_sick_days_modal_idx;
    let uid = this.uids[idx];

    let old_days = this.vaca_or_sick == 'vacation' ? this.employees[idx].vacation_days : this.employees[idx].sick_days;
    let val = (document.getElementById("sick_days_change") as HTMLInputElement).value;

    if (val.length > 0 && !Number.isNaN(this.sick_days_change) && this.sick_days_change >= 0 && this.sick_days_change != old_days && this.days_reason.length > 0) {
      let link = '/'+this.vaca_or_sick+'_days';
    
      set(ref(this.db, 'employees/'+uid+link), this.sick_days_change);

      //upload reason to history
      let diff = this.sick_days_change - old_days;
      let verb = diff > 0 ? "Added " : "Removed ";
      diff = Math.abs(diff);

      let updated : HISTORY_ITEM = {
        date: new Date().toISOString().substring(0,10),
        event: verb + diff + ' '+this.vaca_or_sick+' day'+(diff==1?'':'s'),
        num_days: this.sick_days_change,
        type: this.vaca_or_sick == 'vacation' ? 'info_vacation' : 'info',
        approved: true,
        more_info: 'Reason: '+this.days_reason
      };


      get(ref(this.db, 'sick_days_history/'+uid)).then((snapshot) => {
        if (snapshot.exists()) {
          this.days_history = snapshot.val();

          this.days_history.push(updated);
          set(ref(this.db, 'sick_days_history/'+uid), this.days_history);
          
          this.resetModal(true);
        }
      }).catch((error) => {
        alert("Error, please contact admin");
        console.log(error.message);
      });
    }
  }

  view_sick_days(id?: string) : void {
    var idx = -1;
    if (id != undefined && id.length > 0) {idx = this.findIDindex(id);} else {return;}

    if (!this.days_history_modal) {
      this.days_history_modal = new Modal("#days_history_modal", {
        focus: false
      });
    }

    if (this.days_history_modal) {
      get(ref(this.db, 'sick_days_history/'+this.uids[idx])).then((snapshot) => {
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

  view_pending_days() : void {
    if (!this.pending_days_modal) {
      this.pending_days_modal = new Modal("#pending_days_modal", {
        focus: false
      });
    }

    if (this.pending_days_modal) {
      get(ref(this.db, 'pending_days')).then((snapshot) => {
        if (snapshot.exists()) {
          this.pending_days = snapshot.val();
        }
      }).catch((error) => {
        alert("Error, please contact admin");
        console.log(error.message);
      });

      this.pending_days_modal?.show();
    }
    
  }

  approve_day(approved: boolean, idx: number) {
    let day = Object.values(this.pending_days)[idx];
    let em_idx = this.uids.indexOf(day.uid);

    if ((day.type == 'sick' && this.employees[em_idx].sick_days > 0) ||
        (day.type == 'vacation' && this.employees[em_idx].vacation_days > 0))
    {
      let reason = "";
      if (approved) {
        if (day.type == 'sick') {
          this.employees[em_idx].sick_days = this.employees[em_idx].sick_days-1;
          set(ref(this.db, 'employees/'+day.uid+'/sick_days'), this.employees[em_idx].sick_days);
        } else if (day.type == 'vacation') {
          this.employees[em_idx].vacation_days = this.employees[em_idx].vacation_days-1;
          set(ref(this.db, 'employees/'+day.uid+'/vacation_days'), this.employees[em_idx].vacation_days);
        }
      } else {
        reason = " | Deny Reason: ";
        let reason_prompt : string = "";
        do {
          reason_prompt += prompt("Why are you denying this request?",  "");
        } while (reason_prompt?.length <= 0)
        reason += reason_prompt;
      }

      let verb = approved ? "Approved " : "Denied ";
      
      let updated : HISTORY_ITEM = {
        date: day.proposed_date,
        event: verb + (day.type == 'vacation' ? "vacation day" : "sick day"),
        num_days: day.type == 'vacation' ? this.employees[em_idx].vacation_days : this.employees[em_idx].sick_days,
        type: day.type == 'vacation' ? 'vacation' : 'sick',
        approved: approved,
        more_info: 'Request Date: '+day.request_date+' | '+verb+'on: '+new Date().toISOString().substring(0,10)+' | Request Reason: '+day.reason+reason
      };
      
      get(ref(this.db, 'sick_days_history/'+day.uid)).then((snapshot) => {
        if (snapshot.exists()) {
          this.days_history = snapshot.val();

          this.days_history.push(updated);
          set(ref(this.db, 'sick_days_history/'+day.uid), this.days_history);

          let quickidx = Object.keys(this.pending_days)[idx];
          remove(ref(this.db, 'pending_days/'+quickidx));

          let arr =this.employees[em_idx].pending_days.slice();
          arr.splice(arr.indexOf(quickidx), 1);
          set(ref(this.db, 'employees/'+day.uid+'/pending_days'), arr);
          
          this.pending_days_modal?.hide();
        }
      }).catch((error) => {
        alert("Error, please contact admin");
        console.log(error.message);
      });
    } else {
      alert("Please add more sick days to approve or deny");
    }
  }








  checkNoneEmpty() {
    let fin : boolean = true;
    const ins = document.getElementsByClassName("ins") as HTMLCollectionOf<HTMLInputElement>;
    for (let i = 0; i < ins.length; i++) {
      const inn = ins[i];
      if (!inn.value) {
        fin = false;
        break;
      }
    }

    return fin;
  }

  getNextYear() : void {
    const keyss = Object.keys(this.employee_details.salary)
    this.current_modal_year = this.current_year;
    while (keyss.includes(this.current_modal_year.toString())) {
      this.current_modal_year--;
    }
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

  total(monthStr: string, yearStr: string):number {
    let month:number = parseInt(monthStr);
    let year:number = parseInt(yearStr);

    let deets : { [index:string]: number} = this.employee_details.salary[year].months[month].details;
    let keys : string[] = Object.keys(deets);
    
    let result : number = 0;

    for (let i = 0; i < keys.length; i++) {
      result += deets[keys[i]];
    }

    return result;
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




 

  deactivate() {
    if (confirm("Are you sure you want to deactivate this user?")) {
      get(ref(this.db, 'pending_days')).then((snapshot) => {

        let y = this.current_modal_idx;
        
        if (snapshot.exists()) {
          let pending_days : PENDING_DAY = snapshot.val();
          
          if (pending_days) {
            var val = Object.values(pending_days);

            for (let i = 0; i < val.length; i++) {
              if (val[i].uid == this.uids[y]) {
                confirm("Please settle all pending days before deactivating")
                return;
              } else {
                break;
              }
            }
            
          }

        }

          this.employee_details.deactivated = true;
          this.modal?.hide();

          set(ref(this.db, 'employees/'+this.uids[y]), this.cleanID(this.employee_details)).then(() => {
            this.resetModal();

            let updated : HISTORY_ITEM = {
              date: new Date().toISOString().substring(0,10),
              event: 'Deactivated account',
              num_days: -1,
              type: 'info',
              approved: true,
              more_info: ''
            };
    
            get(ref(this.db, 'sick_days_history/'+this.uids[y])).then((snapshot) => {
              if (snapshot.exists()) {
                this.days_history = snapshot.val();
    
                this.days_history.push(updated);
                set(ref(this.db, 'sick_days_history/'+this.uids[y]), this.days_history);
              }
            }).catch((error) => {
              alert("Error, please contact admin");
              console.log(error.message);
            });

          });
        
      }).catch((error) => {
        alert("Error, please contact admin");
        console.log(error.message);
      });
    }
    
    
  }

  deactivate_pre(id? : string) {
    if (confirm("Are you sure you want to deactivate this user?")) {
      var idx = -1;
      if (id != undefined && id.length > 0) {idx = this.findIDindex(id);} else {return;}
      this.current_modal_idx = idx;
      this.employees[idx].deactivated = true;

      set(ref(this.db, 'employees/'+this.uids[idx]), this.cleanID(this.employees[idx])).then(() => {
            let updated : HISTORY_ITEM = {
              date: new Date().toISOString().substring(0,10),
              event: 'Deactivated account',
              num_days: -1,
              type: 'info',
              approved: true,
              more_info: ''
            };
    
            get(ref(this.db, 'sick_days_history/'+this.uids[idx])).then((snapshot) => {
              this.days_history = [];

              if (snapshot.exists()) {
                this.days_history = snapshot.val();
              }
    
              this.days_history.push(updated);
              set(ref(this.db, 'sick_days_history/'+this.uids[idx]), this.days_history);
              
            }).catch((error) => {
              alert("Error, please contact admin");
              console.log(error.message);
            });

          });
    }
  }

  reactivate(id? : string) {
    if (confirm("Are you sure you want to reactivate this user?")) {
      var idx = -1;
      if (id != undefined && id.length > 0) {idx = this.findIDindex(id);} else {return;}
        delete this.employees[idx].deactivated;

          this.modal?.hide();


          set(ref(this.db, 'employees/'+this.uids[idx]), this.cleanID(this.employees[idx])).then(() => {
            this.resetModal();

            let updated : HISTORY_ITEM = {
              date: new Date().toISOString().substring(0,10),
              event: 'Reactivated account',
              num_days: -1,
              type: 'info',
              approved: true,
              more_info: ''
            };
    
            get(ref(this.db, 'sick_days_history/'+this.uids[idx])).then((snapshot) => {
              if (snapshot.exists()) {
                this.days_history = snapshot.val();
    
                this.days_history.push(updated);
                set(ref(this.db, 'sick_days_history/'+this.uids[idx]), this.days_history);
              }
            }).catch((error) => {
              alert("Error, please contact admin");
              console.log(error.message);
            });

          });
        
      }
  }



  deleteAcc(id? : string) {
    if (confirm("Are you sure you want to delete this user? History & details will be saved")) {
      var idx = -1;
      if (id != undefined && id.length > 0) {idx = this.findIDindex(id);} else {return;}

        let details = deep(this.employees[idx]);
        delete details.ID;
        
        set(ref(this.db, 'deleted_employees/'+this.uids[idx]), details).then(() => {
          let updated : HISTORY_ITEM = {
            date: new Date().toISOString().substring(0,10),
            event: 'Deleted account',
            num_days: -1,
            type: 'info',
            approved: true,
            more_info: ''
          };
  
          get(ref(this.db, 'sick_days_history/'+this.uids[idx])).then((snapshot) => {
            if (snapshot.exists()) {
              this.days_history = snapshot.val();
  
              this.days_history.push(updated);
              set(ref(this.db, 'sick_days_history/'+this.uids[idx]), this.days_history);
              remove(ref(this.db, 'employees/'+this.uids[idx]));
            }
          }).catch((error) => {
            alert("Error, please contact admin");
            console.log(error.message);
          });

        });
    }
    
    
  }



  disable_days() {
    if (confirm("Are you sure you want to disable vacation and sick days for this user?")) {
      get(ref(this.db, 'pending_days')).then((snapshot) => {
        if (snapshot.exists()) {
          let pending_days = snapshot.val();
          
          if (pending_days) {
            confirm("Please settle all pending days before disabled")
          }

        } else {
          let sick = this.employees[this.current_sick_days_modal_idx].sick_days;
          let vacation = this.employees[this.current_sick_days_modal_idx].vacation_days;

          this.employees[this.current_sick_days_modal_idx].sick_days = -1;
          this.employees[this.current_sick_days_modal_idx].vacation_days = -1;
          this.sick_days_modal?.hide();
          let y = this.current_sick_days_modal_idx;

          set(ref(this.db, 'employees/'+this.uids[y]), this.cleanID(this.employees[this.current_sick_days_modal_idx])).then(() => {
            this.current_sick_days_modal_idx = -1;

            let updated1 : HISTORY_ITEM = {
              date: new Date().toISOString().substring(0,10),
              event: 'Disabled sick days',
              num_days: sick,
              type: 'info',
              approved: true,
              more_info: 'There were ' + sick + ' sick days left at time of disabling.'
            };

            let updated2 : HISTORY_ITEM = {
              date: new Date().toISOString().substring(0,10),
              event: 'Disabled vacation days',
              num_days: vacation,
              type: 'info_vacation',
              approved: true,
              more_info: 'There were ' + vacation + ' vacation days left at time of disabling.'
            };
    
            get(ref(this.db, 'sick_days_history/'+this.uids[y])).then((snapshot) => {
              if (snapshot.exists()) {
                this.days_history = snapshot.val();
    
                this.days_history.push(updated1);
                this.days_history.push(updated2);
                set(ref(this.db, 'sick_days_history/'+this.uids[y]), this.days_history);
              }
            }).catch((error) => {
              alert("Error, please contact admin");
              console.log(error.message);
            });

          });
        }
      }).catch((error) => {
        alert("Error, please contact admin");
        console.log(error.message);
      });
    }
    
    
  }



    label_update(event: Event, id?: string) {
      var idx = -1;
      if (id != undefined && id.length > 0) {idx = this.findIDindex(id);} else {return;}
      
      let val = (event.target as HTMLSelectElement).value;
      let i = parseInt(val);
      //console.log(i)
      i = i < 0 ? 0 : i;
      //console.log(i)
      this.employees[idx].demographics.label = i;
      set(ref(this.db, 'employees/'+this.uids[idx]+'/demographics/label'), i);
    }


  
sort () {
  let idxs : number[] = [];
  let emps : DETAILS[] = [];
  let uidds: string[] = [];

  for (let i = 1; i < this.labels.length; i++) {
    for (let j  = 0; j < this.employees.length; j++) {
      if (idxs.indexOf(j) > -1) {continue}
      if (this.employees[j].demographics.label == i) {
        emps.push(this.employees[j])
        idxs.push(j)
        uidds.push(this.uids[j])
      }
    }
  }

  for (let j  = 0; j < this.employees.length; j++) {
    if (idxs.indexOf(j) > -1) {continue}
    emps.push(this.employees[j])
    uidds.push(this.uids[j])
  }

  //console.log(this.employees)
  //console.log(emps)
  this.employees = emps;
  this.uids = uidds;
}

og : DETAILS[] = [];
backed_up : boolean = false;

filterlist : number[] = [...Array(this.labels.length).keys()];

filter () {
  this.filterlist = []

  let list = (document.getElementsByClassName("labels") as HTMLCollectionOf<HTMLInputElement>);

  

  for (let i = 0; i < list.length; i++) {
    if (list[i].checked) {
      this.filterlist.push(parseInt(list[i].value))
    }
  }

  /* if (this.backed_up) {
    this.employees = this.og;
  } else {
    this.og = this.employees;
    this.backed_up = true;
  } */
}

ngAfterViewInit () {
  //this.loaded2 = true;
}

loaded2 : boolean = false;
empys : DETAILS[] = []
organize () {
  
 if (this.loaded2) {
  this.filter(); }

  this.sort();
  
  let emps : DETAILS[] = [];

  
  for (let j = 0; j < this.employees.length; j++) {
    if (this.filterlist.indexOf(0) > -1 && this.employees[j].demographics.label == undefined) {
      emps.push(this.employees[j]);
    } else if (this.filterlist.indexOf(this.employees[j].demographics.label) > -1) {
      emps.push(this.employees[j]);
    }
  }

  //console.log(emps);
  //console.log(this.uids);
  
  return emps;

}








  

  logout() {
    setCookie("logged_in", "", -1);
    this.router.navigateByUrl("/admin-login");
  }

}


function deep<T>(value: T): T {
  if (typeof value !== 'object' || value === null) {
    return value
  }
  if (Array.isArray(value)) {
    return deepArray(value)
  }
  return deepObject(value)
 }

 function deepObject<T extends object>(source: T) {
  const result = {} as T;
  Object.keys(source).forEach((key) => {
    const value = source[key as keyof T]
    result[key as keyof T] = deep(value)
  }, {})
  return result as T
 }

 function deepArray<T extends any[]>(collection: T): any {
  return collection.map((value) => {
    return deep(value)
  })
 }

 function csvToJson(data : string, delimiter : string = ',') : {[index: string]: string;}[] {
  data = data.split(/\r?\n/).filter(line => line.trim() !== '').join('\n');
  const titles = data.slice(0, data.indexOf('\n')).split(delimiter);
  return data
    .slice(data.indexOf('\n') + 1)
    .split('\n')
    .map(v => {
      const values = v.split(delimiter);
      return titles.reduce(
        (obj : {[index:string]:string}, title, index) => ((obj[title] = values[index]), obj),
        {}
      );
    });
};




