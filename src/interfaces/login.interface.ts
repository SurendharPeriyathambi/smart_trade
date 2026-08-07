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
    id:number
}

export interface ForgotPassWordRequest{
    email: string
}
export interface verifyOTPRequest {
email: string;
  otp: number;
  trx_id: string;
}

export interface ChangePasswordRequest {
  email: string;
  password: string;
}

 export interface ForgotPasswordData {
  trx_id: string;
}
export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
 data:ForgotPasswordData       // backend returns this — needed for verify_otp
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}