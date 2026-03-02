export interface LoginResponce <T>{
    status:boolean;
    message: string;
    data: T;
}

export interface Datas{
    access_token:string;
    refresh_token:string;
    user_details:UserDetails;
}

export interface UserDetails{
    email:string;
    password:string;
    login_ip:string;
}