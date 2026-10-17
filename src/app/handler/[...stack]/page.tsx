import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/lib/stack/server";

type HandlerPageProps = {
  params: Promise<{ stack?: string[] }>;
  searchParams: Promise<Record<string, string>>;
};

export default function Handler(props: HandlerPageProps) {
  return <StackHandler fullPage app={stackServerApp} {...props} />;
}
