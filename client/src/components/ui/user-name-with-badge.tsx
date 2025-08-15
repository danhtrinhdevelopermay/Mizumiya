import { Badge } from "@/components/ui/badge";

interface UserNameWithBadgeProps {
  firstName: string;
  lastName: string;
  badgeImageUrl?: string | null | undefined;
  className?: string;
  showFullName?: boolean;
}

export function UserNameWithBadge({ 
  firstName, 
  lastName, 
  badgeImageUrl, 
  className = "",
  showFullName = true 
}: UserNameWithBadgeProps) {
  const displayName = showFullName ? `${firstName} ${lastName}` : firstName;
  
  return (
    <span className={`flex items-center gap-1 ${className}`}>
      <span>{displayName}</span>
      {badgeImageUrl && (
        <img 
          src={badgeImageUrl} 
          alt="User badge" 
          className="w-4 h-4 rounded-sm object-cover flex-shrink-0"
          onError={(e) => {
            // Hide image if it fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
    </span>
  );
}