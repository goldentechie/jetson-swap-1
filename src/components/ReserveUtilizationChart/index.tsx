import React, { useMemo } from "react";
import { LendingReserve } from "../../models/lending";
import {
  formatNumber,
  fromLamports,
  isSmallNumber,
  wadToLamports,
} from "../../utils/utils";
import { useMint } from "../../contexts/accounts";
import { WaterWave } from "./../WaterWave";
import { Statistic } from "antd";

export const ReserveUtilizationChart = (props: { reserve: LendingReserve }) => {
  const mintAddress = props.reserve.liquidityMint?.toBase58();
  const liquidityMint = useMint(mintAddress);
  const availableLiquidity = fromLamports(
    props.reserve.state.availableLiquidity,
    liquidityMint
  );

  const totalBorrows = useMemo(
    () =>
      fromLamports(
        wadToLamports(props.reserve.state.borrowedLiquidityWad),
        liquidityMint
      ),
    [props.reserve, liquidityMint]
  );

  const totalSupply = availableLiquidity + totalBorrows;
  const percent = (100 * totalBorrows) / totalSupply;

  return (
    <WaterWave
      style={{ height: 300 }}
      showPercent={false}
      title={
        <Statistic
          title="Utilization"
          suffix="%"
          value={formatNumber.format(percent, true)}
          precision={3}
          prefix={isSmallNumber(percent) ? "<" : ""}
        />
      }
      percent={percent}
    />
  );
};
