import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/** Marks a route as not requiring authentication (skips AuthGuard/OrgGuard). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
