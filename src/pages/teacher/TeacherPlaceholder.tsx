import { TeacherShell } from "@/components/Teacher/TeacherShell";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";
import { Link } from "react-router-dom";

export function TeacherPlaceholder({ title, hint, link }: { title: string; hint?: string; link?: { to: string; label: string } }) {
  return (
    <TeacherShell title={title}>
      <Card className="rounded-2xl">
        <CardContent className="py-16 text-center">
          <Construction className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <div className="font-medium">{title}</div>
          <div className="text-sm text-muted-foreground mt-1">{hint || "Coming soon — full UI build in progress."}</div>
          {link && <Link to={link.to} className="text-sm text-primary mt-3 inline-block">{link.label}</Link>}
        </CardContent>
      </Card>
    </TeacherShell>
  );
}

export default TeacherPlaceholder;
