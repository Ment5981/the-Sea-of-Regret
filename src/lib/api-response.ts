import { NextResponse } from "next/server";
import type { ApiError, ApiSuccess } from "@/types";

export function ok<T>(data: T, message = "ok", status = 200) {
  const body: ApiSuccess<T> = { code: 0, message, data };
  return NextResponse.json(body, { status });
}

export function fail(message: string, code = 1, status = 400) {
  const body: ApiError = { code, message, data: null };
  return NextResponse.json(body, { status });
}
