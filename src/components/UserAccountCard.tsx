import React from 'react';

export const UserAccountCard: React.FC = () => {
  return (
    <div className="border shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] relative flex w-full gap-4 bg-white p-3 rounded-xl border-solid border-[#E9EAEB]">
      <div className="items-center z-0 flex gap-2 flex-1 shrink basis-3">
        <div className="flex flex-col overflow-hidden self-stretch relative aspect-[1] w-10 my-auto">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/a70c6d8e536e25b6750059b6e15b1183b86a58a6?placeholderIfAbsent=true"
            className="absolute h-full w-full object-cover inset-0"
            alt="User avatar"
          />
          <div className="relative flex flex-col overflow-hidden items-center w-full h-10 pt-[29px] px-2 rounded-full border-[0.75px] border-solid border-[rgba(0,0,0,0.08)]">
            <div className="bg-[#17B26A] z-10 flex w-[13px] shrink-0 h-[13px] rounded-full border-[1.5px] border-solid border-white max-md:-mr-0.5" />
          </div>
        </div>
        <div className="self-stretch text-sm leading-none my-auto">
          <div className="text-[#181D27] text-sm font-semibold leading-5">
            Olivia Rhye
          </div>
          <div className="text-[#535862] text-ellipsis text-sm font-normal leading-5">
            olivia@sodium.app
          </div>
        </div>
      </div>
      <button className="justify-center items-center absolute z-0 flex min-h-8 overflow-hidden w-8 h-8 p-1.5 rounded-md right-1.5 top-1.5 hover:bg-gray-50">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/7618388fd73f071f9d789994c2e5d8b5126994f7?placeholderIfAbsent=true"
          className="aspect-[1] object-contain w-5 self-stretch my-auto"
          alt="Settings"
        />
      </button>
    </div>
  );
};
