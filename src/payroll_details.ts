interface SALARY {
    [index: number]: {
        months: {
            [index: number]: {
                link: string,
                details: {
                    base: number,
                    lunch: number,
                    transport: number,
                    healthcare: number,
                    other: number
                },
                notes?: string
            }
        }
    }
};

export let LABELS = ['', 'Full Time',  'Part Time', 'Consultant', 'Intern'];

export interface DETAILS {
    activated : boolean,
    deactivated? : boolean,
    sick_days : number,
    vacation_days : number,
    pending_days : string[],
    ID?: string,
    demographics: {
        first_name: string,
        last_name: string,
        dob: string,
        job_title: string,
        label: number,
        extras?: {
          address: string,
          phone: string,
          emer_contact: string,
          emer_phone: string
        }
    },
    salary: SALARY
};

export const sample_details : DETAILS = {
    activated: false,
    // deactivated: false,
    sick_days: 12,
    vacation_days: 12,
    pending_days: [],
    demographics: {
      first_name: '',
      last_name: '',
      dob: "",
      job_title: '',
      label: 0
    },
    salary: {
      [new Date().getFullYear()]: {
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
      }
    }
  };


export interface HISTORY_ITEM {
  date : string,
  event : string,
  num_days : number,
  type : string,
  approved : boolean,
  more_info : string
}

export const starter_history_item : HISTORY_ITEM = {
  date : new Date().toISOString().substring(0,10),
  event : "Initial 12 number of sick days",
  num_days : 12,
  type : "info",
  approved : true,
  more_info : ""
}

export const starter_history_item_v : HISTORY_ITEM = {
  date : new Date().toISOString().substring(0,10),
  event : "Initial 12 number of vacation days",
  num_days : 12,
  type : "info_vacation",
  approved : true,
  more_info : ""
}

export interface PENDING_DAY {[index: string] : {
  proposed_date: string;
  reason: string;
  request_date: string;
  uid: string;
  name: string;
  type: string;
}}

export interface EMAIL_ITEM {
  sick_days : number,
  vacation_days : number,
  first_name: string,
  last_name: string,
  date : string,
  type : string,
  more_info : string,
  text? : string
}

export const starter_email_item : EMAIL_ITEM = {
  sick_days : 0,
  vacation_days : 0,
  first_name: 'No',
  last_name: 'Name',
  date : new Date(0).toISOString().substring(0,10),
  type : 'Error',
  more_info : 'There was an error with emailing request details'
}