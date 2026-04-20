import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Search, Printer, Eye, Download } from "lucide-react";
import { StudentBiodataDialog } from "./StudentBiodataDialog";

interface StudentBiodata {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  photo_url: string | null;
  nationality: string | null;
  county: string | null;
  country: string | null;
  address: string | null;
  father_name: string | null;
  mother_name: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  student_id?: string | null;
  class_id?: string | null;
  department_id?: string | null;
  classes?: { name: string } | null;
  departments?: { name: string } | null;
  religion?: string | null;
}

export const UserBiodataManagementTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<StudentBiodata | null>(null);
  const [isBiodataDialogOpen, setIsBiodataDialogOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [downloadScope, setDownloadScope] = useState<"all" | "class" | "department">("all");
  const [downloadClassId, setDownloadClassId] = useState<string>("");
  const [downloadDeptId, setDownloadDeptId] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch only students for the biodata tab
  const { data: users = [], isLoading, error: queryError } = useQuery({
    queryKey: ["students-biodata-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, user_id, full_name, photo_url, gender, student_id, phone_number, date_of_birth, religion, nationality, county, country, address, father_name, mother_name, emergency_contact_name, emergency_contact_phone, class_id, department_id, classes(name), departments(name)")
        .order("full_name");

      if (error) throw error;

      const allUsers: StudentBiodata[] = (data || []).map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        full_name: s.full_name || "Unknown",
        email: "",
        phone_number: s.phone_number ?? null,
        date_of_birth: s.date_of_birth ?? null,
        gender: s.gender ?? null,
        photo_url: s.photo_url ?? null,
        nationality: s.nationality ?? null,
        county: s.county ?? null,
        country: s.country ?? null,
        address: s.address ?? null,
        father_name: s.father_name ?? null,
        mother_name: s.mother_name ?? null,
        emergency_contact_name: s.emergency_contact_name ?? null,
        emergency_contact_phone: s.emergency_contact_phone ?? null,
        student_id: s.student_id ?? null,
        class_id: s.class_id ?? null,
        department_id: s.department_id ?? null,
        classes: s.classes ?? null,
        departments: s.departments ?? null,
        religion: s.religion ?? null,
      }));

      return allUsers;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["biodata-classes-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("id, name").order("name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["biodata-departments-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("id, name").order("name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === "") {
      return users;
    }

    const term = searchTerm.toLowerCase().trim();
    
    return users.filter((user) => {
      const nameMatch = (user.full_name || "").toLowerCase().includes(term);
      const emailMatch = (user.email || "").toLowerCase().includes(term);
      const phoneMatch = (user.phone_number || "").toLowerCase().includes(term);
      const studentIdMatch = (user.student_id || "").toLowerCase().includes(term);
      
      return nameMatch || emailMatch || phoneMatch || studentIdMatch;
    });
  }, [users, searchTerm]);

  const handleViewBiodata = (user: StudentBiodata) => {
    setSelectedUser(user);
    setIsBiodataDialogOpen(true);
  };

  const getDownloadSubset = () => {
    if (downloadScope === "class" && downloadClassId) {
      return users.filter((u) => u.class_id === downloadClassId);
    }
    if (downloadScope === "department" && downloadDeptId) {
      return users.filter((u) => u.department_id === downloadDeptId);
    }
    return users;
  };

  const handleDownloadBiodata = () => {
    if (downloadScope === "class" && !downloadClassId) {
      toast({ title: "Select a class", variant: "destructive" });
      return;
    }
    if (downloadScope === "department" && !downloadDeptId) {
      toast({ title: "Select a department", variant: "destructive" });
      return;
    }

    const subset = getDownloadSubset();
    if (subset.length === 0) {
      toast({ title: "No students to export", variant: "destructive" });
      return;
    }

    const headers = [
      "Full Name", "Student ID", "Gender", "Class", "Department",
      "Date of Birth", "Religion", "Nationality", "Country", "County",
      "Address", "Phone", "Father Name", "Mother Name",
      "Emergency Contact", "Emergency Phone",
    ];

    const rows = subset.map((u) => [
      u.full_name, u.student_id || "N/A", u.gender || "N/A",
      u.classes?.name || "N/A", u.departments?.name || "N/A",
      u.date_of_birth || "N/A", u.religion || "N/A",
      u.nationality || "N/A", u.country || "N/A", u.county || "N/A",
      u.address || "N/A", u.phone_number || "N/A",
      u.father_name || "N/A", u.mother_name || "N/A",
      u.emergency_contact_name || "N/A", u.emergency_contact_phone || "N/A",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${(c ?? "").toString().replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const scopeLabel =
      downloadScope === "all" ? "all" :
      downloadScope === "class" ? `class-${classes.find((c: any) => c.id === downloadClassId)?.name || "class"}` :
      `dept-${departments.find((d: any) => d.id === downloadDeptId)?.name || "dept"}`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `students_biodata_${scopeLabel}_${new Date().toISOString().split("T")[0]}.csv`.replace(/\s+/g, "_");
    link.click();
    window.URL.revokeObjectURL(url);

    toast({ title: "Success", description: `Exported ${subset.length} student biodata record(s)` });
    setIsDownloadOpen(false);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Please allow pop-ups to print",
        variant: "destructive",
      });
      return;
    }

    const rows = filteredUsers.map((user) => `
      <tr>
        <td>${user.full_name}</td>
        <td>${user.student_id || "N/A"}</td>
        <td>${user.gender || "N/A"}</td>
        <td>${user.classes?.name || "N/A"}</td>
        <td>${user.date_of_birth || "N/A"}</td>
        <td>${user.religion || "N/A"}</td>
        <td>${user.country || "N/A"}</td>
        <td>${user.address || "N/A"}</td>
        <td>${user.father_name || "N/A"}</td>
        <td>${user.mother_name || "N/A"}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Student Biodata Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            h1 { text-align: center; color: #1f2937; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
            th { background-color: #f3f4f6; border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: 600; }
            td { border: 1px solid #d1d5db; padding: 6px 8px; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .print-timestamp { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Student Biodata Report</h1>
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Student ID</th>
                <th>Gender</th>
                <th>Class</th>
                <th>Date of Birth</th>
                <th>Religion</th>
                <th>Country</th>
                <th>Address</th>
                <th>Father Name</th>
                <th>Mother Name</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="print-timestamp">
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 250);
  };

  const handleDownloadCSV = () => {
    const headers = [
      "Full Name",
      "Email",
      "Student ID",
      "Phone",
      "Date of Birth",
      "Gender",
      "Nationality",
      "County",
      "Country",
      "Address",
      "Emergency Contact",
    ];

    const rows = filteredUsers.map((user) => [
      user.full_name,
      user.email,
      user.student_id || "N/A",
      user.phone_number || "N/A",
      user.date_of_birth || "N/A",
      user.gender || "N/A",
      user.nationality || "N/A",
      user.county || "N/A",
      user.country || "N/A",
      user.address || "N/A",
      user.emergency_contact_name || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell?.toString().replace(/"/g, '""') || ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `biodata_report_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Biodata exported as CSV successfully",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Biodata Management</CardTitle>
        <div className="mt-4 flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground">Search Students</label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setIsDownloadOpen(true)} className="gap-2">
            <Download className="h-4 w-4" />
            Download Biodata
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {queryError && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
              Error loading biodata: {(queryError as any)?.message || "Unknown error"}
            </div>
          )}
          
          <div className="rounded-lg border">
            <div ref={printRef}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(5)
                      .fill(null)
                      .map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-10 w-10 rounded-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-16" />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <div className="space-y-2">
                          <p>No students found in the system</p>
                          <p className="text-xs">Please ensure students have been created in the system</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <div className="space-y-2">
                          <p>No students found matching "{searchTerm}"</p>
                          <p className="text-xs">Try a different search term</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Avatar>
                            <AvatarImage src={user.photo_url || undefined} alt={user.full_name} />
                            <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.student_id || "N/A"}</TableCell>
                        <TableCell>{user.gender || "N/A"}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewBiodata(user)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {!isLoading && (
            <div className="text-sm text-muted-foreground">
              {searchTerm ? (
                <p>Showing {filteredUsers.length} of {users.length} students matching "{searchTerm}"</p>
              ) : (
                <p>Total students: {users.length}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <StudentBiodataDialog
        student={selectedUser as any}
        open={isBiodataDialogOpen}
        onOpenChange={setIsBiodataDialogOpen}
      />

      <Dialog open={isDownloadOpen} onOpenChange={setIsDownloadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Download Student Biodata</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">Choose scope</Label>
              <RadioGroup
                value={downloadScope}
                onValueChange={(v) => setDownloadScope(v as any)}
                className="mt-2 space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="scope-all" />
                  <Label htmlFor="scope-all" className="font-normal cursor-pointer">All students</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="class" id="scope-class" />
                  <Label htmlFor="scope-class" className="font-normal cursor-pointer">By class</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="department" id="scope-dept" />
                  <Label htmlFor="scope-dept" className="font-normal cursor-pointer">By department</Label>
                </div>
              </RadioGroup>
            </div>

            {downloadScope === "class" && (
              <div>
                <Label className="text-sm font-medium">Select class</Label>
                <Select value={downloadClassId} onValueChange={setDownloadClassId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a class..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {downloadScope === "department" && (
              <div>
                <Label className="text-sm font-medium">Select department</Label>
                <Select value={downloadDeptId} onValueChange={setDownloadDeptId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a department..." />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {getDownloadSubset().length} student record(s) will be exported as CSV.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDownloadOpen(false)}>Cancel</Button>
            <Button onClick={handleDownloadBiodata} className="gap-2">
              <Download className="h-4 w-4" /> Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
