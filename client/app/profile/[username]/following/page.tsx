"use client";

import { use } from "react";
import RelationshipList from "@/components/RelationshipList";

export default function FollowingPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  return <RelationshipList username={username} mode="following" />;
}
