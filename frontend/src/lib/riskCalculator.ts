// Risk Score Calculator for Tech and Healthtech Portfolios
// Score: 0-100 (0 = highest risk, 100 = lowest risk)

export interface RiskScoreBreakdown {
  score: number;
  rating: 'Low Risk' | 'Low-Moderate Risk' | 'Moderate Risk' | 'High Risk' | 'Critical Risk';
  color: string;
  factors: {
    diversification: { score: number; weight: number; explanation: string };
    volatility: { score: number; weight: number; explanation: string };
    exposure: { score: number; weight: number; explanation: string };
    performance: { score: number; weight: number; explanation: string };
  };
  recommendation: string;
}

export function calculateTechRiskScore(data: {
  totalExposure: number;
  totalLimit: number;
  totalVaR: number;
  avgPnL: number;
  numPositions: number;
  sectorDiversification: number; // Number of different tech sectors
}): RiskScoreBreakdown {
  const { totalExposure, totalLimit, totalVaR, avgPnL, numPositions, sectorDiversification } = data;

  // 1. Diversification Score (30% weight)
  // More sectors and positions = better diversification = lower risk
  const diversificationScore = Math.min(100, (sectorDiversification / 4) * 50 + (numPositions / 100) * 50);
  const diversificationExplanation = `You have ${numPositions} positions across ${sectorDiversification} tech sectors. ${
    sectorDiversification >= 3 ? 'Good diversification' : 'Consider diversifying more'
  }.`;

  // 2. Volatility Score (30% weight)
  // Lower VaR = lower risk
  const varRatio = totalExposure > 0 ? totalVaR / totalExposure : 0;
  const volatilityScore = Math.max(0, 100 - varRatio * 1000);
  const volatilityExplanation = `Your 10-day VaR is ${(varRatio * 100).toFixed(2)}% of total exposure. ${
    varRatio < 0.05 ? 'Low volatility' : varRatio < 0.08 ? 'Moderate volatility' : 'High volatility'
  }.`;

  // 3. Exposure Score (25% weight)
  // Lower utilization = lower risk
  const utilizationRatio = totalLimit > 0 ? totalExposure / totalLimit : 0;
  const exposureScore = Math.max(0, 100 - utilizationRatio * 100);
  const exposureExplanation = `Using ${(utilizationRatio * 100).toFixed(1)}% of your limit. ${
    utilizationRatio < 0.7 ? 'Comfortable buffer' : utilizationRatio < 0.85 ? 'Moderate utilization' : 'High utilization - consider caution'
  }.`;

  // 4. Performance Score (15% weight)
  // Positive P&L = better score
  const performanceScore = avgPnL >= 0 ? 100 : Math.max(0, 100 + (avgPnL / Math.abs(avgPnL)) * 50);
  const performanceExplanation = `Average daily P&L is ${avgPnL >= 0 ? 'positive' : 'negative'}. ${
    avgPnL > 0 ? 'Portfolio is profitable' : 'Portfolio needs attention'
  }.`;

  // Weighted average
  const finalScore = Math.round(
    diversificationScore * 0.3 +
    volatilityScore * 0.3 +
    exposureScore * 0.25 +
    performanceScore * 0.15
  );

  // Determine rating and color
  let rating: RiskScoreBreakdown['rating'];
  let color: string;
  let recommendation: string;

  if (finalScore >= 80) {
    rating = 'Low Risk';
    color = '#22c55e'; // green
    recommendation = 'Your portfolio is well-balanced with low risk. Consider gradually increasing exposure if market conditions are favorable.';
  } else if (finalScore >= 65) {
    rating = 'Low-Moderate Risk';
    color = '#84cc16'; // lime
    recommendation = 'Good portfolio health. Monitor volatility and maintain diversification across tech sectors.';
  } else if (finalScore >= 50) {
    rating = 'Moderate Risk';
    color = '#eab308'; // yellow
    recommendation = 'Moderate risk detected. Consider reducing exposure in highly volatile positions and improving sector diversification.';
  } else if (finalScore >= 35) {
    rating = 'High Risk';
    color = '#f97316'; // orange
    recommendation = 'High risk portfolio. Reduce exposure immediately, improve diversification, and review underperforming positions.';
  } else {
    rating = 'Critical Risk';
    color = '#ef4444'; // red
    recommendation = 'Critical risk level! Immediate action required. Reduce exposure significantly and rebalance your portfolio.';
  }

  return {
    score: finalScore,
    rating,
    color,
    factors: {
      diversification: {
        score: Math.round(diversificationScore),
        weight: 30,
        explanation: diversificationExplanation,
      },
      volatility: {
        score: Math.round(volatilityScore),
        weight: 30,
        explanation: volatilityExplanation,
      },
      exposure: {
        score: Math.round(exposureScore),
        weight: 25,
        explanation: exposureExplanation,
      },
      performance: {
        score: Math.round(performanceScore),
        weight: 15,
        explanation: performanceExplanation,
      },
    },
    recommendation,
  };
}

