import React, { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  secondaryfill?: string;
  strokewidth?: number;
  title?: string;
};

function HouseOutline({
  fill = "currentColor",
  secondaryfill,
  width = "1em",
  height = "1em",
  title = "house outline",
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
      <g fill={fill} strokeLinecap="butt" strokeLinejoin="miter">
        <path
          d="M19 43V28H29V43"
          fill="none"
          stroke={secondaryfill}
          strokeMiterlimit="10"
          strokeWidth="2"
        />
        <path
          d="M8 23V38C8 40.7614 10.2386 43 13 43H35C37.7614 43 40 40.7614 40 38V23"
          fill="none"
          stroke={fill}
          strokeLinecap="square"
          strokeMiterlimit="10"
          strokeWidth="2"
        />
        <path
          d="M3 20.5L24 4L45 20.5"
          fill="none"
          stroke={fill}
          strokeLinecap="square"
          strokeMiterlimit="10"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}

export default HouseOutline;
