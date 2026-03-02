import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, switchMap, throwError, finalize } from 'rxjs';
import { StorageEngine } from './storage_engine';
import { LoaderService } from './loader.service';


let isRefreshing = false;

export const InterCeptorEngine: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageEngine);
  const http = inject(HttpClient);
 

  const isProtected = req.headers.get('x-protected') === 'true';

  let modifiedReq = req.clone({
    headers: req.headers.delete('x-protected')
  });

  modifiedReq = modifiedReq.clone({
    setHeaders: {
      'Apikey': 'uB0cD4oO2VmUzexweYg2Gc2FJY7GHVdGehDrbald4j4='
    }
  });

  if (isProtected) {
    const token = storage.getAccessToken();
    if (token) {
      modifiedReq = modifiedReq.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }



  return next(modifiedReq).pipe(

    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isProtected && !isRefreshing) {
        isRefreshing = true;
        const refreshToken = storage.getRefreshToken();

        return http.post<any>('/auth/refresh', { refresh_token: refreshToken }).pipe(
          switchMap(res => {
            isRefreshing = false;
            storage.setAccessToken(res.access_token);
            storage.setRefreshToken(res.refresh_token);

            const retryReq = modifiedReq.clone({
              setHeaders: {
                Authorization: `Bearer ${res.access_token}`,
                Apikey: 'uB0cD4oO2VmUzexweYg2Gc2FJY7GHVdGehDrbald4j4='
              }
            });

            return next(retryReq);
          }),
          catchError(err => {
            isRefreshing = false;
            storage.clear();
            return throwError(() => err);
          })
        );
      }

      return throwError(() => error);
    })
  );
};