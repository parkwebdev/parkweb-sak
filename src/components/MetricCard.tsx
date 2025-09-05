import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  chartImage: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType,
  chartImage
}) => {
  return (
    <div className="min-w-80 border shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] overflow-hidden flex-1 shrink basis-[0%] bg-[#FDFDFD] rounded-xl border-solid border-[#E9EAEB]">
      <div className="w-full gap-0.5">
        <div className="items-center flex w-full gap-4 text-sm text-[#181D27] font-semibold leading-none pt-3 pb-2 px-5">
          <div className="text-[#181D27] text-sm leading-5 self-stretch flex-1 shrink basis-[0%] my-auto">
            {title}
          </div>
        </div>
        <div className="border shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] relative w-full gap-5 bg-white p-5 rounded-xl border-solid border-[#E9EAEB]">
          <div className="items-center content-center flex-wrap z-0 flex w-full gap-3">
            <div className="text-[#181D27] text-3xl font-semibold leading-[38px] self-stretch my-auto">
              {value}
            </div>
            <div className="items-center self-stretch flex gap-2 text-sm font-medium leading-none my-auto">
              <div className={`justify-center items-center self-stretch flex gap-1 whitespace-nowrap text-center my-auto ${
                changeType === 'positive' ? 'text-[#079455]' : 'text-[#D92D20]'
              }`}>
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/33b0490e8b10759c7349e4737b4e3ff1dceae7cb?placeholderIfAbsent=true"
                  className="aspect-[1] object-contain w-4 self-stretch shrink-0 my-auto"
                  alt="Change indicator"
                />
                <div className={`text-sm leading-5 self-stretch my-auto ${
                  changeType === 'positive' ? 'text-[#079455]' : 'text-[#D92D20]'
                }`}>
                  {change}
                </div>
              </div>
              <div className="text-[#535862] text-sm leading-5 self-stretch my-auto">
                vs last month
              </div>
            </div>
          </div>
          <img
            src={chartImage}
            className="aspect-[5.43] object-contain w-[304px] z-0 mt-5"
            alt="Chart"
          />
          <button className="absolute z-0 w-5 right-5 top-5 hover:bg-gray-50 rounded">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/44cb5b8c0cf1d3bd76721e02f2718c0ad5edfac7?placeholderIfAbsent=true"
              className="aspect-[1] object-contain w-full"
              alt="Options"
            />
          </button>
        </div>
      </div>
    </div>
  );
};
