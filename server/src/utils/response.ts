import { Response } from 'express';

export interface ApiSuccessEnvelope<T = any> {
  status: 'success';
  message: string;
  data: T;
}

export interface ApiErrorEnvelope {
  status: 'error';
  error: string;
  code: string;
  message: string;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Request processed successfully',
  statusCode = 200
) {
  const envelope: ApiSuccessEnvelope<T> = {
    status: 'success',
    message,
    data,
  };
  return res.status(statusCode).json(envelope);
}

export function sendError(
  res: Response,
  errorMessage: string,
  statusCode = 400,
  errorCode = 'BAD_REQUEST'
) {
  const envelope: ApiErrorEnvelope = {
    status: 'error',
    error: errorMessage,
    code: errorCode,
    message: errorMessage,
  };
  return res.status(statusCode).json(envelope);
}
