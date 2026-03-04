import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  useAcademicEvents,
  useCreateAcademicEvent,
  useUpdateAcademicEvent,
  useDeleteAcademicEvent,
  EVENT_TYPES,
  type AcademicEvent,
} from "@/hooks/useAcademicEvents";
import { useAuth } from "@/contexts/AuthContext";

const emptyForm = {
  title: "",
  description: "",
  event_type: "other",
  start_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
  color: "#64748b",
};

export const AcademicEventManagementTab = () => {
  const { user } = useAuth();
  const { data: events, isLoading } = useAcademicEvents();
  const createEvent = useCreateAcademicEvent();
  const updateEvent = useUpdateAcademicEvent();
  const deleteEvent = useDeleteAcademicEvent();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const handleTypeChange = (val: string) => {
    const t = EVENT_TYPES.find((e) => e.value === val);
    setForm({ ...form, event_type: val, color: t?.color || form.color });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsOpen(true);
  };

  const openEdit = (event: AcademicEvent) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description || "",
      event_type: event.event_type,
      start_date: event.start_date,
      end_date: event.end_date || "",
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      color: event.color || "#64748b",
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      title: form.title,
      description: form.description || null,
      event_type: form.event_type,
      start_date: form.start_date,
      end_date: form.end_date || null,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      color: form.color,
      created_by: user?.id || null,
    };

    if (editingId) {
      await updateEvent.mutateAsync({ id: editingId, ...payload });
    } else {
      await createEvent.mutateAsync(payload as any);
    }
    setIsOpen(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this event?")) return;
    deleteEvent.mutate(id);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Academic Calendar Events</CardTitle>
          <CardDescription>Manage academic year events, activities, and schedules</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Event" : "Create Event"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Event Type</Label>
                  <Select value={form.event_type} onValueChange={handleTypeChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-10 rounded border cursor-pointer" />
                    <span className="text-sm text-muted-foreground">{form.color}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time (optional)</Label>
                  <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div>
                  <Label>End Time (optional)</Label>
                  <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                </div>
              </div>
              <Button onClick={handleSave} disabled={!form.title || !form.start_date} className="w-full">
                {editingId ? "Update Event" : "Create Event"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading events...</p>
        ) : !events || events.length === 0 ? (
          <p className="text-muted-foreground">No events yet. Create one to get started.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.color || "#64748b" }} />
                      <div>
                        <p className="font-medium">{event.title}</p>
                        {event.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{event.description}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{EVENT_TYPES.find((t) => t.value === event.event_type)?.label || event.event_type}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(event.start_date), "MMM d, yyyy")}</TableCell>
                  <TableCell>{event.end_date ? format(new Date(event.end_date), "MMM d, yyyy") : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(event)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
