import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, Building2 } from "lucide-react";

export default function DirectoryPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("profiles").select("*").order("wing").order("flat_number").then(({ data }) => {
      if (data) setProfiles(data);
    });
  }, []);

  const grouped = profiles.reduce((acc, p) => {
    const wing = p.wing || "Unassigned";
    if (!acc[wing]) acc[wing] = [];
    acc[wing].push(p);
    return acc;
  }, {} as Record<string, any[]>);

  const filtered = search
    ? profiles.filter((p) =>
        p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.flat_number?.toLowerCase().includes(search.toLowerCase()) ||
        p.wing?.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">Society Directory</h1>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name, wing, or flat..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <Card key={p.id} className="shadow-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                  {p.full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-medium">{p.full_name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.wing ? `Wing ${p.wing}, Flat ${p.flat_number}` : "No flat assigned"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        Object.entries(grouped).map(([wing, members]) => (
          <Card key={wing} className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Wing {wing}
                <Badge variant="outline" className="ml-2">{(members as any[]).length} residents</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(members as any[]).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-semibold flex-shrink-0">
                      {p.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{p.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">Flat {p.flat_number || "N/A"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
