import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProblemDetail } from '../models/product.model';

/**
 * HTTP interceptor that normalises RFC 9457 ProblemDetail error responses
 * into a structured ProblemDetail object rethrown as the error value.
 */
export const problemDetailInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        const body = err.error as Partial<ProblemDetail> | null;
        const problem: ProblemDetail = {
          type: body?.type ?? 'about:blank',
          title: body?.title ?? err.statusText,
          status: body?.status ?? err.status,
          detail: body?.detail,
          instance: body?.instance,
          errors: body?.errors,
        };
        return throwError(() => problem);
      }
      return throwError(() => err);
    }),
  );
};
