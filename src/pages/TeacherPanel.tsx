import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { X, Settings2, ChevronDown, Users, UserPlus, Shield } from "lucide-react";
import { useUserManagement } from "@/hooks/useUserManagement";
import { TeacherAssignmentDialog } from "@/components/TeacherAssignmentDialog";
import { SponsorAssignmentDialog } from "@/components/SponsorAssignmentDialog";
import AppShell from "@/components/AppShell";

const UserCard = ({
  user, assignRole, removeRole, onOpenTeacherAssignment, onOpenSponsorAssignment, isTeacher,
}: {
  user: any; assignRole: any; removeRole: any;
  onOpenTeacherAssignment: (user: any) => void;
  onOpenSponsorAssignment: (user: any) => void;
  isTeacher: boolean;
}) => (
  <div className="flex items-center justify-between p-3 rounded-xl border border-[hsl(170,30%,90%)] bg-[hsl(170,20%,98%)] hover:bg-[hsl(170,25%,95%)] transition-colors">
    <div>
      <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
      <p className="text-[10px] text-gray-400">{user.email}</p>
      <div className="flex gap-1.5 mt-1.5 flex-wrap">
        {user.user_roles && user.user_roles.length > 0 ? (
          user.user_roles.map((ur: any) => (
            <span key={ur.role} className="text-[9px] bg-[hsl(170,40%,93%)] text-[hsl(170,50%,30%)] px-2 py-0.5 rounded-md flex items-center gap-1">
              {ur.role}
              <button onClick={() => removeRole.mutate({ userId: user.user_id, role: ur.role })} className="hover:bg-[hsl(0,50%,90%)] rounded-full p-0.5">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-[9px] text-gray-400">No roles assigned</span>
        )}
      </div>
    </div>
    <div className="flex gap-1.5">
      {isTeacher && (
        <Button variant="outline" size="sm" className="h-7 text-[10px] border-[hsl(170,30%,85%)] hover:bg-[hsl(170,25%,95%)]" onClick={() => onOpenTeacherAssignment(user)}>
          <Settings2 className="h-3 w-3 mr-1" />Classes
        </Button>
      )}
      {isTeacher && (
        <Button variant="outline" size="sm" className="h-7 text-[10px] border-[hsl(170,30%,85%)] hover:bg-[hsl(170,25%,95%)]" onClick={() => onOpenSponsorAssignment(user)}>
          <Shield className="h-3 w-3 mr-1" />Sponsor
        </Button>
      )}
      <Select onValueChange={(role) => assignRole.mutate({ userId: user.user_id, role })}>
        <SelectTrigger className="w-[110px] h-7 text-[10px]"><SelectValue placeholder="Add role" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="teacher">Teacher</SelectItem>
          <SelectItem value="student">Student</SelectItem>
          <SelectItem value="parent">Parent</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

const RoleGroup = ({
  title, icon: Icon, users, defaultOpen, assignRole, removeRole, onOpenTeacherAssignment, onOpenSponsorAssignment,
}: {
  title: string; icon: any; users: any[]; defaultOpen: boolean;
  assignRole: any; removeRole: any;
  onOpenTeacherAssignment: (user: any) => void;
  onOpenSponsorAssignment: (user: any) => void;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-xl bg-[hsl(170,20%,96%)] hover:bg-[hsl(170,25%,93%)] transition-colors">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Icon className="h-4 w-4 text-[hsl(170,50%,35%)]" />
          {title}
          <span className="text-[10px] font-normal text-gray-400">({users.length})</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        {users.length > 0 ? (
          users.map((user: any) => (
            <UserCard key={user.id} user={user} assignRole={assignRole} removeRole={removeRole}
              onOpenTeacherAssignment={onOpenTeacherAssignment} onOpenSponsorAssignment={onOpenSponsorAssignment}
              isTeacher={user.user_roles?.some((ur: any) => ur.role === "teacher")} />
          ))
        ) : (
          <p className="text-[10px] text-gray-400 pl-3">No users in this group.</p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

const TeacherPanel = () => {
  const { users, usersLoading, assignRole, removeRole } = useUserManagement();
  const [teacherAssignmentUser, setTeacherAssignmentUser] = useState<any>(null);
  const [sponsorAssignmentUser, setSponsorAssignmentUser] = useState<any>(null);

  const teachers = users?.filter((u) => u.user_roles?.some((ur: any) => ur.role === "teacher")) || [];
  const unassigned = users?.filter((u) => !u.user_roles || u.user_roles.length === 0) || [];

  return (
    <AppShell activeTab="teachers">
      <div className="py-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Teacher Management</h1>
          <p className="text-sm text-gray-500">Manage teacher users, class assignments, and sponsor assignments</p>
        </div>

        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">User & Role Management</h3>
            <span className="text-[10px] font-medium text-[hsl(170,50%,35%)]/70 px-2 py-0.5 bg-[hsl(170,40%,95%)] rounded-md">{users?.length || 0} Users</span>
          </div>
          {usersLoading ? (
            <p className="text-xs text-gray-400 py-6 text-center">Loading users...</p>
          ) : (
            <div className="space-y-3">
              <RoleGroup title="Teachers" icon={Users} users={teachers} defaultOpen={true} assignRole={assignRole} removeRole={removeRole} onOpenTeacherAssignment={setTeacherAssignmentUser} onOpenSponsorAssignment={setSponsorAssignmentUser} />
              {unassigned.length > 0 && (
                <RoleGroup title="Unassigned" icon={UserPlus} users={unassigned} defaultOpen={true} assignRole={assignRole} removeRole={removeRole} onOpenTeacherAssignment={setTeacherAssignmentUser} onOpenSponsorAssignment={setSponsorAssignmentUser} />
              )}
            </div>
          )}
        </div>

        <TeacherAssignmentDialog open={!!teacherAssignmentUser} onOpenChange={(open) => !open && setTeacherAssignmentUser(null)} teacher={teacherAssignmentUser} />
        <SponsorAssignmentDialog open={!!sponsorAssignmentUser} onOpenChange={(open) => !open && setSponsorAssignmentUser(null)} user={sponsorAssignmentUser} />
      </div>
    </AppShell>
  );
};

export default TeacherPanel;
