export interface SignInResponce<T>{
    status:boolean;
    message:string;
    data:T;
}

export interface signData{
    name:string,
    email:string,
    mobile:string,
    password:string
}