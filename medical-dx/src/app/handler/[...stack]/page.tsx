import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/lib/stackauth";

export default function Handler(props: any) {
  return <StackHandler fullPage app={stackServerApp} routeProps={props} />;
}