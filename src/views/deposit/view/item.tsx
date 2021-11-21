import React from "react";
import {
  useUserCollateralBalance,
  useTokenName,
  useUserBalance,
} from "../../../hooks";
import { calculateDepositAPY, LendingReserve } from "../../../models/lending";
import { TokenIcon } from "../../../components/TokenIcon";
import { formatNumber, formatPct } from "../../../utils/utils";
import { Button } from "antd";
import { Link } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { LABELS } from "../../../constants";

export const ReserveItem = (props: {
  reserve: LendingReserve;
  address: PublicKey;
}) => {
  const name = useTokenName(props.reserve.liquidityMint);
  const {
    balance: tokenBalance,
    balanceInUSD: tokenBalanceInUSD,
  } = useUserBalance(props.reserve.liquidityMint);
  const {
    balance: collateralBalance,
    balanceInUSD: collateralBalanceInUSD,
  } = useUserCollateralBalance(props.reserve);

  const apy = calculateDepositAPY(props.reserve);

  return (
    <Link to={`/deposit/${name}`}>
      <div className="deposit-item">
        <span style={{ display: "flex" }}>
          <TokenIcon mintAddress={props.reserve.liquidityMint} />
          {name}
        </span>
        <div>
          <div>
            <div>
              <em>{formatNumber.format(tokenBalance)}</em> {name}
            </div>
            <div className="dashboard-amount-quote">
              ${formatNumber.format(tokenBalanceInUSD)}
            </div>
          </div>
        </div>
        <div>
          <div>
            <div>
              <em>{formatNumber.format(collateralBalance)}</em> {name}
            </div>
            <div className="dashboard-amount-quote">
              ${formatNumber.format(collateralBalanceInUSD)}
            </div>
          </div>
        </div>
        <div>{formatPct.format(apy)}</div>
        <div>
          <Button type="primary">
            <span>{LABELS.DEPOSIT_ACTION}</span>
          </Button>
        </div>
      </div>
    </Link>
  );
};
