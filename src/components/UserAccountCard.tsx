import React from 'react';
import { User01 as User, Settings01 as Settings } from '@untitledui/icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';

export const UserAccountCard: React.FC = () => {
  return (
    <div className="border shadow-sm relative flex w-full gap-3 bg-card p-3 rounded-xl border-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 flex-1 min-w-0 hover:bg-accent/50 rounded-lg p-1 -m-1 transition-colors">
            <div className="relative">
              <Avatar className="h-9 w-9">
                <AvatarImage src="" alt="Olivia Rhye" />
                <AvatarFallback className="text-sm font-medium">OR</AvatarFallback>
              </Avatar>
              <div className="bg-green-500 absolute w-3 h-3 rounded-full border-2 border-background -bottom-0.5 -right-0.5" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <div className="text-foreground text-sm font-semibold leading-5 truncate">
                Olivia Rhye
              </div>
              <div className="text-muted-foreground text-sm font-normal leading-5 truncate">
                olivia@sodium.app
              </div>
            </div>
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
