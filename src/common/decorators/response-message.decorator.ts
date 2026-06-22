import { SetMetadata } from '@nestjs/common';
import { RESPONSE_MESSAGE_KEY } from '../interceptors/response.interceptor';

/** Override the default "Success" message in the response envelope. */
export const ResponseMessage = (message: string) => SetMetadata(RESPONSE_MESSAGE_KEY, message);
