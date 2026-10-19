import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

type MemberPath = "/inicio" | "/pessoas" | "/encontros";

/** Signed in → member destination; visitor → sign-up that returns to this page. */
export function MemberLink({ to, member, visitor, className, signup = true }: { to: MemberPath; member: ReactNode; visitor: ReactNode; className?: string; signup?: boolean }) {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (user) return <Link to={to} className={className}>{member}</Link>;
  return (
    <Link to="/auth" search={{ ...(signup ? { modo: "cadastro" as const } : {}), ...(path !== "/" ? { redirect: path } : {}) }} className={className}>
      {visitor}
    </Link>
  );
}

/** Sign-in link that brings the visitor back to the current page. */
export function useReturnSearch() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return path !== "/" ? { redirect: path } : {};
}
