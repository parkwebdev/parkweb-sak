import React from 'react';
import { User01 as User, Settings01 as Settings } from '@untitledui/icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';

interface UserAccountCardProps {
  isCollapsed?: boolean;
}

export const UserAccountCard: React.FC<UserAccountCardProps> = ({ isCollapsed = false }) => {
  return (
    <div className={`relative flex w-full gap-3 bg-card rounded-xl transition-all ${
      isCollapsed ? 'p-1.5 justify-center' : 'border shadow-sm p-3 border-border'
    }`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={`flex items-center hover:bg-accent/50 rounded-lg transition-colors ${
            isCollapsed ? 'p-1 -m-1' : 'gap-3 flex-1 min-w-0 p-1 -m-1'
          }`}>
            <div className="relative">
              <Avatar className={isCollapsed ? "h-7 w-7" : "h-9 w-9"}>
                <AvatarImage src="" alt="Aaron Chachamovits" />
                <AvatarFallback className={`font-medium ${isCollapsed ? 'text-xs' : 'text-sm'}`}>AC</AvatarFallback>
              </Avatar>
              <div className={`bg-green-500 absolute rounded-full border-2 border-background ${
                isCollapsed ? 'w-2 h-2 -bottom-0 -right-0' : 'w-3 h-3 -bottom-0.5 -right-0.5'
              }`} />
            </div>
            {!isCollapsed && (
              <div className="text-left min-w-0 flex-1">
                <div className="text-foreground text-sm font-semibold leading-5 truncate">
                  Aaron Chachamovits
                </div>
                <div className="text-muted-foreground text-sm font-normal leading-5 truncate">
                  aaron@parkweb.app
                </div>
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link to="/profile" className="w-full">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/team" className="w-full">Team</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/settings" className="w-full">Settings</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
