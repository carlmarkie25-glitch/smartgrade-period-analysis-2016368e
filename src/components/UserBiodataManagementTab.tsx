import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Search, Printer, Eye, Download } from "lucide-react";
import { StudentBiodataDialog } from "./StudentBiodataDialog";

interface UserBiodata {
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
  classes?: { name: string } | null;
  departments?: { name: string } | null;
}

export const UserBiodataManagementTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserBiodata | null>(null);
  const [isBiodataDialogOpen, setIsBiodataDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch all users with their biodata
  const { data: users = [], isLoading, error: queryError } = useQuery({
    queryKey: ["all-users-biodata"],
    queryFn: async () => {
      try {
        let allUsers: UserBiodata[] = [];

        // Fetch students (they have biodata)
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("*");

        if (studentsError) {
          console.error("Error fetching students:", studentsError);
        } else if (studentsData && Array.isArray(studentsData)) {
          console.log("Students fetched:", studentsData.length);
          allUsers = studentsData.map((student: any) => ({
            id: student.id,
            user_id: student.user_id,
            full_name: student.full_name || "Unknown",
            email: student.email || "",
            phone_number: student.phone_number,
            date_of_birth: student.date_of_birth,
            gender: student.gender,
            photo_url: student.photo_url,
            nationality: student.nationality,
            county: student.county,
            country: student.country,
            address: student.address,
            father_name: student.father_name,
            mother_name: student.mother_name,
            emergency_contact_name: student.emergency_contact_name,
            emergency_contact_phone: student.emergency_contact_phone,
            student_id: student.student_id,
          })) as UserBiodata[];
        }

        // Fetch profiles for additional users (teachers/staff)
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .order("full_name");

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
        } else if (profilesData && Array.isArray(profilesData)) {
          console.log("Profiles fetched:", profilesData.length);
          // Filter out users that are already in the students list
          const studentUserIds = new Set(allUsers.map(s => s.user_id));
          const additionalUsers = profilesData
            .filter((profile: any) => !studentUserIds.has(profile.id))
            .map((profile: any) => ({
              id: profile.id,
              user_id: profile.id,
              full_name: profile.full_name || "Unknown",
              email: profile.email || "",
              phone_number: profile.phone_number || null,
              date_of_birth: null,
              gender: null,
              photo_url: null,
              nationality: null,
              county: null,
              country: null,
              address: null,
              father_name: null,
              mother_name: null,
              emergency_contact_name: null,
              emergency_contact_phone: null,
            }));

          allUsers = [...allUsers, ...additionalUsers];
        }

        console.log("Total users loaded:", allUsers.length);
        return allUsers;
      } catch (error) {
        console.error("Error in biodata query:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
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

  const handleViewBiodata = (user: UserBiodata) => {
    setSelectedUser(user as any);
    setIsBiodataDialogOpen(true);
  };

  const handlePrint = () => {
    if (!printRef.current) {
      toast({
        title: "Error",
        description: "Unable to print biodata list",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Please allow pop-ups to print",
        variant: "destructive",
      });
      return;
    }

    const printContent = printRef.current.innerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>User Biodata Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            h1 {
              text-align: center;
              color: #1f2937;
              margin-bottom: 30px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background-color: #f3f4f6;
              border: 1px solid #d1d5db;
              padding: 12px;
              text-align: left;
              font-weight: 600;
            }
            td {
              border: 1px solid #d1d5db;
              padding: 10px;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .print-timestamp {
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <h1>User Biodata Report</h1>
          ${printContent}
          <div class="print-timestamp">
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
        <CardTitle>User Biodata Management</CardTitle>
        <div className="mt-4 flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground">Search Users</label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or student ID..."
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
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {queryError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
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
                    <TableHead>Email</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Date of Birth</TableHead>
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
                            <Skeleton className="h-4 w-40" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-16" />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        <div className="space-y-2">
                          <p>No users found in the system</p>
                          <p className="text-xs">Please ensure students have been created in the system</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        <div className="space-y-2">
                          <p>No users found matching "{searchTerm}"</p>
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
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.student_id || "N/A"}</TableCell>
                        <TableCell>{user.phone_number || "N/A"}</TableCell>
                        <TableCell>{user.gender || "N/A"}</TableCell>
                        <TableCell>{user.date_of_birth || "N/A"}</TableCell>
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
                <p>Showing {filteredUsers.length} of {users.length} users matching "{searchTerm}"</p>
              ) : (
                <p>Total users: {users.length}</p>
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
    </Card>
  );
};
