/**
 * ChatPad Logo Component
 * 
 * SVG logo for the ChatPad/Ari application.
 * Renders a stylized chat bubble with smile design.
 * 
 * @module components/ChatPadLogo
 */

import * as React from "react";

/**
 * ChatPad brand logo as an SVG component.
 * Accepts all standard SVG props for styling and sizing.
 * 
 * @example
 * <ChatPadLogo className="h-8 w-8 text-primary" />
 * 
 * @example
 * <ChatPadLogo width={32} height={32} />
 */
const ChatPadLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 270.69 270.02"
    fill="currentColor"
    aria-label="ChatPad logo"
    {...props}
  >
    <g>
      <path d="M135.35,0C60.59,0,0,60.44,0,135.02s60.59,135,135.35,135,135.35-60.44,135.35-135S210.1,0,135.35,0ZM135.35,241.44c-58.96,0-106.7-47.62-106.7-106.43S76.38,28.57,135.35,28.57s106.7,47.63,106.7,106.44-47.74,106.43-106.7,106.43Z" />
      <path d="M86.78,166.62c9.45,48.43,79.49,46.38,94.14,9.97,3.46-8.6,8.57-27.67-15.49-17.93-22.19,9.02-53.36,37.06-78.66,7.96h.01Z" />
    </g>
  </svg>
);

export default ChatPadLogo;