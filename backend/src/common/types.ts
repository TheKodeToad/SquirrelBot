import { rawTransform } from "valibot";

export type RawTransformContext<In, Out> = Parameters<Parameters<typeof rawTransform<In, Out>>[0]>[0];
