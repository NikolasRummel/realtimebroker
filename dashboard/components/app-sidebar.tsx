"use client";

import * as React from "react";
import {
  Frame,
  SquareTerminal,
  Workflow,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSettings } from "@/components/nav-settings";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {getTopics} from "@/lib/api";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [topics, setTopics] = React.useState<string[]>([]);

  React.useEffect(() => {
    getTopics()
        .then((data) => {
          setTopics(data.topics);
        })
        .catch((error) => {
          console.error("Failed to fetch topics", error);
        });
  }, []);

  const navMain = [
    {
      title: "Topics",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: topics.map((topic) => ({
        title: topic,
        url: `/topics/${topic}`,
      })),
    },
  ];

  const data = {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    teams: [
      {
        name: "RealtimeBroker",
        logo: Workflow,
        plan: "v1.0",
      },
    ],
    projects: [
      {
        name: "Topic Settings",
        url: "#",
        icon: Frame,
      },
    ],
  };

  return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <TeamSwitcher teams={data.teams} />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={navMain} />
          <NavSettings settings={data.projects} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
  );
}
