import React from 'react';

export const UserAccountCard: React.FC = () => {
  return (
    <div className="border shadow-sm relative flex w-full gap-4 bg-card p-3 rounded-xl border-border">
      <div className="items-center z-0 flex gap-2 flex-1 shrink basis-3">
        <div className="flex flex-col overflow-hidden self-stretch relative aspect-[1] w-10 my-auto">
          <div className="relative flex flex-col overflow-hidden items-center w-full h-10 pt-[29px] px-2 rounded-full bg-muted border border-border">
            <span className="text-2xl">👤</span>
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
      <button className="justify-center items-center absolute z-0 flex min-h-8 overflow-hidden w-8 h-8 p-1.5 rounded-md right-1.5 top-1.5 hover:bg-accent">
        <span className="text-lg">⚙️</span>
      </button>
    </div>
  );
};
