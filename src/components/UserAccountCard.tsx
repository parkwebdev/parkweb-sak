import React from 'react';
import { User01 as User, Settings01 as Settings } from '@untitledui/icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';

export const UserAccountCard: React.FC = () => {
  return (
    <div className="border shadow-sm relative flex w-full gap-4 bg-card p-3 rounded-xl border-border">
      <div className="items-center z-0 flex gap-2 flex-1 shrink basis-3">
        <div className="flex flex-col overflow-hidden self-stretch relative aspect-[1] w-10 my-auto">
          <div className="relative flex flex-col overflow-hidden items-center justify-center w-full h-10 rounded-full bg-muted border border-border">
            <User size={20} className="text-muted-foreground" />
            <div className="bg-green-500 z-10 flex w-[13px] shrink-0 h-[13px] rounded-full border-[1.5px] border-solid border-background absolute bottom-0 right-0" />
          </div>
        </div>
        <div className="self-stretch text-sm leading-none my-auto">
          <div className="text-foreground text-sm font-semibold leading-5">
            Olivia Rhye
          </div>
          <div className="text-muted-foreground text-ellipsis text-sm font-normal leading-5">
            olivia@sodium.app
          </div>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="justify-center items-center absolute z-0 flex min-h-8 overflow-hidden w-8 h-8 p-1.5 rounded-md right-1.5 top-1.5 hover:bg-accent">
            <Settings size={16} />
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
