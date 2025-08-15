
interface WelcomeHeaderProps {
  userName?: string | null;
  majorName?: string | null;
  graduationYear?: number | null;
}

export function WelcomeHeader({ userName, majorName, graduationYear }: WelcomeHeaderProps) {
  const firstName = userName?.split(' ')[0] || 'Student';
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Welcome back, {firstName}!</h1>
      <p className="text-muted-foreground">
        {majorName || "Undeclared Major"} • Class of {graduationYear || "TBD"}
      </p>
    </div>
  );
}