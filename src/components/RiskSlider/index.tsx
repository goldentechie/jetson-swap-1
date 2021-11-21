import { riskMarks } from "../../constants";
import { Slider } from "antd";
import React from "react";
import "./style.less";

export const RiskSlider = (props: {
  value: number;
  onChange: (val: number) => void;
}) => {
  return (
    <Slider
      onChange={props.onChange}
      className="risk-slider"
      marks={riskMarks}
      value={props.value}
    />
  );
};
