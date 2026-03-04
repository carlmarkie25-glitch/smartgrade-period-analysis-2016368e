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
  greeting = "Good Morning",
  avatarUrl,
  initials = "JJ",
}: ProfileSummaryProps) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (studentPercentage / 100) * circumference;

  return (
    <div className="bg-gradient-to-br from-teal-50/80 to-emerald-50/60 rounded-2xl backdrop-blur-md border border-teal-200/30 p-8 shadow-lg">
      {/* Greeting */}
      <p className="text-xs font-semibold text-teal-600/70 uppercase tracking-wide mb-6">
        {greeting}
      </p>

      {/* Admin Info */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{adminName}</h2>
        <p className="text-sm font-medium text-teal-600/70">{role}</p>
      </div>

      {/* Circular Progress */}
      <div className="flex flex-col items-center">
        <div className="relative w-44 h-44 mb-6">
          {/* Background circle */}
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 160 160"
            style={{ width: "100%", height: "100%" }}
          >
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#e0f2f1"
              strokeWidth="4"
              opacity={0.5}
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 0.5s ease-out",
              }}
            />
            <defs>
              <linearGradient
                id="progressGradient"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={adminName}
                className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-md mb-2"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center text-white font-bold text-lg mb-2 border-3 border-white shadow-md">
                {initials}
              </div>
            )}
            <span className="text-3xl font-bold text-gray-900">
              {studentPercentage}%
            </span>
          </div>
        </div>

        {/* Label */}
        <p className="text-center">
          <span className="text-2xl font-bold text-gray-900">{totalStudents}</span>
          <span className="block text-sm font-medium text-teal-600/70 mt-1">
            Students
          </span>
        </p>
      </div>
    </div>
  );
};
