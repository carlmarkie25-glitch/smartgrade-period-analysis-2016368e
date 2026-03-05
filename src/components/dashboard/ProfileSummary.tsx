interface ProfileSummaryProps {
  adminName?: string;
  role?: string;
  totalStudents?: number;
  studentPercentage?: number;
  greeting?: string;
  avatarUrl?: string;
  initials?: string;
}

export const ProfileSummary = ({
  adminName = "Dr. John Jacob",
  role = "School Principal",
  totalStudents = 784,
  studentPercentage = 92,
  greeting = "Good Morning!",
  avatarUrl,
  initials = "JJ",
}: ProfileSummaryProps) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (studentPercentage / 100) * circumference;

  return (
    <div className="bg-gradient-to-br from-[hsl(170,30%,97%)] to-[hsl(160,25%,94%)] rounded-2xl backdrop-blur-md border border-[hsl(170,30%,85%)]/30 p-4 shadow-sm flex flex-col items-center justify-center text-center">
      {/* Circular Progress with avatar */}
      <div className="relative w-[120px] h-[120px] mb-2">
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 120 120"
          style={{ width: "100%", height: "100%" }}
        >
          <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(170,30%,90%)" strokeWidth="3" opacity={0.5} />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="url(#profileGradient)"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
          />
          <defs>
            <linearGradient id="profileGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(170,60%,45%)" />
              <stop offset="100%" stopColor="hsl(185,70%,45%)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt={adminName} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm mb-0.5" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(170,50%,50%)] to-[hsl(160,50%,45%)] flex items-center justify-center text-white font-bold text-xs mb-0.5 border-2 border-white shadow-sm">
              {initials}
            </div>
          )}
          <span className="text-lg font-bold text-gray-900">{totalStudents}</span>
          <span className="text-[9px] font-medium text-gray-500">Students</span>
        </div>
      </div>

      {/* Greeting + Info */}
      <p className="text-[10px] font-medium text-gray-400 mb-0.5">{greeting}</p>
      <h3 className="text-sm font-bold text-gray-900">{adminName}</h3>
      <p className="text-[10px] font-medium text-[hsl(170,50%,40%)]">{role}</p>

      {/* Gender indicators */}
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[hsl(210,60%,55%)]" />
          <span className="text-[9px] text-gray-500">Male</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[hsl(330,50%,60%)]" />
          <span className="text-[9px] text-gray-500">Female</span>
        </div>
      </div>
    </div>
  );
};
