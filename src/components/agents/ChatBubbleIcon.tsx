/**
 * ChatBubbleIcon Component
 * 
 * Custom ChatPad logo SVG icon used in branding and widget display.
 * @module components/agents/ChatBubbleIcon
 */

import * as React from "react";

interface ChatBubbleIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const ChatBubbleIcon = (props: ChatBubbleIconProps) => (
  <svg
    id="Layer_2"
    data-name="Layer 2"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 270.69 270.02"
    {...props}
  >
    <defs>
      <style>{"\n      .cls-1 {\n        fill: currentColor;\n      }\n    "}</style>
    </defs>
    <g id="Layer_1-2" data-name="Layer 1">
      <g>
        <path
          id="O_-_0007_-_H.cdr"
          className="cls-1"
          d="M135.35,0C60.59,0,0,60.44,0,135.02s60.59,135,135.35,135,135.35-60.44,135.35-135S210.1,0,135.35,0ZM135.35,241.44c-58.96,0-106.7-47.62-106.7-106.43S76.38,28.57,135.35,28.57s106.7,47.63,106.7,106.44-47.74,106.43-106.7,106.43Z"
        />
        <path
          id="O_-_0007_-_H.cdr_0"
          data-name="O_-_0007_-_H.cdr 0"
          className="cls-1"
          d="M86.78,166.62c9.45,48.43,79.49,46.38,94.14,9.97,3.46-8.6,8.57-27.67-15.49-17.93-22.19,9.02-53.36,37.06-78.66,7.96h.01Z"
        />
      </g>
    </g>
  </svg>
);
