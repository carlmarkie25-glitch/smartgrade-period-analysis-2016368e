import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { Calendar } from "lucide-react";

interface Props {
  value?: string;
  onChange: (yearId: string) => void;
  className?: string;
  /** Limit the choices to a list of allowed year ids (e.g., years a student has enrollments in). */
  allowedYearIds?: string[];
  placeholder?: string;
}

const AcademicYearSelector = ({ value, onChange, className, allowedYearIds, placeholder = "Select year" }: Props) => {
  const { data: years } = useAcademicYears();
  const list = (years ?? []).filter((y) => !allowedYearIds || allowedYearIds.includes(y.id));

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {list.map((y) => (
          <SelectItem key={y.id} value={y.id}>
            {y.year_name}{y.is_current ? " (Current)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default AcademicYearSelector;
