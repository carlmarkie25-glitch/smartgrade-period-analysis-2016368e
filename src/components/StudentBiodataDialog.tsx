import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Download, Printer } from "lucide-react";
import { useRef } from "react";

interface StudentBiodata {
  id: string;
  student_id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone_number: string | null;
  photo_url: string | null;
  nationality: string | null;
  ethnicity: string | null;
  county: string | null;
  country: string | null;
  religion: string | null;
  disability: string | null;
  health_issues: string | null;
  father_name: string | null;
  father_contact: string | null;
  mother_name: string | null;
  mother_contact: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  previous_school: string | null;
  previous_class: string | null;
  address: string | null;
  classes?: { name: string } | null;
  departments?: { name: string } | null;
}

interface StudentBiodataDialogProps {
  student: StudentBiodata | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StudentBiodataDialog = ({ student, open, onOpenChange }: StudentBiodataDialogProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!student) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student Biodata - ${student.full_name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .header h2 {
              margin: 10px 0 0;
              font-size: 18px;
              font-weight: normal;
              color: #666;
            }
            .photo-section {
              text-align: center;
              margin-bottom: 20px;
            }
            .photo-section img {
              width: 120px;
              height: 120px;
              border-radius: 50%;
              object-fit: cover;
              border: 3px solid #333;
            }
            .photo-placeholder {
              width: 120px;
              height: 120px;
              border-radius: 50%;
              background: #e0e0e0;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 36px;
              font-weight: bold;
              color: #666;
              border: 3px solid #333;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              background: #f0f0f0;
              padding: 8px 12px;
              margin-bottom: 15px;
              border-left: 4px solid #333;
            }
            .field-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px 30px;
            }
            .field {
              margin-bottom: 10px;
            }
            .field-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .field-value {
              font-size: 14px;
              font-weight: 500;
              border-bottom: 1px dotted #ccc;
              padding-bottom: 3px;
              min-height: 20px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
              display: flex;
              justify-content: space-between;
            }
            .signature-line {
              text-align: center;
              width: 200px;
            }
            .signature-line hr {
              border: none;
              border-top: 1px solid #333;
              margin-bottom: 5px;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>STUDENT BIODATA FORM</h1>
            <h2>Academic Record</h2>
          </div>
          
          <div class="photo-section">
            ${student.photo_url 
              ? `<img src="${student.photo_url}" alt="Student Photo" />`
              : `<div class="photo-placeholder">${student.full_name.split(' ').map(n => n[0]).join('')}</div>`
            }
          </div>

          <div class="section">
            <div class="section-title">Personal Information</div>
            <div class="field-grid">
              <div class="field">
                <div class="field-label">Student ID</div>
                <div class="field-value">${student.student_id}</div>
              </div>
              <div class="field">
                <div class="field-label">Full Name</div>
                <div class="field-value">${student.full_name}</div>
              </div>
              <div class="field">
                <div class="field-label">Date of Birth</div>
                <div class="field-value">${student.date_of_birth || '-'}</div>
              </div>
              <div class="field">
                <div class="field-label">Gender</div>
                <div class="field-value">${student.gender || '-'}</div>
              </div>
              <div class="field">
                <div class="field-label">Nationality</div>
                <div class="field-value">${student.nationality || '-'}</div>
              </div>
              <div class="field">
                <div class="field-label">Ethnicity</div>
                <div class="field-value">${student.ethnicity || '-'}</div>
              </div>
              <div class="field">
                <div class="field-label">Religion</div>
                <div class="field-value">${student.religion || '-'}</div>
              </div>
              <div class="field">
                <div class="field-label">Phone Number</div>
                <div class="field-value">${student.phone_number || '-'}</div>
              </div>
              <div class="field">
                <div class="field-label">Country</div>
                <div class="field-value">${student.country || '-'}</div>
              </div>
              <div class="field">
                <div class="field-label">County/State</div>
                <div class="field-value">${student.county || '-'}</div>
              </div>
            </div>
            <div class="field" style="margin-top: 10px;">
              <div class="field-label">Address</div>
              <div class="field-value">${student.address || '-'}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Academic Information</div>
            <div class="field-grid">
              <div class="field">
                <div class="field-label">Current Class</div>
                <div class="field-value">${student.classes?.name || '-'}</div>
              </div>
              <div class="field">
                <div class="field-label">Department</div>
                <div class="field-value">${student.departments?.name || '-'}</div>
              </div>
              <div class="field">
                <div class="field-label">Previous School</div>
                <div class="field-value">${student.previous_school || '-'}</div>
              </div>
              <div class="field">
                <div class="field-label">Class in Previous School</div>
                <div class="field-value">${student.previous_class || '-'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Parent/Guardian Information</div>
            <div class="field-grid">
              <div class="field">
                <div class="field-label">Father's Name</div>
                <div class="field-value">${student.father_name || '-'}</div>
              </div>
              <div class="field">
                <div class="field-label">Father's Contact</div>
                <div class="field-value">${student.father_contact || '-'}</div>
              </div>
              <div class="field">
                <div class="field-label">Mother's Name</div>
                <div class="field-value">${student.mother_name || '-'}</div>
              </div>
              <div class="field">
                <div class="field-label">Mother's Contact</div>
                <div class="field-value">${student.mother_contact || '-'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Emergency Contact</div>
            <div class="field-grid">
              <div class="field">
                <div class="field-label">Contact Name</div>
                <div class="field-value">${student.emergency_contact_name || '-'}</div>
              </div>
              <div class="field">
                <div class="field-label">Phone Number</div>
                <div class="field-value">${student.emergency_contact_phone || '-'}</div>
              </div>
              <div class="field">
                <div class="field-label">Relationship to Student</div>
                <div class="field-value">${student.emergency_contact_relationship || '-'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Health Information</div>
            <div class="field-grid">
              <div class="field">
                <div class="field-label">Disability</div>
                <div class="field-value">${student.disability || 'None'}</div>
              </div>
              <div class="field">
                <div class="field-label">Health Issues</div>
                <div class="field-value">${student.health_issues || 'None'}</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="signature-line">
              <hr />
              <div>Parent/Guardian Signature</div>
            </div>
            <div class="signature-line">
              <hr />
              <div>Date</div>
            </div>
            <div class="signature-line">
              <hr />
              <div>School Official</div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownload = () => {
    const biodataText = `
STUDENT BIODATA
================

PERSONAL INFORMATION
--------------------
Student ID: ${student.student_id}
Full Name: ${student.full_name}
Date of Birth: ${student.date_of_birth || '-'}
Gender: ${student.gender || '-'}
Nationality: ${student.nationality || '-'}
Ethnicity: ${student.ethnicity || '-'}
Religion: ${student.religion || '-'}
Phone Number: ${student.phone_number || '-'}
Country: ${student.country || '-'}
County/State: ${student.county || '-'}
Address: ${student.address || '-'}

ACADEMIC INFORMATION
--------------------
Current Class: ${student.classes?.name || '-'}
Department: ${student.departments?.name || '-'}
Previous School: ${student.previous_school || '-'}
Class in Previous School: ${student.previous_class || '-'}

PARENT/GUARDIAN INFORMATION
---------------------------
Father's Name: ${student.father_name || '-'}
Father's Contact: ${student.father_contact || '-'}
Mother's Name: ${student.mother_name || '-'}
Mother's Contact: ${student.mother_contact || '-'}

EMERGENCY CONTACT
-----------------
Contact Name: ${student.emergency_contact_name || '-'}
Phone Number: ${student.emergency_contact_phone || '-'}
Relationship: ${student.emergency_contact_relationship || '-'}

HEALTH INFORMATION
------------------
Disability: ${student.disability || 'None'}
Health Issues: ${student.health_issues || 'None'}
`.trim();

    const blob = new Blob([biodataText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biodata_${student.student_id}_${student.full_name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const InfoField = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium">{value || '-'}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Student Biodata</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div ref={printRef} className="space-y-6 pt-4">
          {/* Photo and Basic Info */}
          <div className="flex items-start gap-6 pb-4 border-b">
            <Avatar className="h-24 w-24">
              <AvatarImage src={student.photo_url || ""} />
              <AvatarFallback className="text-2xl">
                {student.full_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{student.full_name}</h2>
              <p className="text-muted-foreground">Student ID: {student.student_id}</p>
              <div className="flex gap-4 mt-2">
                <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                  {student.classes?.name || 'No Class'}
                </span>
                <span className="text-sm bg-secondary text-secondary-foreground px-2 py-1 rounded">
                  {student.departments?.name || 'No Department'}
                </span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="font-semibold mb-3 text-primary">Personal Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoField label="Date of Birth" value={student.date_of_birth} />
              <InfoField label="Gender" value={student.gender} />
              <InfoField label="Nationality" value={student.nationality} />
              <InfoField label="Ethnicity" value={student.ethnicity} />
              <InfoField label="Religion" value={student.religion} />
              <InfoField label="Phone Number" value={student.phone_number} />
              <InfoField label="Country" value={student.country} />
              <InfoField label="County/State" value={student.county} />
            </div>
            <div className="mt-4">
              <InfoField label="Address" value={student.address} />
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h3 className="font-semibold mb-3 text-primary">Academic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Previous School" value={student.previous_school} />
              <InfoField label="Class in Previous School" value={student.previous_class} />
            </div>
          </div>

          {/* Parent/Guardian Information */}
          <div>
            <h3 className="font-semibold mb-3 text-primary">Parent/Guardian Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Father's Name" value={student.father_name} />
              <InfoField label="Father's Contact" value={student.father_contact} />
              <InfoField label="Mother's Name" value={student.mother_name} />
              <InfoField label="Mother's Contact" value={student.mother_contact} />
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="font-semibold mb-3 text-primary">Emergency Contact</h3>
            <div className="grid grid-cols-3 gap-4">
              <InfoField label="Contact Name" value={student.emergency_contact_name} />
              <InfoField label="Phone Number" value={student.emergency_contact_phone} />
              <InfoField label="Relationship" value={student.emergency_contact_relationship} />
            </div>
          </div>

          {/* Health Information */}
          <div>
            <h3 className="font-semibold mb-3 text-primary">Health Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Disability" value={student.disability || 'None'} />
              <InfoField label="Health Issues" value={student.health_issues || 'None'} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
