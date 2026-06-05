"use client";

import {
  AlertTriangle,
  Award,
  BarChart2,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Coins,
  Globe,
  LayoutDashboard,
  MapPin,
  Monitor,
  Package,
  Settings,
  Star,
  TrendingUp,
  User,
  Users,
  type LucideProps,
} from "lucide-react";
import type { IconName } from "@/lib/icons";

const registry = {
  alertTriangle: AlertTriangle,
  award: Award,
  globe: Globe,
  users: Users,
  monitor: Monitor,
  bookOpen: BookOpen,
  mapPin: MapPin,
  calendar: Calendar,
  coins: Coins,
  package: Package,
  clock: Clock,
  checkCircle: CheckCircle,
  layoutDashboard: LayoutDashboard,
  user: User,
  settings: Settings,
  book: BookOpen,
  star: Star,
  trendingUp: TrendingUp,
  barChart: BarChart2,
} satisfies Record<IconName, React.ComponentType<LucideProps>>;

export function AppIcon({
  name,
  className,
  strokeWidth = 1.75,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = registry[name];
  return <Icon className={className} strokeWidth={strokeWidth} />;
}
