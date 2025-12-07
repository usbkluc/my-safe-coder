import { Shield, ShieldCheck } from "lucide-react";

interface SafeModeIndicatorProps {
  isActive: boolean;
}

const SafeModeIndicator = ({ isActive }: SafeModeIndicatorProps) => {
  if (!isActive) return null;

  return (
    <div className="safe-badge animate-pulse-glow">
      <ShieldCheck className="w-4 h-4" />
      <span>Bezpečný režim</span>
    </div>
  );
};

export default SafeModeIndicator;
