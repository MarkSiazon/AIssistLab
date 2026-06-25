import { APP_ROUTES } from "@/lib/routes/app-routes";

const appRouteExpressions = new Set(
  Object.keys(APP_ROUTES).map((key) => `APP_ROUTES.${key}`),
);

export function isAppRouteExpression(expression: string): boolean {
  return appRouteExpressions.has(expression);
}
