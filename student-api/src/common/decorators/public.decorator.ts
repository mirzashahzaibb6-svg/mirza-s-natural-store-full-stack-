import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants';

/** Marks a route as reachable without a JWT. Everything else is deny-by-default. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