export function calculateHealthtechRiskScore(data: {
  totalMarketValue: number;
  avgPriceChange: number;
  avgVolatility: number;
  numCompanies: number;
  industryDiversification: number; // Number of different healthtech industries
  performanceDistribution: { positive: number; negative: number }; // Count of positive vs negative performers
}): RiskScoreBreakdown {
  const { avgPriceChange, avgVolatility, numCompanies, industryDiversification, performanceDistribution } = data;

  // 1. Diversification Score (30% weight)
  const diversificationScore = Math.min(100, (industryDiversification / 6) * 50 + (numCompanies / 18) * 50);
  const diversificationExplanation = `Invested in ${numCompanies} companies across ${industryDiversification} healthtech industries. ${
    industryDiversification >= 4 ? 'Excellent diversification' : 'Room for more diversification'
  }.`;

  // 2. Volatility Score (30% weight)
  const volatilityScore = Math.max(0, 100 - avgVolatility * 2000);
  const volatilityExplanation = `Average volatility is ${(avgVolatility * 100).toFixed(2)}%. ${
    avgVolatility < 0.03 ? 'Low volatility' : avgVolatility < 0.05 ? 'Moderate volatility' : 'High volatility'
  }.`;

  // 3. Performance Score (25% weight)
  const performanceScore = Math.max(0, Math.min(100, 50 + avgPriceChange * 10));
  const performanceExplanation = `Average price change is ${avgPriceChange.toFixed(2)}%. ${
    avgPriceChange > 2 ? 'Strong growth' : avgPriceChange > 0 ? 'Moderate growth' : avgPriceChange > -2 ? 'Slight decline' : 'Significant decline'
  }.`;

  // 4. Exposure Distribution Score (15% weight)
  const totalPerformers = performanceDistribution.positive + performanceDistribution.negative;
  const positiveRatio = totalPerformers > 0 ? performanceDistribution.positive / totalPerformers : 0.5;
  const exposureScore = positiveRatio * 100;
  const exposureExplanation = `${performanceDistribution.positive} companies growing, ${performanceDistribution.negative} declining. ${
    positiveRatio > 0.6 ? 'Majority performing well' : positiveRatio > 0.4 ? 'Balanced performance' : 'Most positions underperforming'
  }.`;

  // Weighted average
  const finalScore = Math.round(
    diversificationScore * 0.3 +
    volatilityScore * 0.3 +
    performanceScore * 0.25 +
    exposureScore * 0.15
  );

  // Determine rating and color
  let rating: RiskScoreBreakdown['rating'];
  let color: string;
  let recommendation: string;

  if (finalScore >= 80) {
    rating = 'Low Risk';
    color = '#22c55e';
    recommendation = 'Excellent healthtech portfolio. Companies are performing well with good diversification. Continue monitoring and consider strategic additions.';
  } else if (finalScore >= 65) {
    rating = 'Low-Moderate Risk';
    color = '#84cc16';
    recommendation = 'Healthy portfolio with good fundamentals. Keep an eye on underperforming positions and maintain industry diversification.';
  } else if (finalScore >= 50) {
    rating = 'Moderate Risk';
    color = '#eab308';
    recommendation = 'Moderate risk present. Review declining positions, consider rebalancing toward stronger performers, and improve industry coverage.';
  } else if (finalScore >= 35) {
    rating = 'High Risk';
    color = '#f97316';
    recommendation = 'High risk detected. Many positions underperforming. Reduce exposure to volatile stocks and consolidate into proven healthtech leaders.';
  } else {
    rating = 'Critical Risk';
    color = '#ef4444';
    recommendation = 'Critical situation! Immediate portfolio review needed. Cut losses on poor performers and rebuild with stable, diversified healthtech investments.';
  }

  return {
    score: finalScore,
    rating,
    color,
    factors: {
      diversification: {
        score: Math.round(diversificationScore),
        weight: 30,
        explanation: diversificationExplanation,
      },
      volatility: {
        score: Math.round(volatilityScore),
        weight: 30,
        explanation: volatilityExplanation,
      },
      performance: {
        score: Math.round(performanceScore),
        weight: 25,
        explanation: performanceExplanation,
      },
      exposure: {
        score: Math.round(exposureScore),
        weight: 15,
        explanation: exposureExplanation,
      },
    },
    recommendation,
  };
}
