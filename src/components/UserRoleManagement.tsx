import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { X, Settings2, ChevronDown, GraduationCap, Users, UserPlus } from "lucide-react";
import { useState } from "react";

interface UserRoleManagementProps {
  users: any[] | undefined;
  usersLoading: boolean;
  assignRole: any;
  removeRole: any;
  onOpenTeacherAssignment: (user: any) => void;
}

const UserCard = ({
  user,
  assignRole,
  removeRole,
  onOpenTeacherAssignment,
  isTeacher,
}: {
  user: any;
  assignRole: any;
  removeRole: any;
  onOpenTeacherAssignment: (user: any) => void;
  isTeacher: boolean;
}) => (
  <div className="flex items-center justify-between p-4 border rounded-lg">
    <div>
      <p className="font-medium">{user.full_name}</p>
      <p className="text-sm text-muted-foreground">{user.email}</p>
      <div className="flex gap-2 mt-2 flex-wrap">
        {user.user_roles && user.user_roles.length > 0 ? (
          user.user_roles.map((ur: any) => (
            <span key={ur.role} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded flex items-center gap-1">
              {ur.role}
              <button
                onClick={() => removeRole.mutate({ userId: user.user_id, role: ur.role })}
                className="hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">No roles assigned</span>
        )}
      </div>
    </div>
    <div className="flex gap-2">
      {isTeacher && (
        <Button variant="outline" size="sm" onClick={() => onOpenTeacherAssignment(user)}>
          <Settings2 className="h-4 w-4 mr-1" />
          Assign Classes
        </Button>
      )}
      <Select onValueChange={(role) => assignRole.mutate({ userId: user.user_id, role })}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Add role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="teacher">Teacher</SelectItem>
          <SelectItem value="student">Student</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

const RoleGroup = ({
  title,
  icon: Icon,
  users,
  defaultOpen,
  assignRole,
  removeRole,
  onOpenTeacherAssignment,
}: {
  title: string;
  icon: any;
  users: any[];
  defaultOpen: boolean;
  assignRole: any;
  removeRole: any;
  onOpenTeacherAssignment: (user: any) => void;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
        <div className="flex items-center gap-2 font-semibold">
          <Icon className="h-5 w-5 text-primary" />
          {title}
          <span className="text-xs font-normal text-muted-foreground">({users.length})</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-3">
        {users.length > 0 ? (
          users.map((user: any) => (
            <UserCard
              key={user.id}
              user={user}
              assignRole={assignRole}
              removeRole={removeRole}
              onOpenTeacherAssignment={onOpenTeacherAssignment}
              isTeacher={user.user_roles?.some((ur: any) => ur.role === "teacher")}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground pl-3">No users in this group.</p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export const UserRoleManagement = ({
  users,
  usersLoading,
  assignRole,
  removeRole,
  onOpenTeacherAssignment,
}: UserRoleManagementProps) => {
  if (usersLoading) return <Card><CardContent className="p-6"><p>Loading users...</p></CardContent></Card>;
  if (!users || users.length === 0)
    return <Card><CardContent className="p-6"><p className="text-muted-foreground">No users found. Create accounts via the Auth page first.</p></CardContent></Card>;

  const teachers = users.filter((u) => u.user_roles?.some((ur: any) => ur.role === "teacher"));
  const students = users.filter((u) => u.user_roles?.some((ur: any) => ur.role === "student"));
  const admins = users.filter((u) => u.user_roles?.some((ur: any) => ur.role === "admin") && !u.user_roles?.some((ur: any) => ur.role === "teacher"));
  const unassigned = users.filter((u) => !u.user_roles || u.user_roles.length === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User & Role Management</CardTitle>
        <CardDescription>Manage user roles grouped by category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RoleGroup title="Teachers" icon={Users} users={teachers} defaultOpen={true} assignRole={assignRole} removeRole={removeRole} onOpenTeacherAssignment={onOpenTeacherAssignment} />
        <RoleGroup title="Students" icon={GraduationCap} users={students} defaultOpen={false} assignRole={assignRole} removeRole={removeRole} onOpenTeacherAssignment={onOpenTeacherAssignment} />
        <RoleGroup title="Admins" icon={Settings2} users={admins} defaultOpen={false} assignRole={assignRole} removeRole={removeRole} onOpenTeacherAssignment={onOpenTeacherAssignment} />
        {unassigned.length > 0 && (
          <RoleGroup title="Unassigned" icon={UserPlus} users={unassigned} defaultOpen={true} assignRole={assignRole} removeRole={removeRole} onOpenTeacherAssignment={onOpenTeacherAssignment} />
        )}
      </CardContent>
    </Card>
  );
};
