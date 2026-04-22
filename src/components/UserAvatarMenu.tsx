import { useRef, useState, type ChangeEvent } from "react";
import { ChevronDown, Loader2, LogOut, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserAvatarMenuProps {
  userName: string;
  avatarUrl?: string | null;
  className?: string;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

export const UserAvatarMenu = ({ userName, avatarUrl, className }: UserAvatarMenuProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const { profile, user, signOut, updateProfileAvatar } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      await updateProfileAvatar(file);
      toast({ title: "Profile photo updated" });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error?.message ?? "Could not update profile photo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`flex items-center gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-accent ${className ?? ""}`}
            disabled={uploading}
          >
            <p className="max-w-40 truncate text-xs font-semibold text-foreground">{userName}</p>
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={avatarUrl ?? undefined} alt={userName} className="object-cover" />
              <AvatarFallback>{getInitials(userName)}</AvatarFallback>
            </Avatar>
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="space-y-1">
            <div className="truncate">{userName}</div>
            <div className="truncate text-xs font-normal text-muted-foreground">{profile?.email ?? user?.email ?? ""}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload photo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default UserAvatarMenu;