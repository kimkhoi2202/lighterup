import React, { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  secondaryfill?: string;
  strokewidth?: number;
  title?: string;
};

function HouseFilled({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  title = "house filled",
  ...props
}: IconProps) {
  secondaryfill = secondaryfill || fill;

  return (
    <svg
      height={height}
      width={width}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M23.9999 2.09723L46.6053 19.7405L44.7595 22.1054L23.9999 5.90281L3.24034 22.1054L1.39453 19.7405L23.9999 2.09723Z"
          fill={secondaryfill}
          fillRule="evenodd"
        />
        <path d="M7 37.5V23.1709L23.9999 9.90271L41 23.1711V37.5C41 41.0898 38.0899 44 34.5 44H28V31H20V44H13.5C9.91015 44 7 41.0898 7 37.5Z" />
      </g>
    </svg>
  );
}

export default HouseFilled;
