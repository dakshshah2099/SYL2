import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Building2, User } from "lucide-react";
import { useEntity } from "@/context/EntityContext";

export function UserProfile() {
    const { currentEntity } = useEntity();

    if (!currentEntity) return null;

    return (
        <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-10 w-10">
                <AvatarImage src={currentEntity.avatar} alt={currentEntity.name} />
                <AvatarFallback>{currentEntity.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-sm overflow-hidden">
                <span className="font-semibold truncate w-full">{currentEntity.name}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {currentEntity.type === 'ORG' ? <Building2 className="h-3 w-3" /> : (currentEntity.type === 'GOVT' ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />)}
                    {currentEntity.type === 'ORG' ? 'Organization' : (currentEntity.type === 'GOVT' ? 'Government' : 'Individual')}
                </span>
            </div>
        </div>
    );
}
